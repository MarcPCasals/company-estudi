import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { BookOpenText } from '@phosphor-icons/react/dist/csr/BookOpenText'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Coffee } from '@phosphor-icons/react/dist/csr/Coffee'
import { ClockCountdown } from '@phosphor-icons/react/dist/csr/ClockCountdown'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { getPiuAsset } from '../data/piuAssets.js'
import {
  STUDY_ROOM_PHASE,
  STUDY_ROOM_SESSION_STATUS,
  STUDY_ROOM_ADVANCED_MINIMUM_XP,
  createStudyRoomTimer,
  createStudyRoomSessionSnapshot,
  formatStudyRoomTime,
  getNextStudyRoomPhase,
  getRecommendedStudyTask,
  getStudyRoomEvolution,
  getStudyRoomRemainingSeconds,
  getStudyRoomTotalBlocks,
  isAdvancedStudyRoomUnlocked,
  pauseStudyRoomTimer,
  resumeStudyRoomTimer,
} from '../domain/studyRoom.js'
import { observeStudentCalendar } from '../services/calendarService.js'
import { observeConnectivity } from '../services/offlineService.js'
import {
  awardStudyRoomBlock,
  clearLocalStudyRoomSession,
  closeActiveStudyRoomSession,
  getActiveStudyRoomSession,
  getStudyRoomSessionBlocks,
  ensureStudyRoomLeaderboardEntry,
  loadLocalStudyRoomSession,
  observeStudyRoomDay,
  observePrivateStudyRoomRanking,
  observeStudyRoomPodium,
  observeStudyRoomProgress,
  saveLocalStudyRoomSession,
  startOrResumeStudyRoomSession,
  updateActiveStudyRoomSession,
} from '../services/studyRoomService.js'
import './studyRoom.css'

const PHASE_CONTENT = {
  [STUDY_ROOM_PHASE.FOCUS_ONE]: { eyebrow: 'Bloc 1 de 2', title: 'Centra’t en un sol pas' },
  [STUDY_ROOM_PHASE.BREAK]: { eyebrow: 'Pausa', title: 'Ara toca desconnectar' },
  [STUDY_ROOM_PHASE.FOCUS_TWO]: { eyebrow: 'Bloc 2 de 2', title: 'Tornem-hi amb calma' },
}

const evolutionAsset = (evolution) => `${import.meta.env.BASE_URL}mascota/piu/evolucions/${evolution.file}`
const emotionAsset = (state) => {
  const asset = getPiuAsset(state)
  return { ...asset, src: `${import.meta.env.BASE_URL}mascota/piu/${asset.file}` }
}
const formatPosition = (position) => ({ 1: '1r', 2: '2n', 3: '3r', 4: '4t' }[position] ?? `${position}è`)
const evolutionAlt = (evolution) => `Piu al nivell ${evolution.level}: ${evolution.name}`
const CONFETTI_PIECES = Array.from({ length: 48 }, (_, index) => ({
  id: index,
  left: (index * 37) % 101,
  delay: -((index * 73) % 900),
  duration: 2200 + ((index * 97) % 1300),
  drift: ((index * 53) % 161) - 80,
  rotation: (index * 47) % 360,
  color: ['#38a169', '#f2c94c', '#ef8354', '#4f86c6', '#9b5de5'][index % 5],
}))

const BREAK_VARIANT_KEY = 'company-estudi:study-room-break-piu'

const breakVariantForSession = (sessionId) => {
  try {
    const previous = JSON.parse(globalThis.localStorage?.getItem(BREAK_VARIANT_KEY) ?? 'null')
    if (previous?.sessionId === sessionId && ['free_time_music', 'free_time_rubik'].includes(previous.variant)) return previous.variant
    const variant = previous?.variant === 'free_time_music' ? 'free_time_rubik' : 'free_time_music'
    globalThis.localStorage?.setItem(BREAK_VARIANT_KEY, JSON.stringify({ sessionId, variant }))
    return variant
  } catch {
    return 'free_time_music'
  }
}

function StudyRoomEmotionVisual({ state, className = '' }) {
  const asset = emotionAsset(state)
  return <img className={className} src={asset.src} alt={asset.alt} />
}

function ConfettiCelebration() {
  return (
    <div className="study-room-confetti" aria-hidden="true">
      {CONFETTI_PIECES.map((piece) => <i key={piece.id} style={{ '--confetti-left': `${piece.left}%`, '--confetti-delay': `${piece.delay}ms`, '--confetti-duration': `${piece.duration}ms`, '--confetti-drift': `${piece.drift}px`, '--confetti-rotation': `${piece.rotation}deg`, '--confetti-color': piece.color }} />)}
    </div>
  )
}

function FocusPiuVisual({ phase, remainingSeconds, focusMinutes, breakVariant }) {
  const isFocus = phase === STUDY_ROOM_PHASE.FOCUS_ONE || phase === STUDY_ROOM_PHASE.FOCUS_TWO
  const state = phase === STUDY_ROOM_PHASE.FOCUS_ONE
    ? 'starting_work'
    : phase === STUDY_ROOM_PHASE.FOCUS_TWO
      ? 'focused_study'
      : breakVariant
  const percentage = isFocus ? Math.max(0, Math.min(100, (remainingSeconds / (focusMinutes * 60)) * 100)) : 0
  if (!isFocus) return <div className="study-room-break-visual"><StudyRoomEmotionVisual state={state} /></div>
  return (
    <div className="study-room-focus-ring" style={{ '--focus-progress': percentage }} role="progressbar" aria-label="Temps de concentració restant" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(percentage)}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle className="focus-ring-track" cx="110" cy="110" r="103" pathLength="100" />
        <circle className="focus-ring-progress" cx="110" cy="110" r="103" pathLength="100" />
      </svg>
      <StudyRoomEmotionVisual state={state} />
    </div>
  )
}

function StudyRoomEvolutionVisual({ evolution, alt = evolutionAlt(evolution) }) {
  return <img className="study-room-evolution-image" src={evolutionAsset(evolution)} alt={alt} />
}

function StudyRoomEvolutionProgress({ totalXp = 0, evolution }) {
  const currentXp = Math.max(Number(totalXp) || 0, 0)
  const nextThreshold = evolution.next?.minimumXp ?? null
  const percentage = nextThreshold ? Math.min(100, Math.round((currentXp / nextThreshold) * 100)) : 100
  return (
    <div className="study-room-evolution-progress">
      <strong>{nextThreshold ? `${currentXp} / ${nextThreshold} XP` : `${currentXp} XP`}</strong>
      <span>{evolution.next ? `Per desbloquejar ${evolution.next.name}` : 'Evolució màxima desbloquejada'}</span>
      <div role="progressbar" aria-label={evolution.next ? `Progrés per desbloquejar ${evolution.next.name}` : 'Evolució màxima desbloquejada'} aria-valuemin="0" aria-valuemax={nextThreshold ?? currentXp} aria-valuenow={currentXp}>
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default function StudyRoom({ session, onExit, onImmersiveChange = () => {} }) {
  const [phase, setPhase] = useState(STUDY_ROOM_PHASE.PREPARATION)
  const [calendar, setCalendar] = useState({ tasks: [], ready: false })
  const [taskId, setTaskId] = useState('free')
  const [taskChoiceInitialized, setTaskChoiceInitialized] = useState(false)
  const [goal, setGoal] = useState('')
  const [focusMinutes, setFocusMinutes] = useState(30)
  const [studyProgress, setStudyProgress] = useState({ totalXp: 0, rewardedBlocks: 0 })
  const [studyDay, setStudyDay] = useState({ completedBlocks: 0, completedSessions: 0, xp: 0 })
  const [podium, setPodium] = useState({ entries: [], totalStudents: 0 })
  const [privateRanking, setPrivateRanking] = useState(null)
  const [rankingAnnouncement, setRankingAnnouncement] = useState('')
  const [evolutionChange, setEvolutionChange] = useState(null)
  const [wellbeingConfirmed, setWellbeingConfirmed] = useState(false)
  const [online, setOnline] = useState(globalThis.navigator?.onLine ?? true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [timer, setTimer] = useState(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [clockVisible, setClockVisible] = useState(false)
  const [breakVariant, setBreakVariant] = useState('free_time_music')
  const [reflections, setReflections] = useState({ one: '', two: '' })
  const [completedBlocks, setCompletedBlocks] = useState(0)
  const [awards, setAwards] = useState([])
  const [savingBlock, setSavingBlock] = useState(false)
  const [studySessionId, setStudySessionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `study-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [activeFocusLabel, setActiveFocusLabel] = useState('')
  const [exitConfirm, setExitConfirm] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => observeStudentCalendar(
    { classId: session.classId, studentId: session.studentId },
    setCalendar,
    () => setStatus('No hem pogut carregar els deures. Encara pots fer estudi lliure.'),
  ), [session.classId, session.studentId])

  useEffect(() => observeStudyRoomProgress(
    { classId: session.classId, studentId: session.studentId },
    setStudyProgress,
    () => setStatus('No hem pogut actualitzar el nivell de Piu.'),
  ), [session.classId, session.studentId])

  useEffect(() => observeStudyRoomDay(
    { classId: session.classId, studentId: session.studentId },
    setStudyDay,
    () => setStatus('No hem pogut comprovar les sessions d’avui.'),
  ), [session.classId, session.studentId])

  useEffect(() => {
    ensureStudyRoomLeaderboardEntry({ classId: session.classId, studentId: session.studentId, displayName: session.displayName }).catch(() => {})
    return observeStudyRoomPodium(
      { classId: session.classId },
      setPodium,
      () => setStatus('No hem pogut actualitzar el podi de constància.'),
    )
  }, [session.classId, session.studentId, session.displayName])

  useEffect(() => observePrivateStudyRoomRanking(
    { classId: session.classId, studentId: session.studentId },
    (ranking) => {
      setPrivateRanking(ranking)
      if (!ranking?.movementId || !ranking.lastMovement) return
      const key = `company-estudi:study-room-ranking-seen:${session.classId}:${session.studentId}`
      try {
        if (globalThis.localStorage?.getItem(key) === ranking.movementId) return
        globalThis.localStorage?.setItem(key, ranking.movementId)
      } catch {
        // L'anunci continua funcionant encara que l'emmagatzematge local no estigui disponible.
      }
      const places = Math.abs(ranking.lastMovement)
      setRankingAnnouncement(ranking.lastMovement > 0
        ? `Has pujat ${places} ${places === 1 ? 'posició' : 'posicions'}! Ara vas ${formatPosition(ranking.position)}.`
        : `Ara vas ${formatPosition(ranking.position)}: has baixat ${places} ${places === 1 ? 'posició' : 'posicions'}. Pots recuperar terreny amb calma.`)
    },
    () => setStatus('No hem pogut actualitzar la teva posició privada.'),
  ), [session.classId, session.studentId])

  useEffect(() => observeConnectivity(setOnline), [])

  const openTasks = useMemo(() => calendar.tasks.filter((task) => task.status !== 'done'), [calendar.tasks])
  const selectedTask = openTasks.find((task) => task.id === taskId)
  const focusLabel = taskId === 'free' ? (goal.trim() || 'Estudi lliure') : selectedTask?.title ?? 'Tasca seleccionada'
  const advancedUnlocked = isAdvancedStudyRoomUnlocked(studyProgress.totalXp)
  const needsWellbeingConfirmation = studyDay.completedSessions > 0 && !wellbeingConfirmed
  const currentEvolution = getStudyRoomEvolution(studyProgress.totalXp)
  const totalBlocks = getStudyRoomTotalBlocks(focusMinutes)
  const isFocusPhase = phase === STUDY_ROOM_PHASE.FOCUS_ONE || phase === STUDY_ROOM_PHASE.FOCUS_TWO

  useEffect(() => {
    if (!calendar.ready || taskChoiceInitialized) return
    const recommended = getRecommendedStudyTask({ tasks: calendar.tasks, sessions: calendar.sessions })
    if (recommended) setTaskId(recommended.id)
    setTaskChoiceInitialized(true)
  }, [calendar, taskChoiceInitialized])

  useEffect(() => {
    onImmersiveChange(isFocusPhase)
    return () => onImmersiveChange(false)
  }, [isFocusPhase, onImmersiveChange])

  const applySessionSnapshot = (snapshot) => {
    if (!snapshot) return
    setStudySessionId(snapshot.sessionId)
    setPhase(snapshot.phase)
    setFocusMinutes(snapshot.focusMinutes)
    setActiveFocusLabel(snapshot.focusLabel)
    setCompletedBlocks(snapshot.completedBlocks)
    setTimer(snapshot.timer)
    setRemainingSeconds(getStudyRoomRemainingSeconds(snapshot.timer))
    setSessionStarted(true)
    setStatus('Hem recuperat la sessió que tenies en curs.')
    if (globalThis.navigator?.onLine !== false) getStudyRoomSessionBlocks({ classId: session.classId, studentId: session.studentId, sessionId: snapshot.sessionId })
      .then((blocks) => {
        setAwards(blocks.map((block) => ({ block: block.blockNumber, awarded: block.xp > 0, xp: block.xp, reason: block.reason })))
        setCompletedBlocks(blocks.reduce((highest, block) => Math.max(highest, block.blockNumber), snapshot.completedBlocks))
        setReflections((current) => ({
          one: blocks.find((block) => block.blockNumber === 1)?.reflection ?? current.one,
          two: blocks.find((block) => block.blockNumber === 2)?.reflection ?? current.two,
        }))
      })
      .catch(() => {})
  }

  useEffect(() => {
    let cancelled = false
    const local = loadLocalStudyRoomSession({ classId: session.classId, studentId: session.studentId })
    if (local) applySessionSnapshot(local)
    if (globalThis.navigator?.onLine === false) return undefined
    getActiveStudyRoomSession({ classId: session.classId, studentId: session.studentId })
      .then((remote) => { if (!cancelled && remote) applySessionSnapshot(remote) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session.classId, session.studentId])

  useEffect(() => {
    if (!sessionStarted || phase === STUDY_ROOM_PHASE.SUMMARY) return
    const snapshot = createStudyRoomSessionSnapshot({
      sessionId: studySessionId,
      phase,
      focusMinutes,
      timer,
      focusLabel: activeFocusLabel || focusLabel,
      completedBlocks,
    })
    saveLocalStudyRoomSession({ classId: session.classId, studentId: session.studentId, snapshot })
    if (online) updateActiveStudyRoomSession({ classId: session.classId, studentId: session.studentId, snapshot })
      .then((remote) => {
        if (remote.sessionId !== studySessionId) applySessionSnapshot(remote)
      })
      .catch(() => setStatus('La sessió continua en aquest dispositiu, però encara no s’ha pogut sincronitzar.'))
  }, [sessionStarted, phase, timer, focusMinutes, completedBlocks, activeFocusLabel, online])

  useEffect(() => {
    if (!timer || timer.paused) return undefined
    const update = () => setRemainingSeconds(getStudyRoomRemainingSeconds(timer))
    update()
    const interval = globalThis.setInterval(update, 1000)
    return () => globalThis.clearInterval(interval)
  }, [timer])

  useEffect(() => {
    setClockVisible(false)
  }, [phase])

  useEffect(() => {
    if (!clockVisible) return undefined
    const timeout = globalThis.setTimeout(() => setClockVisible(false), 5_000)
    return () => globalThis.clearTimeout(timeout)
  }, [clockVisible])

  useEffect(() => {
    if (phase === STUDY_ROOM_PHASE.REVIEW_ONE || phase === STUDY_ROOM_PHASE.BREAK) {
      setBreakVariant(breakVariantForSession(studySessionId))
    }
  }, [phase, studySessionId])

  useEffect(() => {
    if (!timer || timer.paused || remainingSeconds > 0) return
    if (notificationsEnabled && globalThis.Notification?.permission === 'granted') {
      const message = timer.phase === STUDY_ROOM_PHASE.BREAK ? 'La pausa ha acabat. Pots començar el segon bloc.' : 'El bloc ha acabat. Torna a la Sala d’estudi per tancar-lo.'
      new globalThis.Notification('Company d’estudi', { body: message, tag: `study-room-${studySessionId}-${timer.phase}` })
    }
    setStatus(timer.phase === STUDY_ROOM_PHASE.BREAK ? 'La pausa ha acabat.' : 'El bloc ha acabat. Confirma què has avançat.')
    setPhase(getNextStudyRoomPhase(timer.phase))
    setTimer(null)
  }, [remainingSeconds, timer, notificationsEnabled, studySessionId])

  const beginTimedPhase = (nextPhase) => {
    const nextTimer = createStudyRoomTimer(nextPhase, Date.now(), focusMinutes)
    setPhase(nextPhase)
    setTimer(nextTimer)
    setRemainingSeconds(nextTimer.remainingSeconds)
    setExitConfirm(false)
  }

  const startSession = async (event) => {
    event.preventDefault()
    if (needsWellbeingConfirmation) {
      setStatus('Abans de començar, confirma que encara et trobes amb energia per estudiar.')
      return
    }
    if (notificationsEnabled && globalThis.Notification?.permission === 'default') {
      const permission = await globalThis.Notification.requestPermission()
      if (permission !== 'granted') setNotificationsEnabled(false)
    }
    const nextTimer = createStudyRoomTimer(STUDY_ROOM_PHASE.FOCUS_ONE, Date.now(), focusMinutes)
    const nextFocusLabel = focusLabel
    const candidate = createStudyRoomSessionSnapshot({ sessionId: studySessionId, phase: STUDY_ROOM_PHASE.FOCUS_ONE, focusMinutes, timer: nextTimer, focusLabel: nextFocusLabel })
    setActiveFocusLabel(nextFocusLabel)
    if (online) {
      try {
        const active = await startOrResumeStudyRoomSession({ classId: session.classId, studentId: session.studentId, snapshot: candidate })
        applySessionSnapshot(active)
        return
      } catch {
        setStatus('No hi ha connexió estable. El cronòmetre continuarà aquí i se sincronitzarà quan tornis a estar en línia.')
      }
    }
    saveLocalStudyRoomSession({ classId: session.classId, studentId: session.studentId, snapshot: candidate })
    setSessionStarted(true)
    beginTimedPhase(STUDY_ROOM_PHASE.FOCUS_ONE)
  }

  const togglePause = () => {
    if (timer.paused) {
      const resumed = resumeStudyRoomTimer(timer)
      setTimer(resumed)
      setRemainingSeconds(resumed.remainingSeconds)
      return
    }
    const paused = pauseStudyRoomTimer(timer)
    setTimer(paused)
    setRemainingSeconds(paused.remainingSeconds)
  }

  const completeReview = async (block) => {
    if (!online) {
      setStatus('Connecta’t a internet abans de confirmar el bloc. El teu cronòmetre i la sessió continuen desats en aquest dispositiu.')
      return
    }
    const key = block === 1 ? 'one' : 'two'
    setSavingBlock(true)
    setStatus('')
    try {
      const award = await awardStudyRoomBlock({
        classId: session.classId,
        studentId: session.studentId,
        sessionId: studySessionId,
        blockNumber: block,
        durationMinutes: focusMinutes,
        reflection: reflections[key],
      })
      const previousEvolution = getStudyRoomEvolution(studyProgress.totalXp)
      const nextEvolution = getStudyRoomEvolution(award.totalXp)
      if (nextEvolution.level > previousEvolution.level) setEvolutionChange({ previous: previousEvolution, next: nextEvolution })
      setAwards((current) => [...current.filter((item) => item.block !== block), { block, ...award }])
      setCompletedBlocks((current) => Math.max(current, block))
      if (block === 2 || (block === 1 && totalBlocks === 1)) {
        setPhase(STUDY_ROOM_PHASE.SUMMARY)
        setTimer(null)
      }
    } catch (error) {
      setStatus(error?.message ?? 'No hem pogut registrar el bloc. Torna-ho a provar.')
    } finally {
      setSavingBlock(false)
    }
  }

  const finishTimedPhaseEarly = () => {
    if (phase === STUDY_ROOM_PHASE.BREAK) beginTimedPhase(STUDY_ROOM_PHASE.FOCUS_TWO)
  }

  const closeSession = (finalStatus, callback = onExit) => {
    clearLocalStudyRoomSession({ classId: session.classId, studentId: session.studentId })
    if (online && sessionStarted) closeActiveStudyRoomSession({ classId: session.classId, studentId: session.studentId, sessionId: studySessionId, status: finalStatus }).catch(() => {})
    callback()
  }

  if (phase === STUDY_ROOM_PHASE.PREPARATION) {
    return (
      <section className="study-room study-room-preparation" aria-labelledby="study-room-title">
        <div className="study-room-prep-copy">
          <p className="eyebrow">Sala d’estudi</p>
          <h1 id="study-room-title">Què vols avançar ara?</h1>
          <p>Tria una durada realista i centra’t en un únic objectiu cada vegada.</p>
          {studyDay.completedSessions > 0 && <div className="study-room-wellbeing"><strong>Ja has completat {studyDay.completedSessions === 1 ? 'una sessió' : `${studyDay.completedSessions} sessions`} avui.</strong>{needsWellbeingConfirmation ? <><p>Com et trobes? Descansar també forma part d’un bon hàbit d’estudi.</p><div><button type="button" onClick={() => { setWellbeingConfirmed(true); setStatus('') }}>Estic bé, vull fer una altra sessió</button><button type="button" className="secondary" onClick={onExit}>Millor descanso ara</button></div></> : <p>Perfecte. Escolta el teu cos i atura’t si notes cansament.</p>}</div>}
          {studyDay.xp >= 40 && <p className="study-room-xp-note">Avui ja has aconseguit el màxim de 40 XP. Pots continuar estudiant, però aquesta sessió no afegirà més experiència.</p>}
          <form onSubmit={startSession}>
            <label>Tria el teu focus<select value={taskId} onChange={(event) => { setTaskId(event.target.value); if (event.target.value !== 'free') setGoal('') }}><option value="free">Estudi lliure</option>{openTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
            {taskId === 'free' && <label>Què t’agradaria avançar?<input required maxLength={120} value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Per exemple: repassar el tema 3" /></label>}
            <fieldset className="study-room-duration"><legend>Quin ritme et convé avui?</legend><button type="button" className={focusMinutes === 25 ? 'selected' : ''} onClick={() => setFocusMinutes(25)}><strong>Curta · 25 min</strong><span>Un sol bloc per començar fàcil</span></button><button type="button" className={focusMinutes === 30 ? 'selected' : ''} onClick={() => setFocusMinutes(30)}><strong>Normal · 75 min</strong><span>30 + 15 + 30</span></button><button type="button" disabled={!advancedUnlocked} className={focusMinutes === 45 ? 'selected' : ''} onClick={() => setFocusMinutes(45)}><strong>Avançada · 105 min</strong><span>{advancedUnlocked ? '45 + 15 + 45 · només si tens energia' : `Opcional a partir de ${STUDY_ROOM_ADVANCED_MINIMUM_XP} XP · en tens ${studyProgress.totalXp ?? 0}`}</span></button></fieldset>
            {totalBlocks === 1 ? <div className="study-room-plan single"><span><strong>25 min</strong> concentració</span><ArrowRight size={18} /><span><strong>Resum</strong> i tancament</span></div> : <div className="study-room-plan"><span><strong>{focusMinutes} min</strong> concentració</span><ArrowRight size={18} /><span><strong>15 min</strong> pausa</span><ArrowRight size={18} /><span><strong>{focusMinutes} min</strong> concentració</span></div>}
            {'Notification' in globalThis && <label className="study-room-notification-option"><input type="checkbox" checked={notificationsEnabled} onChange={(event) => setNotificationsEnabled(event.target.checked)} /><span><strong>Avisa’m quan acabi cada fase</strong><small>Avís visual del navegador; no cal tenir el so activat.</small></span></label>}
            <button type="submit" disabled={needsWellbeingConfirmation}><Play size={20} weight="fill" />Comença la sessió</button>
          </form>
          <button type="button" className="text-button study-room-back" onClick={onExit}><ArrowLeft size={17} />Torna a l’inici</button>
          {!online && <p className="study-room-connectivity" role="status">Sense connexió · la sessió es conserva en aquest dispositiu.</p>}
          {status && <p className="form-status error" role="status">{status}</p>}
        </div>
        <div className="study-room-prep-side">
          <div className="study-room-prep-piu"><StudyRoomEvolutionVisual evolution={currentEvolution} /><div className="study-room-prep-piu-copy"><strong>Nivell {currentEvolution.level} · {currentEvolution.name}</strong><StudyRoomEvolutionProgress totalXp={studyProgress.totalXp} evolution={currentEvolution} /><p>Prepara el material i deixa a prop només el que necessites.</p></div></div>
          <details className="study-room-ranking study-room-ranking-collapsed">
            <summary>Consulta el podi i la teva posició</summary><section aria-labelledby="study-room-ranking-title">
            <header><p className="eyebrow">Constància de la classe</p><h2 id="study-room-ranking-title">Podi i aspirants</h2><small>Compta només l’XP de Sala d’estudi, mai les notes ni l’XP d’hàbits.</small><p>Els XP de Sala d’estudi poden ser visibles aquí; els XP d’hàbits continuen sent privats.</p></header>
            {!podium.entries?.length && <p>El podi apareixerà quan la classe comenci a completar blocs.</p>}
            {!!podium.entries?.length && <ol>{podium.entries.map((entry, index) => { const entryEvolution = getStudyRoomEvolution(entry.totalXp); return <li key={entry.studentId} className={`${index < 3 ? 'on-podium' : 'podium-contender'} ${entry.studentId === session.studentId ? 'is-current' : ''}`}><StudyRoomEvolutionVisual evolution={entryEvolution} alt={`Evolució de ${entry.displayName}: ${entryEvolution.name}`} /><span>{entry.position}</span><strong>{entry.displayName}{entry.studentId === session.studentId ? ' · tu' : ''}</strong><small>{entry.totalXp} XP</small></li> })}</ol>}
            <div className="study-room-private-rank"><StudyRoomEvolutionVisual evolution={getStudyRoomEvolution(privateRanking?.totalXp ?? studyProgress.totalXp)} alt="La teva evolució actual de Piu" /><span>Només ho veus tu</span>{privateRanking ? <strong>Vas {formatPosition(privateRanking.position)} de {privateRanking.totalStudents}</strong> : <strong>Calculant la teva posició…</strong>}</div>
            {rankingAnnouncement && <p className={`study-room-rank-movement ${privateRanking?.lastMovement > 0 ? 'up' : 'down'}`} role="status">{rankingAnnouncement}</p>}
          </section></details>
        </div>
      </section>
    )
  }

  if (phase === STUDY_ROOM_PHASE.REVIEW_ONE || phase === STUDY_ROOM_PHASE.REVIEW_TWO) {
    const block = phase === STUDY_ROOM_PHASE.REVIEW_ONE ? 1 : 2
    const key = block === 1 ? 'one' : 'two'
    return (
      <section className="study-room study-room-review" aria-labelledby="study-room-review-title">
        <ConfettiCelebration />
        <div><p className="eyebrow">Bloc {block} completat</p><h1 id="study-room-review-title">Fes visible el que has avançat</h1><p>No cal haver-ho acabat tot. Un pas concret ja compta.</p><label>Què has pogut avançar?<textarea rows={4} maxLength={240} disabled={completedBlocks >= block} value={reflections[key]} onChange={(event) => setReflections((current) => ({ ...current, [key]: event.target.value }))} placeholder="Resposta breu i opcional" /></label>{completedBlocks < block ? <button type="button" disabled={savingBlock} onClick={() => completeReview(block)}><CheckCircle size={21} weight="fill" />{savingBlock ? 'Registrant el bloc…' : 'He completat el bloc'}</button> : block === 1 ? <div className="study-room-after-first"><p>Has guanyat {awards.find((award) => award.block === 1)?.xp ?? 0} XP. Pots continuar després de la pausa o acabar aquí sense cap penalització.</p><div><button type="button" onClick={() => beginTimedPhase(STUDY_ROOM_PHASE.BREAK)}><Coffee size={20} weight="fill" />Continua amb la pausa</button><button type="button" className="secondary" onClick={() => { setPhase(STUDY_ROOM_PHASE.SUMMARY); setTimer(null) }}>Acaba la sessió aquí</button></div></div> : null}{status && <p className="form-status error" role="status">{status}</p>}</div>
        <div className="study-room-review-piu"><StudyRoomEmotionVisual state={block === 1 ? breakVariant : 'celebrate'} /><strong>{block === 1 ? 'Primer pas fet. Ara toca temps lliure.' : 'Sessió completada.'}</strong><small>Nivell {currentEvolution.level} · {currentEvolution.name}</small><StudyRoomEvolutionProgress totalXp={studyProgress.totalXp} evolution={currentEvolution} /></div>
      </section>
    )
  }

  if (phase === STUDY_ROOM_PHASE.SUMMARY) {
    const earnedXp = awards.reduce((total, award) => total + award.xp, 0)
    const reachedDailyLimit = awards.some((award) => award.reason === 'daily_limit')
    const totalXp = awards.at(-1)?.totalXp ?? studyProgress.totalXp ?? earnedXp
    const evolution = getStudyRoomEvolution(totalXp)
    const fullSession = completedBlocks === 2
    return (
      <section className="study-room study-room-summary" aria-labelledby="study-room-summary-title">
        <StudyRoomEvolutionVisual evolution={evolution} />
        <p className="eyebrow">{fullSession ? 'Sessió completada' : 'Primer bloc completat'}</p>
        <h1 id="study-room-summary-title">{fullSession ? 'Has mantingut el compromís amb tu mateix' : 'Has avançat i també has sabut escoltar-te'}</h1>
        <div className="study-room-summary-cards"><article><strong>{completedBlocks}</strong><span>{completedBlocks === 1 ? 'bloc completat' : 'blocs completats'}</span></article><article><strong>{completedBlocks * focusMinutes}</strong><span>minuts de concentració</span></article><article><strong>+{earnedXp}</strong><span>XP de Sala d’estudi</span></article></div>
        {evolutionChange && <section className="study-room-evolution-change" role="status" aria-labelledby="study-room-evolved-title"><p className="eyebrow">Nova evolució</p><h2 id="study-room-evolved-title">Piu ha evolucionat!</h2><div><StudyRoomEvolutionVisual evolution={evolutionChange.previous} alt={`Evolució anterior: ${evolutionChange.previous.name}`} /><ArrowRight size={25} aria-hidden="true" /><StudyRoomEvolutionVisual evolution={evolutionChange.next} alt={`Nova evolució: ${evolutionChange.next.name}`} /></div><strong>{evolutionChange.previous.name} → {evolutionChange.next.name}</strong></section>}
        <div className="study-room-evolution-summary"><StudyRoomEvolutionVisual evolution={evolution} /><div><span>Nivell {evolution.level}</span><strong>{evolution.name}</strong>{evolution.next ? <p>Et falten {evolution.xpToNext} XP per a {evolution.next.name}.</p> : <p>Has arribat a l’evolució màxima.</p>}</div></div>
        <section className="study-room-summary-ranking"><div><p className="eyebrow">Constància de la classe</p><h2>La teva evolució i el podi</h2>{privateRanking ? <strong>Vas {formatPosition(privateRanking.position)} de {privateRanking.totalStudents}</strong> : <strong>Calculant la teva posició…</strong>}{rankingAnnouncement && <p>{rankingAnnouncement}</p>}</div>{!!podium.entries?.length && <ol>{podium.entries.map((entry, index) => <li key={entry.studentId} className={entry.studentId === session.studentId ? 'is-current' : ''}><span>{index + 1}</span><strong>{entry.displayName}{entry.studentId === session.studentId ? ' · tu' : ''}</strong><small>{entry.totalXp} XP</small></li>)}</ol>}</section>
        {reachedDailyLimit && <p className="study-room-xp-note">Has arribat al màxim de 40 XP avui. Pots continuar estudiant sense pressió: els blocs continuen comptant com a feina feta.</p>}
        <div className="study-room-reflection-summary"><h2>El que has avançat</h2><p>{reflections.one || 'Primer bloc completat.'}</p>{fullSession && <p>{reflections.two || 'Segon bloc completat.'}</p>}</div>
        <button type="button" onClick={() => closeSession(STUDY_ROOM_SESSION_STATUS.COMPLETED)}>Torna a l’inici <ArrowRight size={18} /></button>
      </section>
    )
  }

  const content = PHASE_CONTENT[phase]
  return (
    <section className={`study-room study-room-timer ${phase === STUDY_ROOM_PHASE.BREAK ? 'is-break' : ''} ${isFocusPhase ? 'is-focus' : ''}`} aria-labelledby="study-room-timer-title">
      <div className="study-room-timer-main">
        <p className="eyebrow">{phase === STUDY_ROOM_PHASE.FOCUS_ONE && totalBlocks === 1 ? 'Sessió curta · bloc únic' : content.eyebrow}</p>
        <h1 id="study-room-timer-title">{content.title}</h1>
        <div className={`study-room-clock-reveal ${clockVisible ? 'is-visible' : ''}`} aria-hidden={!clockVisible}><div className="study-room-clock" role="timer" aria-label={`${Math.ceil(remainingSeconds / 60)} minuts restants`} aria-live="off">{formatStudyRoomTime(remainingSeconds)}</div></div>
        <button type="button" className="secondary study-room-show-clock" onClick={() => setClockVisible(true)} aria-expanded={clockVisible}><ClockCountdown size={20} />{clockVisible ? 'Cronòmetre visible durant 5 segons' : 'Mostra el temps restant'}</button>
        <p className="study-room-focus-label"><BookOpenText size={20} />{phase === STUDY_ROOM_PHASE.BREAK ? 'Deixa descansar el cap i la vista.' : (activeFocusLabel || focusLabel)}</p>
        {!online && <p className="study-room-connectivity" role="status">Sense connexió · el temps continua i es calcula amb l’hora final desada.</p>}
        {timer?.paused ? <p className="study-room-paused-note">Bloc en pausa. El temps està aturat: el pots reprendre sense perdre progrés ni rebre cap penalització.</p> : <p>{phase === STUDY_ROOM_PHASE.BREAK ? 'Pots començar abans si ja et sents preparat.' : 'No cal córrer: concentra’t només en el pas que tens davant.'}</p>}
        <div className="study-room-timer-actions">
          {phase === STUDY_ROOM_PHASE.BREAK ? <button type="button" onClick={finishTimedPhaseEarly}><Play size={20} weight="fill" />Comença el segon bloc</button> : <button type="button" className={timer?.paused ? '' : 'secondary'} onClick={togglePause}>{timer?.paused ? <Play size={20} weight="fill" /> : <Pause size={20} weight="fill" />}{timer?.paused ? 'Reprèn el bloc' : 'Pausa el bloc'}</button>}
          <button type="button" className="text-button" onClick={() => setExitConfirm(true)}><X size={17} />Surt de la sessió</button>
        </div>
      </div>
      <div className="study-room-timer-piu"><FocusPiuVisual phase={phase} remainingSeconds={remainingSeconds} focusMinutes={focusMinutes} breakVariant={breakVariant} /><div className="study-room-current-evolution"><StudyRoomEvolutionVisual evolution={currentEvolution} /><span>Nivell {currentEvolution.level}</span><strong>{currentEvolution.name}</strong></div></div>
      {exitConfirm && <div className="study-room-exit" role="dialog" aria-modal="true" aria-labelledby="study-room-exit-title" onKeyDown={(event) => { if (event.key === 'Escape') setExitConfirm(false) }}><div><h2 id="study-room-exit-title">Vols sortir de la sessió?</h2><p>No perdràs res ni rebràs cap penalització. Aquest bloc no comptarà com a completat.</p><div><button type="button" className="secondary" autoFocus onClick={() => setExitConfirm(false)}>Continua estudiant</button><button type="button" onClick={() => closeSession(STUDY_ROOM_SESSION_STATUS.ABANDONED)}>Surt amb calma</button></div></div></div>}
    </section>
  )
}
