import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SUBJECTS } from '../data/subjects.js'
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

const addDays = (value, days) => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

function NextStep({ summary, tasksById, onSuggest }) {
  if (summary.kind === 'session') {
    const task = tasksById[summary.session.taskId]
    return (
      <div className="next-step-card">
        <span>Proper pas</span>
        <strong>{formatTime(summary.session.scheduledAt)} · {task?.title ?? 'Sessió de treball'}</strong>
        <p>Comença per la sessió que ja havies decidit.</p>
        {task && <button type="button" className="secondary" onClick={() => onSuggest(task)}>Necessito moure-la</button>}
      </div>
    )
  }
  if (summary.kind === 'review') {
    return (
      <div className="next-step-card attention">
        <span>Proper pas</span>
        <strong>Revisa: {summary.task.title}</strong>
        <p>El termini ha passat. Decideix si l’acabes, l’aclareixes o la reprogramis; no hi ha cap càstig.</p>
        <button type="button" onClick={() => onSuggest(summary.task)}>Busca una nova franja</button>
      </div>
    )
  }
  if (summary.kind === 'clarify') {
    return (
      <div className="next-step-card attention">
        <span>Proper pas</span>
        <strong>Aclareix què cal fer: {summary.task.title}</strong>
        <p>Pregunta a un company o al professor abans de reservar temps.</p>
      </div>
    )
  }
  if (summary.kind === 'plan') {
    return (
      <div className="next-step-card">
        <span>Proper pas</span>
        <strong>Planifica: {summary.task.title}</strong>
        <p>Tria una proposta realista; no s’afegirà fins que la confirmis.</p>
        <button type="button" onClick={() => onSuggest(summary.task)}>Proposa’m franges</button>
      </div>
    )
  }
  return (
    <div className="next-step-card clear">
      <span>Proper pas</span>
      <strong>Tot el més urgent està controlat</strong>
      <p>Pots revisar la setmana o descansar.</p>
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

function TodayView({ data, expandedOccupations, tasksById, onSuggest }) {
  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayKey = localDateKey(today)
  const summary = deriveTodaySummary({ tasks: data.tasks, sessions: data.sessions, today })
  const todayOccupations = expandedOccupations.filter((item) => item.dateKey === todayKey)
  const todaySessions = data.sessions.filter((session) => session.state === 'planned' && localDateKey(session.scheduledAt) === todayKey)
  const todayDeadlines = data.tasks.filter((task) => task.deadline?.at && localDateKey(task.deadline.at) === todayKey)
  const timeline = [
    ...todayOccupations.map((item) => ({ ...item, at: item.startAt, kind: 'occupation' })),
    ...todaySessions.map((item) => ({ ...item, at: item.scheduledAt, kind: 'session' })),
    ...todayDeadlines.map((item) => ({ ...item, at: item.deadline.at, kind: 'deadline' })),
  ].sort((left, right) => left.at.localeCompare(right.at))
  const deliveries = data.tasks.filter((task) => task.requiresDelivery
    && task.deliveryStatus !== 'delivered'
    && task.deadline?.at
    && new Date(task.deadline.at) >= todayStart
    && new Date(task.deadline.at) <= addDays(todayStart, 2))
  const toPlan = data.tasks.filter((task) => task.status !== TASK_STATUS.DONE && !task.activeSessionId)

  return (
    <div className="today-view">
      <NextStep summary={summary} tasksById={tasksById} onSuggest={onSuggest} />
      <div className="today-columns">
        <section className="today-section">
          <div className="calendar-section-heading">
            <h3>Línia temporal d’avui</h3>
            <span>{formatShortDate(today)}</span>
          </div>
          {timeline.length === 0 && <p className="calendar-empty">No tens franges ni terminis previstos avui.</p>}
          <ol className="today-timeline">
            {timeline.map((item) => (
              <li className={item.kind} key={`${item.kind}-${item.id}`}>
                <time>{formatTime(item.at)}</time>
                <div>
                  {item.kind === 'occupation' && <><strong>{item.label}</strong><span>{OCCUPATION_LABELS[item.type] ?? 'Ocupació privada'} · només tu en veus el detall</span></>}
                  {item.kind === 'session' && <><strong>{tasksById[item.taskId]?.title ?? 'Sessió de treball'}</strong><span>Sessió · {item.durationMinutes} min</span></>}
                  {item.kind === 'deadline' && <><strong>{item.title}</strong><span>Termini · {subjectName(item.subjectId)}</span></>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="today-side-stack">
          <section className="today-section">
            <h3>Entregues properes</h3>
            {deliveries.length === 0 && <p className="calendar-empty">Cap entrega pendent en les pròximes 48 hores.</p>}
            {deliveries.map((task) => <div className="compact-calendar-task" key={task.id}><strong>{task.title}</strong><span>{formatShortDate(task.deadline.at)} · {formatTime(task.deadline.at)}</span></div>)}
          </section>
          <section className="today-section">
            <h3>Tasques per planificar</h3>
            {toPlan.length === 0 && <p className="calendar-empty">No tens tasques obertes sense sessió.</p>}
            {toPlan.slice(0, 5).map((task) => (
              <div className="compact-calendar-task" key={task.id}>
                <strong>{task.title}</strong>
                <span>{subjectName(task.subjectId)}</span>
                <button type="button" className="secondary" onClick={() => onSuggest(task)}>Proposa franges</button>
              </div>
            ))}
          </section>
        </div>
      </div>
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

export default function CalendarWorkspace({ session }) {
  const [view, setView] = useState('today')
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
    <section className="calendar-workspace" aria-labelledby="calendar-workspace-title">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">Temps útil fora de l’escola</p>
          <h2 id="calendar-workspace-title">Avui i calendari</h2>
        </div>
        <div className="calendar-view-switcher">
          <button type="button" className={view === 'today' ? '' : 'secondary'} aria-pressed={view === 'today'} onClick={() => setView('today')}>Avui</button>
          <button type="button" className={view === 'week' ? '' : 'secondary'} aria-pressed={view === 'week'} onClick={() => setView('week')}>Setmana</button>
        </div>
      </div>

      <div className="calendar-legend" aria-label="Llegenda del calendari">
        <span className="deadline">Termini</span>
        <span className="session">Sessió de treball</span>
        <span className="occupation">Ocupació personal</span>
      </div>

      {!data.ready && <p className="calendar-empty">Carregant calendari…</p>}
      {data.ready && view === 'today' && <TodayView data={data} expandedOccupations={expandRecurringOccupations(data.occupations, currentWeekDays)} tasksById={tasksById} onSuggest={suggest} />}
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
