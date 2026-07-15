import { describe, expect, it } from 'vitest'
import { TASK_STATUS } from './dataModel.js'
import {
  buildWeekDays,
  deriveTodaySummary,
  findDailyReviewTask,
  isStudentFreeTimeNow,
  localDateKey,
  suggestStudySlots,
  suggestWeeklyPlans,
  validateStudySlot,
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

  it('marca temps lliure només dins la disponibilitat i fora de sessions o ocupacions', () => {
    const now = new Date(2026, 8, 14, 18, 0)
    expect(isStudentFreeTimeNow({ availability, now })).toBe(true)
    expect(isStudentFreeTimeNow({ availability, occupations: [{ day: 'monday', start: '17:45', end: '19:00' }], now })).toBe(false)
    expect(isStudentFreeTimeNow({ availability, sessions: [{ state: 'planned', scheduledAt: now.toISOString(), durationMinutes: 30 }], now })).toBe(false)
    expect(isStudentFreeTimeNow({ availability, now: new Date(2026, 8, 14, 16, 0) })).toBe(false)
  })

  it('bloqueja una sessió a les 17:30 si el descans ocupa de 17:15 a 17:45', () => {
    const result = validateStudySlot({
      task: { id: 'task-1' },
      scheduledAt: new Date(2026, 8, 14, 17, 30).toISOString(),
      durationMinutes: 30,
      availability: { ...availability, availableAfterByDay: { ...availability.availableAfterByDay, monday: '17:15' } },
      occupations: [{ day: 'monday', start: '17:15', end: '17:45', type: 'rest' }],
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('solapa')
  })

  it('crea un pla setmanal sense modificar dades i divideix un treball llarg', () => {
    const tasks = [{ id: 'project', title: 'Treball llarg', taskType: 'project', status: TASK_STATUS.PENDING, estimatedMinutes: 150, deadline: { at: new Date(2026, 8, 18, 23, 59).toISOString() } }]
    const result = suggestWeeklyPlans({ tasks, weekDays: buildWeekDays(new Date(2026, 8, 14)), availability, now: new Date(2026, 8, 14, 16, 0) })
    expect(result.alternatives[0].sessions.length).toBe(3)
    expect(result.alternatives[0].sessions.every((item) => item.durationMinutes <= 60)).toBe(true)
    expect(tasks[0].activeSessionId).toBeUndefined()
  })

  it('detecta una setmana sobrecarregada sense inventar franges', () => {
    const tasks = [{ id: 'exam', title: 'Examen', taskType: 'exam', status: TASK_STATUS.PENDING, estimatedMinutes: 300, deadline: { at: new Date(2026, 8, 14, 19, 0).toISOString() } }]
    const result = suggestWeeklyPlans({ tasks, weekDays: buildWeekDays(new Date(2026, 8, 14)), availability, occupations: [{ day: 'monday', start: '17:45', end: '20:30' }], now: new Date(2026, 8, 14, 16, 0) })
    expect(result.unscheduled.length).toBeGreaterThan(0)
  })

  it('retorna un pla buit quan no hi ha tasques pendents', () => {
    const result = suggestWeeklyPlans({ tasks: [], weekDays: buildWeekDays(new Date(2026, 8, 14)), availability })
    expect(result).toMatchObject({ alternatives: [], unscheduled: [], capacityMinutes: 0 })
  })

  it('reparteix la preparació d’un examen respectant diverses ocupacions', () => {
    const tasks = [{ id: 'exam-1', title: 'Examen de ciències', taskType: 'exam', status: TASK_STATUS.PENDING, estimatedMinutes: 120, deadline: { at: new Date(2026, 8, 18, 23, 59).toISOString() } }]
    const result = suggestWeeklyPlans({ tasks, weekDays: buildWeekDays(new Date(2026, 8, 14)), availability, occupations: [{ day: 'monday', start: '17:45', end: '19:00' }, { day: 'tuesday', start: '18:00', end: '19:30' }], now: new Date(2026, 8, 14, 16, 0) })
    expect(result.alternatives[0].sessions).toHaveLength(2)
    expect(result.alternatives[0].sessions.every((item) => validateStudySlot({ task: item.task, scheduledAt: item.scheduledAt, durationMinutes: item.durationMinutes, availability, occupations: [{ day: 'monday', start: '17:45', end: '19:00' }, { day: 'tuesday', start: '18:00', end: '19:30' }] }).valid)).toBe(true)
  })

  it('torna a proposar sense penalització una sessió passada que no consta completada', () => {
    const task = { id: 'task-1', title: 'Reprendre', status: TASK_STATUS.PLANNED, activeSessionId: 'old', estimatedMinutes: 30, deadline: { at: null } }
    const result = suggestWeeklyPlans({ tasks: [task], sessions: [{ id: 'old', taskId: task.id, state: 'planned', scheduledAt: new Date(2026, 8, 14, 15, 0).toISOString(), durationMinutes: 30 }], weekDays: buildWeekDays(new Date(2026, 8, 14)), availability, now: new Date(2026, 8, 15, 16, 0) })
    expect(result.alternatives[0].sessions.length).toBeGreaterThan(0)
  })

  it('només ofereix la revisió diària si avui ja ha acabat una sessió pendent', () => {
    const task = { id: 'task-1', status: TASK_STATUS.PLANNED }
    const pastSession = { taskId: task.id, state: 'planned', scheduledAt: new Date(2026, 8, 14, 17, 0).toISOString(), durationMinutes: 30 }
    expect(findDailyReviewTask({ tasks: [task], sessions: [], now: new Date(2026, 8, 14, 18, 0) })).toBeNull()
    expect(findDailyReviewTask({ tasks: [task], sessions: [pastSession], now: new Date(2026, 8, 14, 18, 0) })).toBe(task)
    expect(findDailyReviewTask({ tasks: [{ ...task, status: TASK_STATUS.DONE }], sessions: [pastSession], now: new Date(2026, 8, 14, 18, 0) })).toBeNull()
  })
})
