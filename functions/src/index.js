import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { defineSecret } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  createAccessCode,
  credentialDigest,
  isValidAccessCode,
  normalizeAccessCode,
} from './accessSecurity.js'
import { DEFAULT_SUBJECTS } from './subjects.js'

if (getApps().length === 0) initializeApp()

const db = getFirestore()
const codePepper = defineSecret('CODE_PEPPER')

const MAX_FAILED_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

const invalidCodesError = () => new HttpsError(
  'permission-denied',
  'Els codis no són correctes o ja no són vàlids.',
)

const requireAnonymousUser = (request) => {
  const provider = request.auth?.token?.firebase?.sign_in_provider
  if (!request.auth || provider !== 'anonymous') {
    throw new HttpsError(
      'unauthenticated',
      'Cal iniciar una sessió d’alumne abans de validar els codis.',
    )
  }
  return request.auth.uid
}

const assertAttemptAllowed = async (uid, now) => {
  const attemptRef = db.doc(`accessAttempts/${uid}`)

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(attemptRef)
    const data = snapshot.data()
    const windowStartedAt = data?.windowStartedAt?.toMillis?.() ?? 0
    const withinWindow = now.toMillis() - windowStartedAt < ATTEMPT_WINDOW_MS
    const failures = withinWindow ? (data?.failures ?? 0) : 0

    if (failures >= MAX_FAILED_ATTEMPTS) {
      throw new HttpsError(
        'resource-exhausted',
        'Massa intents. Espera deu minuts abans de tornar-ho a provar.',
      )
    }

    transaction.set(attemptRef, {
      failures,
      windowStartedAt: withinWindow ? data.windowStartedAt : now,
      updatedAt: now,
    })
  })
}

const recordFailedAttempt = (uid) => db.doc(`accessAttempts/${uid}`).set({
  failures: FieldValue.increment(1),
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true })

const clearFailedAttempts = (uid) => db.doc(`accessAttempts/${uid}`).delete()

const requireGoogleTutor = (request) => {
  const provider = request.auth?.token?.firebase?.sign_in_provider
  if (!request.auth || provider !== 'google.com') {
    throw new HttpsError(
      'unauthenticated',
      'Cal iniciar sessió amb Google com a tutor.',
    )
  }
  return request.auth.uid
}

const cleanRequiredText = (value, label, maxLength = 80) => {
  const cleanValue = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (cleanValue.length < 2 || cleanValue.length > maxLength) {
    throw new HttpsError(
      'invalid-argument',
      `${label} ha de tenir entre 2 i ${maxLength} caràcters.`,
    )
  }
  return cleanValue
}

const callableOptions = {
  region: 'europe-west1',
  secrets: [codePepper],
  timeoutSeconds: 15,
  memory: '256MiB',
  maxInstances: 10,
  cors: [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    'https://marcpcasals.github.io',
  ],
}

export const createClass = onCall(callableOptions, async (request) => {
  const tutorId = requireGoogleTutor(request)
  const name = cleanRequiredText(request.data?.name, 'El nom de la classe')
  const course = cleanRequiredText(request.data?.course, 'El curs')
  const pepper = codePepper.value()
  const classRef = db.collection('classes').doc()

  let classCode
  let credentialRef
  for (let attempt = 0; attempt < 5; attempt += 1) {
    classCode = createAccessCode(5)
    const digest = credentialDigest({ kind: 'class', code: classCode, pepper })
    const candidateRef = db.doc(`accessCredentials/${digest}`)
    if (!(await candidateRef.get()).exists) {
      credentialRef = candidateRef
      break
    }
  }

  if (!credentialRef) {
    throw new HttpsError('aborted', 'No s’ha pogut generar un codi únic. Torna-ho a provar.')
  }

  const batch = db.batch()
  batch.create(classRef, {
    tutorId,
    name,
    course,
    active: true,
    subjectIds: DEFAULT_SUBJECTS.map((subject) => subject.id),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  batch.create(credentialRef, {
    classId: classRef.id,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  })
  batch.create(db.doc(`tutors/${tutorId}/classSecrets/${classRef.id}`), {
    classId: classRef.id,
    classCode,
    credentialVersion: 1,
    createdAt: FieldValue.serverTimestamp(),
  })

  for (const subject of DEFAULT_SUBJECTS) {
    batch.create(classRef.collection('rooms').doc(subject.id), {
      name: subject.name,
      subjectId: subject.id,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()

  return {
    classId: classRef.id,
    classCode,
    name,
    course,
    subjectCount: DEFAULT_SUBJECTS.length,
  }
})

export const exchangeStudentCodes = onCall(callableOptions, async (request) => {
  const uid = requireAnonymousUser(request)
  const classCode = normalizeAccessCode(request.data?.classCode)
  const studentCode = normalizeAccessCode(request.data?.studentCode)

  if (!isValidAccessCode(classCode, 5) || !isValidAccessCode(studentCode, 8)) {
    throw invalidCodesError()
  }

  const now = Timestamp.now()
  await assertAttemptAllowed(uid, now)

  const pepper = codePepper.value()
  const classHash = credentialDigest({ kind: 'class', code: classCode, pepper })
  const classCredentialRef = db.doc(`accessCredentials/${classHash}`)
  const classCredential = await classCredentialRef.get()
  const classData = classCredential.data()

  if (!classCredential.exists || classData?.active !== true || !classData?.classId) {
    await recordFailedAttempt(uid)
    throw invalidCodesError()
  }

  const studentHash = credentialDigest({
    kind: `student:${classData.classId}`,
    code: studentCode,
    pepper,
  })
  const studentCredential = await classCredentialRef
    .collection('students')
    .doc(studentHash)
    .get()
  const studentData = studentCredential.data()

  if (
    !studentCredential.exists
    || studentData?.active !== true
    || !studentData?.studentId
    || !Number.isInteger(studentData?.credentialVersion)
  ) {
    await recordFailedAttempt(uid)
    throw invalidCodesError()
  }

  const studentRef = db.doc(
    `classes/${classData.classId}/students/${studentData.studentId}`,
  )
  const student = await studentRef.get()
  const currentStudent = student.data()

  if (
    !student.exists
    || currentStudent?.active !== true
    || currentStudent?.credentialVersion !== studentData.credentialVersion
  ) {
    await recordFailedAttempt(uid)
    throw invalidCodesError()
  }

  const expiresAt = Timestamp.fromMillis(now.toMillis() + SESSION_DURATION_MS)
  await Promise.all([
    db.doc(`studentSessions/${uid}`).set({
      active: true,
      classId: classData.classId,
      studentId: studentData.studentId,
      credentialVersion: studentData.credentialVersion,
      createdAt: FieldValue.serverTimestamp(),
      lastValidatedAt: FieldValue.serverTimestamp(),
      expiresAt,
    }),
    clearFailedAttempts(uid),
  ])

  return {
    classId: classData.classId,
    studentId: studentData.studentId,
    expiresAt: expiresAt.toDate().toISOString(),
  }
})
