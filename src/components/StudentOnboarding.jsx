import { useEffect, useState } from 'react'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { ChartLineUp } from '@phosphor-icons/react/dist/csr/ChartLineUp'
import { ChatsCircle } from '@phosphor-icons/react/dist/csr/ChatsCircle'
import { ClipboardText } from '@phosphor-icons/react/dist/csr/ClipboardText'
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { House } from '@phosphor-icons/react/dist/csr/House'
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut'
import { WEEK_DAYS } from '../data/defaultSchedule.js'
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECTS } from '../data/subjects.js'
import { loadStudentPlanningSetup, saveStudentPlanningSetup } from '../services/planningSetupService.js'
import TaskWorkspace from './TaskWorkspace.jsx'
import CalendarWorkspace from './CalendarWorkspace.jsx'
import StudentTutorialPanel from './StudentTutorialPanel.jsx'
import CommunitySpace from './CommunitySpace.jsx'
import StudentGamificationPanel from './StudentGamificationPanel.jsx'

const newActivity = () => ({ day: 'monday', start: '18:00', end: '19:00', label: '', type: 'extracurricular' })

const STUDENT_VIEWS = [
  { id: 'today', label: 'Avui', Icon: House },
  { id: 'calendar', label: 'Calendari', Icon: CalendarDots },
  { id: 'tasks', label: 'Deures', Icon: ClipboardText },
  { id: 'community', label: 'Comunitat', Icon: ChatsCircle },
  { id: 'progress', label: 'Progrés', Icon: ChartLineUp },
]

export default function StudentOnboarding({ session, onLogout }) {
  const [activeView, setActiveView] = useState('today')
  const [travelMinutes, setTravelMinutes] = useState(15)
  const [restMinutes, setRestMinutes] = useState(30)
  const [weekendEnabled, setWeekendEnabled] = useState(true)
  const [weekendStart, setWeekendStart] = useState('10:00')
  const [weekendEnd, setWeekendEnd] = useState('18:00')
  const [activities, setActivities] = useState([])
  const [subjectColors, setSubjectColors] = useState(DEFAULT_SUBJECT_COLORS)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => {
    loadStudentPlanningSetup({ classId: session.classId, studentId: session.studentId })
      .then((setup) => {
        if (!setup) {
          setActiveView('settings')
          setStatus({ state: 'info', message: 'Configura primer el teu temps habitual perquè et puguem proposar franges realistes.' })
          return
        }
        setTravelMinutes(setup.travelMinutes ?? 15)
        setRestMinutes(setup.restMinutes ?? 30)
        setWeekendEnabled(setup.weekend?.enabled ?? true)
        setWeekendStart(setup.weekend?.start ?? '10:00')
        setWeekendEnd(setup.weekend?.end ?? '18:00')
        setActivities((setup.activities ?? []).map((activity) => ({
          ...activity,
          type: activity.type ?? 'other',
        })))
        setSubjectColors({ ...DEFAULT_SUBJECT_COLORS, ...(setup.subjectColors ?? {}) })
      })
      .catch((error) => setStatus({ state: 'error', message: error.message }))
  }, [session.classId, session.studentId])

  const updateActivity = (index, field, value) => setActivities((current) =>
    current.map((activity, activityIndex) => activityIndex === index
      ? { ...activity, [field]: value }
      : activity))

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Desant la configuració privada…' })
    try {
      await saveStudentPlanningSetup({
        classId: session.classId,
        studentId: session.studentId,
        schoolSchedule: session.schoolSchedule,
        travelMinutes,
        restMinutes,
        weekendEnabled,
        weekendStart,
        weekendEnd,
        activities,
        subjectColors,
      })
      setStatus({ state: 'success', message: 'Configuració desada. Ja podem proposar franges realistes.' })
      setActiveView('today')
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  return (
    <div className="student-app">
      <header className="student-topbar">
        <button type="button" className="student-brand" onClick={() => setActiveView('today')}>
          <span>Company d’estudi</span>
        </button>
        <nav className="student-primary-nav" aria-label="Navegació de l’alumne">
          {STUDENT_VIEWS.map(({ id, label, Icon }) => (
            <button
              type="button"
              className={activeView === id ? 'active' : ''}
              aria-current={activeView === id ? 'page' : undefined}
              key={id}
              onClick={() => setActiveView(id)}
            >
              <Icon size={23} weight={activeView === id ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{label}</span>
              {id === 'community' && <small aria-label="2 continguts nous">2</small>}
            </button>
          ))}
        </nav>
        <div className="student-account-actions">
          <button
            type="button"
            className={activeView === 'settings' ? 'student-profile active' : 'student-profile'}
            onClick={() => setActiveView('settings')}
            aria-label="Obre la configuració personal"
          >
            <span aria-hidden="true">{session.displayName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
            <strong>{session.displayName}</strong>
            <GearSix size={21} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button" onClick={onLogout} aria-label="Surt de l’espai de l’alumne">
            <SignOut size={23} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="student-app-content">
        {activeView === 'today' && (
          <CalendarWorkspace
            session={session}
            subjectColors={subjectColors}
            initialView="today"
            lockedView
            onOpenTasks={() => setActiveView('tasks')}
            onOpenCalendar={() => setActiveView('calendar')}
          />
        )}
        {activeView === 'calendar' && (
          <CalendarWorkspace session={session} subjectColors={subjectColors} initialView="week" />
        )}
        {activeView === 'tasks' && <TaskWorkspace session={session} />}
        {activeView === 'community' && (
          <CommunitySpace
            classId={session.classId}
            role="student"
            actorId={session.studentId}
            actorName={session.displayName}
            studentId={session.studentId}
          />
        )}
        {activeView === 'progress' && (
          <div className="progress-page">
            <StudentGamificationPanel session={session} />
            <StudentTutorialPanel session={session} />
          </div>
        )}
        {activeView === 'settings' && (
          <section className="student-settings-page" aria-labelledby="student-settings-title">
            <div className="settings-page-heading">
              <div>
                <p className="eyebrow">El teu temps i el teu espai</p>
                <h1 id="student-settings-title">Configuració personal</h1>
                <p>{session.className} · {session.course}</p>
              </div>
              <div className="privacy-explanation compact">
                <strong>La teva privacitat</strong>
                <p>El tutor veu les tasques i un resum de disponibilitat, però no els noms de les extraescolars ni les notes privades.</p>
              </div>
            </div>

            <form className="planning-setup-form visual-settings-form" onSubmit={submit}>
              <section>
                <h2>Temps habitual</h2>
                <div className="two-column-fields">
                  <label>
                    Trajecte després de classe (min)
                    <input type="number" min="0" max="180" value={travelMinutes} onChange={(event) => setTravelMinutes(event.target.value)} />
                  </label>
                  <label>
                    Descans abans d’estudiar (min)
                    <input type="number" min="0" max="180" value={restMinutes} onChange={(event) => setRestMinutes(event.target.value)} />
                  </label>
                </div>
                <label className="checkbox-label">
                  <input type="checkbox" checked={weekendEnabled} onChange={(event) => setWeekendEnabled(event.target.checked)} />
                  Vull poder planificar també el cap de setmana
                </label>
                {weekendEnabled && (
                  <div className="two-column-fields">
                    <label>Des de <input type="time" value={weekendStart} onChange={(event) => setWeekendStart(event.target.value)} /></label>
                    <label>Fins a <input type="time" value={weekendEnd} onChange={(event) => setWeekendEnd(event.target.value)} /></label>
                  </div>
                )}
              </section>

              <section className="activities-editor">
                <div className="inline-heading">
                  <div><h2>Extraescolars i ocupacions</h2><p>El nom sempre queda privat.</p></div>
                  <button type="button" className="secondary" onClick={() => setActivities((current) => [...current, newActivity()])} disabled={activities.length >= 10}>
                    Afegeix-ne una
                  </button>
                </div>
                {activities.length === 0 && <p className="empty-settings-message">Encara no has afegit cap ocupació habitual.</p>}
                {activities.map((activity, index) => (
                  <div className="activity-row" key={`${index}-${activity.day}`}>
                    <select aria-label="Tipus" value={activity.type} onChange={(event) => updateActivity(index, 'type', event.target.value)}>
                      <option value="extracurricular">Extraescolar</option>
                      <option value="meal">Àpat</option>
                      <option value="other">Altres</option>
                    </select>
                    <select aria-label="Dia" value={activity.day} onChange={(event) => updateActivity(index, 'day', event.target.value)}>
                      {WEEK_DAYS.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}
                    </select>
                    <input aria-label="Inici" type="time" value={activity.start} onChange={(event) => updateActivity(index, 'start', event.target.value)} />
                    <input aria-label="Final" type="time" value={activity.end} onChange={(event) => updateActivity(index, 'end', event.target.value)} />
                    <input aria-label="Nom privat" value={activity.label} onChange={(event) => updateActivity(index, 'label', event.target.value)} placeholder="Nom privat" />
                    <button type="button" className="secondary" onClick={() => setActivities((current) => current.filter((_, activityIndex) => activityIndex !== index))}>Elimina</button>
                  </div>
                ))}
              </section>

              <section>
                <div className="inline-heading"><div><h2>Colors de les assignatures</h2><p>Pots adaptar-los al teu gust. El text i les icones continuen identificant cada assignatura.</p></div></div>
                <div className="subject-color-grid">
                  {DEFAULT_SUBJECTS.map((subject) => (
                    <label key={subject.id}>
                      <input
                        type="color"
                        value={subjectColors[subject.id] ?? subject.color}
                        onChange={(event) => setSubjectColors((current) => ({ ...current, [subject.id]: event.target.value }))}
                        aria-label={`Color de ${subject.name}`}
                      />
                      <span>{subject.name}</span>
                    </label>
                  ))}
                </div>
              </section>

              <button type="submit" disabled={status.state === 'loading'}>
                {status.state === 'loading' ? 'Desant…' : 'Desa la configuració'}
              </button>
            </form>
            {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
          </section>
        )}
      </main>
    </div>
  )
}
