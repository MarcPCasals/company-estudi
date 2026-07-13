import { useEffect, useState } from 'react'
import { PROGRESS_STAGES } from '../domain/tutorialAnalytics.js'
import { markNoticeRead, observeStudentTutorial, respondToSessionSuggestion, submitWeeklyReview } from '../services/tutorialService.js'

const formatDate = (value) => new Intl.DateTimeFormat('ca-AD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export default function StudentTutorialPanel({ session }) {
  const [data, setData] = useState({ goal: null, reviews: [], feedback: [], suggestions: [], notices: [], tasks: [] })
  const [review, setReview] = useState({ workedWell: '', wasDifficult: '', nextAdjustment: '', helpNeeded: false })
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  useEffect(() => observeStudentTutorial({ classId: session.classId, studentId: session.studentId }, setData, (error) => setStatus({ state: 'error', message: error.message })), [session.classId, session.studentId])
  const submit = async (event) => { event.preventDefault(); setStatus({ state: 'loading', message: 'Desant la revisió…' }); try { await submitWeeklyReview({ classId: session.classId, studentId: session.studentId, input: review }); setStatus({ state: 'success', message: 'Revisió setmanal desada.' }) } catch (error) { setStatus({ state: 'error', message: error.message }) } }
  const respond = async (suggestion, accepted) => { const task = data.tasks.find((item) => item.id === suggestion.taskId); if (accepted && !task) return; setStatus({ state: 'loading', message: 'Registrant la teva decisió…' }); try { await respondToSessionSuggestion({ suggestion, task, accepted }); setStatus({ state: 'success', message: accepted ? 'Sessió acceptada i afegida al teu calendari.' : 'Proposta descartada.' }) } catch (error) { setStatus({ state: 'error', message: error.message }) } }
  return (
    <section className="student-tutorial-panel">
      <div className="student-tutorial-heading"><div><p className="eyebrow">Acompanyament tutorial</p><h2>Revisió i feedback</h2></div></div>
      {data.notices.filter((item) => !item.readAt).map((notice) => <article className="student-notice" key={notice.id}><strong>{notice.title}</strong><p>{notice.message}</p><button type="button" className="secondary" onClick={() => markNoticeRead({ classId: session.classId, studentId: session.studentId, noticeId: notice.id })}>Marca com a llegit</button></article>)}
      {data.goal && <article className="student-goal"><span>Objectiu tutorial</span><strong>{data.goal.competency}</strong><p>{data.goal.description}</p><small>{PROGRESS_STAGES.find((item) => item.id === data.goal.progressStage)?.label} · no és una nota.</small></article>}
      {data.suggestions.filter((item) => item.status === 'pending').map((item) => <article className="student-suggestion" key={item.id}><strong>El tutor et suggereix una sessió</strong><p>{formatDate(item.scheduledAt)} · {item.durationMinutes} min</p>{item.note && <p>{item.note}</p>}<div className="actions"><button type="button" onClick={() => respond(item, true)}>Accepta i afegeix</button><button type="button" className="secondary" onClick={() => respond(item, false)}>Ara no</button></div><small>El tutor no l’ha afegit al teu calendari: la decisió és teva.</small></article>)}
      <div className="student-tutorial-grid">
        <form onSubmit={submit}><h3>Revisió setmanal breu</h3><label>Què ha funcionat?<textarea required value={review.workedWell} onChange={(event) => setReview({ ...review, workedWell: event.target.value })} /></label><label>Què ha costat?<textarea required value={review.wasDifficult} onChange={(event) => setReview({ ...review, wasDifficult: event.target.value })} /></label><label>Què reajustaràs?<textarea required value={review.nextAdjustment} onChange={(event) => setReview({ ...review, nextAdjustment: event.target.value })} /></label><label className="checkbox-label"><input type="checkbox" checked={review.helpNeeded} onChange={(event) => setReview({ ...review, helpNeeded: event.target.checked })} />Vull comentar-ho amb el tutor</label><button>Desa la revisió</button></form>
        <section><h3>Feedback del tutor</h3>{!data.feedback.length && <p>Encara no hi ha feedback.</p>}{data.feedback.map((item) => <article key={item.id}><strong>{item.observation}</strong><p><b>Pregunta:</b> {item.question}</p><p><b>Estratègia:</b> {item.strategy}</p><p><b>Acord:</b> {item.agreement}</p></article>)}</section>
      </div>
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
  )
}
