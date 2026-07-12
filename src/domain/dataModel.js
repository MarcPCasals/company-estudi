const assertDocumentId = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/')) {
    throw new Error(`${label} ha de ser un identificador de document vàlid.`)
  }
  return value.trim()
}

export const dataPaths = {
  classroom: (classId) => `classes/${assertDocumentId(classId, 'classId')}`,
  student: (classId, studentId) =>
    `${dataPaths.classroom(classId)}/students/${assertDocumentId(studentId, 'studentId')}`,
  subject: (classId, subjectId) =>
    `${dataPaths.classroom(classId)}/subjects/${assertDocumentId(subjectId, 'subjectId')}`,
  room: (classId, subjectId) =>
    `${dataPaths.classroom(classId)}/rooms/${assertDocumentId(subjectId, 'subjectId')}`,
  task: (classId, studentId, taskId) =>
    `${dataPaths.student(classId, studentId)}/tasks/${assertDocumentId(taskId, 'taskId')}`,
  taskCandidate: (classId, candidateId) =>
    `${dataPaths.classroom(classId)}/taskCandidates/${assertDocumentId(candidateId, 'candidateId')}`,
  officialTask: (classId, officialTaskId) =>
    `${dataPaths.classroom(classId)}/officialTasks/${assertDocumentId(officialTaskId, 'officialTaskId')}`,
  studySession: (classId, studentId, sessionId) =>
    `${dataPaths.student(classId, studentId)}/studySessions/${assertDocumentId(sessionId, 'sessionId')}`,
  occupation: (classId, studentId, occupationId) =>
    `${dataPaths.student(classId, studentId)}/personalSchedule/${assertDocumentId(occupationId, 'occupationId')}`,
}

export const TASK_RECORD_KIND = Object.freeze({
  PERSONAL: 'personal_task',
  COMMUNITY_CANDIDATE: 'community_candidate',
  OFFICIAL: 'official_task',
})

const cleanTaskText = (value, label) => {
  const cleanValue = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (cleanValue.length < 2 || cleanValue.length > 200) {
    throw new Error(`${label} ha de tenir entre 2 i 200 caràcters.`)
  }
  return cleanValue
}

const taskBase = ({ classId, subjectId, title, deadline }) => ({
  classId: assertDocumentId(classId, 'classId'),
  subjectId: assertDocumentId(subjectId, 'subjectId'),
  title: cleanTaskText(title, 'El títol'),
  deadline,
})

export const createPersonalTaskRecord = ({
  classId,
  ownerStudentId,
  subjectId,
  title,
  deadline = createDeadline(),
  privateNote = '',
}) => ({
  ...taskBase({ classId, subjectId, title, deadline }),
  recordKind: TASK_RECORD_KIND.PERSONAL,
  ownerStudentId: assertDocumentId(ownerStudentId, 'ownerStudentId'),
  privateNote: String(privateNote).trim(),
  officialTaskId: null,
})

export const createCommunityTaskCandidateRecord = ({
  classId,
  subjectId,
  title,
  deadline = createDeadline(),
  fingerprint,
}) => ({
  ...taskBase({ classId, subjectId, title, deadline }),
  recordKind: TASK_RECORD_KIND.COMMUNITY_CANDIDATE,
  fingerprint: assertDocumentId(fingerprint, 'fingerprint'),
})

export const createOfficialTaskRecord = ({
  classId,
  subjectId,
  title,
  deadline = createDeadline(),
  confirmedByTutorId,
}) => ({
  ...taskBase({ classId, subjectId, title, deadline }),
  recordKind: TASK_RECORD_KIND.OFFICIAL,
  confirmedByTutorId: assertDocumentId(confirmedByTutorId, 'confirmedByTutorId'),
})

export const DEADLINE_CERTAINTY = Object.freeze({
  CONFIRMED: 'confirmed',
  TO_CONFIRM: 'to_confirm',
  WITHOUT_DATE: 'without_date',
})

export const createDeadline = ({
  certainty = DEADLINE_CERTAINTY.WITHOUT_DATE,
  at = null,
  timezone = 'Europe/Andorra',
} = {}) => {
  if (!Object.values(DEADLINE_CERTAINTY).includes(certainty)) {
    throw new Error('La certesa del termini no és vàlida.')
  }
  if (certainty === DEADLINE_CERTAINTY.WITHOUT_DATE && at !== null) {
    throw new Error('Un termini sense data no pot contenir una data.')
  }
  if (certainty !== DEADLINE_CERTAINTY.WITHOUT_DATE && !at) {
    throw new Error('Un termini confirmat o per confirmar necessita una data.')
  }

  return { certainty, at, timezone }
}
