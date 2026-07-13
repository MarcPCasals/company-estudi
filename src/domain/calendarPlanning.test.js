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
    const week = buildWeekDays(new Date(2026, 8, 16, 12, 0))
    expect(week.map((day) => day.id)).toEqual([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ])
    expect(week[0].dateKey).toBe('2026-09-14')
    expect(week[6].dateKey).toBe('2026-09-20')
  })

  it('proposa una franja després del descans i evita una extraescolar', () => {
    const week = buildWeekDays(new Date(2026, 8, 14, 12, 0))
    const deadline = new Date(2026, 8, 18, 23, 59).toISOString()
    const suggestions = suggestStudySlots({
      task: { id: 'task-1', estimatedMinutes: 45, deadline: { at: deadline } },
      weekDays: week,
      availability,
      occupations: [{ day: 'monday', start: '17:45', end: '19:00' }],
      now: new Date(2026, 8, 14, 16, 0),
    })
    expect(localDateKey(suggestions[0].scheduledAt)).toBe('2026-09-14')
    expect(new Date(suggestions[0].scheduledAt).getHours()).toBe(19)
    expect(new Date(suggestions[0].scheduledAt).getMinutes()).toBe(15)
    expect(suggestions[0].durationMinutes).toBe(45)
  })

  it('no omple el final del dia ni proposa cap de setmana desactivat', () => {
    const week = buildWeekDays(new Date(2026, 8, 18, 12, 0))
    const suggestions = suggestStudySlots({
      task: { id: 'task-1', estimatedMinutes: 180, deadline: { at: null } },
      weekDays: week,
      availability,
      sessions: [{ id: 'busy', state: 'planned', scheduledAt: new Date(2026, 8, 18, 20, 30).toISOString(), durationMinutes: 30 }],
      now: new Date(2026, 8, 18, 20, 0),
    })
    expect(suggestions).toEqual([])
  })

  it('només suggereix: no modifica la tasca ni crea sessions', () => {
    const task = Object.freeze({ id: 'task-1', estimatedMinutes: 30, deadline: { at: null } })
    const sessions = []
    suggestStudySlots({
      task,
      weekDays: buildWeekDays(new Date(2026, 8, 14, 12, 0)),
      availability,
      sessions,
      now: new Date(2026, 8, 14, 16, 0),
    })
    expect(sessions).toEqual([])
    expect(task).toEqual({ id: 'task-1', estimatedMinutes: 30, deadline: { at: null } })
  })

  it('prioritza la propera sessió a la pantalla Avui', () => {
    const summary = deriveTodaySummary({
      tasks: [{ id: 'task-1', status: TASK_STATUS.PENDING }],
      sessions: [{ id: 'session-1', state: 'planned', scheduledAt: new Date(2026, 8, 14, 18, 0).toISOString() }],
      today: new Date(2026, 8, 14, 17, 0),
    })
    expect(summary).toMatchObject({ kind: 'session', session: { id: 'session-1' } })
  })
})
