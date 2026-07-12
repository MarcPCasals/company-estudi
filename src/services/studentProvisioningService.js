import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { createStudentCode } from '../domain/accessCodes.js'
import { deriveStudentCredentials } from '../domain/technicalCredentials.js'
import { db, getStudentProvisioningAuth } from '../lib/firebase.js'

const cleanStudentName = (value) => {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 80) {
    throw new Error('El nom de l’alumne ha de tenir entre 2 i 80 caràcters.')
  }
  return name
}

const requireProvisioningServices = () => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  const provisioningAuth = getStudentProvisioningAuth()
  if (!provisioningAuth) throw new Error('Firebase Authentication no està configurat.')
  return { firestore: db, provisioningAuth }
}

const loadClassCode = async ({ tutorId, classId }) => {
  const snapshot = await getDoc(doc(
    db,
    'tutors',
    tutorId,
    'classSecrets',
    classId,
  ))
  const classCode = snapshot.data()?.classCode
  if (!snapshot.exists() || !classCode) {
    throw new Error('No s’ha trobat el codi segur de la classe.')
  }
  return classCode
}

const createTechnicalAccount = async ({
  classCode,
  credentialVersion,
  provisioningAuth,
}) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const studentCode = createStudentCode()
    const credentials = await deriveStudentCredentials({
      classCode,
      studentCode,
      credentialVersion,
    })
    try {
      const account = await createUserWithEmailAndPassword(
        provisioningAuth,
        credentials.email,
        credentials.password,
      )
      return { account, studentCode }
    } catch (error) {
      if (!String(error?.code).includes('email-already-in-use')) throw error
    }
  }
  throw new Error('No s’ha pogut generar una credencial única.')
}

const commitAccountProvisioning = async ({ account, provisioningAuth, commit }) => {
  try {
    await commit()
  } catch (error) {
    await deleteUser(account.user).catch(() => undefined)
    throw error
  } finally {
    await signOut(provisioningAuth).catch(() => undefined)
  }
}

export const provisionStudentTechnicalAccount = async ({
  tutorId,
  classId,
  displayName,
}) => {
  const { provisioningAuth } = requireProvisioningServices()
  const cleanName = cleanStudentName(displayName)
  const classCode = await loadClassCode({ tutorId, classId })
  const credentialVersion = 1
  const { account, studentCode } = await createTechnicalAccount({
    classCode,
    credentialVersion,
    provisioningAuth,
  })
  const studentRef = doc(collection(db, 'classes', classId, 'students'))

  await commitAccountProvisioning({
    account,
    provisioningAuth,
    commit: async () => {
      const batch = writeBatch(db)
      batch.set(studentRef, {
        displayName: cleanName,
        active: true,
        authUid: account.user.uid,
        credentialVersion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      batch.set(doc(db, 'studentAccess', account.user.uid), {
        active: true,
        classId,
        studentId: studentRef.id,
        credentialVersion,
        createdAt: serverTimestamp(),
      })
      batch.set(doc(
        db,
        'tutors',
        tutorId,
        'classSecrets',
        classId,
        'students',
        studentRef.id,
      ), {
        studentId: studentRef.id,
        displayName: cleanName,
        studentCode,
        authUid: account.user.uid,
        credentialVersion,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await batch.commit()
    },
  })

  return {
    studentId: studentRef.id,
    displayName: cleanName,
    classCode,
    studentCode,
    credentialVersion,
  }
}

export const provisionStudents = async ({ tutorId, classId, names }) => {
  const cleanNames = names.map(cleanStudentName)
  if (cleanNames.length === 0 || cleanNames.length > 40) {
    throw new Error('Cal indicar entre 1 i 40 alumnes.')
  }
  const students = []
  for (const displayName of cleanNames) {
    students.push(await provisionStudentTechnicalAccount({
      tutorId,
      classId,
      displayName,
    }))
  }
  return students
}

export const observeStudentCredentials = ({ tutorId, classId }, onData, onError) =>
  onSnapshot(
    collection(db, 'tutors', tutorId, 'classSecrets', classId, 'students'),
    (snapshot) => onData(snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }))
      .sort((left, right) => left.displayName.localeCompare(right.displayName, 'ca'))),
    onError,
  )

export const regenerateStudentCredential = async ({
  tutorId,
  classId,
  studentId,
}) => {
  const { provisioningAuth } = requireProvisioningServices()
  const studentRef = doc(db, 'classes', classId, 'students', studentId)
  const secretRef = doc(
    db,
    'tutors',
    tutorId,
    'classSecrets',
    classId,
    'students',
    studentId,
  )
  const [studentSnapshot, secretSnapshot, classCode] = await Promise.all([
    getDoc(studentRef),
    getDoc(secretRef),
    loadClassCode({ tutorId, classId }),
  ])
  if (!studentSnapshot.exists() || !secretSnapshot.exists()) {
    throw new Error('No s’ha trobat l’alumne o la seva credencial.')
  }
  const student = studentSnapshot.data()
  const credentialVersion = (student.credentialVersion ?? 1) + 1
  const { account, studentCode } = await createTechnicalAccount({
    classCode,
    credentialVersion,
    provisioningAuth,
  })

  await commitAccountProvisioning({
    account,
    provisioningAuth,
    commit: async () => {
      const batch = writeBatch(db)
      batch.update(studentRef, {
        authUid: account.user.uid,
        credentialVersion,
        updatedAt: serverTimestamp(),
      })
      batch.update(doc(db, 'studentAccess', student.authUid), {
        active: false,
        revokedAt: serverTimestamp(),
      })
      batch.set(doc(db, 'studentAccess', account.user.uid), {
        active: true,
        classId,
        studentId,
        credentialVersion,
        createdAt: serverTimestamp(),
      })
      batch.update(secretRef, {
        studentCode,
        authUid: account.user.uid,
        credentialVersion,
        active: true,
        updatedAt: serverTimestamp(),
      })
      await batch.commit()
    },
  })

  return { studentId, studentCode, classCode, credentialVersion }
}

export const moveStudentToClass = async ({
  tutorId,
  sourceClassId,
  targetClassId,
  studentId,
}) => {
  if (sourceClassId === targetClassId) throw new Error('La classe de destí ha de ser diferent.')
  const { provisioningAuth } = requireProvisioningServices()
  const sourceStudentRef = doc(db, 'classes', sourceClassId, 'students', studentId)
  const sourceSecretRef = doc(
    db,
    'tutors',
    tutorId,
    'classSecrets',
    sourceClassId,
    'students',
    studentId,
  )
  const [studentSnapshot, sourceSecretSnapshot, targetClassCode] = await Promise.all([
    getDoc(sourceStudentRef),
    getDoc(sourceSecretRef),
    loadClassCode({ tutorId, classId: targetClassId }),
  ])
  if (!studentSnapshot.exists() || !sourceSecretSnapshot.exists()) {
    throw new Error('No s’ha trobat l’alumne a la classe d’origen.')
  }
  const student = studentSnapshot.data()
  const credentialVersion = (student.credentialVersion ?? 1) + 1
  const { account, studentCode } = await createTechnicalAccount({
    classCode: targetClassCode,
    credentialVersion,
    provisioningAuth,
  })
  const targetStudentRef = doc(db, 'classes', targetClassId, 'students', studentId)

  await commitAccountProvisioning({
    account,
    provisioningAuth,
    commit: async () => {
      const batch = writeBatch(db)
      batch.update(sourceStudentRef, {
        active: false,
        movedToClassId: targetClassId,
        updatedAt: serverTimestamp(),
      })
      batch.update(doc(db, 'studentAccess', student.authUid), {
        active: false,
        revokedAt: serverTimestamp(),
      })
      batch.update(sourceSecretRef, {
        active: false,
        movedToClassId: targetClassId,
        updatedAt: serverTimestamp(),
      })
      batch.set(targetStudentRef, {
        displayName: student.displayName,
        active: true,
        authUid: account.user.uid,
        credentialVersion,
        movedFromClassId: sourceClassId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      batch.set(doc(db, 'studentAccess', account.user.uid), {
        active: true,
        classId: targetClassId,
        studentId,
        credentialVersion,
        createdAt: serverTimestamp(),
      })
      batch.set(doc(
        db,
        'tutors',
        tutorId,
        'classSecrets',
        targetClassId,
        'students',
        studentId,
      ), {
        studentId,
        displayName: student.displayName,
        studentCode,
        authUid: account.user.uid,
        credentialVersion,
        active: true,
        movedFromClassId: sourceClassId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await batch.commit()
    },
  })

  return {
    studentId,
    displayName: student.displayName,
    classCode: targetClassCode,
    studentCode,
    credentialVersion,
  }
}
