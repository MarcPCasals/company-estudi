export const STUDY_ROOM_PHASE = Object.freeze({
  PREPARATION: 'preparation',
  FOCUS_ONE: 'focus_one',
  REVIEW_ONE: 'review_one',
  BREAK: 'break',
  FOCUS_TWO: 'focus_two',
  REVIEW_TWO: 'review_two',
  SUMMARY: 'summary',
})

export const STUDY_ROOM_DURATIONS = Object.freeze({
  [STUDY_ROOM_PHASE.FOCUS_ONE]: 30 * 60,
  [STUDY_ROOM_PHASE.BREAK]: 15 * 60,
  [STUDY_ROOM_PHASE.FOCUS_TWO]: 30 * 60,
})

export const STUDY_ROOM_FIRST_BLOCK_XP = 4
export const STUDY_ROOM_SECOND_BLOCK_XP = 16
export const STUDY_ROOM_FULL_SESSION_XP = STUDY_ROOM_FIRST_BLOCK_XP + STUDY_ROOM_SECOND_BLOCK_XP
export const STUDY_ROOM_DAILY_XP_LIMIT = 40
export const STUDY_ROOM_ADVANCED_MINIMUM_XP = 800
export const STUDY_ROOM_ACTIVE_SESSION_VERSION = 1
export const STUDY_ROOM_FOCUS_MINUTES = Object.freeze([25, 30, 45])

export const STUDY_ROOM_SESSION_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
})

export const STUDY_ROOM_PHASE_STEP = Object.freeze({
  [STUDY_ROOM_PHASE.PREPARATION]: 0,
  [STUDY_ROOM_PHASE.FOCUS_ONE]: 1,
  [STUDY_ROOM_PHASE.REVIEW_ONE]: 2,
  [STUDY_ROOM_PHASE.BREAK]: 3,
  [STUDY_ROOM_PHASE.FOCUS_TWO]: 4,
  [STUDY_ROOM_PHASE.REVIEW_TWO]: 5,
  [STUDY_ROOM_PHASE.SUMMARY]: 6,
})

export const isAdvancedStudyRoomUnlocked = (xp = 0) => (Number(xp) || 0) >= STUDY_ROOM_ADVANCED_MINIMUM_XP
export const getStudyRoomTotalBlocks = (focusMinutes = 30) => Number(focusMinutes) === 25 ? 1 : 2

export const getRecommendedStudyTask = ({ tasks = [], sessions = [], now = new Date() } = {}) => {
  const openTasks = tasks.filter((task) => task?.id && task.status !== 'done')
  if (!openTasks.length) return null
  const nowMs = new Date(now).getTime()
  const upcoming = sessions
    .filter((item) => item?.state === 'planned' && openTasks.some((task) => task.id === item.taskId))
    .filter((item) => new Date(item.scheduledAt).getTime() >= nowMs)
    .sort((left, right) => String(left.scheduledAt).localeCompare(String(right.scheduledAt)))[0]
  if (upcoming) return openTasks.find((task) => task.id === upcoming.taskId) ?? null
  return [...openTasks].sort((left, right) => String(left.deadline?.at ?? '9999').localeCompare(String(right.deadline?.at ?? '9999')))[0]
}

export const STUDY_ROOM_EVOLUTIONS = Object.freeze([
  { level: 1, name: 'Ou', minimumXp: 0, file: 'evolucio-ou.png' },
  { level: 2, name: 'Ou esquerdat', minimumXp: 40, file: 'evolucio-ou-esquerdat.png' },
  { level: 3, name: 'Traient el cap', minimumXp: 100, file: 'evolucio-piu-traient-cap.png' },
  { level: 4, name: 'Acabat de néixer', minimumXp: 200, file: 'evolucio-piu-acabat-neixer.png' },
  { level: 5, name: 'Pollet', minimumXp: 350, file: 'evolucio-piu-pollet.png' },
  { level: 6, name: 'Adolescent', minimumXp: 550, file: 'evolucio-piu-adolescent.png' },
  { level: 7, name: 'Adult', minimumXp: 800, file: 'evolucio-piu-adult.png' },
  { level: 8, name: 'Professional', minimumXp: 1100, file: 'evolucio-piu-professional.png' },
  { level: 9, name: 'Graduat', minimumXp: 1450, file: 'evolucio-piu-graduat.png' },
  { level: 10, name: 'Aprenent de mag', minimumXp: 1850, file: 'evolucio-piu-aprenent-mag.png' },
  { level: 11, name: 'Mag', minimumXp: 2300, file: 'evolucio-piu-mag.png' },
  { level: 12, name: 'Gran mag', minimumXp: 3000, file: 'evolucio-piu-gran-mag.png' },
  { level: 13, name: 'Mestre del temps', minimumXp: 4000, file: 'evolucio-piu-mestre-temps.png' },
  { level: 14, name: 'Llegendari', minimumXp: 6000, file: 'evolucio-piu-llegendari.png' },
])

export const getStudyRoomEvolution = (xp = 0) => {
  const safeXp = Math.max(0, Number(xp) || 0)
  const current = [...STUDY_ROOM_EVOLUTIONS].reverse().find((stage) => safeXp >= stage.minimumXp) ?? STUDY_ROOM_EVOLUTIONS[0]
  const next = STUDY_ROOM_EVOLUTIONS.find((stage) => stage.level === current.level + 1) ?? null
  return { ...current, next, progressPercent: next ? Math.round(((safeXp - current.minimumXp) / (next.minimumXp - current.minimumXp)) * 100) : 100, xpToNext: next ? next.minimumXp - safeXp : 0 }
}

export const getStudyRoomXpDecision = ({ blockNumber, dailyXp = 0, alreadyAwarded = false, firstBlockCompleted = false }) => {
  if (alreadyAwarded) return { awarded: false, xp: 0, reason: 'already_awarded' }
  if (blockNumber === 2 && !firstBlockCompleted) return { awarded: false, xp: 0, reason: 'missing_first_block' }
  const xp = blockNumber === 1 ? STUDY_ROOM_FIRST_BLOCK_XP : STUDY_ROOM_SECOND_BLOCK_XP
  if (![1, 2].includes(blockNumber)) return { awarded: false, xp: 0, reason: 'invalid_block' }
  if (dailyXp + xp > STUDY_ROOM_DAILY_XP_LIMIT) {
    return { awarded: false, xp: 0, reason: 'daily_limit' }
  }
  return { awarded: true, xp, reason: blockNumber === 1 ? 'awarded_block' : 'awarded_full_session' }
}

export const isTimedStudyRoomPhase = (phase) => Boolean(STUDY_ROOM_DURATIONS[phase])

export const getNextStudyRoomPhase = (phase) => ({
  [STUDY_ROOM_PHASE.PREPARATION]: STUDY_ROOM_PHASE.FOCUS_ONE,
  [STUDY_ROOM_PHASE.FOCUS_ONE]: STUDY_ROOM_PHASE.REVIEW_ONE,
  [STUDY_ROOM_PHASE.REVIEW_ONE]: STUDY_ROOM_PHASE.BREAK,
  [STUDY_ROOM_PHASE.BREAK]: STUDY_ROOM_PHASE.FOCUS_TWO,
  [STUDY_ROOM_PHASE.FOCUS_TWO]: STUDY_ROOM_PHASE.REVIEW_TWO,
  [STUDY_ROOM_PHASE.REVIEW_TWO]: STUDY_ROOM_PHASE.SUMMARY,
}[phase] ?? STUDY_ROOM_PHASE.PREPARATION)

export const createStudyRoomTimer = (phase, now = Date.now(), focusMinutes = 30) => {
  if (!STUDY_ROOM_FOCUS_MINUTES.includes(focusMinutes)) throw new Error('La durada del bloc no és vàlida.')
  const durationSeconds = phase === STUDY_ROOM_PHASE.BREAK ? STUDY_ROOM_DURATIONS[phase] : focusMinutes * 60
  if (!durationSeconds) throw new Error('Aquesta fase no necessita cronòmetre.')
  return {
    phase,
    startedAt: now,
    endsAt: now + durationSeconds * 1000,
    remainingSeconds: durationSeconds,
    paused: false,
  }
}

export const getStudyRoomRemainingSeconds = (timer, now = Date.now()) => {
  if (!timer) return 0
  if (timer.paused) return Math.max(0, timer.remainingSeconds)
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
}

export const pauseStudyRoomTimer = (timer, now = Date.now()) => ({
  ...timer,
  paused: true,
  remainingSeconds: getStudyRoomRemainingSeconds(timer, now),
  endsAt: null,
})

export const resumeStudyRoomTimer = (timer, now = Date.now()) => ({
  ...timer,
  paused: false,
  startedAt: now,
  endsAt: now + timer.remainingSeconds * 1000,
})

export const formatStudyRoomTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const createStudyRoomSessionSnapshot = ({
  sessionId,
  phase,
  focusMinutes = 30,
  timer = null,
  focusLabel = 'Estudi lliure',
  completedBlocks = 0,
  startedAt = Date.now(),
}) => ({
  version: STUDY_ROOM_ACTIVE_SESSION_VERSION,
  sessionId: String(sessionId ?? '').slice(0, 120),
  status: STUDY_ROOM_SESSION_STATUS.ACTIVE,
  phase: Object.values(STUDY_ROOM_PHASE).includes(phase) ? phase : STUDY_ROOM_PHASE.PREPARATION,
  phaseStep: STUDY_ROOM_PHASE_STEP[phase] ?? 0,
  focusMinutes: STUDY_ROOM_FOCUS_MINUTES.includes(Number(focusMinutes)) ? Number(focusMinutes) : 30,
  focusLabel: String(focusLabel ?? 'Estudi lliure').trim().slice(0, 120) || 'Estudi lliure',
  completedBlocks: Math.min(2, Math.max(0, Number(completedBlocks) || 0)),
  startedAt: Number(startedAt) || Date.now(),
  timer: timer ? {
    phase: timer.phase,
    startedAt: Number(timer.startedAt) || null,
    endsAt: Number(timer.endsAt) || null,
    remainingSeconds: Math.max(0, Number(timer.remainingSeconds) || 0),
    paused: Boolean(timer.paused),
  } : null,
})

export const normalizeStudyRoomSessionSnapshot = (value) => {
  if (!value || value.version !== STUDY_ROOM_ACTIVE_SESSION_VERSION || value.status !== STUDY_ROOM_SESSION_STATUS.ACTIVE) return null
  if (!String(value.sessionId ?? '').trim()) return null
  const phase = Object.values(STUDY_ROOM_PHASE).includes(value.phase) ? value.phase : null
  if (!phase || phase === STUDY_ROOM_PHASE.SUMMARY) return null
  const snapshot = createStudyRoomSessionSnapshot({ ...value, phase })
  if (isTimedStudyRoomPhase(phase) && !snapshot.timer) return null
  return snapshot
}

export const buildStudyRoomLeaderboard = (entries = [], currentStudentId = '') => {
  let previousXp = null
  let previousPosition = 0
  return [...entries]
    .filter((entry) => entry?.studentId && entry?.displayName)
    .sort((left, right) => (Number(right.totalXp) || 0) - (Number(left.totalXp) || 0)
      || String(left.displayName).localeCompare(String(right.displayName), 'ca'))
    .map((entry, index) => {
      const totalXp = Math.max(0, Number(entry.totalXp) || 0)
      const position = totalXp === previousXp ? previousPosition : index + 1
      previousXp = totalXp
      previousPosition = position
      return { ...entry, totalXp, position, isCurrentStudent: entry.studentId === currentStudentId }
    })
}
