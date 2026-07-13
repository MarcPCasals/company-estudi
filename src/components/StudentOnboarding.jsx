import { useEffect, useState } from 'react'
import { WEEK_DAYS } from '../data/defaultSchedule.js'
import { loadStudentPlanningSetup, saveStudentPlanningSetup } from '../services/planningSetupService.js'
import TaskWorkspace from './TaskWorkspace.jsx'
import CalendarWorkspace from './CalendarWorkspace.jsx'
import StudentTutorialPanel from './StudentTutorialPanel.jsx'
import CommunitySpace from './CommunitySpace.jsx'
import StudentGamificationPanel from './StudentGamificationPanel.jsx'

const newActivity = () => ({ day: 'monday', start: '18:00', end: '19:00', label: '', type: 'extracurricular' })

export default function StudentOnboarding({ session, onLogout }) {
  const [travelMinutes, setTravelMinutes] = useState(15)
  const [restMinutes, setRestMinutes] = useState(30)
  const [weekendEnabled, setWeekendEnabled] = useState(true)
  const [weekendStart, setWeekendStart] = useState('10:00')
  const [weekendEnd, setWeekendEnd] = useState('18:00')
  const [activities, setActivities] = useState([])
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => {
    loadStudentPlanningSetup({ classId: session.classId, studentId: session.studentId })
      .then((setup) => {
        if (!setup) return
        setTravelMinutes(setup.travelMinutes ?? 15)
        setRestMinutes(setup.restMinutes ?? 30)
        setWeekendEnabled(setup.weekend?.enabled ?? true)
        setWeekendStart(setup.weekend?.start ?? '10:00')
        setWeekendEnd(setup.weekend?.end ?? '18:00')
        setActivities((setup.activities ?? []).map((activity) => ({
          ...activity,
          type: activity.type ?? 'other',
        })))
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
      })
      setStatus({ state: 'success', message: 'Configuració desada. Ja podem proposar franges realistes.' })
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  return (
    <div className="student-space">
    <section className="panel student-onboarding" aria-labelledby="student-onboarding-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Primer accés completat</p>
          <h2 id="student-onboarding-title">Hola, {session.displayName}</h2>
          <p>{session.className} · {session.course}</p>
        </div>
        <button type="button" className="secondary" onClick={onLogout}>Surt</button>
      </div>

      <div className="privacy-explanation">
        <strong>La teva privacitat</strong>
        <p>El tutor veu les tasques, com planifiques i un resum de quan estàs disponible.</p>
        <p>No veu les teves notes privades, el nom de les extraescolars ni què fas en directe.</p>
      </div>

      <form className="planning-setup-form" onSubmit={submit}>
        <h3>Configura el teu temps habitual</h3>
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

        <div className="activities-editor">
          <div className="inline-heading">
            <h4>Extraescolars i altres ocupacions</h4>
            <button type="button" className="secondary" onClick={() => setActivities((current) => [...current, newActivity()])} disabled={activities.length >= 10}>
              Afegeix-ne una
            </button>
          </div>
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
        </div>

        <button type="submit" disabled={status.state === 'loading'}>
          {status.state === 'loading' ? 'Desant…' : 'Desa la configuració inicial'}
        </button>
      </form>
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
    <section className="panel">
      <CalendarWorkspace session={session} />
    </section>
    <section className="panel">
      <StudentGamificationPanel session={session} />
    </section>
    <section className="panel">
      <StudentTutorialPanel session={session} />
    </section>
    <section className="panel">
      <CommunitySpace classId={session.classId} role="student" actorId={session.studentId} actorName={session.displayName} studentId={session.studentId} />
    </section>
    <section className="panel">
      <TaskWorkspace session={session} />
    </section>
    </div>
  )
}
