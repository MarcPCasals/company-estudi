import { describe, expect, it } from 'vitest'
import {
  DEADLINE_CERTAINTY,
  createDeadline,
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
