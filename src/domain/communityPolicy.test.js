import { describe, expect, it } from 'vitest'
import { buildCommonTaskCorrection, detectCommonTaskContradictions, detectCommonTasks, normalizeCommunityPost } from './communityPolicy.js'

describe('política comunitària', () => {
  it('impedeix avisos d’alumne i manté autoria visible', () => {
    expect(() => normalizeCommunityPost({ type: 'notice', title: 'Avís', body: 'Text', authorRole: 'student' })).toThrow('tutor')
  })

  it('aplica un mínim de tres sense retornar identitats', () => {
    const students = Array.from({ length: 8 }, (_, index) => ({ id: `s${index}`, active: true }))
    const task = { fingerprint: 'catala|exercicis|2026-09-18', subjectId: 'catala', title: 'Exercicis', status: 'pending' }
    const tasksByStudent = Object.fromEntries(students.slice(0, 3).map((student) => [student.id, [task]]))
    const [candidate] = detectCommonTasks({ students, tasksByStudent })
    expect(candidate).toMatchObject({ count: 3, requiredCount: 3, classSize: 8 })
    expect(candidate).not.toHaveProperty('studentIds')
  })

  it('no activa detecció en classes de menys de tres', () => {
    expect(detectCommonTasks({ students: [{ id: 'a' }], tasksByStudent: { a: [] } })).toEqual([])
  })

  it('compta alumnes únics encara que un alumne tingui un duplicat', () => {
    const students = Array.from({ length: 10 }, (_, index) => ({ id: `s${index}` }))
    const task = { fingerprint: 'mate|tema|data', subjectId: 'matematiques', title: 'Tema', status: 'pending' }
    const tasksByStudent = Object.fromEntries(students.slice(0, 4).map((student) => [student.id, [task]]))
    tasksByStudent.s0 = [task, task]
    expect(detectCommonTasks({ students, tasksByStudent })).toHaveLength(1)
  })

  it('genera una alarma agregada quan hi ha dates contradictòries', () => {
    const students = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const base = { subjectId: 'mates', title: 'Exercicis 4–8', status: 'pending' }
    const tasksByStudent = {
      a: [{ ...base, fingerprint: 'mates|exercicis 4 8|2026-09-18', deadline: { at: '2026-09-18T20:00:00Z' } }],
      b: [{ ...base, fingerprint: 'mates|exercicis 4 8|2026-09-18', deadline: { at: '2026-09-18T20:00:00Z' } }],
      c: [{ ...base, fingerprint: 'mates|exercicis 4 8|2026-09-19', deadline: { at: '2026-09-19T20:00:00Z' } }],
    }
    const [alarm] = detectCommonTaskContradictions({ students, tasksByStudent })
    expect(alarm).toMatchObject({ count: 3, variants: [{ key: '2026-09-18', count: 2 }, { key: '2026-09-19', count: 1 }] })
    expect(alarm).not.toHaveProperty('studentIds')
  })

  it('converteix una correcció de data del tutor en un termini confirmat', () => {
    const correction = buildCommonTaskCorrection({
      candidate: { title: 'Exercicis', deadline: null },
      title: 'Exercicis corregits',
      deadlineAt: '2026-07-15T23:59:00+02:00',
    })
    expect(correction).toEqual({
      title: 'Exercicis corregits',
      deadline: {
        certainty: 'confirmed',
        at: '2026-07-15T21:59:00.000Z',
        timezone: 'Europe/Andorra',
      },
    })
  })
})
