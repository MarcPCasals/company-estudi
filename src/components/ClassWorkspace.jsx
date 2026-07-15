import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getTutorClassSecret,
  observeClassRooms,
  observeClassStudents,
  updateClassSchoolSchedule,
  updateRoomMembership,
} from '../services/classService.js'
import {
  moveStudentToClass,
  observeStudentCredentials,
  provisionStudents,
  regenerateStudentCredential,
} from '../services/studentProvisioningService.js'
import { WEEK_DAYS } from '../data/defaultSchedule.js'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import TutorDashboard from './TutorDashboard.jsx'
import TutorCommunityPanel from './TutorCommunityPanel.jsx'
import TutorGamificationPanel from './TutorGamificationPanel.jsx'
import TutorHome, { TutorTopbar } from './TutorHome.jsx'
import CotutoringPanel, { CotutorInvitationInbox } from './CotutoringPanel.jsx'
import { isResponsibleTutor, teacherRoleLabel } from '../domain/cotutoring.js'

const messageFromError = (error) =>
  error?.message ?? 'No s’ha pogut completar l’operació.'

const VIEW_TITLES = {
  dashboard: ['Seguiment de la classe', 'Resum, progrés, missatges i informació rellevant'],
  community: ['Comunitat', 'Sales, recursos i converses de la classe'],
  missions: ['Missions de classe', 'Reptes compartits i reconeixements'],
  calendar: ['Calendari de la classe', 'Horari escolar habitual'],
  settings: ['Configuració de la classe', 'Accessos, alumnes i sales'],
}

export default function ClassWorkspace({ tutorId, classroom, classes, user, onLogout, invitations = [], onRespondInvitation, invitationBusy, onSelectClass }) {
  const [students, setStudents] = useState([])
  const [credentials, setCredentials] = useState([])
  const [rooms, setRooms] = useState([])
  const [classCode, setClassCode] = useState('')
  const [namesText, setNamesText] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [roomMode, setRoomMode] = useState('all')
  const [roomMembers, setRoomMembers] = useState([])
  const [moveTargets, setMoveTargets] = useState({})
  const [schoolSchedule, setSchoolSchedule] = useState(classroom.schoolSchedule ?? {})
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [activeView, setActiveView] = useState('home')
  const owner = isResponsibleTutor(classroom, tutorId)
  const reportStatus = useCallback(
    (state, message) => setStatus({ state, message }),
    [],
  )

  useEffect(() => {
    setStatus({ state: 'idle', message: '' })
    if (owner) {
      getTutorClassSecret({ tutorId, classId: classroom.id })
        .then((secret) => setClassCode(secret?.classCode ?? ''))
        .catch((error) => setStatus({ state: 'error', message: messageFromError(error) }))
    } else {
      setClassCode('')
    }
    const stopStudents = observeClassStudents(
      classroom.id,
      setStudents,
      (error) => setStatus({ state: 'error', message: messageFromError(error) }),
    )
    const stopCredentials = owner ? observeStudentCredentials(
      { tutorId, classId: classroom.id },
      setCredentials,
      (error) => setStatus({ state: 'error', message: messageFromError(error) }),
    ) : () => setCredentials([])
    const stopRooms = observeClassRooms(
      classroom.id,
      setRooms,
      (error) => setStatus({ state: 'error', message: messageFromError(error) }),
    )
    return () => {
      stopStudents()
      stopCredentials()
      stopRooms()
    }
  }, [classroom.id, tutorId, owner])

  useEffect(() => setSchoolSchedule(classroom.schoolSchedule ?? {}), [classroom.schoolSchedule])

  const activeStudents = useMemo(
    () => students.filter((student) => student.active !== false),
    [students],
  )
  const credentialsByStudent = useMemo(
    () => Object.fromEntries(credentials.map((credential) => [credential.studentId, credential])),
    [credentials],
  )
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)

  useEffect(() => {
    if (!selectedRoom) return
    setRoomMode(selectedRoom.memberMode ?? 'all')
    setRoomMembers(selectedRoom.memberStudentIds ?? [])
  }, [selectedRoomId, selectedRoom?.memberMode, selectedRoom?.memberStudentIds])

  const addStudents = async (event) => {
    event.preventDefault()
    const names = namesText.split('\n').map((name) => name.trim()).filter(Boolean)
    setStatus({ state: 'loading', message: `Creant ${names.length} accessos d’alumne…` })
    try {
      await provisionStudents({ tutorId, classId: classroom.id, names })
      setNamesText('')
      setStatus({ state: 'success', message: 'Alumnes i codis creats correctament.' })
    } catch (error) {
      setStatus({ state: 'error', message: messageFromError(error) })
    }
  }

  const regenerate = async (studentId) => {
    setStatus({ state: 'loading', message: 'Regenerant el codi i revocant l’anterior…' })
    try {
      await regenerateStudentCredential({ tutorId, classId: classroom.id, studentId })
      setStatus({ state: 'success', message: 'Codi regenerat. L’anterior ja no dona accés.' })
    } catch (error) {
      setStatus({ state: 'error', message: messageFromError(error) })
    }
  }

  const move = async (studentId) => {
    const targetClassId = moveTargets[studentId]
    if (!targetClassId) return
    setStatus({ state: 'loading', message: 'Canviant l’alumne de classe…' })
    try {
      await moveStudentToClass({
        tutorId,
        sourceClassId: classroom.id,
        targetClassId,
        studentId,
      })
      setStatus({
        state: 'success',
        message: 'Alumne traslladat. Els codis anteriors han quedat invalidats.',
      })
    } catch (error) {
      setStatus({ state: 'error', message: messageFromError(error) })
    }
  }

  const saveRoom = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Desant els membres de la sala…' })
    try {
      await updateRoomMembership({
        classId: classroom.id,
        roomId: selectedRoomId,
        memberMode: roomMode,
        memberStudentIds: roomMembers,
      })
      setStatus({ state: 'success', message: 'Membres de la sala actualitzats.' })
    } catch (error) {
      setStatus({ state: 'error', message: messageFromError(error) })
    }
  }

  const saveSchoolSchedule = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Desant l’horari escolar…' })
    try {
      await updateClassSchoolSchedule({ classId: classroom.id, schoolSchedule })
      setStatus({ state: 'success', message: 'Horari escolar actualitzat.' })
    } catch (error) {
      setStatus({ state: 'error', message: messageFromError(error) })
    }
  }

  const goHome = () => setActiveView('home')
  const viewTitle = VIEW_TITLES[activeView] ?? VIEW_TITLES.dashboard

  return (
    <div className={`tutor-class-app view-${activeView}`}>
      <TutorTopbar
        user={user}
        classroom={classroom}
        onHome={goHome}
        onSettings={() => setActiveView('settings')}
        onLogout={onLogout}
      />

      {activeView === 'home' && (
        <>
          {classes.length > 1 && (
            <div className="class-switcher">
              <label>Classe activa<select value={classroom.id} onChange={(event) => onSelectClass?.(event.target.value)}>{classes.filter(({ active }) => active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}{item.tutorId === tutorId ? '' : ' · compartida'}</option>)}</select></label>
              <span className="role-badge">{teacherRoleLabel(classroom, tutorId)}</span>
            </div>
          )}
          <CotutorInvitationInbox invitations={invitations} onRespond={onRespondInvitation} busy={invitationBusy} />
          <TutorHome tutorId={tutorId} classroom={classroom} students={activeStudents} user={user} onNavigate={setActiveView} />
        </>
      )}

      {activeView !== 'home' && (
        <main className="tutor-view-page">
          <header className="tutor-view-heading">
            <div><p className="eyebrow">{classroom.name} · {classroom.course}</p><h1>{viewTitle[0]}</h1><p>{viewTitle[1]}</p></div>
            <button type="button" className="secondary" onClick={goHome}><ArrowLeft size={18} aria-hidden="true" />Torna a l’inici</button>
          </header>

          <section className="class-workspace" aria-labelledby="class-workspace-title">
            {activeView === 'dashboard' && <TutorDashboard tutorId={tutorId} classroom={classroom} students={activeStudents} />}
            {activeView === 'community' && <TutorCommunityPanel tutorId={tutorId} classroom={classroom} students={activeStudents} />}
            {activeView === 'missions' && <TutorGamificationPanel tutorId={tutorId} classroom={classroom} studentCount={activeStudents.length} />}

            {activeView === 'calendar' && (
              owner ? <form className="school-schedule-form" onSubmit={saveSchoolSchedule}>
                <h4>Horari escolar de la classe</h4>
                <div className="school-schedule-grid">
                  {WEEK_DAYS.slice(0, 5).map((day) => (
                    <label key={day.id}>
                      {day.label}
                      <input type="time" required value={schoolSchedule[day.id]?.schoolEndsAt ?? ''} onChange={(event) => setSchoolSchedule((current) => ({ ...current, [day.id]: { schoolEndsAt: event.target.value } }))} />
                    </label>
                  ))}
                </div>
                <button type="submit">Desa l’horari escolar</button>
              </form> : <p className="helper-text">Només el tutor responsable pot modificar la configuració general de la classe.</p>
            )}

            {activeView === 'settings' && (
              <>
                <div className="class-workspace-heading">
                  <div><p className="eyebrow">Classe activa</p><h3 id="class-workspace-title">{classroom.name}</h3><span>{classroom.course}</span></div>
                  <div className="class-code"><span>Rol docent</span><code>{teacherRoleLabel(classroom, tutorId)}</code></div>
                </div>
                <CotutoringPanel classroom={classroom} tutorId={tutorId} user={user} onStatus={reportStatus} />
                <div className="privacy-explanation"><strong>Què veu el tutor?</strong><p>Tasques escolars, sessions planificades, disponibilitat resumida i revisions tutorials.</p><p>No veu notes privades, noms d’extraescolars ni activitat en directe.</p></div>
                {owner && <><div className="class-code"><span>Codi de classe</span><code>{classCode || 'Carregant…'}</code></div><button type="button" className="secondary" onClick={() => setActiveView('calendar')}>Configura l’horari escolar</button></>}

                {owner && <form className="student-bulk-form" onSubmit={addStudents}>
                  <label>Afegeix alumnes, un nom per línia<textarea required rows={5} value={namesText} onChange={(event) => setNamesText(event.target.value)} placeholder={'Alba M.\nBiel R.\nCarla P.'} /></label>
                  <button type="submit" disabled={status.state === 'loading'}>Genera els codis personals</button>
                </form>}

                {owner && <div className="student-credentials">
                  <h4>Alumnes i accessos</h4>
                  {activeStudents.length === 0 && <p className="helper-text">Encara no hi ha alumnes.</p>}
                  {activeStudents.map((student) => {
                    const credential = credentialsByStudent[student.id]
                    const otherClasses = classes.filter((item) => item.id !== classroom.id)
                    return (
                      <article key={student.id} className="student-access-card">
                        <div><strong>{student.displayName}</strong><span>Codi personal: <code>{credential?.studentCode ?? 'Carregant…'}</code></span></div>
                        <button type="button" className="secondary" onClick={() => regenerate(student.id)}>Codi perdut: regenera</button>
                        {otherClasses.length > 0 && (
                          <div className="move-student-controls">
                            <select aria-label={`Classe de destí per a ${student.displayName}`} value={moveTargets[student.id] ?? ''} onChange={(event) => setMoveTargets((current) => ({ ...current, [student.id]: event.target.value }))}>
                              <option value="">Canvia de classe…</option>
                              {otherClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <button type="button" onClick={() => move(student.id)}>Mou</button>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>}

                {owner && <form className="room-membership-form" onSubmit={saveRoom}>
                  <h4>Sales comunes i optatives</h4>
                  <label>Sala<select value={selectedRoomId} onChange={(event) => setSelectedRoomId(event.target.value)}><option value="">Selecciona una sala…</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
                  {selectedRoom && (
                    <>
                      <label>Accés<select value={roomMode} onChange={(event) => setRoomMode(event.target.value)}><option value="all">Tota la classe</option><option value="selected">Només membres seleccionats</option></select></label>
                      {roomMode === 'selected' && <fieldset><legend>Alumnes de l’optativa</legend>{activeStudents.map((student) => <label key={student.id} className="checkbox-label"><input type="checkbox" checked={roomMembers.includes(student.id)} onChange={(event) => setRoomMembers((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} />{student.displayName}</label>)}</fieldset>}
                      <button type="submit">Desa els membres</button>
                    </>
                  )}
                </form>}
                <p className="helper-text">Canvi de dispositiu: l’alumne només ha d’introduir els mateixos dos codis al nou dispositiu.</p>
              </>
            )}

            {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
          </section>
        </main>
      )}
    </div>
  )
}
