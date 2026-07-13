import {
  doc,
  getDoc,
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
  const previousEventIds = [
    ...Array.from({ length: 10 }, (_, index) => `activity-${index}`),
    ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .flatMap((day) => [`travel-${day}`, `rest-${day}`]),
  ]
  const nextEventIds = new Set(normalized.personalEvents.map((event) => event.id))
  for (const eventId of previousEventIds) {
    if (!nextEventIds.has(eventId)) {
      batch.delete(doc(db, ...studentPath, 'personalSchedule', eventId))
    }
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

export const loadStudentPlanningSetup = async ({ classId, studentId }) => {
  if (!db) throw new Error('Firestore no està configurat.')
  const snapshot = await getDoc(doc(
    db,
    'classes', classId, 'students', studentId, 'private', 'planning',
  ))
  return snapshot.exists() ? snapshot.data() : null
}
