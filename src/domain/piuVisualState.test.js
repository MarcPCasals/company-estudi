import { describe, expect, it } from 'vitest'
import { PIU_EVENT, PIU_SURFACE, isPiuStateAllowed, resolvePiuVisualState } from './piuVisualState.js'

describe('motor visual viu de Piu', () => {
  it('saluda alegrement només en la primera entrada del dia', () => {
    expect(resolvePiuVisualState({ surface: PIU_SURFACE.HOME, firstEntryToday: true }).state).toBe('greeting_happy')
    expect(resolvePiuVisualState({ surface: PIU_SURFACE.HOME, returningToday: true }).state).toBe('greeting_normal')
  })

  it('prioritza un problema de connexió per sobre d’una celebració', () => {
    expect(resolvePiuVisualState({ event: PIU_EVENT.IMPORTANT_TASK_COMPLETED, online: false }).state).toBe('concerned')
    expect(resolvePiuVisualState({ event: PIU_EVENT.TASK_SAVED, hasError: true }).state).toBe('concerned')
  })

  it('gradua les reaccions positives segons la mida del pas', () => {
    expect(resolvePiuVisualState({ event: PIU_EVENT.TASK_SAVED }).state).toBe('satisfied')
    expect(resolvePiuVisualState({ event: PIU_EVENT.TASK_COMPLETED }).state).toBe('happy')
    expect(resolvePiuVisualState({ event: PIU_EVENT.IMPORTANT_TASK_COMPLETED }).state).toBe('very_happy')
    expect(resolvePiuVisualState({ event: PIU_EVENT.WEEKLY_REVIEW }).state).toBe('proud')
  })

  it('manté una reacció fins que acaba la durada mínima', () => {
    expect(resolvePiuVisualState({
      surface: PIU_SURFACE.TASKS,
      previousState: 'happy',
      previousShownAt: 1_000,
      now: 3_000,
    }).state).toBe('happy')
  })

  it('respecta el refredament i torna al context persistent', () => {
    expect(resolvePiuVisualState({
      surface: PIU_SURFACE.TASKS,
      event: PIU_EVENT.TASK_SAVED,
      lastShownAt: { satisfied: 9_000 },
      now: 10_000,
    }).state).toBe('ready')
  })

  it('només dorm si no hi ha una activitat funcional en curs', () => {
    const late = new Date('2026-07-13T23:00:00')
    expect(resolvePiuVisualState({ surface: PIU_SURFACE.HOME, localTime: late }).state).toBe('sleeping')
    expect(resolvePiuVisualState({ surface: PIU_SURFACE.HOME, localTime: late, activity: 'working' }).state).toBe('focused_work')
  })

  it('tria una reacció de temps lliure estable i permet veure les dues variants', () => {
    const localTime = new Date(2026, 8, 14, 18, 0)
    const first = resolvePiuVisualState({ surface: PIU_SURFACE.HOME, activity: 'free_time', variantSeed: 'alumne-a', localTime }).state
    expect(resolvePiuVisualState({ surface: PIU_SURFACE.HOME, activity: 'free_time', variantSeed: 'alumne-a', localTime }).state).toBe(first)
    const variants = new Set(['alumne-a', 'alumne-b'].map((variantSeed) => resolvePiuVisualState({ surface: PIU_SURFACE.HOME, activity: 'free_time', variantSeed, localTime }).state))
    expect(variants).toEqual(new Set(['free_time_music', 'free_time_rubik']))
  })

  it('no permet seleccionar imatges que culpabilitzen', () => {
    expect(isPiuStateAllowed('angry')).toBe(false)
    expect(isPiuStateAllowed('annoyed')).toBe(false)
    expect(isPiuStateAllowed('disappointed')).toBe(false)
    expect(isPiuStateAllowed('facepalm')).toBe(false)
  })
})
