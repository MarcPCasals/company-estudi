import {
  doc,
  collection,
  serverTimestamp,
  setDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { createClassCode } from '../domain/accessCodes.js'
import { DEFAULT_SUBJECTS } from '../data/subjects.js'
import { resolveSyncState } from '../domain/offlinePolicy.js'
import { auth, db } from '../lib/firebase.js'

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
  await setDoc(classRef, {
    tutorId: tutor.uid,
    name: cleanName,
    course: cleanCourse,
    active: true,
    subjectIds: DEFAULT_SUBJECTS.map((subject) => subject.id),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const metadataBatch = writeBatch(firestore)
  metadataBatch.set(doc(firestore, 'tutors', tutor.uid, 'classSecrets', classRef.id), {
    classId: classRef.id,
    classCode,
    credentialVersion: 1,
    createdAt: serverTimestamp(),
  })
  for (const subject of DEFAULT_SUBJECTS) {
    metadataBatch.set(doc(firestore, 'classes', classRef.id, 'subjects', subject.id), {
      ...subject,
      active: true,
      createdAt: serverTimestamp(),
    })
  }
  await metadataBatch.commit()

  const roomsBatch = writeBatch(firestore)
  for (const subject of DEFAULT_SUBJECTS) {
    roomsBatch.set(doc(firestore, 'classes', classRef.id, 'rooms', subject.id), {
      name: subject.name,
      subjectId: subject.id,
      active: true,
      createdAt: serverTimestamp(),
    })
  }
  await roomsBatch.commit()

  return {
    classId: classRef.id,
    classCode,
    name: cleanName,
    course: cleanCourse,
    subjectCount: DEFAULT_SUBJECTS.length,
  }
}

export const observeTutorClasses = (tutorId, onClasses, onError) => {
  const classesQuery = query(
    collection(requireFirebaseService(db, 'Firestore'), 'classes'),
    where('tutorId', '==', tutorId),
  )

  return onSnapshot(classesQuery, { includeMetadataChanges: true }, (snapshot) => {
    const classes = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }))
      .sort((left, right) => left.name.localeCompare(right.name, 'ca'))
    onClasses(classes, {
      state: resolveSyncState({
        online: globalThis.navigator?.onLine ?? true,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.docs.some(
          (document) => document.metadata.hasPendingWrites,
        ),
      }),
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.docs.some(
        (document) => document.metadata.hasPendingWrites,
      ),
    })
  }, onError)
}
