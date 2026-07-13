import { describe, expect, it } from 'vitest'
import { TASK_STATUS } from './dataModel.js'
import {
  buildWeekDays,
  deriveTodaySummary,
  localDateKey,
  suggestStudySlots,
} from './calendarPlanning.js'

const availability = {
  availableAfterByDay: {
    monday: '17:45', tuesday: '17:45', wednesday: '14:45', thursday: '17:45', friday: '17:45',
  },
  weekend: { enabled: false, start: null, end: null },
}

describe('calendari i propostes de franges', () => {
  it('construeix sempre una setmana de dilluns a diumenge', () => {
    const week = buildWeekDays(new Date('2026-09-16T12:00:00+02:00'))
    expect(week.map((day) => day.id)).toEqual([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ])
    expect(week[0].dateKey).toBe('2026-09-14')
    expect(week[6].dateKey).toBe('2026-09-20')
  })

  it('proposa una franja després del descans i evita una extraescolar', () => {
    const week = buildWeekDays(new Date('2026-09-14T12:00:00+02:00'))
    const suggestions = suggestStudySlots({
      task: { id: 'task-1', estimatedMinutes: 45, deadline: { at: '2026-09-18T23:59:00+02:00' } },
      weekDays: week,
      availability,
      occupations: [{ day: 'monday', start: '17:45', end: '19:00' }],
      now: new Date('2026-09-14T16:00:00+02:00'),
    })
    expect(localDateKey(suggestions[0].scheduledAt)).toBe('2026-09-14')
    expect(new Date(suggestions[0].scheduledAt).getHours()).toBe(19)
    expect(new Date(suggestions[0].scheduledAt).getMinutes()).toBe(15)
    expect(suggestions[0].durationMinutes).toBe(45)
  })

  it('no omple el final del dia ni proposa cap de setmana desactivat', () => {
    const week = buildWeekDays(new Date('2026-09-18T12:00:00+02:00'))
    const suggestions = suggestStudySlots({
      task: { id: 'task-1', estimatedMinutes: 180, deadline: { at: null } },
      weekDays: week,
      availability,
      sessions: [{ id: 'busy', scheduledAt: '2026-09-18T20:30:00+02:00', durationMinutes: 30 }],
      now: new Date('2026-09-18T20:00:00+02:00'),
    })
    expect(suggestions).toEqual([])
  })

  it('només suggereix: no modifica la tasca ni crea sessions', () => {
    const task = Object.freeze({ id: 'task-1', estimatedMinutes: 30, deadline: { at: null } })
    const sessions = []
    suggestStudySlots({
      task,
      weekDays: buildWeekDays(new Date('2026-09-14T12:00:00+02:00')),
      availability,
      sessions,
      now: new Date('2026-09-14T16:00:00+02:00'),
    })
    expect(sessions).toEqual([])
    expect(task).toEqual({ id: 'task-1', estimatedMinutes: 30, deadline: { at: null } })
  })

  it('prioritza la propera sessió a la pantalla Avui', () => {
    const summary = deriveTodaySummary({
      tasks: [{ id: 'task-1', status: TASK_STATUS.PENDING }],
      sessions: [{ id: 'session-1', state: 'planned', scheduledAt: '2026-09-14T18:00:00+02:00' }],
      today: new Date('2026-09-14T17:00:00+02:00'),
    })
    expect(summary).toMatchObject({ kind: 'session', session: { id: 'session-1' } })
  })
})
