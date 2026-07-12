import {
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { normalizePlanningSetup } from '../domain/planningSetup.js'
import { db } from '../lib/firebase.js'

export const saveStudentPlanningSetup = async ({
  classId,
  studentId,
  schoolSchedule,
  ...input
}) => {
  if (!db) throw new Error('Firestore no està configurat.')
  const normalized = normalizePlanningSetup({ ...input, schoolSchedule })
  const studentPath = ['classes', classId, 'students', studentId]
  const batch = writeBatch(db)

  batch.set(doc(db, ...studentPath, 'private', 'planning'), {
    ...normalized.privateSettings,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  for (let index = 0; index < 10; index += 1) {
    batch.delete(doc(db, ...studentPath, 'personalSchedule', `activity-${index}`))
  }
  for (const event of normalized.personalEvents) {
    batch.set(doc(db, ...studentPath, 'personalSchedule', event.id), {
      ...event,
      recurring: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  batch.set(doc(db, ...studentPath, 'availability', 'current'), {
    classId,
    ownerStudentId: studentId,
    ...normalized.availabilitySummary,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
  return normalized
}
