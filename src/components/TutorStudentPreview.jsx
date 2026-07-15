import { useMemo, useState } from 'react'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { ChartLineUp } from '@phosphor-icons/react/dist/csr/ChartLineUp'
import { ChatsCircle } from '@phosphor-icons/react/dist/csr/ChatsCircle'
import { ClipboardText } from '@phosphor-icons/react/dist/csr/ClipboardText'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { House } from '@phosphor-icons/react/dist/csr/House'
import { Timer } from '@phosphor-icons/react/dist/csr/Timer'
import { DEFAULT_SUBJECTS } from '../data/subjects.js'
import { STUDY_ROOM_ADVANCED_MINIMUM_XP, getRecommendedStudyTask, getStudyRoomEvolution } from '../domain/studyRoom.js'
import StudentHome from './StudentHome.jsx'
import PiuBrand from './PiuBrand.jsx'

const PREVIEW_VIEWS = [
  { id: 'home', label: 'Inici', Icon: House },
  { id: 'today', label: 'Avui', Icon: CalendarDots },
  { id: 'calendar', label: 'Calendari', Icon: CalendarDots },
  { id: 'tasks', label: 'Deures', Icon: ClipboardText },
  { id: 'community', label: 'Comunitat', Icon: ChatsCircle },
  { id: 'progress', label: 'Progrés', Icon: ChartLineUp },
  { id: 'study', label: 'Sala', Icon: Timer },
]

export const TUTOR_STUDENT_PREVIEW_VIEW_IDS = PREVIEW_VIEWS.map((view) => view.id)

const asDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateKey = (value) => {
  const date = asDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const timeLabel = (value) => {
  const date = asDate(value)
  return date ? new Intl.DateTimeFormat('ca-AD', { hour: '2-digit', minute: '2-digit' }).format(date) : '—'
}

const dateLabel = (value) => {
  const date = asDate(value)
  return date ? new Intl.DateTimeFormat('ca-AD', { weekday: 'short', day: 'numeric', month: 'short' }).format(date) : 'Sense data'
}

const subjectById = Object.fromEntries(DEFAULT_SUBJECTS.map((subject) => [subject.id, subject]))
const subjectName = (subjectId) => subjectById[subjectId]?.name ?? 'Assignatura'
const subjectColor = (subjectId) => subjectById[subjectId]?.color ?? '#596787'

const mondayOf = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}

const weekDaysFrom = (value) => {
  const monday = mondayOf(value)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return { date, key: dateKey(date), label: ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'][index] }
  })
}

function TodayPreview({ student, tasks, sessions }) {
  const today = new Date()
  const todayKey = dateKey(today)
  const tasksById = Object.fromEntries(tasks.map((task) => [task.id, task]))
  const todaySessions = sessions
    .filter((session) => session.state === 'planned' && dateKey(session.scheduledAt) === todayKey)
    .sort((left, right) => String(left.scheduledAt).localeCompare(String(right.scheduledAt)))
  const plannedMinutes = todaySessions.reduce((total, session) => total + Number(session.durationMinutes ?? 0), 0)
  const nextSession = todaySessions[0]
  const nextTask = nextSession ? tasksById[nextSession.taskId] : tasks.find((task) => task.status !== 'done')

  return (
    <div className="today-view visual-today-view">
      <header className="today-hero-heading">
        <div><h1>Bon dia, {student.displayName}</h1><p>{dateLabel(today)}</p></div>
        <div className="today-study-summary"><ClipboardText size={30} weight="duotone" aria-hidden="true" /><div><strong>{todaySessions.length} {todaySessions.length === 1 ? 'tasca' : 'tasques'} · {plannedMinutes || 0} min</strong><span>Temps d’estudi previst avui</span></div></div>
      </header>

      <div className="visual-calendar-grid">
        <section className="day-time-grid" aria-label="Planificació visible per al tutor">
          <div className="time-grid-labels" aria-hidden="true">{['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((time) => <span key={time}>{time}</span>)}</div>
          <div className="time-grid-events">
            {!todaySessions.length && <div className="calendar-empty visual-empty"><strong>Encara no hi ha cap sessió prevista avui.</strong><span>Les ocupacions personals de l’alumne no es mostren al tutor.</span></div>}
            {todaySessions.map((session) => {
              const task = tasksById[session.taskId]
              return <article className="visual-time-event session" style={{ '--event-color': subjectColor(task?.subjectId) }} key={session.id}><time>{timeLabel(session.scheduledAt)}</time><div className="event-copy"><strong>{task?.title ?? 'Sessió de treball'}</strong><span>{subjectName(task?.subjectId)} · {session.durationMinutes} min</span></div></article>
            })}
          </div>
        </section>

        <aside className="visual-today-sidebar">
          <section className="next-step-card visual-next-step">
            <span>Següent pas</span>
            {nextTask ? <><strong>{subjectName(nextTask.subjectId)}</strong><p>{nextTask.title}</p><small>{nextSession ? `${timeLabel(nextSession.scheduledAt)} · ${nextSession.durationMinutes} min` : 'Encara per planificar'}</small></> : <p>No hi ha cap tasca oberta.</p>}
          </section>
          <section className="privacy-explanation compact"><strong>Detalls privats protegits</strong><p>El tutor veu la mateixa estructura, les tasques i les sessions, però no les notes personals ni els noms de les extraescolars.</p></section>
        </aside>
      </div>
    </div>
  )
}

function CalendarPreview({ tasks, sessions }) {
  const tasksById = Object.fromEntries(tasks.map((task) => [task.id, task]))
  const days = weekDaysFrom(new Date())
  return <div className="week-calendar" role="grid" aria-label="Calendari setmanal de l’alumne en només lectura">{days.map((day) => {
    const daySessions = sessions.filter((session) => session.state === 'planned' && dateKey(session.scheduledAt) === day.key)
    const deadlines = tasks.filter((task) => dateKey(task.deadline?.at) === day.key)
    return <section className={`week-day ${day.key === dateKey(new Date()) ? 'today' : ''}`} role="gridcell" key={day.key}><header><strong>{day.label}</strong><span>{day.date.getDate()}</span></header><div className="week-day-events">{daySessions.map((session) => <div className="week-event session" key={session.id}><time>{timeLabel(session.scheduledAt)} · {session.durationMinutes} min</time><strong>{tasksById[session.taskId]?.title ?? 'Sessió de treball'}</strong></div>)}{deadlines.map((task) => <div className="week-event deadline" key={task.id}><time>{timeLabel(task.deadline.at)}</time><strong>{task.title}</strong><span>Termini</span></div>)}{!daySessions.length && !deadlines.length && <span className="empty-day">Sense elements escolars visibles</span>}</div></section>
  })}</div>
}

const TASK_STATUS_LABELS = { pending: 'Pendent', needs_clarification: 'Per aclarir', planned: 'Planificada', in_progress: 'En curs', done: 'Feta' }

function TasksPreview({ tasks, sessions }) {
  return <section className="task-list" aria-label="Deures de l’alumne en només lectura">{!tasks.length && <p className="empty-task-list">Aquest alumne encara no té deures.</p>}{tasks.map((task) => { const nextSession = sessions.filter((item) => item.taskId === task.id && item.state === 'planned').sort((left, right) => String(left.scheduledAt).localeCompare(String(right.scheduledAt)))[0]; return <article className={`task-card status-${task.status}`} key={task.id}><div className="task-card-heading"><div><span className="task-type">{subjectName(task.subjectId)}</span><h4>{task.title}</h4></div><span className={`task-status ${task.status}`}>{TASK_STATUS_LABELS[task.status] ?? task.status}</span></div><p>{task.deadline?.at ? `Termini: ${dateLabel(task.deadline.at)}` : 'Sense data confirmada'}</p>{nextSession && <p><strong>Pròxima sessió:</strong> {dateLabel(nextSession.scheduledAt)} · {timeLabel(nextSession.scheduledAt)} · {nextSession.durationMinutes} min</p>}<small>{task.progressPercent ?? 0}% completat · vista només de lectura</small></article> })}</section>
}

function ProgressPreview({ tutorialData }) {
  return <div className="progress-page"><section className="student-tutorial-panel"><div className="student-tutorial-heading"><div><p className="eyebrow">Acompanyament tutorial</p><h2>Revisió i feedback</h2></div></div>{tutorialData.goal ? <article className="student-goal"><span>Objectiu tutorial</span><strong>{tutorialData.goal.competency}</strong><p>{tutorialData.goal.description}</p></article> : <p>Encara no hi ha cap objectiu tutorial.</p>}<div className="student-tutorial-grid"><section><h3>Revisions setmanals</h3>{!tutorialData.reviews.length && <p>Encara no n’hi ha.</p>}{tutorialData.reviews.map((review) => <article key={review.id}><strong>{review.workedWell}</strong><p>{review.nextAdjustment}</p></article>)}</section><section><h3>Feedback del tutor</h3>{!tutorialData.feedback.length && <p>Encara no n’hi ha.</p>}{tutorialData.feedback.map((item) => <article key={item.id}><strong>{item.observation}</strong><p>{item.strategy}</p></article>)}</section></div><p className="explainability-note">Els XP i les preferències personals de gamificació són privats i no apareixen en aquesta previsualització.</p></section></div>
}

const evolutionAsset = (evolution) => `${import.meta.env.BASE_URL}mascota/piu/evolucions/${evolution.file}`

function StudyRoomPreview({ tasks, sessions, studyProgress, onExit }) {
  const openTasks = tasks.filter((task) => task.status !== 'done')
  const totalXp = Math.max(0, Number(studyProgress?.totalXp) || 0)
  const evolution = getStudyRoomEvolution(totalXp)
  const nextThreshold = evolution.next?.minimumXp ?? null
  const percentage = nextThreshold ? Math.min(100, Math.round((totalXp / nextThreshold) * 100)) : 100
  const recommendedTask = getRecommendedStudyTask({ tasks, sessions })

  return (
    <section className="study-room study-room-preparation tutor-study-room-preview" aria-labelledby="tutor-study-room-preview-title">
      <div className="study-room-prep-copy">
        <p className="eyebrow">Sala d’estudi</p>
        <h1 id="tutor-study-room-preview-title">Què vols avançar ara?</h1>
        <p>Tria una durada realista i centra’t en un únic objectiu cada vegada.</p>
        <form aria-label="Preparació de la Sala d’estudi en només lectura">
          <label>Tria el teu focus<select disabled defaultValue={recommendedTask?.id ?? 'free'}><option value="free">Estudi lliure</option>{openTasks.map((task) => <option value={task.id} key={task.id}>{task.title}</option>)}</select></label>
          <fieldset className="study-room-duration"><legend>Quin ritme et convé avui?</legend><button type="button" disabled><strong>Curta · 25 min</strong><span>Un sol bloc per començar fàcil</span></button><button type="button" className="selected" disabled><strong>Normal · 75 min</strong><span>30 + 15 + 30</span></button><button type="button" disabled><strong>Avançada · 105 min</strong><span>{totalXp >= STUDY_ROOM_ADVANCED_MINIMUM_XP ? '45 + 15 + 45 · només si té energia' : `Opcional a partir de ${STUDY_ROOM_ADVANCED_MINIMUM_XP} XP · en té ${totalXp}`}</span></button></fieldset>
          <div className="study-room-plan"><span><strong>30 min</strong> concentració</span><span aria-hidden="true">→</span><span><strong>15 min</strong> pausa</span><span aria-hidden="true">→</span><span><strong>30 min</strong> concentració</span></div>
          <button type="button" disabled><Timer size={20} />Només l’alumne pot començar el bloc</button>
        </form>
        <button type="button" className="text-button study-room-back" onClick={onExit}>Torna a l’inici</button>
      </div>
      <div className="study-room-prep-side">
        <div className="study-room-prep-piu"><img className="study-room-evolution-image" src={evolutionAsset(evolution)} alt={`Piu al nivell ${evolution.level}: ${evolution.name}`} /><div className="study-room-prep-piu-copy"><strong>Nivell {evolution.level} · {evolution.name}</strong><div className="study-room-evolution-progress"><strong>{nextThreshold ? `${totalXp} / ${nextThreshold} XP` : `${totalXp} XP`}</strong><span>{evolution.next ? `Per desbloquejar ${evolution.next.name}` : 'Evolució màxima desbloquejada'}</span><div role="progressbar" aria-label="Progrés de l’evolució de Piu" aria-valuemin="0" aria-valuemax={nextThreshold ?? totalXp} aria-valuenow={totalXp}><span style={{ width: `${percentage}%` }} /></div></div><p>Prepara el material i deixa a prop només el que necessites.</p></div></div>
        <section className="study-room-ranking" aria-labelledby="tutor-study-ranking-preview-title"><header><p className="eyebrow">Constància de la classe</p><h2 id="tutor-study-ranking-preview-title">Podi i aspirants</h2><small>La classificació pública apareix igual que a l’espai de l’alumne.</small></header><p>La posició individual de l’alumne és privada i no es mostra al tutor.</p></section>
      </div>
    </section>
  )
}

export default function TutorStudentPreview({ student, tasks, sessions, tutorialData, studyProgress = { totalXp: 0 } }) {
  const [activeView, setActiveView] = useState('home')
  const initials = useMemo(() => student.displayName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), [student.displayName])

  return (
    <section aria-label={`Vista de ${student.displayName} com a alumne`}>
      <header className="student-topbar">
        <PiuBrand className="student-brand" onClick={() => setActiveView('home')} />
        <nav className="student-primary-nav" aria-label="Previsualització de la navegació de l’alumne">{PREVIEW_VIEWS.map(({ id, label, Icon }) => <button type="button" className={activeView === id ? 'active' : ''} aria-current={activeView === id ? 'page' : undefined} key={id} onClick={() => setActiveView(id)}><Icon size={23} weight={activeView === id ? 'fill' : 'regular'} aria-hidden="true" /><span>{label}</span></button>)}</nav>
        <div className="student-account-actions"><div className="student-profile"><span aria-hidden="true">{initials}</span><strong>{student.displayName}</strong><Eye size={21} aria-hidden="true" /></div></div>
      </header>
      <div className="student-app-content">
        <p className="explainability-note"><strong>Previsualització del tutor · només lectura.</strong> Estàs veient l’experiència de l’alumne amb els detalls privats protegits.</p>
        {activeView === 'home' && <StudentHome session={{ classId: '', studentId: student.id, displayName: student.displayName }} onNavigate={setActiveView} calendarOverride={{ tasks, sessions }} tutorialOverride={tutorialData} />}
        {activeView === 'today' && <TodayPreview student={student} tasks={tasks} sessions={sessions} />}
        {activeView === 'calendar' && <CalendarPreview tasks={tasks} sessions={sessions} />}
        {activeView === 'tasks' && <TasksPreview tasks={tasks} sessions={sessions} />}
        {activeView === 'community' && <section className="community-space"><div className="community-heading"><div><p className="eyebrow">Espai compartit</p><h2>Comunitat</h2></div></div><p>Les sales i publicacions són compartides amb la classe. Les preguntes privades i les preferències de notificació de l’alumne no es mostren aquí.</p></section>}
        {activeView === 'progress' && <ProgressPreview tutorialData={tutorialData} />}
        {activeView === 'study' && <StudyRoomPreview tasks={tasks} sessions={sessions} studyProgress={studyProgress} onExit={() => setActiveView('home')} />}
      </div>
    </section>
  )
}
