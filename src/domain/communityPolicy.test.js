import { describe, expect, it } from 'vitest'
import { detectCommonTasks, normalizeCommunityPost } from './communityPolicy.js'

describe('política comunitària', () => {
  it('impedeix avisos d’alumne i manté autoria visible', () => {
    expect(() => normalizeCommunityPost({ type: 'notice', title: 'Avís', body: 'Text', authorRole: 'student' })).toThrow('tutor')
  })

  it('aplica 50% i un mínim de cinc sense retornar identitats', () => {
    const students = Array.from({ length: 8 }, (_, index) => ({ id: `s${index}`, active: true }))
    const task = { fingerprint: 'catala|exercicis|2026-09-18', subjectId: 'catala', title: 'Exercicis', status: 'pending' }
    const tasksByStudent = Object.fromEntries(students.slice(0, 5).map((student) => [student.id, [task]]))
    const [candidate] = detectCommonTasks({ students, tasksByStudent })
    expect(candidate).toMatchObject({ count: 5, requiredCount: 5, classSize: 8 })
    expect(candidate).not.toHaveProperty('studentIds')
  })

  it('no activa detecció en classes de menys de cinc', () => {
    expect(detectCommonTasks({ students: [{ id: 'a' }], tasksByStudent: { a: [] } })).toEqual([])
  })

  it('compta alumnes únics encara que un alumne tingui un duplicat', () => {
    const students = Array.from({ length: 10 }, (_, index) => ({ id: `s${index}` }))
    const task = { fingerprint: 'mate|tema|data', subjectId: 'matematiques', title: 'Tema', status: 'pending' }
    const tasksByStudent = Object.fromEntries(students.slice(0, 4).map((student) => [student.id, [task]]))
    tasksByStudent.s0 = [task, task]
    expect(detectCommonTasks({ students, tasksByStudent })).toEqual([])
  })
})
