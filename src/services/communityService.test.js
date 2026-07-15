import { describe, expect, it } from 'vitest'
import { countUnreadRoomPosts } from './communityService.js'

const at = (seconds) => ({ seconds })

describe('comptador de Comunitat', () => {
  it('és zero quan no hi ha contingut', () => {
    expect(countUnreadRoomPosts({ posts: [], studentId: 'student-1' })).toBe(0)
  })

  it('compta només el contingut visible, aliè i posterior a la darrera lectura', () => {
    const posts = [
      { id: 'old', authorStudentId: 'other', createdAt: at(10) },
      { id: 'new', authorStudentId: 'other', createdAt: at(30) },
      { id: 'own', authorStudentId: 'student-1', createdAt: at(40) },
      { id: 'hidden', authorStudentId: 'other', createdAt: at(50), hidden: true },
    ]

    expect(countUnreadRoomPosts({ posts, lastReadAt: 20_000, studentId: 'student-1' })).toBe(1)
  })

  it('considera nou tot el contingut aliè si la sala encara no s’ha visitat', () => {
    const posts = [
      { id: 'question', authorStudentId: 'student-2', createdAt: at(10) },
      { id: 'reply', authorStudentId: 'student-3', createdAt: at(20), parentPostId: 'question' },
    ]

    expect(countUnreadRoomPosts({ posts, studentId: 'student-1' })).toBe(2)
  })

  it('s’actualitza quan arriba contingut nou i torna a zero en marcar-lo com a llegit', () => {
    const posts = [{ id: 'remote', authorStudentId: 'student-2', createdAt: at(30) }]

    expect(countUnreadRoomPosts({ posts, lastReadAt: 20_000, studentId: 'student-1' })).toBe(1)
    expect(countUnreadRoomPosts({ posts, lastReadAt: 30_000, studentId: 'student-1' })).toBe(0)
  })
})
