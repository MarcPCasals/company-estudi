import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_GAMIFICATION_PREFERENCES, GAMIFICATION_ACTIONS, PIU_ACCESSORIES, buildGamificationSummary, getPiuStateForSummary } from '../domain/gamification.js'
import { contributeToCooperativeMission, observeStudentGamification, saveGamificationPreferences } from '../services/gamificationService.js'
import PiuVisual from './PiuVisual.jsx'

const piuMessage = (summary) => {
  if (!summary.weeklyEvents.length) return 'Avui podem reprendre el ritme amb un pas petit.'
  if (summary.consistencyComplete) return 'Aquesta setmana has practicat maneres diferents d’organitzar-te.'
  if (summary.latestEvent?.action === 'help_requested') return 'Demanar ajuda també forma part d’un bon pla.'
  if (summary.latestEvent?.action === 'readjusted') return 'Canviar un pla perquè sigui realista és avançar.'
  return 'Bon pas. Mirem amb calma quin és el següent.'
}

export default function StudentGamificationPanel({ session }) {
  const [data, setData] = useState({ events: [], preferences: DEFAULT_GAMIFICATION_PREFERENCES, missions: [], contributions: [] })
  const [preferences, setPreferences] = useState(DEFAULT_GAMIFICATION_PREFERENCES)
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  useEffect(() => observeStudentGamification(
    { classId: session.classId, studentId: session.studentId },
    setData,
    (error) => setStatus({ state: 'error', message: error.message }),
  ), [session.classId, session.studentId])
  useEffect(() => setPreferences(data.preferences), [data.preferences])
  const summary = useMemo(() => buildGamificationSummary({ events: data.events }), [data.events])
  const unlockedAccessories = PIU_ACCESSORIES.filter((item) => item.requiredLevel <= summary.level.level)
  const currentAccessory = unlockedAccessories.some((item) => item.id === preferences.accessory) ? preferences.accessory : 'none'
  const currentMissions = data.missions.filter((mission) => mission.weekKey === summary.weekKey && ['active', 'completed'].includes(mission.status))
  const contributionIds = new Set(data.contributions.map((item) => item.missionId))

  const savePreferences = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Desant les preferències…' })
    try {
      await saveGamificationPreferences({ classId: session.classId, studentId: session.studentId, preferences: { ...preferences, accessory: currentAccessory } })
      setStatus({ state: 'success', message: 'Preferències desades.' })
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  const contribute = async (mission) => {
    setStatus({ state: 'loading', message: 'Comptant la teva aportació sense mostrar el teu nom…' })
    try {
      await contributeToCooperativeMission({ classId: session.classId, studentId: session.studentId, mission, events: data.events })
      setStatus({ state: 'success', message: 'Aportació comptada. La classe només veurà el progrés total.' })
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  return (
    <section className={`gamification-panel mode-${preferences.mode}`} aria-labelledby="gamification-title">
      <div className="gamification-heading">
        <div><p className="eyebrow">Company d’estudi</p><h2 id="gamification-title">Piu i el teu progrés</h2></div>
        {preferences.mode !== 'off' && <span className="level-badge">Nivell {summary.level.level} · {summary.level.name}</span>}
      </div>

      {preferences.mode !== 'off' && <div className="piu-summary"><PiuVisual state={getPiuStateForSummary(summary)} accessory={currentAccessory} animationsEnabled={preferences.animationsEnabled} /><div><strong>{piuMessage(summary)}</strong><p>{summary.level.nestStage}</p><div className="xp-progress" aria-label={`${summary.totalXp} punts d’experiència`}><div><span style={{ width: `${summary.level.progressPercent}%` }} /></div><small>{summary.totalXp} XP{summary.level.next ? ` · en falten ${summary.level.next.minimumXp - summary.totalXp} per a ${summary.level.next.name}` : ' · nivell màxim actual'}</small></div></div></div>}

      {preferences.mode !== 'off' && <section className="weekly-consistency"><div><h3>Constància flexible</h3><p>{summary.consistencySteps}/3 tipus d’hàbit aquesta setmana</p></div><div className="consistency-steps" aria-label={`${summary.consistencySteps} de 3 passos`}>{[1, 2, 3].map((step) => <span className={step <= summary.consistencySteps ? 'complete' : ''} key={step} />)}</div><small>No és una ratxa diària: no perds res si descanses o un dia no hi entres.</small></section>}

      {preferences.mode === 'full' && <div className="gamification-missions-grid">
        <section><h3>Missions personals de la setmana</h3>{summary.missions.map((mission) => <article className={mission.completed ? 'mission-complete' : ''} key={mission.id}><span>{mission.completed ? 'Feta' : 'Pendent'}</span><div><strong>{mission.title}</strong><p>{mission.description}</p></div></article>)}</section>
        <section><h3>Missió cooperativa</h3>{!currentMissions.length && <p>El tutor encara no n’ha activat cap aquesta setmana.</p>}{currentMissions.map((mission) => {
          const contributed = contributionIds.has(mission.id)
          const eligible = summary.weeklyEvents.some((event) => event.action === mission.action)
          return <article key={mission.id}><div><strong>{mission.title}</strong><p>{mission.description}</p><small>{mission.progress}/{mission.target} aportacions totals · no es mostren noms</small></div>{mission.status === 'completed' ? <span className="mission-complete-label">Assolida entre tots</span> : contributed ? <span>La teva aportació ja compta</span> : <button type="button" disabled={!eligible || status.state === 'loading'} onClick={() => contribute(mission)}>{eligible ? 'Aporta el meu pas' : `Primer: ${GAMIFICATION_ACTIONS[mission.action]?.label ?? 'completa l’hàbit'}`}</button>}</article>
        })}</section>
      </div>}

      <form className="gamification-settings" onSubmit={savePreferences}>
        <h3>Com vols viure aquesta part?</h3>
        <label>Gamificació<select value={preferences.mode} onChange={(event) => setPreferences({ ...preferences, mode: event.target.value })}><option value="full">Completa</option><option value="reduced">Reduïda</option><option value="off">Desactivada</option></select></label>
        <label className="checkbox-label"><input type="checkbox" checked={preferences.animationsEnabled} onChange={(event) => setPreferences({ ...preferences, animationsEnabled: event.target.checked })} />Permet animacions suaus</label>
        {preferences.mode !== 'off' && <label>Complement de Piu<select value={currentAccessory} onChange={(event) => setPreferences({ ...preferences, accessory: event.target.value })}>{unlockedAccessories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><small>Els complements visuals apareixeran quan hi afegim les imatges definitives.</small></label>}
        <button>Desa les preferències</button><small>Els XP són privats, no són una nota i el tutor no els utilitza per comparar alumnes.</small>
      </form>
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
  )
}
