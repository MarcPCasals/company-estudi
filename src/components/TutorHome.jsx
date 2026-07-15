import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { CalendarDots } from '@phosphor-icons/react/dist/csr/CalendarDots'
import { ChartLineUp } from '@phosphor-icons/react/dist/csr/ChartLineUp'
import { ChatTeardropText } from '@phosphor-icons/react/dist/csr/ChatTeardropText'
import { CompassRose } from '@phosphor-icons/react/dist/csr/CompassRose'
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { ListChecks } from '@phosphor-icons/react/dist/csr/ListChecks'
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Student } from '@phosphor-icons/react/dist/csr/Student'
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree'
import { buildClassExceptions, buildClassLoad } from '../domain/tutorialAnalytics.js'
import { observeTutorClassActivity } from '../services/tutorialService.js'
import { observeAndRefreshStudyRoomRanking } from '../services/studyRoomService.js'
import { PIU_SURFACE, resolvePiuVisualState } from '../domain/piuVisualState.js'
import PiuVisual from './PiuVisual.jsx'
import PiuBrand from './PiuBrand.jsx'
import './tutorHome.css'

const shortDay = (dateKey) => new Intl.DateTimeFormat('ca-AD', {
  weekday: 'long',
  day: 'numeric',
}).format(new Date(`${dateKey}T12:00:00`))

const initialsFor = (name) => String(name ?? 'Tutor')
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase()

const firstNameFor = (name) => String(name ?? 'Tutor').trim().split(/\s+/)[0]

function TutorAction({ className, Icon, label, detail, badge, onClick }) {
  return (
    <button type="button" className={`tutor-orbit-action ${className}`} onClick={onClick}>
      <span className="tutor-action-icon"><Icon size={26} weight="duotone" aria-hidden="true" /></span>
      <span className="tutor-action-copy"><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
      {badge > 0 && <b aria-label={`${badge} elements per revisar`}>{badge}</b>}
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  )
}

export function TutorTopbar({ user, classroom, onHome, onSettings, onLogout }) {
  const displayName = user?.displayName ?? 'Tutor'
  return (
    <header className="tutor-home-topbar">
      <PiuBrand className="tutor-home-brand" onClick={onHome} />
      <div className="tutor-home-access"><span>Accés del tutor</span>{classroom?.name && <small>{classroom.name}</small>}</div>
      <div className="tutor-home-account">
        <span className="tutor-home-avatar" aria-hidden="true">{initialsFor(displayName)}</span>
        <strong>{displayName}</strong>
        <button type="button" className="tutor-icon-button" aria-label="Configuració de la classe" onClick={onSettings}><GearSix size={25} weight="duotone" /></button>
        <button type="button" className="tutor-icon-button" aria-label="Tanca la sessió" onClick={onLogout}><SignOut size={25} /></button>
      </div>
    </header>
  )
}

export default function TutorHome({ tutorId, classroom, students, user, onNavigate }) {
  const [activity, setActivity] = useState({ tasksByStudent: {}, sessionsByStudent: {} })
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')
  const [greeting] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    const key = `company-estudi:piu-tutor-greeting:${tutorId}`
    try {
      const previous = globalThis.localStorage?.getItem(key)
      globalThis.localStorage?.setItem(key, today)
      return { firstEntryToday: previous !== today, returningToday: previous === today }
    } catch {
      return { firstEntryToday: true, returningToday: false }
    }
  })
  const activeStudents = useMemo(() => students.filter((student) => student.active !== false), [students])

  useEffect(() => {
    setReady(false)
    return observeTutorClassActivity(
      { classId: classroom.id, students: activeStudents },
      (nextActivity) => {
        setActivity(nextActivity)
        setReady(true)
      },
      () => {
        setStatus('No hem pogut actualitzar el resum de la classe.')
        setReady(true)
      },
    )
  }, [classroom.id, activeStudents.map((student) => student.id).join('|')])

  useEffect(() => observeAndRefreshStudyRoomRanking(
    { classId: classroom.id },
    () => setStatus('No hem pogut recalcular el podi de la Sala d’estudi.'),
  ), [classroom.id])

  const exceptions = useMemo(() => buildClassExceptions({
    students: activeStudents,
    tasksByStudent: activity.tasksByStudent,
  }), [activeStudents, activity.tasksByStudent])
  const classLoad = useMemo(() => buildClassLoad({
    tasksByStudent: activity.tasksByStudent,
    sessionsByStudent: activity.sessionsByStudent,
  }), [activity.tasksByStudent, activity.sessionsByStudent])
  const radarDays = classLoad.filter((day) => day.deadlines > 0 || day.sessions > 0).slice(0, 3)
  const openTasks = Object.values(activity.tasksByStudent).flat().filter((task) => task.status !== 'done').length
  const plannedSessions = Object.values(activity.sessionsByStudent).flat().filter((session) => session.state === 'planned').length
  const helpRequests = exceptions.filter((item) => item.type === 'help').length
  const piu = resolvePiuVisualState({ surface: PIU_SURFACE.TUTOR, ...greeting, hasUpcomingAction: exceptions.length > 0 })

  return (
    <main className="tutor-home-page" aria-labelledby="tutor-home-title">
      <section className="tutor-home-stage">
        <header className="tutor-home-greeting">
          <p className="eyebrow">{classroom.name} · {classroom.course}</p>
          <h1 id="tutor-home-title">Bon dia, {firstNameFor(user?.displayName)}!</h1>
          <p>Piu posa el més important de la tutoria al teu abast.</p>
        </header>

        <div className="tutor-home-orbit">
          <div className="tutor-home-character">
            <PiuVisual state={piu.state} />
          </div>

          <TutorAction className="tutor-action-summary" Icon={CalendarDots} label="Resum" detail="Vista general d’avui" onClick={() => onNavigate('dashboard')} />
          <TutorAction className="tutor-action-progress" Icon={ChartLineUp} label="Progrés de classe" detail="Ritme i seguiment" badge={exceptions.length} onClick={() => onNavigate('dashboard')} />
          <TutorAction className="tutor-action-messages" Icon={ChatTeardropText} label="Missatges alumnes" detail="Peticions i feedback" badge={helpRequests} onClick={() => onNavigate('dashboard')} />
          <TutorAction className="tutor-action-students" Icon={Student} label="Alumnes" detail="Informació rellevant" badge={exceptions.length} onClick={() => onNavigate('dashboard')} />
          <TutorAction className="tutor-action-community" Icon={UsersThree} label="Comunitat" detail="Sales i recursos" onClick={() => onNavigate('community')} />
          <TutorAction className="tutor-action-missions" Icon={ListChecks} label="Missions de classe" detail="Reptes compartits" onClick={() => onNavigate('missions')} />
        </div>
      </section>

      <aside className="tutor-home-insights">
        <section className="tutor-home-insight tutor-radar-card">
          <header><CompassRose size={29} weight="duotone" aria-hidden="true" /><div><span>Radar</span><h2>Els pròxims dies</h2></div></header>
          {!ready && <p>Actualitzant el Radar de la classe…</p>}
          {ready && radarDays.length === 0 && <div className="tutor-calm-state"><strong>Tot tranquil</strong><p>No hi ha terminis ni sessions planificades a prop.</p></div>}
          {radarDays.map((day) => <button type="button" key={day.dateKey} onClick={() => onNavigate('dashboard')}><strong>{shortDay(day.dateKey)}</strong><span>{day.deadlines} {day.deadlines === 1 ? 'termini' : 'terminis'} · {day.sessions} {day.sessions === 1 ? 'sessió' : 'sessions'}</span><small>Obre el resum <ArrowRight size={15} aria-hidden="true" /></small></button>)}
        </section>

        <section className="tutor-home-insight tutor-feedback-card">
          <header><Sparkle size={29} weight="duotone" aria-hidden="true" /><div><span>Espai feedback</span><h2>Una lectura de la setmana</h2></div></header>
          <blockquote>{openTasks === 0 ? 'La classe no té cap tasca oberta ara mateix.' : `La classe té ${openTasks} ${openTasks === 1 ? 'tasca oberta' : 'tasques obertes'} i ${plannedSessions} ${plannedSessions === 1 ? 'sessió planificada' : 'sessions planificades'}.`}</blockquote>
          <p>{exceptions.length ? `Hi ha ${exceptions.length} ${exceptions.length === 1 ? 'cas que demana' : 'casos que demanen'} una mirada concreta.` : 'No hi ha cap excepció destacada: pots mantenir el ritme actual.'}</p>
          <button type="button" className="text-button" onClick={() => onNavigate('dashboard')}>Veure el progrés de classe <ArrowRight size={16} aria-hidden="true" /></button>
        </section>

        {status && <p className="form-status error" role="status">{status}</p>}
      </aside>
    </main>
  )
}
