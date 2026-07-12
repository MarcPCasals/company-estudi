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
  studySession: (classId, studentId, sessionId) =>
    `${dataPaths.student(classId, studentId)}/studySessions/${assertDocumentId(sessionId, 'sessionId')}`,
  occupation: (classId, studentId, occupationId) =>
    `${dataPaths.student(classId, studentId)}/personalSchedule/${assertDocumentId(occupationId, 'occupationId')}`,
}

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
