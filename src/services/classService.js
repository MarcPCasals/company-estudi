import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../lib/firebase.js'

const requireFirebaseService = (service, label) => {
  if (!service) throw new Error(`${label} no està configurat en aquest entorn.`)
  return service
}

export const createTutorClass = async ({ name, course }) => {
  const callable = httpsCallable(
    requireFirebaseService(functions, 'Firebase Functions'),
    'createClass',
  )
  const result = await callable({ name, course })
  return result.data
}

export const observeTutorClasses = (tutorId, onClasses, onError) => {
  const classesQuery = query(
    collection(requireFirebaseService(db, 'Firestore'), 'classes'),
    where('tutorId', '==', tutorId),
  )

  return onSnapshot(classesQuery, (snapshot) => {
    const classes = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }))
      .sort((left, right) => left.name.localeCompare(right.name, 'ca'))
    onClasses(classes)
  }, onError)
}
