import { describe, expect, it } from 'vitest'
import { normalizeSmartMessageState, resolveStudentSmartMessages } from './smartMessages.js'

const task = (changes = {}) => ({ id: 'task-1', title: 'Examen de ciències', taskType: 'exam', status: 'pending', progressPercent: 0, estimatedMinutes: 90, deadline: { at: '2026-07-19T18:00:00+02:00' }, steps: [], ...changes })

describe('resolveStudentSmartMessages', () => {
  it('recorda la revisió diumenge després de les 18 h, però no si ja està feta', () => {
    const now = new Date('2026-07-19T18:15:00+02:00')
    expect(resolveStudentSmartMessages({ tasks: [task()], now }).some((item) => item.id.startsWith('weekly-review:'))).toBe(true)
    expect(resolveStudentSmartMessages({ tasks: [task()], reviews: [{ id: '2026-07-13' }], now }).some((item) => item.id.startsWith('weekly-review:'))).toBe(false)
  })

  it('adapta la recomanació d’examen als dies i a la feina restant', () => {
    const messages = resolveStudentSmartMessages({ tasks: [task()], now: new Date('2026-07-17T12:00:00+02:00'), maximum: 10 })
    expect(messages.find((item) => item.id === 'exam-normal:task-1:2')).toMatchObject({ level: 'alert' })
  })

  it('prioritza un pla insuficient per sobre d’un suggeriment de dividir', () => {
    const messages = resolveStudentSmartMessages({ tasks: [task({ activeSessionId: 'session-1' })], sessions: [{ id: 'session-1', taskId: 'task-1', state: 'planned', scheduledAt: '2026-07-18T17:00:00+02:00', durationMinutes: 30 }], now: new Date('2026-07-17T12:00:00+02:00'), maximum: 10 })
    expect(messages[0].id).toContain('insufficient-plan')
  })

  it('respecta els missatges descartats i els ajornats que encara no han caducat', () => {
    const now = new Date('2026-07-17T12:00:00+02:00')
    const states = { 'exam-normal:task-1:2': { status: 'dismissed' }, 'urgent-not-started:task-1:2026-07-17': { status: 'snoozed', until: '2026-07-17T15:00:00+02:00' } }
    const messages = resolveStudentSmartMessages({ tasks: [task()], messageStates: states, now, maximum: 10 })
    expect(messages.some((item) => states[item.id])).toBe(false)
  })

  it('no recomana sempre més estudi quan la preparació ja està completada', () => {
    expect(resolveStudentSmartMessages({ tasks: [task({ progressPercent: 100 })], now: new Date('2026-07-18T12:00:00+02:00'), maximum: 10 })).toHaveLength(0)
  })
})

describe('normalizeSmartMessageState', () => {
  it('rebutja estats desconeguts', () => expect(() => normalizeSmartMessageState({ status: 'ignored' })).toThrow())
})
