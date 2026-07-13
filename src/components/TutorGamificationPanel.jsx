import { useEffect, useState } from 'react'
import { GAMIFICATION_ACTIONS } from '../domain/gamification.js'
import { createCooperativeMission, observeClassMissions } from '../services/gamificationService.js'

export default function TutorGamificationPanel({ tutorId, classroom, studentCount }) {
  const [missions, setMissions] = useState([])
  const [form, setForm] = useState({ title: '', description: '', action: 'planned', target: Math.max(2, Math.min(studentCount, 8)) })
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  useEffect(() => observeClassMissions(classroom.id, setMissions, (error) => setStatus({ state: 'error', message: error.message })), [classroom.id])
  const submit = async (event) => {
    event.preventDefault(); setStatus({ state: 'loading', message: 'Creant la missió…' })
    try {
      await createCooperativeMission({ tutorId, classId: classroom.id, input: form })
      setForm((current) => ({ ...current, title: '', description: '' }))
      setStatus({ state: 'success', message: 'Missió creada. Només es mostrarà el recompte total.' })
    } catch (error) { setStatus({ state: 'error', message: error.message }) }
  }
  return <section className="tutor-gamification-panel"><div><p className="eyebrow">Cooperació sense rànquing</p><h4>Missió de classe</h4><p>El tutor veu el progrés total, però no qui hi ha contribuït.</p></div><div className="tutor-mission-layout"><form onSubmit={submit}><label>Títol<input required minLength="3" maxLength="80" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Preparem la setmana" /></label><label>Explicació<input required minLength="3" maxLength="240" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Entre tots, planifiquem vuit tasques reals" /></label><label>Hàbit<select value={form.action} onChange={(event) => setForm({ ...form, action: event.target.value })}>{Object.entries(GAMIFICATION_ACTIONS).map(([id, action]) => <option key={id} value={id}>{action.label}</option>)}</select></label><label>Objectiu d’aportacions<input type="number" min="2" max="40" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></label><button disabled={status.state === 'loading'}>Activa la missió</button></form><div className="tutor-mission-list">{!missions.length && <p>Encara no hi ha missions.</p>}{missions.map((mission) => <article key={mission.id}><strong>{mission.title}</strong><span>{mission.progress}/{mission.target} aportacions</span><progress max={mission.target} value={mission.progress} /><small>{mission.status === 'completed' ? 'Assolida entre tots' : 'Activa'} · sense identitats</small></article>)}</div></div>{status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}</section>
}
