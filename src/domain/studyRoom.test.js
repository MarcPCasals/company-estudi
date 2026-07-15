import { describe, expect, it } from 'vitest'
import {
  STUDY_ROOM_DURATIONS,
  STUDY_ROOM_PHASE,
  STUDY_ROOM_DAILY_XP_LIMIT,
  STUDY_ROOM_FIRST_BLOCK_XP,
  STUDY_ROOM_FULL_SESSION_XP,
  STUDY_ROOM_SECOND_BLOCK_XP,
  STUDY_ROOM_EVOLUTIONS,
  STUDY_ROOM_ADVANCED_MINIMUM_XP,
  STUDY_ROOM_ACTIVE_SESSION_VERSION,
  createStudyRoomTimer,
  createStudyRoomSessionSnapshot,
  buildStudyRoomLeaderboard,
  formatStudyRoomTime,
  getNextStudyRoomPhase,
  getRecommendedStudyTask,
  getStudyRoomRemainingSeconds,
  getStudyRoomTotalBlocks,
  getStudyRoomXpDecision,
  getStudyRoomEvolution,
  isAdvancedStudyRoomUnlocked,
  normalizeStudyRoomSessionSnapshot,
  pauseStudyRoomTimer,
  resumeStudyRoomTimer,
} from './studyRoom.js'

describe('study room session', () => {
  it('follows the complete 30 + 15 + 30 flow', () => {
    expect(getNextStudyRoomPhase(STUDY_ROOM_PHASE.PREPARATION)).toBe(STUDY_ROOM_PHASE.FOCUS_ONE)
    expect(getNextStudyRoomPhase(STUDY_ROOM_PHASE.FOCUS_ONE)).toBe(STUDY_ROOM_PHASE.REVIEW_ONE)
    expect(getNextStudyRoomPhase(STUDY_ROOM_PHASE.REVIEW_ONE)).toBe(STUDY_ROOM_PHASE.BREAK)
    expect(getNextStudyRoomPhase(STUDY_ROOM_PHASE.BREAK)).toBe(STUDY_ROOM_PHASE.FOCUS_TWO)
    expect(getNextStudyRoomPhase(STUDY_ROOM_PHASE.FOCUS_TWO)).toBe(STUDY_ROOM_PHASE.REVIEW_TWO)
    expect(getNextStudyRoomPhase(STUDY_ROOM_PHASE.REVIEW_TWO)).toBe(STUDY_ROOM_PHASE.SUMMARY)
    expect(STUDY_ROOM_DURATIONS[STUDY_ROOM_PHASE.FOCUS_ONE]).toBe(1800)
    expect(STUDY_ROOM_DURATIONS[STUDY_ROOM_PHASE.BREAK]).toBe(900)
  })

  it('derives remaining time from the end timestamp', () => {
    const timer = createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, 1_000)
    expect(getStudyRoomRemainingSeconds(timer, 6_000)).toBe(1795)
  })

  it('pauses and resumes without losing the remaining time', () => {
    const timer = createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, 1_000)
    const paused = pauseStudyRoomTimer(timer, 11_000)
    expect(paused.remainingSeconds).toBe(1790)
    const resumed = resumeStudyRoomTimer(paused, 21_000)
    expect(resumed.endsAt).toBe(1_811_000)
  })

  it('formats the timer consistently', () => {
    expect(formatStudyRoomTime(1800)).toBe('30:00')
    expect(formatStudyRoomTime(65)).toBe('01:05')
    expect(formatStudyRoomTime(-1)).toBe('00:00')
  })

  it('rewards a complete session more than stopping after the first block', () => {
    expect(STUDY_ROOM_FIRST_BLOCK_XP).toBe(4)
    expect(STUDY_ROOM_SECOND_BLOCK_XP).toBe(16)
    expect(STUDY_ROOM_FULL_SESSION_XP).toBe(20)
    expect(getStudyRoomXpDecision({ blockNumber: 1, dailyXp: 0 })).toEqual({ awarded: true, xp: 4, reason: 'awarded_block' })
    expect(getStudyRoomXpDecision({ blockNumber: 2, dailyXp: 4, firstBlockCompleted: true })).toEqual({ awarded: true, xp: 16, reason: 'awarded_full_session' })
  })

  it('allows more study sessions but caps rewards at 40 XP per day', () => {
    expect(STUDY_ROOM_DAILY_XP_LIMIT).toBe(40)
    expect(getStudyRoomXpDecision({ blockNumber: 1, dailyXp: 40 })).toEqual({ awarded: false, xp: 0, reason: 'daily_limit' })
    expect(getStudyRoomXpDecision({ blockNumber: 2, dailyXp: 4 })).toEqual({ awarded: false, xp: 0, reason: 'missing_first_block' })
    expect(getStudyRoomXpDecision({ blockNumber: 1, dailyXp: 20, alreadyAwarded: true })).toEqual({ awarded: false, xp: 0, reason: 'already_awarded' })
  })

  it('maps XP to the fourteen Piu evolutions', () => {
    expect(STUDY_ROOM_EVOLUTIONS).toHaveLength(14)
    expect(getStudyRoomEvolution(0)).toMatchObject({ level: 1, name: 'Ou', xpToNext: 40 })
    expect(getStudyRoomEvolution(20)).toMatchObject({ level: 1, name: 'Ou', xpToNext: 20 })
    expect(getStudyRoomEvolution(1450)).toMatchObject({ level: 9, name: 'Graduat' })
    expect(getStudyRoomEvolution(6000)).toMatchObject({ level: 14, name: 'Llegendari' })
  })

  it('changes evolution exactly at every configured XP threshold', () => {
    STUDY_ROOM_EVOLUTIONS.forEach((stage, index) => {
      expect(getStudyRoomEvolution(stage.minimumXp)).toMatchObject({ level: stage.level, name: stage.name })
      if (index > 0) expect(getStudyRoomEvolution(stage.minimumXp - 1).level).toBe(stage.level - 1)
    })
  })

  it('offers 45-minute blocks from level 7 at 800 XP', () => {
    expect(STUDY_ROOM_ADVANCED_MINIMUM_XP).toBe(800)
    expect(isAdvancedStudyRoomUnlocked(799)).toBe(false)
    expect(isAdvancedStudyRoomUnlocked(800)).toBe(true)
    expect(createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, 1_000, 45).remainingSeconds).toBe(2700)
    expect(createStudyRoomTimer(STUDY_ROOM_PHASE.BREAK, 1_000, 45).remainingSeconds).toBe(900)
  })

  it('offers a one-block 25-minute session without changing the normal and advanced modes', () => {
    expect(createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, 1_000, 25).remainingSeconds).toBe(1500)
    expect(getStudyRoomTotalBlocks(25)).toBe(1)
    expect(getStudyRoomTotalBlocks(30)).toBe(2)
    expect(getStudyRoomTotalBlocks(45)).toBe(2)
  })

  it('selects the next planned task and otherwise the most urgent open task', () => {
    const tasks = [
      { id: 'urgent', title: 'Urgent', status: 'pending', deadline: { at: '2026-07-16T20:00:00Z' } },
      { id: 'planned', title: 'Planificada', status: 'planned', deadline: { at: '2026-07-20T20:00:00Z' } },
      { id: 'done', title: 'Feta', status: 'done', deadline: { at: '2026-07-15T10:00:00Z' } },
    ]
    expect(getRecommendedStudyTask({ tasks, sessions: [{ taskId: 'planned', state: 'planned', scheduledAt: '2026-07-17T18:00:00Z' }], now: '2026-07-15T12:00:00Z' })?.id).toBe('planned')
    expect(getRecommendedStudyTask({ tasks, sessions: [], now: '2026-07-15T12:00:00Z' })?.id).toBe('urgent')
  })

  it('stores only the minimum state needed to resume a timed phase', () => {
    const timer = createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, 1_000)
    const snapshot = createStudyRoomSessionSnapshot({
      sessionId: 'session-1',
      phase: STUDY_ROOM_PHASE.FOCUS_ONE,
      timer,
      focusLabel: 'Tema 3',
      startedAt: 1_000,
    })
    expect(snapshot).toMatchObject({
      version: STUDY_ROOM_ACTIVE_SESSION_VERSION,
      sessionId: 'session-1',
      phase: STUDY_ROOM_PHASE.FOCUS_ONE,
      focusLabel: 'Tema 3',
      timer: { endsAt: 1_801_000, paused: false },
    })
    expect(getStudyRoomRemainingSeconds(snapshot.timer, 11_000)).toBe(1790)
  })

  it('rejects invalid or finished session snapshots', () => {
    expect(normalizeStudyRoomSessionSnapshot(null)).toBeNull()
    expect(normalizeStudyRoomSessionSnapshot({ version: 99, status: 'active' })).toBeNull()
    expect(normalizeStudyRoomSessionSnapshot({
      version: STUDY_ROOM_ACTIVE_SESSION_VERSION,
      status: 'active',
      sessionId: 'done',
      phase: STUDY_ROOM_PHASE.SUMMARY,
    })).toBeNull()
  })

  it('orders the class ranking by study-room XP and shares positions on ties', () => {
    expect(buildStudyRoomLeaderboard([
      { studentId: 'b', displayName: 'Berta', totalXp: 20 },
      { studentId: 'a', displayName: 'Arnau', totalXp: 20 },
      { studentId: 'c', displayName: 'Clàudia', totalXp: 4 },
    ], 'b')).toEqual([
      expect.objectContaining({ studentId: 'a', position: 1, isCurrentStudent: false }),
      expect.objectContaining({ studentId: 'b', position: 1, isCurrentStudent: true }),
      expect.objectContaining({ studentId: 'c', position: 3, isCurrentStudent: false }),
    ])
  })
})
