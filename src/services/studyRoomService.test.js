import { describe, expect, it } from 'vitest'
import { STUDY_ROOM_PHASE, createStudyRoomTimer } from '../domain/studyRoom.js'
import {
  clearLocalStudyRoomSession,
  getStudyRoomBlockEventId,
  loadLocalStudyRoomSession,
  saveLocalStudyRoomSession,
} from './studyRoomService.js'

const createMemoryStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('persistència local de la Sala d’estudi', () => {
  it('recupera una sessió amb el mateix temps final després de tancar la pestanya', () => {
    const storage = createMemoryStorage()
    const owner = { classId: 'classe-1', studentId: 'alumne-1' }
    const timer = createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, 1_000)
    const snapshot = {
      sessionId: 'sessio-1',
      phase: STUDY_ROOM_PHASE.FOCUS_ONE,
      focusMinutes: 30,
      focusLabel: 'Matemàtiques',
      completedBlocks: 0,
      timer,
    }

    expect(saveLocalStudyRoomSession({ ...owner, snapshot }, storage)).toBe(true)
    expect(loadLocalStudyRoomSession(owner, storage)).toMatchObject({
      sessionId: 'sessio-1',
      phase: STUDY_ROOM_PHASE.FOCUS_ONE,
      timer: { endsAt: timer.endsAt, paused: false },
    })
    expect(clearLocalStudyRoomSession(owner, storage)).toBe(true)
    expect(loadLocalStudyRoomSession(owner, storage)).toBeNull()
  })

  it('genera una única clau estable per bloc, també entre dispositius', () => {
    expect(getStudyRoomBlockEventId('sessio-1', 1)).toBe('sessio-1--1')
    expect(getStudyRoomBlockEventId('sessio-1', 1)).toBe(getStudyRoomBlockEventId('sessio-1', 1))
    expect(getStudyRoomBlockEventId('sessio-1', 2)).not.toBe(getStudyRoomBlockEventId('sessio-1', 1))
  })
})
