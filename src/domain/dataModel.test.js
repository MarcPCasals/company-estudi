import { describe, expect, it } from 'vitest'
import {
  DEADLINE_CERTAINTY,
  DELIVERY_STATUS,
  TASK_ACTOR_ROLE,
  TASK_HISTORY_EVENT,
  TASK_RECORD_KIND,
  TASK_STATUS,
  changeTaskDeliveryStatus,
  createCommunityTaskCandidateRecord,
  createDeadline,
  createOfficialTaskRecord,
  createPersonalTaskRecord,
  createTaskHistoryEvent,
  transitionTaskStatus,
  dataPaths,
} from './dataModel.js'

describe('model de dades', () => {
  it('situa les dades personals dins de l’alumne propietari', () => {
    expect(dataPaths.task('class-1', 'student-1', 'task-1')).toBe(
      'classes/class-1/students/student-1/tasks/task-1',
    )
    expect(dataPaths.studySession('class-1', 'student-1', 'session-1')).toBe(
      'classes/class-1/students/student-1/studySessions/session-1',
    )
    expect(dataPaths.occupation('class-1', 'student-1', 'football')).toBe(
      'classes/class-1/students/student-1/personalSchedule/football',
    )
  })

  it('vincula assignatura i sala sense barrejar-ne les funcions', () => {
    expect(dataPaths.subject('class-1', 'catala')).toBe('classes/class-1/subjects/catala')
    expect(dataPaths.room('class-1', 'catala')).toBe('classes/class-1/rooms/catala')
  })

  it('separa les ubicacions personal, candidata i oficial', () => {
    expect(dataPaths.task('class-1', 'student-1', 'task-1')).toBe(
      'classes/class-1/students/student-1/tasks/task-1',
    )
    expect(dataPaths.taskCandidate('class-1', 'candidate-1')).toBe(
      'classes/class-1/taskCandidates/candidate-1',
    )
    expect(dataPaths.officialTask('class-1', 'official-1')).toBe(
      'classes/class-1/officialTasks/official-1',
    )
  })

  it('manté les notes privades només a la tasca personal', () => {
    const commonFields = {
      classId: 'class-1',
      subjectId: 'catala',
      title: 'Exercicis de comprensió',
    }
    const personal = createPersonalTaskRecord({
      ...commonFields,
      ownerStudentId: 'student-1',
      privateNote: 'No entenc l’exercici 4.',
    })
    const candidate = createCommunityTaskCandidateRecord({
      ...commonFields,
      fingerprint: 'catala-exercicis-comprensio',
    })
    const official = createOfficialTaskRecord({
      ...commonFields,
      confirmedByTutorId: 'tutor-1',
    })

    expect(personal.recordKind).toBe(TASK_RECORD_KIND.PERSONAL)
    expect(personal.privateNote).toBe('No entenc l’exercici 4.')
    expect(personal.status).toBe(TASK_STATUS.PENDING)
    expect(personal.deliveryStatus).toBe(DELIVERY_STATUS.NOT_DELIVERED)
    expect(candidate.recordKind).toBe(TASK_RECORD_KIND.COMMUNITY_CANDIDATE)
    expect(candidate).not.toHaveProperty('ownerStudentId')
    expect(candidate).not.toHaveProperty('privateNote')
    expect(official.recordKind).toBe(TASK_RECORD_KIND.OFFICIAL)
    expect(official).not.toHaveProperty('privateNote')
  })

  it('registra una transició vàlida sense interpretar-la com una penalització', () => {
    const transition = transitionTaskStatus({
      classId: 'class-1',
      ownerStudentId: 'student-1',
      taskId: 'task-1',
      fromStatus: TASK_STATUS.IN_PROGRESS,
      toStatus: TASK_STATUS.PLANNED,
      reason: 'Necessito una altra sessió demà.',
      happenedAt: '2026-09-14T18:00:00.000Z',
    })

    expect(transition.taskChanges.status).toBe(TASK_STATUS.PLANNED)
    expect(transition.historyEvent).toMatchObject({
      eventType: TASK_HISTORY_EVENT.STATUS_CHANGED,
      actorRole: TASK_ACTOR_ROLE.STUDENT,
      from: TASK_STATUS.IN_PROGRESS,
      to: TASK_STATUS.PLANNED,
      reason: 'Necessito una altra sessió demà.',
    })
    expect(transition.historyEvent).not.toHaveProperty('penalty')
  })

  it('impedeix salts incoherents des de per aclarir', () => {
    expect(() => transitionTaskStatus({
      classId: 'class-1',
      ownerStudentId: 'student-1',
      taskId: 'task-1',
      fromStatus: TASK_STATUS.NEEDS_CLARIFICATION,
      toStatus: TASK_STATUS.IN_PROGRESS,
    })).toThrow('No es pot passar')
  })

  it('separa fet d’entregat', () => {
    const doneTask = createPersonalTaskRecord({
      classId: 'class-1',
      ownerStudentId: 'student-1',
      subjectId: 'catala',
      title: 'Redacció',
      lifecycle: { status: TASK_STATUS.DONE },
    })
    expect(doneTask.deliveryStatus).toBe(DELIVERY_STATUS.NOT_DELIVERED)

    const delivery = changeTaskDeliveryStatus({
      classId: 'class-1',
      ownerStudentId: 'student-1',
      taskId: 'task-1',
      taskStatus: TASK_STATUS.DONE,
      fromDeliveryStatus: DELIVERY_STATUS.NOT_DELIVERED,
      toDeliveryStatus: DELIVERY_STATUS.DELIVERED,
      happenedAt: '2026-09-14T19:00:00.000Z',
    })
    expect(delivery.taskChanges.deliveryStatus).toBe(DELIVERY_STATUS.DELIVERED)
    expect(delivery.historyEvent.eventType).toBe(TASK_HISTORY_EVENT.DELIVERY_CHANGED)
  })

  it('no permet marcar com entregada una tasca encara no feta', () => {
    expect(() => changeTaskDeliveryStatus({
      classId: 'class-1',
      ownerStudentId: 'student-1',
      taskId: 'task-1',
      taskStatus: TASK_STATUS.IN_PROGRESS,
      fromDeliveryStatus: DELIVERY_STATUS.NOT_DELIVERED,
      toDeliveryStatus: DELIVERY_STATUS.DELIVERED,
    })).toThrow('tasca feta')
  })

  it('modela un historial append-only sota la tasca', () => {
    expect(dataPaths.taskHistory('class-1', 'student-1', 'task-1', 'event-1')).toBe(
      'classes/class-1/students/student-1/tasks/task-1/history/event-1',
    )
    const event = createTaskHistoryEvent({
      classId: 'class-1',
      ownerStudentId: 'student-1',
      taskId: 'task-1',
      eventType: TASK_HISTORY_EVENT.HELP_REQUESTED,
      actorRole: TASK_ACTOR_ROLE.STUDENT,
      actorId: 'student-1',
      happenedAt: '2026-09-14T19:30:00.000Z',
    })
    expect(event.eventType).toBe(TASK_HISTORY_EVENT.HELP_REQUESTED)
  })

  it('representa un termini com a part de la tasca', () => {
    expect(createDeadline({
      certainty: DEADLINE_CERTAINTY.CONFIRMED,
      at: '2026-09-18T21:59:00.000Z',
    })).toEqual({
      certainty: 'confirmed',
      at: '2026-09-18T21:59:00.000Z',
      timezone: 'Europe/Andorra',
    })
  })

  it('rebutja identificadors i terminis incoherents', () => {
    expect(() => dataPaths.student('class/1', 'student-1')).toThrow()
    expect(() => createDeadline({ certainty: 'without_date', at: '2026-09-18' })).toThrow()
  })
})
