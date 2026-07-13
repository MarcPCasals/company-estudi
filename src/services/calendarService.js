import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

const requireFirestore = () => {
  if (!db) throw new Error('Firestore no està configurat en aquest entorn.')
  return db
}

export const observeStudentCalendar = ({ classId, studentId }, onData, onError) => {
  const firestore = requireFirestore()
  const studentPath = ['classes', classId, 'students', studentId]
  const state = {
    tasks: [],
    sessions: [],
    occupations: [],
    availability: null,
  }
  const loaded = new Set()
  const emit = (source) => {
    loaded.add(source)
    onData({ ...state, ready: loaded.size === 4 })
  }
  const observeCollection = (source, path, sorter) => onSnapshot(
    collection(firestore, ...path),
    { includeMetadataChanges: true },
    (snapshot) => {
      state[source] = snapshot.docs
        .map((document) => ({ id: document.id, ...document.data() }))
        .sort(sorter)
      emit(source)
    },
    onError,
  )

  const stops = [
    observeCollection('tasks', [...studentPath, 'tasks'], (left, right) =>
      (left.deadline?.at ?? '9999').localeCompare(right.deadline?.at ?? '9999')),
    observeCollection('sessions', [...studentPath, 'studySessions'], (left, right) =>
      String(left.scheduledAt).localeCompare(String(right.scheduledAt))),
    observeCollection('occupations', [...studentPath, 'personalSchedule'], (left, right) =>
      `${left.day}-${left.start}`.localeCompare(`${right.day}-${right.start}`)),
    onSnapshot(
      doc(firestore, ...studentPath, 'availability', 'current'),
      { includeMetadataChanges: true },
      (snapshot) => {
        state.availability = snapshot.exists() ? snapshot.data() : null
        emit('availability')
      },
      onError,
    ),
  ]
  return () => stops.forEach((stop) => stop())
}
