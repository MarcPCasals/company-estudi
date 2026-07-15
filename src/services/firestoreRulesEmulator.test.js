import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore'

const runEmulatorTests = import.meta.env.VITE_RUN_FIREBASE_EMULATOR_TESTS === 'true'
const emulatorDescribe = runEmulatorTests ? describe : describe.skip
const rules = readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8')

const CLASS_ID = 'quality-class'
const STUDENT_A = 'student-a'
const STUDENT_B = 'student-b'
const TUTOR_UID = 'tutor-quality'
const COTUTOR_UID = 'cotutor-quality'
const EXTERNAL_TUTOR_UID = 'external-quality'
const STUDENT_A_UID = 'auth-student-a'
const STUDENT_B_UID = 'auth-student-b'

const providerClaims = (provider) => ({ firebase: { sign_in_provider: provider } })

emulatorDescribe('Regles de Firestore · privacitat i permisos', () => {
  let environment

  const tutorDb = () => environment.authenticatedContext(TUTOR_UID, providerClaims('google.com')).firestore()
  const cotutorDb = () => environment.authenticatedContext(COTUTOR_UID, {
    ...providerClaims('google.com'),
    email: 'cotutor@educand.ad',
  }).firestore()
  const externalTutorDb = () => environment.authenticatedContext(EXTERNAL_TUTOR_UID, providerClaims('google.com')).firestore()
  const studentADb = () => environment.authenticatedContext(STUDENT_A_UID, providerClaims('password')).firestore()
  const studentBDb = () => environment.authenticatedContext(STUDENT_B_UID, providerClaims('password')).firestore()

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: 'company-estudi',
      firestore: {
        host: '127.0.0.1',
        port: Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT ?? 8080),
        rules,
      },
    })
  })

  beforeEach(async () => {
    await environment.clearFirestore()
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await Promise.all([
        setDoc(doc(db, 'classes', CLASS_ID), { tutorId: TUTOR_UID, teacherIds: [TUTOR_UID], name: 'Classe de qualitat' }),
        setDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A), { active: true, authUid: STUDENT_A_UID, credentialVersion: 1, displayName: 'Alumna A' }),
        setDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_B), { active: true, authUid: STUDENT_B_UID, credentialVersion: 1, displayName: 'Alumne B' }),
        setDoc(doc(db, 'studentAccess', STUDENT_A_UID), { active: true, classId: CLASS_ID, studentId: STUDENT_A, credentialVersion: 1 }),
        setDoc(doc(db, 'studentAccess', STUDENT_B_UID), { active: true, classId: CLASS_ID, studentId: STUDENT_B, credentialVersion: 1 }),
        setDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'task-a'), { classId: CLASS_ID, ownerStudentId: STUDENT_A, subjectId: 'catala', title: 'Tasca A' }),
        setDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'task-a', 'private', 'details'), { privateNote: 'Nota que només veu l’alumna' }),
        setDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'personalSchedule', 'activity-a'), { label: 'Activitat privada', start: '18:00' }),
        setDoc(doc(db, 'classes', CLASS_ID, 'rooms', 'catala'), { memberMode: 'all', name: 'Català' }),
        setDoc(doc(db, 'classes', CLASS_ID, 'studyRoomPodium', 'current'), { entries: [], totalStudents: 2 }),
        setDoc(doc(db, 'classes', CLASS_ID, 'studyRoomLeaderboard', STUDENT_A), { studentId: STUDENT_A, displayName: 'Alumna A', totalXp: 20 }),
        setDoc(doc(db, 'tutors', TUTOR_UID, 'classSecrets', CLASS_ID), { classCode: 'SECRET' }),
      ])
    })
  })

  afterAll(async () => environment?.cleanup())

  it('nega qualsevol accés sense autenticar', async () => {
    const db = environment.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID)))
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID, 'studyRoomPodium', 'current')))
  })

  it('permet a cada alumne les seves dades però bloqueja les dels companys', async () => {
    const db = studentADb()
    await assertSucceeds(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'task-a')))
    await assertSucceeds(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'task-a', 'private', 'details')))
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_B)))
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_B, 'tasks', 'task-b')))
    await assertFails(getDoc(doc(db, 'tutors', TUTOR_UID, 'classSecrets', CLASS_ID)))
  })

  it('manté notes i horaris personals fora de la vista del tutor', async () => {
    const db = tutorDb()
    await assertSucceeds(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'task-a')))
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'task-a', 'private', 'details')))
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'personalSchedule', 'activity-a')))
  })

  it('evita filtracions del rànquing i permet només el podi públic de la classe', async () => {
    const db = studentBDb()
    await assertSucceeds(getDoc(doc(db, 'classes', CLASS_ID, 'studyRoomPodium', 'current')))
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID, 'studyRoomLeaderboard', STUDENT_A)))
    await assertFails(getDocs(collection(db, 'classes', CLASS_ID, 'studyRoomLeaderboard')))
  })

  it('bloqueja camps privats al document acadèmic i protegeix l’autoria', async () => {
    const db = studentADb()
    const ownTask = doc(db, 'classes', CLASS_ID, 'students', STUDENT_A, 'tasks', 'new-task')
    await assertSucceeds(setDoc(ownTask, { classId: CLASS_ID, ownerStudentId: STUDENT_A, subjectId: 'catala', title: 'Tasca segura' }))
    await assertFails(updateDoc(ownTask, { privateNote: 'No pot sortir al document compartit' }))
    await assertFails(setDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_B, 'tasks', 'forged'), { classId: CLASS_ID, ownerStudentId: STUDENT_B, subjectId: 'catala', title: 'Tasca falsa' }))
    await assertFails(deleteDoc(doc(db, 'classes', CLASS_ID, 'students', STUDENT_B, 'tasks', 'task-b')))
  })

  it('permet comunitat de classe sense convertir alumnes en emissors d’avisos', async () => {
    const db = studentADb()
    const post = doc(db, 'classes', CLASS_ID, 'rooms', 'catala', 'posts', 'post-a')
    await assertSucceeds(setDoc(post, { authorRole: 'student', authorStudentId: STUDENT_A, authorName: 'Alumna A', type: 'question', body: 'Em podeu ajudar?' }))
    await assertFails(setDoc(doc(db, 'classes', CLASS_ID, 'rooms', 'catala', 'posts', 'fake-notice'), { authorRole: 'student', authorStudentId: STUDENT_A, authorName: 'Alumna A', type: 'notice', body: 'Avís fals' }))
  })

  it('protegeix l’estat privat dels missatges intel·ligents', async () => {
    const ownState = doc(studentADb(), 'classes', CLASS_ID, 'students', STUDENT_A, 'private', 'smartMessages', 'states', 'weekly-review')
    await assertSucceeds(setDoc(ownState, { messageId: 'weekly-review', status: 'snoozed', until: '2026-07-20T18:00:00Z' }))
    await assertFails(getDoc(doc(tutorDb(), 'classes', CLASS_ID, 'students', STUDENT_A, 'private', 'smartMessages', 'states', 'weekly-review')))
    await assertFails(getDoc(doc(studentBDb(), 'classes', CLASS_ID, 'students', STUDENT_A, 'private', 'smartMessages', 'states', 'weekly-review')))
  })

  it('permet al tutor publicar una contradicció agregada sense permetre que la publiqui un alumne', async () => {
    const alertData = { classId: CLASS_ID, type: 'contradiction', status: 'active', title: 'Exercicis', publishedByTutorId: TUTOR_UID, variants: [{ key: '2026-09-18', count: 2 }, { key: '2026-09-19', count: 1 }] }
    const tutorAlert = doc(tutorDb(), 'classes', CLASS_ID, 'taskAlerts', 'alert-a')
    await assertSucceeds(setDoc(tutorAlert, alertData))
    await assertSucceeds(getDoc(doc(studentADb(), 'classes', CLASS_ID, 'taskAlerts', 'alert-a')))
    await assertFails(setDoc(doc(studentADb(), 'classes', CLASS_ID, 'taskAlerts', 'fake-alert'), { ...alertData, publishedByTutorId: STUDENT_A_UID }))
  })

  it('dona al cotutor acceptat accés pedagògic però no a codis ni configuració sensible', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await updateDoc(doc(db, 'classes', CLASS_ID), {
        teacherIds: [TUTOR_UID, COTUTOR_UID],
        cotutorId: COTUTOR_UID,
      })
      await setDoc(doc(db, 'classes', CLASS_ID, 'teacherMembers', COTUTOR_UID), {
        uid: COTUTOR_UID,
        role: 'cotutor',
        status: 'accepted',
      })
    })

    await assertSucceeds(getDoc(doc(cotutorDb(), 'classes', CLASS_ID)))
    await assertSucceeds(getDoc(doc(cotutorDb(), 'classes', CLASS_ID, 'students', STUDENT_A)))
    await assertSucceeds(setDoc(doc(cotutorDb(), 'classes', CLASS_ID, 'taskAlerts', 'cotutor-alert'), {
      classId: CLASS_ID,
      type: 'contradiction',
      status: 'active',
      publishedByTutorId: COTUTOR_UID,
    }))
    await assertFails(updateDoc(doc(cotutorDb(), 'classes', CLASS_ID), { schoolSchedule: {} }))
    await assertFails(setDoc(doc(cotutorDb(), 'classes', CLASS_ID, 'students', 'new-student'), { displayName: 'No permès' }))
    await assertFails(getDoc(doc(cotutorDb(), 'tutors', TUTOR_UID, 'classSecrets', CLASS_ID)))
    await assertFails(getDoc(doc(externalTutorDb(), 'classes', CLASS_ID)))
  })

  it('no dona accés amb una invitació pendent i el concedeix només en acceptar-la amb el compte correcte', async () => {
    const invitationId = 'invitation-quality'
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'cotutorInvitations', invitationId), {
        classId: CLASS_ID,
        ownerTutorId: TUTOR_UID,
        inviteeEmailNormalized: 'cotutor@educand.ad',
        status: 'pending',
        expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
      })
    })
    await assertSucceeds(getDoc(doc(cotutorDb(), 'cotutorInvitations', invitationId)))
    await assertFails(getDoc(doc(cotutorDb(), 'classes', CLASS_ID)))
    await assertFails(getDoc(doc(externalTutorDb(), 'cotutorInvitations', invitationId)))

    const db = cotutorDb()
    const batch = writeBatch(db)
    batch.update(doc(db, 'cotutorInvitations', invitationId), {
      status: 'accepted',
      respondedAt: Timestamp.now(),
      respondedByUid: COTUTOR_UID,
    })
    batch.update(doc(db, 'classes', CLASS_ID), {
      teacherIds: [TUTOR_UID, COTUTOR_UID],
      cotutorId: COTUTOR_UID,
      membershipInvitationId: invitationId,
    })
    batch.set(doc(db, 'classes', CLASS_ID, 'teacherMembers', COTUTOR_UID), {
      uid: COTUTOR_UID,
      role: 'cotutor',
      status: 'accepted',
    })
    await assertSucceeds(batch.commit())
    await assertSucceeds(getDoc(doc(cotutorDb(), 'classes', CLASS_ID)))
  })

  it('talla immediatament l’accés del cotutor retirat', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'classes', CLASS_ID), {
        teacherIds: [TUTOR_UID, COTUTOR_UID],
        cotutorId: COTUTOR_UID,
      })
    })
    await assertSucceeds(getDoc(doc(cotutorDb(), 'classes', CLASS_ID, 'students', STUDENT_A)))
    await assertSucceeds(updateDoc(doc(tutorDb(), 'classes', CLASS_ID), {
      teacherIds: [TUTOR_UID],
      cotutorId: null,
    }))
    await assertFails(getDoc(doc(cotutorDb(), 'classes', CLASS_ID, 'students', STUDENT_A)))
  })
})
