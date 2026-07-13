import { useEffect, useMemo, useState } from 'react'
import { BookOpen } from '@phosphor-icons/react/dist/csr/BookOpen'
import { CalendarCheck } from '@phosphor-icons/react/dist/csr/CalendarCheck'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Flask } from '@phosphor-icons/react/dist/csr/Flask'
import { Function as FunctionIcon } from '@phosphor-icons/react/dist/csr/Function'
import { SoccerBall } from '@phosphor-icons/react/dist/csr/SoccerBall'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECTS } from '../data/subjects.js'
import { TASK_STATUS } from '../domain/dataModel.js'
import {
  buildWeekDays,
  deriveTodaySummary,
  expandRecurringOccupations,
  localDateKey,
  suggestStudySlots,
} from '../domain/calendarPlanning.js'
import { observeStudentCalendar } from '../services/calendarService.js'
import { planStudentTask } from '../services/taskService.js'

const OCCUPATION_LABELS = {
  extracurricular: 'Extraescolar',
  meal: 'Àpat',
  travel: 'Trajecte',
  rest: 'Descans',
  other: 'Ocupació',
}

const formatTime = (value) => new Intl.DateTimeFormat('ca-AD', {
  hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

const formatShortDate = (value) => new Intl.DateTimeFormat('ca-AD', {
  weekday: 'short', day: 'numeric', month: 'short',
}).format(new Date(value))

const formatWeekTitle = (weekDays) => {
  const first = weekDays[0]?.date
  const last = weekDays[6]?.date
  if (!first || !last) return ''
  return `${new Intl.DateTimeFormat('ca-AD', { day: 'numeric', month: 'short' }).format(first)} – ${new Intl.DateTimeFormat('ca-AD', { day: 'numeric', month: 'short', year: 'numeric' }).format(last)}`
}

const subjectName = (subjectId) => DEFAULT_SUBJECTS.find((subject) => subject.id === subjectId)?.name ?? subjectId
const subjectColor = (subjectId, subjectColors) => subjectColors?.[subjectId] ?? DEFAULT_SUBJECT_COLORS[subjectId] ?? '#315f9e'

function SubjectIcon({ subjectId, kind, size = 26 }) {
  if (kind === 'occupation') return <SoccerBall size={size} weight="duotone" aria-hidden="true" />
  if (subjectId === 'matematiques') return <FunctionIcon size={size} weight="duotone" aria-hidden="true" />
  if (subjectId?.includes('ciencies')) return <Flask size={size} weight="duotone" aria-hidden="true" />
  return <BookOpen size={size} weight="duotone" aria-hidden="true" />
}

const addDays = (value, days) => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

function NextStep({ summary, tasksById, subjectColors, onSuggest, onOpenTasks }) {
  if (summary.kind === 'session') {
    const task = tasksById[summary.session.taskId]
    const color = subjectColor(task?.subjectId, subjectColors)
    return (
      <div className="next-step-card visual-next-step" style={{ '--event-color': color }}>
        <span>Següent pas</span>
        <div className="next-step-subject-icon"><SubjectIcon subjectId={task?.subjectId} size={34} /></div>
        <small>{subjectName(task?.subjectId)}</small>
        <strong>{task?.title ?? 'Sessió de treball'}</strong>
        <p><Clock size={18} aria-hidden="true" /> {summary.session.durationMinutes} min · prepara el material abans de començar.</p>
        <button type="button" onClick={onOpenTasks}>Comença ara</button>
        {task && <button type="button" className="text-button" onClick={() => onSuggest(task)}>Necessito moure-la</button>}
      </div>
    )
  }
  if (summary.kind === 'review') {
    const color = subjectColor(summary.task.subjectId, subjectColors)
    return (
      <div className="next-step-card visual-next-step attention" style={{ '--event-color': color }}>
        <span>Següent pas</span>
        <div className="next-step-subject-icon"><SubjectIcon subjectId={summary.task.subjectId} size={34} /></div>
        <small>{subjectName(summary.task.subjectId)}</small>
        <strong>Revisa: {summary.task.title}</strong>
        <p>El termini ha passat. Decideix si l’acabes, l’aclareixes o la reprogramis; no hi ha cap càstig.</p>
        <button type="button" onClick={() => onSuggest(summary.task)}>Busca una nova franja</button>
      </div>
    )
  }
  if (summary.kind === 'clarify') {
    const color = subjectColor(summary.task.subjectId, subjectColors)
    return (
      <div className="next-step-card visual-next-step attention" style={{ '--event-color': color }}>
        <span>Següent pas</span>
        <div className="next-step-subject-icon"><SubjectIcon subjectId={summary.task.subjectId} size={34} /></div>
        <small>{subjectName(summary.task.subjectId)}</small>
        <strong>Aclareix què cal fer: {summary.task.title}</strong>
        <p>Pregunta a un company o al professor abans de reservar temps.</p>
        <button type="button" onClick={onOpenTasks}>Obre el deure</button>
      </div>
    )
  }
  if (summary.kind === 'plan') {
    const color = subjectColor(summary.task.subjectId, subjectColors)
    return (
      <div className="next-step-card visual-next-step" style={{ '--event-color': color }}>
        <span>Següent pas</span>
        <div className="next-step-subject-icon"><SubjectIcon subjectId={summary.task.subjectId} size={34} /></div>
        <small>{subjectName(summary.task.subjectId)}</small>
        <strong>Planifica: {summary.task.title}</strong>
        <p>Tria una proposta realista; no s’afegirà fins que la confirmis.</p>
        <button type="button" onClick={() => onSuggest(summary.task)}>Proposa’m franges</button>
      </div>
    )
  }
  return (
    <div className="next-step-card visual-next-step clear" style={{ '--event-color': '#3f7d3a' }}>
      <span>Següent pas</span>
      <div className="next-step-subject-icon"><CalendarCheck size={34} weight="duotone" aria-hidden="true" /></div>
      <small>Pla al dia</small>
      <strong>Tot el més urgent està controlat</strong>
      <p>Pots revisar la setmana o descansar.</p>
      <button type="button" className="secondary" onClick={onOpenTasks}>Revisa els deures</button>
    </div>
  )
}

function SlotSuggestions({ proposal, onConfirm, onCancel, busy }) {
  if (!proposal) return null
  return (
    <div className="slot-proposals" role="status">
      <div>
        <span className="eyebrow">Proposta pendent de confirmació</span>
        <h3>{proposal.task.title}</h3>
        <p>Hem deixat marge lliure al final del dia i entre ocupacions.</p>
      </div>
      {proposal.slots.length === 0 && (
        <p className="no-slot-message">No hem trobat una franja prou còmoda en els pròxims dies. Pots ajustar la disponibilitat o planificar-la manualment.</p>
      )}
      <div className="slot-options">
        {proposal.slots.map((slot) => (
          <button type="button" className="slot-option" disabled={busy} key={slot.id} onClick={() => onConfirm(proposal.task, slot)}>
            <strong>{formatShortDate(slot.scheduledAt)}</strong>
            <span>{formatTime(slot.scheduledAt)} · {slot.durationMinutes} min</span>
            <small>Confirma aquesta franja</small>
          </button>
        ))}
      </div>
      <button type="button" className="secondary" onClick={onCancel}>Descarta la proposta</button>
      <p className="field-note">Encara no s’ha creat ni mogut cap sessió.</p>
    </div>
  )
}

function TodayView({ data, expandedOccupations, tasksById, subjectColors, session, onSuggest, onOpenTasks, onOpenCalendar }) {
  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayKey = localDateKey(today)
  const summary = deriveTodaySummary({ tasks: data.tasks, sessions: data.sessions, today })
  const todayOccupations = expandedOccupations.filter((item) => item.dateKey === todayKey)
  const todaySessions = data.sessions.filter((item) => item.state === 'planned' && localDateKey(item.scheduledAt) === todayKey)
  const timeline = [
    ...todayOccupations.map((item) => ({ ...item, at: item.startAt, kind: 'occupation' })),
    ...todaySessions.map((item) => ({ ...item, at: item.scheduledAt, kind: 'session' })),
  ].sort((left, right) => left.at.localeCompare(right.at))
  const deliveries = data.tasks.filter((task) => task.requiresDelivery
    && task.deliveryStatus !== 'delivered'
    && task.deadline?.at
    && new Date(task.deadline.at) >= todayStart
    && new Date(task.deadline.at) <= addDays(todayStart, 2))
  const toPlan = data.tasks.filter((task) => task.status !== TASK_STATUS.DONE && !task.activeSessionId)
  const weekDays = buildWeekDays(today)
  const plannedMinutes = todaySessions.reduce((total, item) => total + Number(item.durationMinutes ?? 0), 0)
  const loadBySubject = todaySessions.reduce((result, item) => {
    const task = tasksById[item.taskId]
    if (task) result[task.subjectId] = (result[task.subjectId] ?? 0) + Number(item.durationMinutes ?? 0)
    return result
  }, {})

  return (
    <div className="today-view visual-today-view">
      <header className="today-hero-heading">
        <div><h1>Bon dia, {session.displayName}</h1><p>{formatShortDate(today)}</p></div>
        <div className="today-study-summary"><CalendarCheck size={30} weight="duotone" aria-hidden="true" /><div><strong>{todaySessions.length} {todaySessions.length === 1 ? 'tasca' : 'tasques'} · {plannedMinutes ? `${plannedMinutes} min` : 'per planificar'}</strong><span>Temps d’estudi previst avui</span></div></div>
        <button type="button" className="secondary" onClick={onOpenTasks}>Veure deures</button>
      </header>

      <div className="today-day-switcher" aria-label="Dies d’aquesta setmana">
        {weekDays.map((day, index) => <button type="button" className={day.isToday ? 'active' : ''} aria-pressed={day.isToday} key={day.dateKey} onClick={day.isToday ? undefined : onOpenCalendar}>{['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'][index]} <span>{day.date.getDate()}</span></button>)}
      </div>

      <div className="visual-calendar-grid">
        <section className="day-time-grid" aria-label="Planificació horària d’avui">
          <div className="time-grid-labels" aria-hidden="true">{['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((time) => <span key={time}>{time}</span>)}</div>
          <div className="time-grid-events">
            {timeline.length === 0 && <div className="calendar-empty visual-empty"><Sparkle size={28} aria-hidden="true" /><strong>Encara no hi ha cap franja prevista avui.</strong><span>Planifica una tasca i apareixerà aquí.</span></div>}
            {timeline.map((item) => {
              const task = item.kind === 'session' ? tasksById[item.taskId] : item
              const color = item.kind === 'occupation' ? '#4f79a6' : subjectColor(task?.subjectId, subjectColors)
              return (
                <article className={`visual-time-event ${item.kind}`} style={{ '--event-color': color }} key={`${item.kind}-${item.id}`}>
                  <time>{formatTime(item.at)}</time>
                  <div className="event-icon"><SubjectIcon subjectId={task?.subjectId} kind={item.kind} /></div>
                  <div className="event-copy">
                    <strong>{item.kind === 'occupation' ? item.label : task?.title ?? 'Sessió de treball'}</strong>
                    <span>{item.kind === 'occupation' ? `${OCCUPATION_LABELS[item.type] ?? 'Ocupació'} · detall privat` : `${subjectName(task?.subjectId)}${item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}`}</span>
                  </div>
                  {item.kind === 'occupation' && <b>Ocupat</b>}
                  {item.kind === 'session' && task?.deadline?.at && localDateKey(task.deadline.at) === todayKey && <b>Entrega avui</b>}
                </article>
              )
            })}
          </div>
        </section>

        <aside className="visual-today-sidebar">
          <NextStep summary={summary} tasksById={tasksById} subjectColors={subjectColors} onSuggest={onSuggest} onOpenTasks={onOpenTasks} />
          <section className="planning-insight">
            <div className="insight-icon"><Clock size={25} weight="duotone" aria-hidden="true" /></div>
            <div><span>Planifica millor</span><strong>{todayOccupations.length ? 'Hem respectat les teves ocupacions i els marges de descans.' : 'Deixarem marge entre sessions perquè el pla sigui realista.'}</strong></div>
          </section>
          <section className="daily-load-card">
            <h3>Càrrega del dia</h3>
            {Object.keys(loadBySubject).length === 0 && <p>Encara no hi ha sessions d’estudi confirmades.</p>}
            {Object.entries(loadBySubject).map(([subjectId, minutes]) => <div key={subjectId}><i style={{ '--event-color': subjectColor(subjectId, subjectColors) }} /><span>{subjectName(subjectId)}</span><strong>{minutes} min</strong></div>)}
            {plannedMinutes > 0 && <footer><span>Total</span><strong>{plannedMinutes} min</strong></footer>}
          </section>
        </aside>
      </div>

      <section className="today-bottom-strip">
        <CalendarCheck size={31} weight="duotone" aria-hidden="true" />
        <div><span>Pla d’avui</span><strong>{todaySessions.length} {todaySessions.length === 1 ? 'sessió confirmada' : 'sessions confirmades'}</strong></div>
        <p>{deliveries.length ? `${deliveries.length} ${deliveries.length === 1 ? 'entrega pendent' : 'entregues pendents'} en les pròximes 48 hores.` : 'Cap entrega urgent en les pròximes 48 hores.'}</p>
        {toPlan.length > 0 && <button type="button" className="secondary" onClick={() => onSuggest(toPlan[0])}>Planifica la següent</button>}
      </section>
    </div>
  )
}

function WeekView({ weekDays, data, expandedOccupations, tasksById, onSuggest }) {
  return (
    <div className="week-calendar" role="grid" aria-label="Calendari setmanal de dilluns a diumenge">
      {weekDays.map((day) => {
        const occupations = expandedOccupations.filter((item) => item.dateKey === day.dateKey)
        const sessions = data.sessions.filter((session) => session.state === 'planned' && localDateKey(session.scheduledAt) === day.dateKey)
        const deadlines = data.tasks.filter((task) => task.deadline?.at && localDateKey(task.deadline.at) === day.dateKey)
        return (
          <section className={`week-day ${day.isToday ? 'today' : ''}`} role="gridcell" key={day.dateKey}>
            <header><strong>{day.label}</strong><span>{day.date.getDate()}</span></header>
            <div className="week-day-events">
              {occupations.map((item) => (
                <div className="week-event occupation" key={`occupation-${item.id}`}>
                  <time>{item.start}–{item.end}</time>
                  <strong>{item.label}</strong>
                  <span>Privat</span>
                </div>
              ))}
              {sessions.map((session) => (
                <div className="week-event session" key={`session-${session.id}`}>
                  <time>{formatTime(session.scheduledAt)} · {session.durationMinutes} min</time>
                  <strong>{tasksById[session.taskId]?.title ?? 'Sessió de treball'}</strong>
                  {tasksById[session.taskId] && <button type="button" onClick={() => onSuggest(tasksById[session.taskId])}>Proposa un canvi</button>}
                </div>
              ))}
              {deadlines.map((task) => (
                <div className="week-event deadline" key={`deadline-${task.id}`}>
                  <time>{formatTime(task.deadline.at)}</time>
                  <strong>{task.title}</strong>
                  <span>Termini</span>
                </div>
              ))}
              {occupations.length + sessions.length + deadlines.length === 0 && <span className="empty-day">Sense elements</span>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default function CalendarWorkspace({
  session,
  subjectColors = DEFAULT_SUBJECT_COLORS,
  initialView = 'today',
  lockedView = false,
  onOpenTasks = () => {},
  onOpenCalendar = () => {},
}) {
  const [view, setView] = useState(initialView)
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [data, setData] = useState({ tasks: [], sessions: [], occupations: [], availability: null, ready: false })
  const [proposal, setProposal] = useState(null)
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const weekDays = useMemo(() => buildWeekDays(referenceDate), [referenceDate])
  const currentWeekDays = useMemo(() => buildWeekDays(new Date()), [data.tasks, data.sessions, data.occupations])
  const planningDays = useMemo(() => [...currentWeekDays, ...buildWeekDays(addDays(currentWeekDays[0].date, 7))], [currentWeekDays])
  const expandedOccupations = useMemo(
    () => expandRecurringOccupations(data.occupations, weekDays),
    [data.occupations, weekDays],
  )
  const tasksById = useMemo(() => Object.fromEntries(data.tasks.map((task) => [task.id, task])), [data.tasks])

  useEffect(() => observeStudentCalendar(
    { classId: session.classId, studentId: session.studentId },
    setData,
    (error) => setStatus({ state: 'error', message: error.message }),
  ), [session.classId, session.studentId])

  useEffect(() => setView(initialView), [initialView])

  const suggest = (task) => {
    const slots = suggestStudySlots({
      task,
      weekDays: planningDays,
      availability: data.availability,
      schoolSchedule: session.schoolSchedule,
      sessions: data.sessions,
      occupations: data.occupations,
    })
    setProposal({ task, slots })
  }

  const confirm = async (task, slot) => {
    setStatus({ state: 'loading', message: 'Confirmant la franja…' })
    try {
      await planStudentTask(task, {
        scheduledAt: slot.scheduledAt,
        durationMinutes: slot.durationMinutes,
        reason: task.activeSessionId ? 'Reprogramada des del calendari amb confirmació de l’alumne.' : '',
      })
      setProposal(null)
      setStatus({ state: 'success', message: task.activeSessionId ? 'Sessió moguda després de confirmar-la.' : 'Sessió afegida després de confirmar-la.' })
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  const moveWeek = (days) => setReferenceDate((current) => addDays(current, days))

  return (
    <section className={`calendar-workspace visual-calendar-workspace view-${view}${lockedView ? ' locked-view' : ''}`} aria-labelledby="calendar-workspace-title">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">Temps útil fora de l’escola</p>
          <h2 id="calendar-workspace-title">Avui i calendari</h2>
        </div>
        {!lockedView && <div className="calendar-view-switcher">
          <button type="button" className={view === 'today' ? '' : 'secondary'} aria-pressed={view === 'today'} onClick={() => setView('today')}>Avui</button>
          <button type="button" className={view === 'week' ? '' : 'secondary'} aria-pressed={view === 'week'} onClick={() => setView('week')}>Setmana</button>
        </div>}
      </div>

      <div className="calendar-legend" aria-label="Llegenda del calendari">
        <span className="deadline">Termini</span>
        <span className="session">Sessió de treball</span>
        <span className="occupation">Ocupació personal</span>
      </div>

      {!data.ready && <p className="calendar-empty">Carregant calendari…</p>}
      {data.ready && view === 'today' && <TodayView data={data} expandedOccupations={expandRecurringOccupations(data.occupations, currentWeekDays)} tasksById={tasksById} subjectColors={subjectColors} session={session} onSuggest={suggest} onOpenTasks={onOpenTasks} onOpenCalendar={onOpenCalendar} />}
      {data.ready && view === 'week' && (
        <>
          <div className="week-navigation">
            <button type="button" className="secondary" onClick={() => moveWeek(-7)} aria-label="Setmana anterior">←</button>
            <strong>{formatWeekTitle(weekDays)}</strong>
            <button type="button" className="secondary" onClick={() => moveWeek(7)} aria-label="Setmana següent">→</button>
            <button type="button" className="secondary" onClick={() => setReferenceDate(new Date())}>Aquesta setmana</button>
          </div>
          <WeekView weekDays={weekDays} data={data} expandedOccupations={expandedOccupations} tasksById={tasksById} onSuggest={suggest} />
        </>
      )}

      <SlotSuggestions proposal={proposal} onConfirm={confirm} onCancel={() => setProposal(null)} busy={status.state === 'loading'} />
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
  )
}
