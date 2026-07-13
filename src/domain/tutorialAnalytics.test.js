import { describe, expect, it } from 'vitest'
import { TASK_STATUS } from './dataModel.js'
import { buildClassExceptions, buildStudentInsights, buildSupportiveNotice } from './tutorialAnalytics.js'

describe('avaluació formadora explicable', () => {
  it('genera tendències amb recompte i sense puntuació secreta', () => {
    const insights = buildStudentInsights({ tasks: [{ status: TASK_STATUS.PENDING, activeSessionId: 's1', progressPercent: 25 }] })
    expect(insights[0].interpretation).toContain('1 de 1')
    expect(insights.every((item) => !('score' in item))).toBe(true)
  })

  it('mostra excepcions observables, no judicis personals', () => {
    const result = buildClassExceptions({ students: [{ id: 'a', displayName: 'Alba' }], tasksByStudent: { a: [{ status: TASK_STATUS.PENDING, helpRequested: true }] } })
    expect(result[0]).toMatchObject({ type: 'help', studentName: 'Alba' })
  })

  it('estructura els avisos amb observació, proposta i suport', () => {
    expect(buildSupportiveNotice({ title: 'Revisem el pla', observation: 'hi ha dues tasques pendents', suggestedAction: 'tria una primera franja', support: 'ho podem mirar junts' }).message)
      .toBe('Hem observat: hi ha dues tasques pendents Et proposem: tria una primera franja Si ho necessites: ho podem mirar junts')
  })
})
