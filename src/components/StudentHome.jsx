import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { BookOpenText } from '@phosphor-icons/react/dist/csr/BookOpenText'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { ChartLineUp } from '@phosphor-icons/react/dist/csr/ChartLineUp'
import { ChatTeardropText } from '@phosphor-icons/react/dist/csr/ChatTeardropText'
import { CompassRose } from '@phosphor-icons/react/dist/csr/CompassRose'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree'
import { observeStudentCalendar } from '../services/calendarService.js'
import { observeStudentTutorial } from '../services/tutorialService.js'
import { isStudentFreeTimeNow } from '../domain/calendarPlanning.js'
import { PIU_SURFACE, resolvePiuVisualState } from '../domain/piuVisualState.js'
import { resolveStudentSmartMessages } from '../domain/smartMessages.js'
import { observeSmartMessageStates, saveSmartMessageState } from '../services/smartMessageService.js'
import { observeClassTaskAlerts, observeOfficialTasks } from '../services/communityService.js'
import PiuVisual from './PiuVisual.jsx'
import SmartMessageCenter from './SmartMessageCenter.jsx'
import './studentHome.css'

const asDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const toMillis = (value) => asDate(value)?.getTime() ?? 0

const formatDate = (value) => {
  const date = asDate(value)
  return date ? new Intl.DateTimeFormat('ca-AD', { weekday: 'short', day: 'numeric', month: 'short' }).format(date) : 'Sense data'
}

const formatTime = (value) => {
  const date = asDate(value)
  return date ? new Intl.DateTimeFormat('ca-AD', { hour: '2-digit', minute: '2-digit' }).format(date) : ''
}

function OrbitButton({ className, Icon, label, detail, badge, onClick, disabled = false }) {
  return (
    <button type="button" className={`home-orbit-action ${className}`} onClick={onClick} disabled={disabled}>
      <span className="home-action-icon"><Icon size={26} weight="duotone" aria-hidden="true" /></span>
      <span className="home-action-copy"><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
      {badge > 0 && <b aria-label={`${badge} elements pendents`}>{badge}</b>}
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  )
}

export default function StudentHome({ session, onNavigate, calendarOverride = null, tutorialOverride = null, setupIncomplete = false, communityUnreadCount = 0 }) {
  const [calendarState, setCalendarState] = useState({ tasks: [], sessions: [], occupations: [], availability: null, ready: false })
  const [tutorialState, setTutorialState] = useState({ feedback: [], notices: [], reviews: [] })
  const [smartMessageStates, setSmartMessageStates] = useState({})
  const [communityTasks, setCommunityTasks] = useState([])
  const [communityAlerts, setCommunityAlerts] = useState([])
  const [status, setStatus] = useState('')
  const [clock, setClock] = useState(() => new Date())
  const [greeting] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    const key = `company-estudi:piu-greeting:${session.studentId}`
    try {
      const previous = globalThis.localStorage?.getItem(key)
      globalThis.localStorage?.setItem(key, today)
      return { firstEntryToday: previous !== today, returningToday: previous === today }
    } catch {
      return { firstEntryToday: true, returningToday: false }
    }
  })

  useEffect(() => {
    if (calendarOverride) return undefined
    return observeStudentCalendar(
    { classId: session.classId, studentId: session.studentId },
    setCalendarState,
    () => setStatus('No hem pogut actualitzar el Radar.'),
    )
  }, [session.classId, session.studentId, Boolean(calendarOverride)])

  useEffect(() => {
    if (tutorialOverride) return undefined
    return observeStudentTutorial(
    { classId: session.classId, studentId: session.studentId },
    setTutorialState,
    () => setStatus('No hem pogut actualitzar els missatges del tutor.'),
    )
  }, [session.classId, session.studentId, Boolean(tutorialOverride)])

  useEffect(() => observeSmartMessageStates(
    { classId: session.classId, studentId: session.studentId },
    setSmartMessageStates,
    () => setStatus('No hem pogut actualitzar els recordatoris intel·ligents.'),
  ), [session.classId, session.studentId])
  useEffect(() => observeOfficialTasks({ classId: session.classId }, setCommunityTasks, () => {}), [session.classId])
  useEffect(() => observeClassTaskAlerts({ classId: session.classId }, setCommunityAlerts, () => {}), [session.classId])

  useEffect(() => {
    const interval = globalThis.setInterval(() => setClock(new Date()), 60_000)
    return () => globalThis.clearInterval(interval)
  }, [])

  const calendar = calendarOverride ? { ...calendarOverride, ready: true } : calendarState
  const tutorial = tutorialOverride ?? tutorialState

  const openTasks = useMemo(() => calendar.tasks.filter((task) => task.status !== 'done'), [calendar.tasks])
  const radarTasks = useMemo(() => [...openTasks]
    .filter((task) => task.deadline?.at)
    .sort((left, right) => toMillis(left.deadline.at) - toMillis(right.deadline.at))
    .slice(0, 3), [openTasks])
  const nextSession = useMemo(() => [...calendar.sessions]
    .filter((item) => item.state === 'planned' && toMillis(item.scheduledAt) >= clock.getTime())
    .sort((left, right) => toMillis(left.scheduledAt) - toMillis(right.scheduledAt))[0], [calendar.sessions, clock])
  const isFreeTime = useMemo(() => calendar.ready && isStudentFreeTimeNow({
    availability: calendar.availability,
    sessions: calendar.sessions,
    occupations: calendar.occupations,
    now: clock,
  }), [calendar.ready, calendar.availability, calendar.sessions, calendar.occupations, clock])
  const unreadNotices = tutorial.notices.filter((notice) => !notice.readAt).length
  const latestFeedback = [...tutorial.feedback].sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))[0]
  const taskById = Object.fromEntries(calendar.tasks.map((task) => [task.id, task]))
  const nextTask = nextSession ? taskById[nextSession.taskId] : null
  const smartMessages = useMemo(() => resolveStudentSmartMessages({
    tasks: calendar.tasks,
    sessions: calendar.sessions,
    reviews: tutorial.reviews,
    communityTasks,
    communityAlerts,
    messageStates: smartMessageStates,
    now: clock,
  }), [calendar.tasks, calendar.sessions, tutorial.reviews, communityTasks, communityAlerts, smartMessageStates, clock])
  const updateSmartMessage = async (item, nextStatus, until = null) => {
    try {
      await saveSmartMessageState({ classId: session.classId, studentId: session.studentId, messageId: item.id, status: nextStatus, until })
    } catch {
      setStatus('No hem pogut desar la teva decisió. Torna-ho a provar.')
    }
  }
  const actOnSmartMessage = (item, action) => {
    updateSmartMessage(item, 'accepted')
    onNavigate(action.view)
  }
  const snoozeSmartMessage = (item) => updateSmartMessage(item, 'snoozed', new Date(clock.getTime() + (3 * 60 * 60 * 1000)))
  const primaryAction = useMemo(() => {
    if (setupIncomplete) return { kind: 'setup', eyebrow: 'Primer pas', title: 'Prepara el teu temps', detail: 'Configura descansos i ocupacions perquè les propostes siguin realistes.', label: 'Configura el meu temps', view: 'settings' }
    const overdue = openTasks.find((task) => task.deadline?.at && toMillis(task.deadline.at) < clock.getTime())
    if (overdue) return { kind: 'urgent', taskId: overdue.id, eyebrow: 'Revisa ara', title: overdue.title, detail: 'El termini ha passat. Decideix el següent pas sense cap penalització.', label: 'Revisa la tasca', view: 'tasks' }
    if (nextSession) return { kind: 'session', taskId: nextSession.taskId, eyebrow: 'Següent sessió', title: nextTask?.title ?? 'Sessió de treball', detail: `${formatDate(nextSession.scheduledAt)} · ${formatTime(nextSession.scheduledAt)} · ${nextSession.durationMinutes} min`, label: 'Comença o revisa-la', view: 'tasks' }
    const unplanned = openTasks.find((task) => !task.activeSessionId)
    if (unplanned) return { kind: 'plan', taskId: unplanned.id, eyebrow: 'Per organitzar', title: unplanned.title, detail: 'Encara no té una franja reservada.', label: 'Planifica-la', view: 'tasks' }
    if (unreadNotices) return { kind: 'message', eyebrow: 'Missatge nou', title: 'El tutor t’ha escrit', detail: 'Llegeix el missatge i decideix si cal respondre o ajustar alguna cosa.', label: 'Obre els missatges', view: 'messages' }
    return { kind: 'rest', eyebrow: 'Pla al dia', title: 'Ara pots descansar o triar què vols avançar', detail: 'No hi ha cap pas urgent pendent.', label: 'Mira el pla d’avui', view: 'today' }
  }, [setupIncomplete, openTasks, clock, nextSession, nextTask, unreadNotices])
  const visibleRadarTasks = radarTasks.filter((task) => task.id !== primaryAction.taskId)
  const piu = resolvePiuVisualState({
    surface: PIU_SURFACE.HOME,
    activity: isFreeTime ? 'free_time' : null,
    variantSeed: session.studentId,
    localTime: clock,
    ...greeting,
    hasUpcomingAction: Boolean(nextSession || radarTasks.length),
  })

  return (
    <section className="student-home-page" aria-labelledby="student-home-title">
      <div className="student-home-stage">
        <header className="student-home-greeting">
          <p className="eyebrow">El teu espai</p>
          <h1 id="student-home-title">Bon dia, {session.displayName}!</h1>
          <p>Piu t’ajuda a veure què tens entre mans i a escollir el següent pas.</p>
        </header>

        <div className="piu-home-orbit">
          <div className="piu-home-character">
            <PiuVisual state={piu.state} />
            <span>{primaryAction.kind === 'rest' ? 'Tot controlat. Descansar també forma part del pla.' : `Ens centrem en una sola cosa: ${primaryAction.title}.`}</span>
          </div>

          <OrbitButton className="action-today" Icon={CalendarDots} label="Avui" detail={nextSession ? `${formatTime(nextSession.scheduledAt)} · ${nextSession.durationMinutes} min` : 'Mira el pla del dia'} onClick={() => onNavigate('today')} />
          <OrbitButton className="action-progress" Icon={ChartLineUp} label="Progrés" detail="Hàbits i revisions" onClick={() => onNavigate('progress')} />
          <OrbitButton className="action-tutor" Icon={ChatTeardropText} label="Missatges del tutor" detail={unreadNotices ? 'Tens novetats' : 'Feedback tutorial'} badge={unreadNotices} onClick={() => onNavigate('messages')} />
          <OrbitButton className="action-tasks" Icon={BookOpenText} label="Deures" detail={`${openTasks.length} ${openTasks.length === 1 ? 'tasca oberta' : 'tasques obertes'}`} badge={openTasks.length} onClick={() => onNavigate('tasks')} />
          <OrbitButton className="action-community" Icon={UsersThree} label="Comunitat" detail={communityUnreadCount ? 'Tens contingut nou' : 'Sales i recursos'} badge={communityUnreadCount} onClick={() => onNavigate('community')} />
          <OrbitButton className="action-study" Icon={Play} label="Sala d’estudi" detail="Blocs guiats" onClick={() => onNavigate('study')} />
        </div>
      </div>

      <aside className="student-home-insights">
        <SmartMessageCenter messages={smartMessages} onAction={actOnSmartMessage} onSnooze={snoozeSmartMessage} onDismiss={(item) => updateSmartMessage(item, 'dismissed')} />
        <section className={`home-primary-action ${primaryAction.kind}`} aria-labelledby="home-primary-action-title"><span>{primaryAction.eyebrow}</span><h2 id="home-primary-action-title">Què em convé fer ara?</h2><strong>{primaryAction.title}</strong><p>{primaryAction.detail}</p><button type="button" onClick={() => onNavigate(primaryAction.view)}>{primaryAction.label} <ArrowRight size={17} aria-hidden="true" /></button></section>
        {visibleRadarTasks.length > 0 && <section className="home-insight-card radar-card">
          <header><CompassRose size={29} weight="duotone" aria-hidden="true" /><div><span>Radar</span><h2>El que s’acosta</h2></div></header>
          {!calendar.ready && <p>Actualitzant el teu Radar…</p>}
          {visibleRadarTasks.map((task) => <button type="button" key={task.id} onClick={() => onNavigate('tasks')}><span>{formatDate(task.deadline.at)}</span><strong>{task.title}</strong><small>Obre els deures <ArrowRight size={15} aria-hidden="true" /></small></button>)}
        </section>}

        {latestFeedback && <section className="home-insight-card feedback-card">
          <header><ChatTeardropText size={29} weight="duotone" aria-hidden="true" /><div><span>Espai de feedback</span><h2>Una mirada útil</h2></div></header>
          <blockquote>{latestFeedback.observation}</blockquote><p>{latestFeedback.strategy}</p><button type="button" className="text-button" onClick={() => onNavigate('messages')}>Veure el feedback complet <ArrowRight size={16} aria-hidden="true" /></button>
        </section>}
        {status && <p className="form-status error" role="status">{status}</p>}
      </aside>
    </section>
  )
}
