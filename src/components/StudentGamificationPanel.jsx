import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_GAMIFICATION_PREFERENCES, GAMIFICATION_ACTION, GAMIFICATION_ACTIONS, PIU_ACCESSORIES, buildGamificationSummary } from '../domain/gamification.js'
import { PIU_EVENT, PIU_SURFACE, resolvePiuVisualState } from '../domain/piuVisualState.js'
import { contributeToCooperativeMission, observeStudentGamification, saveGamificationPreferences } from '../services/gamificationService.js'
import PiuVisual from './PiuVisual.jsx'

const piuMessage = (summary) => {
  if (!summary.weeklyEvents.length) return 'Avui podem reprendre el ritme amb un pas petit.'
  if (summary.consistencyComplete) return 'Aquesta setmana has practicat maneres diferents d’organitzar-te.'
  if (summary.latestEvent?.action === 'help_requested') return 'Demanar ajuda també forma part d’un bon pla.'
  if (summary.latestEvent?.action === 'readjusted') return 'Canviar un pla perquè sigui realista és avançar.'
  return 'Bon pas. Mirem amb calma quin és el següent.'
}

export default function StudentGamificationPanel({ session, onOpenReview = () => {} }) {
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
  const piu = useMemo(() => {
    let event = null
    if (summary.consistencyComplete) event = PIU_EVENT.LONG_CONSISTENCY
    else if (summary.latestEvent?.action === GAMIFICATION_ACTION.WEEKLY_REVIEW) event = PIU_EVENT.WEEKLY_REVIEW
    else if (summary.latestEvent?.action === GAMIFICATION_ACTION.EARLY_START) event = PIU_EVENT.START_WORK
    else if ([GAMIFICATION_ACTION.PLANNED, GAMIFICATION_ACTION.DIVIDED, GAMIFICATION_ACTION.READJUSTED].includes(summary.latestEvent?.action)) event = PIU_EVENT.PLAN_SAVED
    else if (summary.latestEvent) event = PIU_EVENT.CONTRIBUTION_SHARED
    return resolvePiuVisualState({ surface: PIU_SURFACE.PROGRESS, event })
  }, [summary.consistencyComplete, summary.latestEvent])

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

  const settingsForm = (
    <details className="gamification-preferences piu-orbit-card piu-orbit-settings"><summary>Preferències de Piu i gamificació</summary><form className="gamification-settings" onSubmit={savePreferences}>
      <h3>Com vols viure aquesta part?</h3>
      <label>Gamificació<select value={preferences.mode} onChange={(event) => setPreferences({ ...preferences, mode: event.target.value })}><option value="full">Completa</option><option value="reduced">Reduïda</option><option value="off">Desactivada</option></select></label>
      <label className="checkbox-label"><input type="checkbox" checked={preferences.animationsEnabled} onChange={(event) => setPreferences({ ...preferences, animationsEnabled: event.target.checked })} />Permet animacions suaus</label>
      {preferences.mode !== 'off' && unlockedAccessories.length > 1 && <label>Complement de Piu<select value={currentAccessory} onChange={(event) => setPreferences({ ...preferences, accessory: event.target.value })}>{unlockedAccessories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      <button>Desa les preferències</button><small>Els XP d’hàbits són privats, no són una nota i el tutor no els utilitza per comparar alumnes.</small>
    </form></details>
  )

  return (
    <section className={`gamification-panel mode-${preferences.mode}`} aria-labelledby="gamification-title">
      <div className="gamification-heading">
        <div><p className="eyebrow">Company d’estudi</p><h2 id="gamification-title">Piu i el teu progrés</h2></div>
        {preferences.mode !== 'off' && <span className="level-badge">Nivell {summary.level.level} · {summary.level.name}</span>}
      </div>

      {preferences.mode !== 'off' ? <div className="piu-orbit">
        <div className="piu-summary piu-orbit-center"><PiuVisual state={piu.state} accessory={currentAccessory} animationsEnabled={preferences.animationsEnabled} /><div><strong>{piuMessage(summary)}</strong><p>{summary.level.nestStage}</p><div className="xp-progress" aria-label={`${summary.totalXp} punts d’experiència d’hàbits`}><div><span style={{ width: `${summary.level.progressPercent}%` }} /></div><small>{summary.totalXp} XP d’hàbits{summary.level.next ? ` · en falten ${summary.level.next.minimumXp - summary.totalXp} per a ${summary.level.next.name}` : ' · nivell màxim actual'}</small></div></div></div>

        <section className="xp-systems-card piu-orbit-card"><h3>Aquests XP no són els de la Sala d’estudi</h3><p>Els <strong>XP d’hàbits</strong> reconeixen que planifiques, divideixes o reajustes i són sempre privats.</p><p>Els <strong>XP de Sala d’estudi</strong> compten blocs de concentració i poden aparèixer al podi i als aspirants.</p><small>Per això pots tenir, per exemple, 20 XP d’hàbits i 0 XP de Sala d’estudi sense haver perdut res.</small></section>

        <section className="weekly-consistency piu-orbit-card piu-orbit-consistency"><div><h3>Constància flexible</h3><p>{summary.consistencySteps}/3 tipus d’hàbit aquesta setmana</p></div><div className="consistency-steps" aria-label={`${summary.consistencySteps} de 3 passos`}>{[1, 2, 3].map((step) => <span className={step <= summary.consistencySteps ? 'complete' : ''} key={step} />)}</div><small>No és una ratxa diària: no perds res si descanses o un dia no hi entres.</small></section>

        {preferences.mode === 'full' && <section className="piu-orbit-card piu-orbit-personal piu-mission-panel"><h3>Missions personals de la setmana</h3>{summary.missions.map((mission) => <article className={mission.completed ? 'mission-complete' : ''} key={mission.id}><span>{mission.completed ? 'Feta' : 'Pendent'}</span><div><strong>{mission.title}</strong><p>{mission.description}</p>{mission.id === 'look-back' && !mission.completed && <button type="button" onClick={onOpenReview}>Obre la revisió setmanal</button>}</div></article>)}</section>}

        {preferences.mode === 'full' && <section className="piu-orbit-card piu-orbit-cooperative piu-mission-panel"><h3>Missió cooperativa</h3>{!currentMissions.length && <p>El tutor encara no n’ha activat cap aquesta setmana.</p>}{currentMissions.map((mission) => {
          const contributed = contributionIds.has(mission.id)
          const eligible = summary.weeklyEvents.some((event) => event.action === mission.action)
          return <article key={mission.id}><div><strong>{mission.title}</strong><p>{mission.description}</p><small>{mission.progress}/{mission.target} aportacions totals · no es mostren noms</small></div>{mission.status === 'completed' ? <span className="mission-complete-label">Assolida entre tots</span> : contributed ? <span>La teva aportació ja compta</span> : <button type="button" disabled={!eligible || status.state === 'loading'} onClick={() => contribute(mission)}>{eligible ? 'Aporta el meu pas' : `Primer: ${GAMIFICATION_ACTIONS[mission.action]?.label ?? 'completa l’hàbit'}`}</button>}</article>
        })}</section>}

        {settingsForm}
      </div> : settingsForm}
      {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
    </section>
  )
}
