import { describe, expect, it } from 'vitest'
import { addMinutesToTime, normalizePlanningSetup } from './planningSetup.js'

describe('configuració inicial de planificació', () => {
  it('combina sortida escolar, trajecte i descans', () => {
    const setup = normalizePlanningSetup({ travelMinutes: 20, restMinutes: 30 })
    expect(setup.availabilitySummary.availableAfterByDay.monday).toBe('17:50')
    expect(setup.availabilitySummary.availableAfterByDay.wednesday).toBe('14:50')
    expect(setup.personalEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'travel-monday', type: 'travel', start: '17:00', end: '17:20' }),
      expect.objectContaining({ id: 'rest-wednesday', type: 'rest', start: '14:20', end: '14:50' }),
    ]))
  })

  it('manté el nom de l’extraescolar fora del resum tutorial', () => {
    const setup = normalizePlanningSetup({
      activities: [{ day: 'monday', start: '18:00', end: '19:30', label: 'Futbol' }],
    })
    expect(setup.privateSettings.activities[0].label).toBe('Futbol')
    expect(setup.personalEvents).toContainEqual(expect.objectContaining({ label: 'Futbol', type: 'other' }))
    expect(setup.availabilitySummary.blockedSlots).toContainEqual({
      day: 'monday', start: '18:00', end: '19:30',
    })
    expect(setup.availabilitySummary.blockedSlots.every((slot) => !('label' in slot))).toBe(true)
  })

  it('valida hores i durades', () => {
    expect(addMinutesToTime('17:00', 45)).toBe('17:45')
    expect(() => normalizePlanningSetup({ travelMinutes: 181 })).toThrow('trajecte')
    expect(() => normalizePlanningSetup({
      activities: [{ day: 'monday', start: '20:00', end: '19:00', label: 'Activitat' }],
    })).toThrow('acabar')
  })
})
