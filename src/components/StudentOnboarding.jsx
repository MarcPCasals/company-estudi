import { useEffect, useState } from 'react'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { ChartLineUp } from '@phosphor-icons/react/dist/csr/ChartLineUp'
import { ChatsCircle } from '@phosphor-icons/react/dist/csr/ChatsCircle'
import { ClipboardText } from '@phosphor-icons/react/dist/csr/ClipboardText'
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { House } from '@phosphor-icons/react/dist/csr/House'
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut'
import { Timer } from '@phosphor-icons/react/dist/csr/Timer'
import { WEEK_DAYS } from '../data/defaultSchedule.js'
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECTS } from '../data/subjects.js'
import { loadStudentPlanningSetup, saveStudentPlanningSetup } from '../services/planningSetupService.js'
import { observeCommunityUnreadCount } from '../services/communityService.js'
import TaskWorkspace from './TaskWorkspace.jsx'
import CalendarWorkspace from './CalendarWorkspace.jsx'
import StudentTutorialPanel from './StudentTutorialPanel.jsx'
import CommunitySpace from './CommunitySpace.jsx'
import StudentGamificationPanel from './StudentGamificationPanel.jsx'
import StudentHome from './StudentHome.jsx'
import StudyRoom from './StudyRoom.jsx'
import PiuBrand from './PiuBrand.jsx'

const newActivity = () => ({ day: 'monday', days: ['monday'], start: '18:00', end: '19:00', label: '', type: 'extracurricular' })
const addMinutesToClock = (time, minutes) => { const [hours, minutePart] = String(time).split(':').map(Number); const total = (hours * 60) + minutePart + Number(minutes || 0); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }

const STUDENT_VIEWS = [
  { id: 'today', label: 'Avui', Icon: House },
  { id: 'calendar', label: 'Calendari', Icon: CalendarDots },
  { id: 'tasks', label: 'Deures', Icon: ClipboardText },
  { id: 'community', label: 'Comunitat', Icon: ChatsCircle },
  { id: 'progress', label: 'Progrés', Icon: ChartLineUp },
  { id: 'study', label: 'Sala', Icon: Timer },
]

export default function StudentOnboarding({ session, onLogout }) {
  const [activeView, setActiveView] = useState('home')
  const [travelMinutes, setTravelMinutes] = useState(15)
  const [restMinutes, setRestMinutes] = useState(30)
  const [weekendEnabled, setWeekendEnabled] = useState(true)
  const [weekendStart, setWeekendStart] = useState('10:00')
  const [weekendEnd, setWeekendEnd] = useState('18:00')
  const [activities, setActivities] = useState([])
  const [subjectColors, setSubjectColors] = useState(DEFAULT_SUBJECT_COLORS)
  const [needsPlanningSetup, setNeedsPlanningSetup] = useState(false)
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0)
  const [studyImmersive, setStudyImmersive] = useState(false)

  useEffect(() => {
    loadStudentPlanningSetup({ classId: session.classId, studentId: session.studentId })
      .then((setup) => {
        if (!setup) {
          setNeedsPlanningSetup(true)
          setActiveView('home')
          setStatus({ state: 'idle', message: '' })
          return
        }
        setNeedsPlanningSetup(false)
        setTravelMinutes(setup.travelMinutes ?? 15)
        setRestMinutes(setup.restMinutes ?? 30)
        setWeekendEnabled(setup.weekend?.enabled ?? true)
        setWeekendStart(setup.weekend?.start ?? '10:00')
        setWeekendEnd(setup.weekend?.end ?? '18:00')
        setActivities((setup.activities ?? []).map((activity) => ({
          ...activity,
          type: activity.type ?? 'other',
          days: activity.days ?? [activity.day],
        })))
        setSubjectColors({ ...DEFAULT_SUBJECT_COLORS, ...(setup.subjectColors ?? {}) })
      })
      .catch((error) => setStatus({ state: 'error', message: error.message }))
  }, [session.classId, session.studentId])

  useEffect(() => observeCommunityUnreadCount(
    { classId: session.classId, studentId: session.studentId },
    setCommunityUnreadCount,
    () => setCommunityUnreadCount(0),
  ), [session.classId, session.studentId])

  const updateActivity = (index, field, value) => setActivities((current) =>
    current.map((activity, activityIndex) => activityIndex === index
      ? { ...activity, [field]: value }
      : activity))
  const toggleActivityDay = (index, dayId) => setActivities((current) => current.map((activity, activityIndex) => activityIndex !== index ? activity : { ...activity, days: activity.days?.includes(dayId) ? activity.days.filter((day) => day !== dayId) : [...(activity.days ?? []), dayId] }))
  const availabilityPreview = WEEK_DAYS.map((day) => {
    const schoolEnd = session.schoolSchedule?.[day.id]?.schoolEndsAt
    const start = day.id === 'saturday' || day.id === 'sunday' ? (weekendEnabled ? weekendStart : null) : addMinutesToClock(schoolEnd ?? '17:00', Number(travelMinutes) + Number(restMinutes))
    const end = day.id === 'saturday' || day.id === 'sunday' ? weekendEnd : '21:30'
    if (!start) return { ...day, text: 'Temps lliure protegit' }
    const windows = []; let cursor = start
    activities.filter((activity) => activity.days?.includes(day.id) || activity.day === day.id).sort((left, right) => left.start.localeCompare(right.start)).forEach((activity) => { if (activity.end <= cursor || activity.start >= end) return; if (activity.start > cursor) windows.push(`${cursor}–${activity.start}`); if (activity.end > cursor) cursor = activity.end })
    if (cursor < end) windows.push(`${cursor}–${end}`)
    return { ...day, text: windows.length ? `Pots estudiar ${windows.join(' · ')}` : 'Dia sense franges disponibles' }
  })

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
        activities: activities.flatMap((activity) => (activity.days?.length ? activity.days : [activity.day]).map((day) => ({ ...activity, day, days: undefined }))),
        subjectColors,
      })
      setNeedsPlanningSetup(false)
      setStatus({ state: 'success', message: 'Configuració desada. Ja podem proposar franges realistes.' })
      setActiveView('home')
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  return (
    <div className={`student-app view-${activeView} ${studyImmersive ? 'study-immersive' : ''}`}>
      {!studyImmersive && <header className="student-topbar">
        <PiuBrand className="student-brand" onClick={() => setActiveView('home')} />
        {activeView !== 'home' && <nav className="student-primary-nav" aria-label="Navegació de l’alumne">
          {STUDENT_VIEWS.map(({ id, label, Icon }) => (
            <button
              type="button"
              className={activeView === id || (id === 'progress' && ['messages', 'review'].includes(activeView)) ? 'active' : ''}
              aria-current={activeView === id || (id === 'progress' && ['messages', 'review'].includes(activeView)) ? 'page' : undefined}
              aria-label={id === 'community' && communityUnreadCount > 0
                ? `${label}, ${communityUnreadCount} continguts nous`
                : label}
              title={label}
              key={id}
              onClick={() => setActiveView(id)}
            >
              <Icon size={23} weight={activeView === id || (id === 'progress' && ['messages', 'review'].includes(activeView)) ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{label}</span>
              {id === 'community' && communityUnreadCount > 0 && (
                <small aria-hidden="true">{communityUnreadCount > 99 ? '99+' : communityUnreadCount}</small>
              )}
            </button>
          ))}
        </nav>}
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
      </header>}

      <main className="student-app-content">
        {activeView === 'home' && <StudentHome session={session} onNavigate={setActiveView} setupIncomplete={needsPlanningSetup} communityUnreadCount={communityUnreadCount} />}
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
        {['progress', 'messages', 'review'].includes(activeView) && (
          <div className="progress-page">
            <nav className="progress-section-nav" aria-label="Progrés, missatges i revisió">{[['progress', 'Hàbits i progrés'], ['messages', 'Missatges'], ['review', 'Revisió setmanal']].map(([id, label]) => <button type="button" className={activeView === id ? '' : 'secondary'} aria-current={activeView === id ? 'page' : undefined} key={id} onClick={() => setActiveView(id)}>{label}</button>)}</nav>
            {activeView === 'progress' && <StudentGamificationPanel session={session} onOpenReview={() => setActiveView('review')} />}
            {activeView === 'messages' && <StudentTutorialPanel session={session} section="messages" />}
            {activeView === 'review' && <StudentTutorialPanel session={session} section="review" />}
          </div>
        )}
        {activeView === 'study' && <StudyRoom session={session} onImmersiveChange={setStudyImmersive} onExit={() => { setStudyImmersive(false); setActiveView('home') }} />}
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
                    <fieldset className="activity-days"><legend>Dies</legend>{WEEK_DAYS.map((day, dayIndex) => <label key={day.id}><input type="checkbox" aria-label={day.label} checked={activity.days?.includes(day.id)} onChange={() => toggleActivityDay(index, day.id)} />{['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'][dayIndex]}</label>)}</fieldset>
                    <input aria-label="Inici" type="time" value={activity.start} onChange={(event) => updateActivity(index, 'start', event.target.value)} />
                    <input aria-label="Final" type="time" value={activity.end} onChange={(event) => updateActivity(index, 'end', event.target.value)} />
                    <input aria-label="Nom privat" value={activity.label} onChange={(event) => updateActivity(index, 'label', event.target.value)} placeholder="Nom privat" />
                    <div className="activity-actions"><button type="button" className="secondary" onClick={() => setActivities((current) => [...current, { ...activity, label: `${activity.label} còpia` }])}>Duplica</button><button type="button" className="secondary" onClick={() => setActivities((current) => current.filter((_, activityIndex) => activityIndex !== index))}>Elimina</button></div>
                  </div>
                ))}
              </section>

              <section className="availability-preview"><h2>Previsualització de la setmana</h2><div>{availabilityPreview.map((day) => <article key={day.id}><strong>{day.label}</strong><span>{day.text}</span></article>)}</div></section>

              <section className="xp-system-explanation"><h2>Dos progressos diferents</h2><div><article><strong>XP d’hàbits</strong><p>Reconeixen accions d’organització. Són privats: només els veus tu.</p></article><article><strong>XP de Sala d’estudi</strong><p>Compten blocs de concentració. Poden aparèixer al podi i als aspirants de la Sala d’estudi.</p></article></div><small>Tenir 20 XP d’hàbits i 0 XP de Sala d’estudi és normal: cap progrés s’ha perdut.</small></section>

              <details className="appearance-settings">
                <summary>Aparença i colors</summary>
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
              </details>

              <button type="submit" className="sticky-settings-save" disabled={status.state === 'loading'}>
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
