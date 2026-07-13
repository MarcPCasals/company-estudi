import { useEffect, useMemo, useState } from 'react'
import { buildClassExceptions, buildClassLoad, buildStudentInsights, PROGRESS_STAGES, TUTORIAL_COMPETENCIES } from '../domain/tutorialAnalytics.js'
import { createSessionSuggestion, createTutorFeedback, observeStudentTutorial, observeTutorClassActivity, saveTutorialGoal, sendTutorNotice } from '../services/tutorialService.js'

const localDateTime = () => { const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(17, 30, 0, 0); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16) }
const shortDate = (value) => new Intl.DateTimeFormat('ca-AD', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(value))

function StudentDetail({ tutorId, classId, student, tasks, sessions, onStatus }) {
  const [data, setData] = useState({ goal: null, reviews: [], feedback: [], suggestions: [], notices: [], availability: null })
  const [goal, setGoal] = useState({ competency: TUTORIAL_COMPETENCIES[0], progressStage: PROGRESS_STAGES[0].id, description: '' })
  const [feedback, setFeedback] = useState({ observation: '', question: '', strategy: '', agreement: '' })
  const [suggestion, setSuggestion] = useState({ taskId: '', scheduledAt: localDateTime(), durationMinutes: 30, note: '' })
  useEffect(() => observeStudentTutorial({ classId, studentId: student.id }, setData, (error) => onStatus('error', error.message)), [classId, student.id])
  useEffect(() => { if (data.goal) setGoal({ competency: data.goal.competency, progressStage: data.goal.progressStage, description: data.goal.description }) }, [data.goal])
  const insights = buildStudentInsights({ tasks, sessions })
  const submit = async (event, action, success) => { event.preventDefault(); onStatus('loading', 'Desant…'); try { await action(); onStatus('success', success) } catch (error) { onStatus('error', error.message) } }
  return (
    <section className="tutor-student-detail">
      <div className="tutor-detail-heading"><div><p className="eyebrow">Fitxa individual</p><h4>{student.displayName}</h4></div><span>{tasks.filter((task) => task.status !== 'done').length} tasques obertes</span></div>
      <div className="tutor-insights">
        {insights.map((item) => <article key={item.id}><strong>{item.label}</strong><p>{item.interpretation}</p><small>{item.evidence}</small></article>)}
      </div>
      <p className="explainability-note">Aquestes tendències són recomptes visibles. No formen cap nota ni puntuació secreta.</p>

      <div className="tutor-detail-grid">
        <form onSubmit={(event) => submit(event, () => saveTutorialGoal({ tutorId, classId, studentId: student.id, input: goal }), 'Objectiu tutorial actualitzat.')}>
          <h5>Objectiu tutorial</h5>
          <label>Competència<select value={goal.competency} onChange={(event) => setGoal({ ...goal, competency: event.target.value })}>{TUTORIAL_COMPETENCIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Etapa<select value={goal.progressStage} onChange={(event) => setGoal({ ...goal, progressStage: event.target.value })}>{PROGRESS_STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Objectiu concret<textarea required value={goal.description} onChange={(event) => setGoal({ ...goal, description: event.target.value })} /></label>
          <button>Desa l’objectiu</button><small>No és una qualificació acadèmica.</small>
        </form>

        <form onSubmit={(event) => submit(event, () => createTutorFeedback({ tutorId, classId, studentId: student.id, input: feedback }), 'Feedback enviat a l’alumne.')}>
          <h5>Feedback formador</h5>
          {Object.entries({ observation: 'Observació', question: 'Pregunta', strategy: 'Estratègia', agreement: 'Acord' }).map(([key, label]) => <label key={key}>{label}<textarea required value={feedback[key]} onChange={(event) => setFeedback({ ...feedback, [key]: event.target.value })} /></label>)}
          <button>Envia el feedback</button>
        </form>

        <form onSubmit={(event) => submit(event, () => createSessionSuggestion({ tutorId, classId, studentId: student.id, input: suggestion }), 'Proposta enviada. L’alumne haurà d’acceptar-la.')}>
          <h5>Suggereix una sessió</h5>
          <label>Tasca<select required value={suggestion.taskId} onChange={(event) => setSuggestion({ ...suggestion, taskId: event.target.value })}><option value="">Selecciona…</option>{tasks.filter((task) => task.status !== 'done').map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
          <label>Franja<input required type="datetime-local" value={suggestion.scheduledAt} onChange={(event) => setSuggestion({ ...suggestion, scheduledAt: event.target.value })} /></label>
          <label>Durada<input type="number" min="10" max="240" value={suggestion.durationMinutes} onChange={(event) => setSuggestion({ ...suggestion, durationMinutes: event.target.value })} /></label>
          <label>Motiu breu<input value={suggestion.note} onChange={(event) => setSuggestion({ ...suggestion, note: event.target.value })} /></label>
          <button>Envia la proposta</button><small>No modifica el calendari de l’alumne.</small>
        </form>
      </div>

      <div className="tutorial-history-grid">
        <section><h5>Revisions setmanals</h5>{!data.reviews.length && <p>Encara no n’hi ha.</p>}{data.reviews.map((item) => <article key={item.id}><strong>{item.workedWell}</strong><p>Dificultat: {item.wasDifficult}</p><p>Reajustament: {item.nextAdjustment}</p></article>)}</section>
        <section><h5>Feedback enviat</h5>{!data.feedback.length && <p>Encara no n’hi ha.</p>}{data.feedback.map((item) => <article key={item.id}><strong>{item.observation}</strong><p>{item.strategy}</p><small>Acord: {item.agreement}</small></article>)}</section>
        <section><h5>Disponibilitat resumida</h5><p>{data.availability ? Object.entries(data.availability.availableAfterByDay ?? {}).map(([day, time]) => `${day}: ${time}`).join(' · ') : 'Encara no configurada.'}</p><small>Sense noms d’extraescolars ni detalls personals.</small></section>
      </div>
    </section>
  )
}

export default function TutorDashboard({ tutorId, classroom, students }) {
  const [activity, setActivity] = useState({ tasksByStudent: {}, sessionsByStudent: {} })
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [notice, setNotice] = useState({ audience: 'class', recipients: [], title: '', observation: '', suggestedAction: '', support: '' })
  const activeStudents = useMemo(() => students.filter((student) => student.active !== false), [students])
  useEffect(() => {
    setActivity({ tasksByStudent: {}, sessionsByStudent: {} })
    return observeTutorClassActivity({ classId: classroom.id, students: activeStudents }, setActivity, (error) => setStatus({ state: 'error', message: error.message }))
  }, [classroom.id, activeStudents.map((item) => item.id).join('|')])
  const exceptions = buildClassExceptions({ students: activeStudents, tasksByStudent: activity.tasksByStudent })
  const load = buildClassLoad({ tasksByStudent: activity.tasksByStudent, sessionsByStudent: activity.sessionsByStudent })
  const selected = activeStudents.find((student) => student.id === selectedId)
  const report = (state, message) => setStatus({ state, message })
  const sendNotice = async (event) => { event.preventDefault(); const ids = notice.audience === 'class' ? activeStudents.map((item) => item.id) : notice.recipients; report('loading', 'Enviant l’avís…'); try { await sendTutorNotice({ tutorId, classId: classroom.id, studentIds: ids, audience: notice.audience, input: notice }); report('success', 'Avís enviat amb un to basat en observació, proposta i suport.') } catch (error) { report('error', error.message) } }
  return (
    <section className="tutor-dashboard">
      <div className="tutor-dashboard-heading"><div><p className="eyebrow">Acompanyament formador</p><h3>Resum tutorial</h3></div><span>{activeStudents.length} alumnes</span></div>
      <div className="tutor-summary-cards">
        <article><strong>{exceptions.filter((item) => item.type === 'help').length}</strong><span>Peticions d’ajuda</span></article>
        <article><strong>{exceptions.filter((item) => item.type === 'clarify').length}</strong><span>Casos per aclarir</span></article>
        <article><strong>{exceptions.filter((item) => item.type === 'review').length}</strong><span>Revisions de termini</span></article>
      </div>
      <div className="tutor-overview-grid">
        <section><h4>Excepcions útils</h4>{!exceptions.length && <p>Cap excepció destacada ara mateix.</p>}{exceptions.map((item, index) => <button type="button" className="tutor-exception" key={`${item.studentId}-${item.type}-${index}`} onClick={() => setSelectedId(item.studentId)}><strong>{item.studentName}</strong><span>{item.label}</span></button>)}</section>
        <section><h4>Càrrega agregada · 7 dies</h4><div className="class-load-grid">{load.map((day) => <article key={day.dateKey}><strong>{shortDate(`${day.dateKey}T12:00:00`)}</strong><span>{day.deadlines} terminis</span><span>{day.sessions} sessions</span></article>)}</div></section>
      </div>
      <section className="tutor-student-picker"><h4>Fitxes individuals</h4><div>{activeStudents.map((student) => <button type="button" className={selectedId === student.id ? '' : 'secondary'} key={student.id} onClick={() => setSelectedId(student.id)}>{student.displayName}</button>)}</div></section>
      {selected && <StudentDetail tutorId={tutorId} classId={classroom.id} student={selected} tasks={activity.tasksByStudent[selected.id] ?? []} sessions={activity.sessionsByStudent[selected.id] ?? []} onStatus={report} />}

      <form className="tutor-notice-form" onSubmit={sendNotice}><h4>Avís individual, de grup o de classe</h4><label>Abast<select value={notice.audience} onChange={(event) => setNotice({ ...notice, audience: event.target.value, recipients: [] })}><option value="class">Tota la classe</option><option value="group">Grup seleccionat</option><option value="individual">Un alumne</option></select></label>{notice.audience !== 'class' && <fieldset><legend>Destinataris</legend>{activeStudents.map((student) => <label className="checkbox-label" key={student.id}><input type={notice.audience === 'individual' ? 'radio' : 'checkbox'} name="notice-student" checked={notice.recipients.includes(student.id)} onChange={(event) => setNotice({ ...notice, recipients: notice.audience === 'individual' ? [student.id] : event.target.checked ? [...notice.recipients, student.id] : notice.recipients.filter((id) => id !== student.id) })} />{student.displayName}</label>)}</fieldset>}{Object.entries({ title: 'Títol', observation: 'Què hem observat?', suggestedAction: 'Què proposem?', support: 'Quin suport oferim? (opcional)' }).map(([key, label]) => <label key={key}>{label}<input required={key !== 'support'} value={notice[key]} onChange={(event) => setNotice({ ...notice, [key]: event.target.value })} /></label>)}<button>Envia l’avís</button></form>
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
  )
}
