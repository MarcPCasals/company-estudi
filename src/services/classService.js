import {
  doc,
  collection,
  getDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { createClassCode } from '../domain/accessCodes.js'
import { DEFAULT_SUBJECTS } from '../data/subjects.js'
import { DEFAULT_SCHOOL_SCHEDULE } from '../data/defaultSchedule.js'
import { resolveSyncState } from '../domain/offlinePolicy.js'
import { auth, db } from '../lib/firebase.js'
import { observeWithPermissionRetry } from './firestoreObserver.js'

const requireFirebaseService = (service, label) => {
  if (!service) throw new Error(`${label} no està configurat en aquest entorn.`)
  return service
}

export const createTutorClass = async ({ name, course }) => {
  const firestore = requireFirebaseService(db, 'Firestore')
  const tutor = auth?.currentUser
  if (!tutor || !tutor.providerData.some((provider) => provider.providerId === 'google.com')) {
    throw new Error('Cal iniciar sessió amb Google com a tutor.')
  }

  const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ')
  const cleanCourse = String(course ?? '').trim().replace(/\s+/g, ' ')
  if (cleanName.length < 2 || cleanName.length > 80) {
    throw new Error('El nom de la classe ha de tenir entre 2 i 80 caràcters.')
  }
  if (cleanCourse.length < 2 || cleanCourse.length > 80) {
    throw new Error('El curs ha de tenir entre 2 i 80 caràcters.')
  }

  const classRef = doc(collection(firestore, 'classes'))
  const classCode = createClassCode()
  const creationBatch = writeBatch(firestore)
  creationBatch.set(classRef, {
    tutorId: tutor.uid,
    teacherIds: [tutor.uid],
    ownerDisplayName: tutor.displayName ?? tutor.email ?? 'Tutor responsable',
    name: cleanName,
    course: cleanCourse,
    active: true,
    subjectIds: DEFAULT_SUBJECTS.map((subject) => subject.id),
    schoolSchedule: DEFAULT_SCHOOL_SCHEDULE,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  creationBatch.set(doc(firestore, 'tutors', tutor.uid, 'classSecrets', classRef.id), {
    classId: classRef.id,
    classCode,
    credentialVersion: 1,
    createdAt: serverTimestamp(),
  })
  creationBatch.set(doc(firestore, 'classes', classRef.id, 'teacherMembers', tutor.uid), {
    uid: tutor.uid,
    role: 'owner',
    status: 'accepted',
    joinedAt: serverTimestamp(),
  })
  for (const subject of DEFAULT_SUBJECTS) {
    creationBatch.set(doc(firestore, 'classes', classRef.id, 'subjects', subject.id), {
      ...subject,
      active: true,
      createdAt: serverTimestamp(),
    })
  }
  for (const subject of DEFAULT_SUBJECTS) {
    creationBatch.set(doc(firestore, 'classes', classRef.id, 'rooms', subject.id), {
      name: subject.name,
      subjectId: subject.id,
      active: true,
      memberMode: 'all',
      memberStudentIds: [],
      createdAt: serverTimestamp(),
    })
  }
  await creationBatch.commit()

  return {
    classId: classRef.id,
    classCode,
    name: cleanName,
    course: cleanCourse,
    subjectCount: DEFAULT_SUBJECTS.length,
  }
}

export const getTutorClassSecret = async ({ tutorId, classId }) => {
  const snapshot = await getDoc(doc(
    requireFirebaseService(db, 'Firestore'),
    'tutors',
    tutorId,
    'classSecrets',
    classId,
  ))
  return snapshot.exists() ? snapshot.data() : null
}

const observeSortedCollection = ({ path, sortField, onData, onError }) => {
  return observeWithPermissionRetry({
    subscribe: (handleError) => onSnapshot(
      collection(requireFirebaseService(db, 'Firestore'), ...path),
      { includeMetadataChanges: true },
      (snapshot) => onData(snapshot.docs
        .map((document) => ({ id: document.id, ...document.data() }))
        .sort((left, right) => String(left[sortField]).localeCompare(String(right[sortField]), 'ca'))),
      handleError,
    ),
    onError,
  })
}

export const observeClassStudents = (classId, onStudents, onError) =>
  observeSortedCollection({
    path: ['classes', classId, 'students'],
    sortField: 'displayName',
    onData: onStudents,
    onError,
  })

export const observeClassRooms = (classId, onRooms, onError) =>
  observeSortedCollection({
    path: ['classes', classId, 'rooms'],
    sortField: 'name',
    onData: onRooms,
    onError,
  })

export const updateRoomMembership = async ({
  classId,
  roomId,
  memberMode,
  memberStudentIds = [],
}) => {
  if (!['all', 'selected'].includes(memberMode)) {
    throw new Error('El tipus de membres de la sala no és vàlid.')
  }
  await updateDoc(doc(
    requireFirebaseService(db, 'Firestore'),
    'classes',
    classId,
    'rooms',
    roomId,
  ), {
    memberMode,
    memberStudentIds: memberMode === 'all'
      ? []
      : [...new Set(memberStudentIds)],
    updatedAt: serverTimestamp(),
  })
}

export const updateClassSchoolSchedule = async ({ classId, schoolSchedule }) => {
  const weekdayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const cleanSchedule = Object.fromEntries(weekdayIds.map((dayId) => {
    const schoolEndsAt = String(schoolSchedule[dayId]?.schoolEndsAt ?? '')
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(schoolEndsAt)) {
      throw new Error('Tots els dies lectius necessiten una hora de sortida vàlida.')
    }
    return [dayId, { schoolEndsAt }]
  }))
  cleanSchedule.saturday = { schoolEndsAt: null }
  cleanSchedule.sunday = { schoolEndsAt: null }
  await updateDoc(doc(
    requireFirebaseService(db, 'Firestore'),
    'classes',
    classId,
  ), {
    schoolSchedule: cleanSchedule,
    updatedAt: serverTimestamp(),
  })
  return cleanSchedule
}

export const observeTutorClasses = (tutorId, onClasses, onError) => {
  const classesCollection = collection(requireFirebaseService(db, 'Firestore'), 'classes')
  const snapshots = new Map()
  const publish = () => {
    const documents = [...snapshots.values()].flatMap((snapshot) => snapshot.docs)
    const classes = [...new Map(documents.map((document) => [
      document.id,
      { id: document.id, ...document.data() },
    ])).values()]
      .sort((left, right) => left.name.localeCompare(right.name, 'ca'))
    const metadata = [...snapshots.values()]
    onClasses(classes, {
      state: resolveSyncState({
        online: globalThis.navigator?.onLine ?? true,
        fromCache: metadata.some((snapshot) => snapshot.metadata.fromCache),
        hasPendingWrites: metadata.some((snapshot) => snapshot.docs.some(
          (document) => document.metadata.hasPendingWrites,
        )),
      }),
      fromCache: metadata.some((snapshot) => snapshot.metadata.fromCache),
      hasPendingWrites: metadata.some((snapshot) => snapshot.docs.some(
        (document) => document.metadata.hasPendingWrites,
      )),
    })
  }
  const subscribe = (key, classesQuery) => onSnapshot(
    classesQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      snapshots.set(key, snapshot)
      publish()
    },
    onError,
  )
  const stopOwned = subscribe('owned', query(classesCollection, where('tutorId', '==', tutorId)))
  const stopShared = subscribe('shared', query(classesCollection, where('teacherIds', 'array-contains', tutorId)))
  return () => {
    stopOwned()
    stopShared()
  }
}
