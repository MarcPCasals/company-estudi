import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
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

export const provisionStudentTechnicalAccount = async ({
  tutorId,
  classId,
  displayName,
}) => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  const provisioningAuth = getStudentProvisioningAuth()
  if (!provisioningAuth) throw new Error('Firebase Authentication no està configurat.')

  const cleanName = cleanStudentName(displayName)
  const secretSnapshot = await getDoc(doc(
    db,
    'tutors',
    tutorId,
    'classSecrets',
    classId,
  ))
  const classCode = secretSnapshot.data()?.classCode
  if (!secretSnapshot.exists() || !classCode) {
    throw new Error('No s’ha trobat el codi segur de la classe.')
  }

  let account
  let studentCode
  const credentialVersion = 1
  for (let attempt = 0; attempt < 5; attempt += 1) {
    studentCode = createStudentCode()
    const credentials = await deriveStudentCredentials({
      classCode,
      studentCode,
      credentialVersion,
    })
    try {
      account = await createUserWithEmailAndPassword(
        provisioningAuth,
        credentials.email,
        credentials.password,
      )
      break
    } catch (error) {
      if (!String(error?.code).includes('email-already-in-use')) throw error
    }
  }
  if (!account) throw new Error('No s’ha pogut generar una credencial única.')

  const studentRef = doc(db, 'classes', classId, 'students', account.user.uid)
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
    studentId: account.user.uid,
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
    account.user.uid,
  ), {
    studentId: account.user.uid,
    displayName: cleanName,
    studentCode,
    credentialVersion,
    createdAt: serverTimestamp(),
  })

  try {
    await batch.commit()
  } catch (error) {
    await deleteUser(account.user).catch(() => undefined)
    throw error
  } finally {
    await signOut(provisioningAuth).catch(() => undefined)
  }

  return {
    studentId: account.user.uid,
    displayName: cleanName,
    classCode,
    studentCode,
    credentialVersion,
  }
}
