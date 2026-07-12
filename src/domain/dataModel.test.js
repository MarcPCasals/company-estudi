import { describe, expect, it } from 'vitest'
import {
  DEADLINE_CERTAINTY,
  TASK_RECORD_KIND,
  createCommunityTaskCandidateRecord,
  createDeadline,
  createOfficialTaskRecord,
  createPersonalTaskRecord,
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
    expect(candidate.recordKind).toBe(TASK_RECORD_KIND.COMMUNITY_CANDIDATE)
    expect(candidate).not.toHaveProperty('ownerStudentId')
    expect(candidate).not.toHaveProperty('privateNote')
    expect(official.recordKind).toBe(TASK_RECORD_KIND.OFFICIAL)
    expect(official).not.toHaveProperty('privateNote')
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
