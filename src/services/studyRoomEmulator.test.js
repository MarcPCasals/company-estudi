import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { STUDY_ROOM_PHASE, createStudyRoomTimer } from '../domain/studyRoom.js'
import { auth, db } from '../lib/firebase.js'
import {
  awardStudyRoomBlock,
  getStudyRoomBlockEventId,
  startOrResumeStudyRoomSession,
} from './studyRoomService.js'

const runEmulatorTests = import.meta.env.VITE_RUN_FIREBASE_EMULATOR_TESTS === 'true'
const emulatorDescribe = runEmulatorTests ? describe : describe.skip

const seedDocument = async (path, fields) => {
  const response = await fetch(`http://127.0.0.1:8080/v1/projects/company-estudi/databases/(default)/documents/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!response.ok) throw new Error(`No s'ha pogut preparar ${path}: ${await response.text()}`)
}

emulatorDescribe('Sala d’estudi contra els emuladors Firebase', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const classId = `qa-class-${suffix}`
  const studentId = `qa-student-${suffix}`
  const sessionId = `qa-session-${suffix}`
  let user

  beforeAll(async () => {
    const credential = await createUserWithEmailAndPassword(auth, `qa-${suffix}@company-estudi.test`, 'Validacio-13.6!')
    user = credential.user
    await seedDocument(`classes/${classId}`, { tutorId: { stringValue: 'qa-tutor' } })
    await seedDocument(`classes/${classId}/students/${studentId}`, {
      active: { booleanValue: true },
      authUid: { stringValue: user.uid },
      credentialVersion: { integerValue: '1' },
      displayName: { stringValue: 'Alumne de validació' },
    })
    await seedDocument(`studentAccess/${user.uid}`, {
      active: { booleanValue: true },
      classId: { stringValue: classId },
      studentId: { stringValue: studentId },
      credentialVersion: { integerValue: '1' },
    })
  })

  afterAll(async () => {
    if (user) await deleteUser(user)
  })

  it('registra una sessió curta una sola vegada encara que dos dispositius la confirmin alhora', async () => {
    const timer = createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, Date.now(), 25)
    await startOrResumeStudyRoomSession({
      classId,
      studentId,
      snapshot: {
        sessionId,
        phase: STUDY_ROOM_PHASE.FOCUS_ONE,
        focusMinutes: 25,
        focusLabel: 'Validació concurrent',
        completedBlocks: 0,
        timer,
      },
    })

    const input = { classId, studentId, sessionId, blockNumber: 1, durationMinutes: 25, reflection: 'Bloc curt completat.' }
    const results = await Promise.all([awardStudyRoomBlock(input), awardStudyRoomBlock(input)])
    const progress = await getDoc(doc(db, 'classes', classId, 'students', studentId, 'studyRoomProgress', 'current'))
    const block = await getDoc(doc(db, 'classes', classId, 'students', studentId, 'studyRoomBlocks', getStudyRoomBlockEventId(sessionId, 1)))
    const day = await getDoc(doc(db, 'classes', classId, 'students', studentId, 'studyRoomDays', new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date())))

    expect(results.map((result) => result.reason).sort()).toEqual(['already_awarded', 'awarded_block'])
    expect(progress.data()).toMatchObject({ totalXp: 4, rewardedBlocks: 1 })
    expect(block.data()).toMatchObject({ xp: 4, blockNumber: 1, sessionId })
    expect(day.data()).toMatchObject({ completedBlocks: 1, completedSessions: 1 })
  })
})
