import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import {
  COTUTOR_INVITATION_DAYS,
  COTUTOR_INVITATION_STATUS,
  effectiveInvitationStatus,
  normalizeTeacherEmail,
  validateCotutorEmail,
} from '../domain/cotutoring.js'
import { auth, db } from '../lib/firebase.js'

const firestore = () => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  return db
}

const currentGoogleTutor = () => {
  const tutor = auth?.currentUser
  if (!tutor || !tutor.providerData.some(({ providerId }) => providerId === 'google.com')) {
    throw new Error('Cal iniciar sessió amb Google com a docent.')
  }
  return tutor
}

const requireOwner = (classroom, tutorId) => {
  if (classroom?.tutorId !== tutorId) {
    throw new Error('Només el tutor responsable pot gestionar la cotutoria.')
  }
}

export const inviteCotutor = async ({ classroom, email }) => {
  const tutor = currentGoogleTutor()
  requireOwner(classroom, tutor.uid)
  if ((classroom.teacherIds ?? [classroom.tutorId]).length > 1) {
    throw new Error('Aquesta primera versió admet un sol cotutor per classe.')
  }
  const inviteeEmailNormalized = validateCotutorEmail({ email, currentEmail: tutor.email })
  const invitations = collection(firestore(), 'cotutorInvitations')
  const duplicates = await getDocs(query(
    invitations,
    where('classId', '==', classroom.id),
  ))
  const hasPendingDuplicate = duplicates.docs.some((item) => {
    const invitation = item.data()
    return invitation.inviteeEmailNormalized === inviteeEmailNormalized
      && effectiveInvitationStatus(invitation) === COTUTOR_INVITATION_STATUS.PENDING
  })
  if (hasPendingDuplicate) throw new Error('Ja hi ha una invitació pendent per a aquest correu.')

  return addDoc(invitations, {
    classId: classroom.id,
    className: classroom.name,
    classCourse: classroom.course,
    ownerTutorId: tutor.uid,
    ownerDisplayName: tutor.displayName ?? tutor.email ?? 'Tutor responsable',
    inviteeEmailNormalized,
    status: COTUTOR_INVITATION_STATUS.PENDING,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + COTUTOR_INVITATION_DAYS * 24 * 60 * 60 * 1000),
  })
}

export const observeMyCotutorInvitations = ({ email, onInvitations, onError }) => {
  const normalizedEmail = normalizeTeacherEmail(email)
  if (!normalizedEmail) {
    onInvitations([])
    return () => {}
  }
  return onSnapshot(query(
    collection(firestore(), 'cotutorInvitations'),
    where('inviteeEmailNormalized', '==', normalizedEmail),
  ), (snapshot) => onInvitations(snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => effectiveInvitationStatus(item) === COTUTOR_INVITATION_STATUS.PENDING)), onError)
}

export const observeClassCotutorInvitations = ({ classId, onInvitations, onError }) =>
  onSnapshot(query(
    collection(firestore(), 'cotutorInvitations'),
    where('classId', '==', classId),
  ), (snapshot) => onInvitations(snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
    effectiveStatus: effectiveInvitationStatus(item.data()),
  }))), onError)

export const respondToCotutorInvitation = async ({ invitation, accept }) => {
  const tutor = currentGoogleTutor()
  if (normalizeTeacherEmail(tutor.email) !== invitation.inviteeEmailNormalized) {
    throw new Error('Aquesta invitació està vinculada a un altre compte.')
  }
  if (effectiveInvitationStatus(invitation) !== COTUTOR_INVITATION_STATUS.PENDING) {
    throw new Error('La invitació ja no està disponible.')
  }
  const invitationRef = doc(firestore(), 'cotutorInvitations', invitation.id)
  if (!accept) {
    await updateDoc(invitationRef, {
      status: COTUTOR_INVITATION_STATUS.REJECTED,
      respondedAt: serverTimestamp(),
      respondedByUid: tutor.uid,
    })
    return
  }

  await runTransaction(firestore(), async (transaction) => {
    const classRef = doc(firestore(), 'classes', invitation.classId)
    const [freshInvitation, classSnapshot] = await Promise.all([
      transaction.get(invitationRef),
      transaction.get(classRef),
    ])
    const data = freshInvitation.data()
    if (!freshInvitation.exists() || effectiveInvitationStatus(data) !== COTUTOR_INVITATION_STATUS.PENDING) {
      throw new Error('La invitació ja no està disponible.')
    }
    if (!classSnapshot.exists() || classSnapshot.data().tutorId !== data.ownerTutorId) {
      throw new Error('La classe ja no està disponible.')
    }
    if ((classSnapshot.data().teacherIds ?? [data.ownerTutorId]).length > 1) {
      throw new Error('La classe ja té un cotutor.')
    }
    transaction.update(invitationRef, {
      status: COTUTOR_INVITATION_STATUS.ACCEPTED,
      respondedAt: serverTimestamp(),
      respondedByUid: tutor.uid,
    })
    transaction.update(classRef, {
      teacherIds: arrayUnion(tutor.uid),
      cotutorId: tutor.uid,
      cotutorDisplayName: tutor.displayName ?? tutor.email,
      membershipInvitationId: invitation.id,
      updatedAt: serverTimestamp(),
    })
    transaction.set(doc(firestore(), 'classes', invitation.classId, 'teacherMembers', tutor.uid), {
      uid: tutor.uid,
      role: 'cotutor',
      status: 'accepted',
      invitedBy: data.ownerTutorId,
      invitationId: invitation.id,
      joinedAt: serverTimestamp(),
    })
  })
}

export const revokeCotutorInvitation = (invitationId) => updateDoc(
  doc(firestore(), 'cotutorInvitations', invitationId),
  { status: COTUTOR_INVITATION_STATUS.REVOKED, revokedAt: serverTimestamp() },
)

export const removeCotutor = async ({ classroom }) => {
  const tutor = currentGoogleTutor()
  requireOwner(classroom, tutor.uid)
  if (!classroom.cotutorId) return
  const batch = writeBatch(firestore())
  batch.update(doc(firestore(), 'classes', classroom.id), {
    teacherIds: arrayRemove(classroom.cotutorId),
    cotutorId: null,
    cotutorDisplayName: null,
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(firestore(), 'classes', classroom.id, 'teacherMembers', classroom.cotutorId), {
    status: 'removed',
    removedAt: serverTimestamp(),
    removedBy: tutor.uid,
  })
  await batch.commit()
}

export const leaveSharedClass = async ({ classroom }) => {
  const tutor = currentGoogleTutor()
  if (classroom.tutorId === tutor.uid || classroom.cotutorId !== tutor.uid) {
    throw new Error('Aquesta acció només està disponible per al cotutor.')
  }
  const batch = writeBatch(firestore())
  batch.update(doc(firestore(), 'classes', classroom.id), {
    teacherIds: arrayRemove(tutor.uid),
    cotutorId: null,
    cotutorDisplayName: null,
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(firestore(), 'classes', classroom.id, 'teacherMembers', tutor.uid), {
    status: 'left',
    leftAt: serverTimestamp(),
  })
  await batch.commit()
}

export const transferClassOwnership = async ({ classroom }) => {
  const tutor = currentGoogleTutor()
  requireOwner(classroom, tutor.uid)
  if (!classroom.cotutorId) throw new Error('Cal un cotutor acceptat per transferir la classe.')
  const currentSecretRef = doc(firestore(), 'tutors', tutor.uid, 'classSecrets', classroom.id)
  const currentSecret = await getDoc(currentSecretRef)
  if (!currentSecret.exists()) throw new Error('No s’ha trobat el codi privat de la classe.')
  const batch = writeBatch(firestore())
  batch.update(doc(firestore(), 'classes', classroom.id), {
    tutorId: classroom.cotutorId,
    cotutorId: tutor.uid,
    cotutorDisplayName: tutor.displayName ?? tutor.email,
    ownerDisplayName: classroom.cotutorDisplayName ?? 'Tutor responsable',
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(firestore(), 'classes', classroom.id, 'teacherMembers', classroom.cotutorId), {
    uid: classroom.cotutorId,
    role: 'owner',
    status: 'accepted',
    roleChangedAt: serverTimestamp(),
  }, { merge: true })
  batch.set(doc(firestore(), 'classes', classroom.id, 'teacherMembers', tutor.uid), {
    uid: tutor.uid,
    role: 'cotutor',
    status: 'accepted',
    roleChangedAt: serverTimestamp(),
  }, { merge: true })
  batch.set(doc(firestore(), 'tutors', classroom.cotutorId, 'classSecrets', classroom.id), {
    ...currentSecret.data(),
    transferredAt: serverTimestamp(),
    transferredBy: tutor.uid,
  })
  batch.delete(currentSecretRef)
  await batch.commit()
}
