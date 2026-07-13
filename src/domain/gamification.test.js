import { describe, expect, it } from 'vitest'
import {
  GAMIFICATION_ACTION,
  buildGamificationSummary,
  canAwardGamificationAction,
  createGamificationEventId,
  getGamificationLevel,
  getWeekKey,
  isEarlyStart,
} from './gamification.js'

describe('gamificació formadora', () => {
  it('utilitza una setmana de dilluns a diumenge', () => {
    expect(getWeekKey(new Date('2026-07-12T12:00:00'))).toBe('2026-07-06')
    expect(getWeekKey(new Date('2026-07-13T12:00:00'))).toBe('2026-07-13')
  })

  it('no premia dues vegades la mateixa planificació', () => {
    const now = new Date('2026-07-13T12:00:00')
    const id = createGamificationEventId({ action: GAMIFICATION_ACTION.PLANNED, sourceId: 'task-1', weekKey: '2026-07-13' })
    expect(canAwardGamificationAction({ events: [{ id }], action: GAMIFICATION_ACTION.PLANNED, sourceId: 'task-1', now })).toMatchObject({ allowed: false, reason: 'already_awarded' })
  })

  it('limita les accions repetides encara que provinguin de tasques diferents', () => {
    const events = [1, 2, 3].map((number) => ({ id: `planned--task-${number}`, action: 'planned', weekKey: '2026-07-13' }))
    expect(canAwardGamificationAction({ events, action: GAMIFICATION_ACTION.PLANNED, sourceId: 'task-4', now: new Date('2026-07-13T18:00:00') })).toMatchObject({ allowed: false, reason: 'weekly_limit' })
  })

  it('calcula nivells acumulatius sense perdre progrés', () => {
    expect(getGamificationLevel(0).level).toBe(1)
    expect(getGamificationLevel(105)).toMatchObject({ level: 3, progressPercent: 6 })
    expect(getGamificationLevel(500)).toMatchObject({ level: 5, progressPercent: 100 })
  })

  it('mesura constància per varietat d’hàbits, no per dies seguits', () => {
    const events = [
      { action: 'planned', xp: 10, weekKey: '2026-07-13' },
      { action: 'divided', xp: 10, weekKey: '2026-07-13' },
      { action: 'weekly_review', xp: 12, weekKey: '2026-07-13' },
    ]
    const summary = buildGamificationSummary({ events, now: new Date('2026-07-14T12:00:00') })
    expect(summary).toMatchObject({ totalXp: 32, consistencySteps: 3, consistencyComplete: true })
  })

  it('només considera inici amb temps quan falten almenys 24 hores', () => {
    const now = new Date('2026-07-13T12:00:00Z')
    expect(isEarlyStart({ deadlineAt: '2026-07-14T12:00:00Z', now })).toBe(true)
    expect(isEarlyStart({ deadlineAt: '2026-07-14T11:59:00Z', now })).toBe(false)
  })
})
