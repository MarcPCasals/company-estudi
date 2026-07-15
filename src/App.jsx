import { useEffect, useMemo, useState } from 'react'
import {
  createStudentCredential,
  isSessionAuthorized,
  rotateStudentCredential,
} from './domain/accessCodes.js'
import {
  getCommunityProfileView,
  getStudentProfileView,
  getTutorProfileView,
} from './domain/profileViews.js'
import { demoProfile } from './data/demoProfile.js'
import {
  firebaseProjectId,
  firebaseEmulatorsEnabled,
  isFirebaseConfigured,
} from './lib/firebase.js'
import {
  exchangeStudentAccessCodes,
  loadCurrentStudentContext,
  observeCurrentUser,
  signInTutorWithGoogle,
  signInTestTutor,
  signOutCurrentUser,
} from './services/authService.js'
import {
  createTutorClass,
  observeTutorClasses,
} from './services/classService.js'
import { SYNC_STATE } from './domain/offlinePolicy.js'
import {
  clearOfflineDataAndDisable,
  observeConnectivity,
  synchronizePendingWrites,
} from './services/offlineService.js'
import ClassWorkspace from './components/ClassWorkspace.jsx'
import { CotutorInvitationInbox } from './components/CotutoringPanel.jsx'
import StudentOnboarding from './components/StudentOnboarding.jsx'
import {
  observeMyCotutorInvitations,
  respondToCotutorInvitation,
} from './services/cotutoringService.js'

const formatDeadline = (value) =>
  new Intl.DateTimeFormat('ca-AD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

function DetailList({ entries }) {
  return (
    <dl className="detail-list">
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const SYNC_LABELS = {
  [SYNC_STATE.OFFLINE]: 'Sense connexió',
  [SYNC_STATE.CACHED]: 'Còpia local',
  [SYNC_STATE.PENDING]: 'Canvis pendents',
  [SYNC_STATE.SYNCED]: 'Sincronitzat',
}

function OfflineStatusPanel() {
  const [online, setOnline] = useState(globalThis.navigator?.onLine ?? true)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => observeConnectivity(setOnline), [])

  const disable = async () => {
    setStatus({ state: 'loading', message: 'Comprovant i esborrant dades locals antigues…' })
    try {
      await clearOfflineDataAndDisable()
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  const synchronize = async () => {
    setStatus({ state: 'loading', message: 'Comprovant canvis pendents…' })
    try {
      await synchronizePendingWrites()
      setStatus({ state: 'success', message: 'Tots els canvis estan sincronitzats.' })
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  return (
    <section className="offline-panel" aria-labelledby="offline-title">
      <div>
        <p className="eyebrow">Connexió i recuperació</p>
        <h2 id="offline-title">Connexió segura</h2>
        <p>
          Les dades es desen directament a Firestore. La còpia permanent del navegador està desactivada per evitar problemes d’espai al dispositiu.
        </p>
      </div>
      <span className={`sync-badge ${online ? 'synced' : 'offline'}`} role="status">
        {online ? 'Amb connexió' : 'Sense connexió'}
      </span>
      <div className="offline-actions">
        <button type="button" onClick={synchronize} disabled={!online || status.state === 'loading'}>
          Comprova la sincronització
        </button>
        <button type="button" className="secondary" onClick={disable} disabled={status.state === 'loading'}>
          Neteja dades locals antigues
        </button>
      </div>
      {status.message && (
        <p className={`form-status ${status.state}`} role="status">{status.message}</p>
      )}
    </section>
  )
}

function ProfilePreview({ mode }) {
  const profile = useMemo(() => {
    if (mode === 'tutor') return getTutorProfileView(demoProfile)
    if (mode === 'community') return getCommunityProfileView(demoProfile)
    return getStudentProfileView(demoProfile)
  }, [mode])

  const task = profile.academicTasks?.[0]

  return (
    <section className="panel" aria-labelledby="profile-preview-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Vista funcional</p>
          <h2 id="profile-preview-title">
            {mode === 'student' && 'El que veu l’alumne'}
            {mode === 'tutor' && 'El que veu el tutor'}
            {mode === 'community' && 'El que veu la comunitat'}
          </h2>
        </div>
        <span className="visibility-badge">{mode}</span>
      </div>

      <DetailList
        entries={[
          ['Nom visible', profile.displayName],
          ['Avatar compartit', profile.avatar ?? profile.gamification?.sharedAvatar ?? 'No visible'],
        ]}
      />

      {task && (
        <div className="content-block">
          <h3>Deure escolar</h3>
          <DetailList
            entries={[
              ['Assignatura', task.subject],
              ['Tasca', task.title],
              ['Termini', formatDeadline(task.deadline)],
              ['Estat', task.status],
              ['Nota personal', task.privateNote ?? 'No visible'],
            ]}
          />
        </div>
      )}

      {profile.personalSchedule && (
        <div className="content-block">
          <h3>Agenda personal</h3>
          <p>{profile.personalSchedule[0].label}</p>
        </div>
      )}

      {profile.personalAvailability && (
        <div className="content-block">
          <h3>Disponibilitat</h3>
          <p>
            {profile.personalAvailability[0].day}: {profile.personalAvailability[0].label} ·{' '}
            {profile.personalAvailability[0].durationMinutes} min
          </p>
        </div>
      )}

      {profile.privateNotes && (
        <div className="content-block private-block">
          <h3>Nota privada</h3>
          <p>{profile.privateNotes}</p>
        </div>
      )}

      {profile.tutorialGoal && (
        <div className="content-block">
          <h3>Objectiu tutorial</h3>
          <p>
            <strong>{profile.tutorialGoal.competency}:</strong>{' '}
            {profile.tutorialGoal.description}
          </p>
        </div>
      )}
    </section>
  )
}

function CredentialDemo() {
  const [credential, setCredential] = useState(() =>
    createStudentCredential({
      studentId: demoProfile.studentId,
      classId: demoProfile.classId,
    }),
  )
  const [sessionVersion, setSessionVersion] = useState(credential.version)

  const session = {
    studentId: demoProfile.studentId,
    classId: demoProfile.classId,
    credentialVersion: sessionVersion,
  }
  const isAuthorized = isSessionAuthorized({ session, credential })

  return (
    <section className="panel" aria-labelledby="credential-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Accés amb codi</p>
          <h2 id="credential-title">Credencial regenerable</h2>
        </div>
        <span className={`status-badge ${isAuthorized ? 'ok' : 'warning'}`}>
          {isAuthorized ? 'Sessió vàlida' : 'Sessió antiga invalidada'}
        </span>
      </div>

      <DetailList
        entries={[
          ['Codi personal de demostració', credential.code],
          ['Versió de la credencial', credential.version],
          ['Versió de la sessió oberta', sessionVersion],
        ]}
      />

      <div className="actions">
        <button
          type="button"
          onClick={() => setCredential((current) => rotateStudentCredential(current))}
        >
          Regenera el codi
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setSessionVersion(credential.version)}
        >
          Inicia una sessió nova
        </button>
      </div>
      <p className="helper-text">
        Regenerar el codi augmenta la versió de la credencial i invalida les sessions anteriors.
      </p>
    </section>
  )
}

const tutorLoginErrorMessage = (error) => {
  const code = String(error?.code ?? '')
  if (code.includes('popup-closed-by-user')) return 'Has tancat la finestra de Google abans d’entrar.'
  if (code.includes('unauthorized-domain')) return 'Aquest domini encara no està autoritzat a Firebase Authentication.'
  if (code.includes('operation-not-allowed')) return 'Cal activar el proveïdor Google a Firebase Authentication.'
  return 'No hem pogut iniciar la sessió amb Google. Torna-ho a provar.'
}

const classCreationErrorMessage = (error) => {
  const code = String(error?.code ?? '')
  if (code.includes('invalid-argument')) return error.message
  if (code.includes('unauthenticated')) return 'La sessió de tutor ha caducat. Torna a entrar amb Google.'
  if (code.includes('permission-denied')) return 'Les regles de Firestore no han permès crear la classe.'
  return error?.message ?? 'No hem pogut crear la classe. Torna-ho a provar.'
}

const timestampMillis = (value) => {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function ClassManager({ tutorId, user, onLogout }) {
  const [classes, setClasses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [createdClass, setCreatedClass] = useState(null)
  const [syncState, setSyncState] = useState(SYNC_STATE.CACHED)
  const [invitations, setInvitations] = useState([])
  const [invitationBusy, setInvitationBusy] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')

  useEffect(() => observeTutorClasses(
    tutorId,
    (nextClasses, syncMetadata) => {
      setClasses(nextClasses)
      setSyncState(syncMetadata.state)
    },
    () => setStatus({ state: 'error', message: 'No hem pogut carregar les classes.' }),
  ), [tutorId])

  useEffect(() => observeMyCotutorInvitations({
    email: user?.email,
    onInvitations: setInvitations,
    onError: () => setStatus({ state: 'error', message: 'No hem pogut carregar les invitacions de cotutoria.' }),
  }), [user?.email])

  const respondToInvitation = async (invitation, accept) => {
    setInvitationBusy(true)
    try {
      await respondToCotutorInvitation({ invitation, accept })
      setStatus({ state: 'success', message: accept ? 'Cotutoria acceptada.' : 'Invitació rebutjada.' })
    } catch (error) {
      setStatus({ state: 'error', message: error?.message ?? 'No hem pogut respondre la invitació.' })
    } finally {
      setInvitationBusy(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Creant la classe i les sales…' })
    try {
      const result = await createTutorClass({ name, course })
      setCreatedClass(result)
      setName('')
      setCourse('')
      setShowForm(false)
      setStatus({ state: 'success', message: 'Classe creada correctament.' })
    } catch (error) {
      setStatus({ state: 'error', message: classCreationErrorMessage(error) })
    }
  }

  const availableClasses = [...classes]
    .filter((item) => item.active !== false)
    .sort((left, right) => timestampMillis(right.updatedAt ?? right.createdAt) - timestampMillis(left.updatedAt ?? left.createdAt))
  const classroom = availableClasses.find(({ id }) => id === selectedClassId) ?? availableClasses[0]

  if (classroom) {
    return <ClassWorkspace tutorId={tutorId} classroom={classroom} classes={classes} user={user} onLogout={onLogout} invitations={invitations} onRespondInvitation={respondToInvitation} invitationBusy={invitationBusy} onSelectClass={setSelectedClassId} />
  }

  return (
    <div className="class-manager">
      <CotutorInvitationInbox invitations={invitations} onRespond={respondToInvitation} busy={invitationBusy} />
      <div className="class-manager-heading">
        <div>
          <p className="eyebrow">Primer pas</p>
          <h3>Prepara el teu grup de tutoria</h3>
          <p className="helper-text">Només ho hauràs de fer una vegada.</p>
        </div>
        <button type="button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Cancel·la' : 'Configura el grup'}
        </button>
      </div>
      <p className={`class-sync-state ${syncState}`}>{SYNC_LABELS[syncState]}</p>

      {showForm && (
        <form className="class-creator" onSubmit={submit}>
          <label>
            Nom de la classe
            <input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tutoria 2n B"
            />
          </label>
          <label>
            Curs
            <input
              required
              minLength={2}
              maxLength={80}
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              placeholder="2n d’EASEO · 2026-2027"
            />
          </label>
          <button type="submit" disabled={status.state === 'loading'}>
            {status.state === 'loading' ? 'Creant…' : 'Crea la classe i les sales'}
          </button>
          <p className="helper-text">
            Es crearan automàticament les 13 sales d’assignatura precarregades.
          </p>
        </form>
      )}

      {createdClass && (
        <div className="created-class-result">
          <strong>{createdClass.name} · {createdClass.course}</strong>
          <span>Codi de classe: <code>{createdClass.classCode}</code></span>
          <p>Guarda aquest codi. El següent pas serà afegir els alumnes.</p>
        </div>
      )}

      {status.message && (
        <p className={`form-status ${status.state}`} role="status">{status.message}</p>
      )}
    </div>
  )
}

function TutorLoginPanel({ onUserChange = () => {} }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => observeCurrentUser((currentUser) => {
    const isGoogleTutor = currentUser?.providerData.some(
      (provider) => provider.providerId === 'google.com',
    )
    const tutor = isGoogleTutor ? currentUser : null
    setUser(tutor)
    onUserChange(tutor)
    setAuthReady(true)
  }), [onUserChange])

  const login = async () => {
    setStatus({ state: 'loading', message: 'Obrint Google…' })
    try {
      await signInTutorWithGoogle()
      setStatus({ state: 'success', message: 'Sessió de tutor iniciada correctament.' })
    } catch (error) {
      setStatus({ state: 'error', message: tutorLoginErrorMessage(error) })
    }
  }

  const loginForValidation = async () => {
    setStatus({ state: 'loading', message: 'Preparant el tutor de validació…' })
    try {
      await signInTestTutor()
      setStatus({ state: 'success', message: 'Tutor local de validació iniciat.' })
    } catch (error) {
      setStatus({ state: 'error', message: tutorLoginErrorMessage(error) })
    }
  }

  const logout = async () => {
    setStatus({ state: 'loading', message: 'Tancant la sessió…' })
    try {
      await signOutCurrentUser()
      setStatus({ state: 'idle', message: '' })
    } catch {
      setStatus({ state: 'error', message: 'No hem pogut tancar la sessió.' })
    }
  }

  if (user) {
    return <ClassManager tutorId={user.uid} user={user} onLogout={logout} />
  }

  return (
    <section className="panel tutor-login" aria-labelledby="tutor-login-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Espai del tutor</p>
          <h2 id="tutor-login-title">Accés del professorat</h2>
        </div>
      </div>

      {!authReady && <p className="helper-text">Comprovant la sessió…</p>}

      {authReady && !user && (
        <>
          <p>Entra amb el teu compte de Google per crear i gestionar la classe.</p>
          <button
            type="button"
            className="google-login-button"
            disabled={status.state === 'loading'}
            onClick={login}
          >
            <span aria-hidden="true" className="google-mark">G</span>
            Continua amb Google
          </button>
          {firebaseEmulatorsEnabled && (
            <button type="button" className="secondary" disabled={status.state === 'loading'} onClick={loginForValidation}>
              Entra com a tutor de validació
            </button>
          )}
        </>
      )}

      {status.message && (
        <p className={`form-status ${status.state}`} role="status">{status.message}</p>
      )}
    </section>
  )
}

const studentAccessErrorMessage = (error) => {
  const code = String(error?.code ?? '')
  if (
    code.includes('invalid-credential')
    || code.includes('user-not-found')
    || code.includes('wrong-password')
  ) {
    return 'Els codis no són correctes o ja no són vàlids.'
  }
  if (code.includes('operation-not-allowed')) {
    return 'Cal activar Correu/contrasenya a Firebase Authentication.'
  }
  return 'No hem pogut validar els codis. Comprova la connexió i torna-ho a provar.'
}

function StudentAccessForm({ onSessionChange }) {
  const [classCode, setClassCode] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [session, setSession] = useState(null)

  useEffect(() => observeCurrentUser((currentUser) => {
    const isStudent = currentUser?.providerData.some(
      (provider) => provider.providerId === 'password',
    )
    if (!isStudent) {
      setSession(null)
      onSessionChange(null)
      return
    }
    loadCurrentStudentContext(currentUser)
      .then((currentSession) => {
        setSession(currentSession)
        onSessionChange(currentSession)
      })
      .catch((error) => setStatus({ state: 'error', message: studentAccessErrorMessage(error) }))
  }), [onSessionChange])

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Comprovant els codis…' })

    try {
      const session = await exchangeStudentAccessCodes({ classCode, studentCode })
      setSession(session)
      onSessionChange(session)
      setStatus({
        state: 'success',
        message: `Accés validat per a l’alumne ${session.studentId}.`,
      })
    } catch (error) {
      setStatus({ state: 'error', message: studentAccessErrorMessage(error) })
    }
  }

  if (session) {
    return null
  }

  return (
    <section className="panel" aria-labelledby="student-access-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Accés real de l’alumne</p>
          <h2 id="student-access-title">Entra al teu espai</h2>
        </div>
      </div>

      <form className="access-form" onSubmit={submit}>
        <label>
          Codi de classe
          <input
            autoComplete="off"
            inputMode="text"
            maxLength={7}
            required
            value={classCode}
            onChange={(event) => setClassCode(event.target.value.toUpperCase())}
            placeholder="ABCDE"
          />
        </label>
        <label>
          Codi personal
          <input
            autoComplete="off"
            inputMode="text"
            maxLength={11}
            required
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
            placeholder="ABCD-2345"
          />
        </label>
        <button type="submit" disabled={status.state === 'loading'}>
          {status.state === 'loading' ? 'Comprovant…' : 'Entrar'}
        </button>
      </form>

      {status.message && (
        <p className={`form-status ${status.state}`} role="status">
          {status.message}
        </p>
      )}
      <p className="helper-text">
        Els codis es transformen en una credencial tècnica i només obren l’espai vinculat a aquest alumne.
      </p>
    </section>
  )
}

export default function App() {
  const [studentSession, setStudentSession] = useState(null)
  const [tutorUser, setTutorUser] = useState(null)

  if (studentSession) {
    return (
      <StudentOnboarding
        session={studentSession}
        onLogout={async () => {
          await signOutCurrentUser()
          setStudentSession(null)
        }}
      />
    )
  }

  if (tutorUser) {
    return (
      <main className="tutor-visual-shell">
        <TutorLoginPanel onUserChange={setTutorUser} />
      </main>
    )
  }

  return (
    <main className="app-shell public-app-shell">
      <header className="page-heading public-hero">
        <p className="eyebrow">Company d’estudi</p>
        <h1>Organitza’t amb calma, avança amb confiança</h1>
        <p>
          Planifica els deures, troba temps realista per estudiar i demana ajuda a la teva classe quan la necessitis.
        </p>
        <p className="firebase-status" role="status">
          Firebase:{' '}
          <strong>{isFirebaseConfigured ? `configurat · ${firebaseProjectId}` : 'pendent'}</strong>
        </p>
      </header>

      <div className="public-access-layout">
        <TutorLoginPanel onUserChange={setTutorUser} />
        <StudentAccessForm onSessionChange={setStudentSession} />
      </div>

      <OfflineStatusPanel />

      <section className="public-privacy-note" aria-labelledby="privacy-note-title">
        <p className="eyebrow">Privacitat clara</p>
        <h2 id="privacy-note-title">Un mateix espai de classe, una agenda personal per alumne</h2>
        <p>El tutor acompanya la planificació i veu evidències útils per orientar. Les notes personals i el nom de les extraescolars continuen sent privats.</p>
      </section>
    </main>
  )
}
