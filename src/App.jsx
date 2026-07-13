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
  enableTrustedDevicePersistence,
  getOfflinePersistencePreference,
  observeConnectivity,
  synchronizePendingWrites,
} from './services/offlineService.js'
import ClassWorkspace from './components/ClassWorkspace.jsx'
import StudentOnboarding from './components/StudentOnboarding.jsx'

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
  const [persistent, setPersistent] = useState(getOfflinePersistencePreference())
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => observeConnectivity(setOnline), [])

  const enable = () => {
    setStatus({ state: 'loading', message: 'Activant la còpia local…' })
    try {
      enableTrustedDevicePersistence()
      setPersistent(true)
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  const disable = async () => {
    setStatus({ state: 'loading', message: 'Comprovant i esborrant la còpia local…' })
    try {
      await clearOfflineDataAndDisable()
      setPersistent(false)
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
        <h2 id="offline-title">Treball sense connexió</h2>
        <p>
          {persistent
            ? 'Aquest dispositiu conserva una còpia local i sincronitza els canvis quan torna la connexió.'
            : 'La còpia local permanent està desactivada. Activa-la només en un dispositiu propi o assignat.'}
        </p>
      </div>
      <span className={`sync-badge ${online ? 'synced' : 'offline'}`} role="status">
        {online ? 'Amb connexió' : 'Sense connexió'}
      </span>
      <div className="offline-actions">
        {!persistent && <button type="button" onClick={enable}>Activa en aquest dispositiu</button>}
        {persistent && (
          <>
            <button type="button" onClick={synchronize} disabled={!online || status.state === 'loading'}>
              Comprova la sincronització
            </button>
            <button type="button" className="secondary" onClick={disable} disabled={status.state === 'loading'}>
              Esborra la còpia local
            </button>
          </>
        )}
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

function ClassManager({ tutorId }) {
  const [classes, setClasses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [createdClass, setCreatedClass] = useState(null)
  const [syncState, setSyncState] = useState(SYNC_STATE.CACHED)
  const [selectedClassId, setSelectedClassId] = useState('')

  useEffect(() => observeTutorClasses(
    tutorId,
    (nextClasses, syncMetadata) => {
      setClasses(nextClasses)
      setSyncState(syncMetadata.state)
    },
    () => setStatus({ state: 'error', message: 'No hem pogut carregar les classes.' }),
  ), [tutorId])

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Creant la classe i les sales…' })
    try {
      const result = await createTutorClass({ name, course })
      setCreatedClass(result)
      setName('')
      setCourse('')
      setShowForm(false)
      setSelectedClassId(result.classId)
      setStatus({ state: 'success', message: 'Classe creada correctament.' })
    } catch (error) {
      setStatus({ state: 'error', message: classCreationErrorMessage(error) })
    }
  }

  return (
    <div className="class-manager">
      <div className="class-manager-heading">
        <div>
          <h3>Les meves classes</h3>
          <p className="helper-text">
            {classes.length === 0 ? 'Encara no has creat cap classe.' : `${classes.length} classes creades.`}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Cancel·la' : 'Crea una classe'}
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

      {classes.length > 0 && (
        <ul className="class-list">
          {classes.map((classroom) => (
            <li key={classroom.id} className={selectedClassId === classroom.id ? 'selected' : ''}>
              <div>
                <strong>{classroom.name}</strong>
                <span>{classroom.course}</span>
              </div>
              <button type="button" className="secondary" onClick={() => setSelectedClassId(classroom.id)}>
                Gestiona
              </button>
            </li>
          ))}
        </ul>
      )}

      {classes.find((classroom) => classroom.id === selectedClassId) && (
        <ClassWorkspace
          tutorId={tutorId}
          classroom={classes.find((classroom) => classroom.id === selectedClassId)}
          classes={classes}
        />
      )}

      {status.message && (
        <p className={`form-status ${status.state}`} role="status">{status.message}</p>
      )}
    </div>
  )
}

function TutorLoginPanel() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => observeCurrentUser((currentUser) => {
    const isGoogleTutor = currentUser?.providerData.some(
      (provider) => provider.providerId === 'google.com',
    )
    setUser(isGoogleTutor ? currentUser : null)
    setAuthReady(true)
  }), [])

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

  return (
    <section className="panel tutor-login" aria-labelledby="tutor-login-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Espai del tutor</p>
          <h2 id="tutor-login-title">Accés del professorat</h2>
        </div>
        {user && <span className="status-badge ok">Sessió iniciada</span>}
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

      {user && (
        <>
          <div className="signed-in-user">
            {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
            <div>
              <strong>{user.displayName ?? 'Tutor'}</strong>
              <span>{user.email}</span>
            </div>
            <button type="button" className="secondary" onClick={logout}>Tanca la sessió</button>
          </div>
          <ClassManager tutorId={user.uid} />
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

function StudentAccessForm() {
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
      return
    }
    loadCurrentStudentContext(currentUser)
      .then(setSession)
      .catch((error) => setStatus({ state: 'error', message: studentAccessErrorMessage(error) }))
  }), [])

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Comprovant els codis…' })

    try {
      const session = await exchangeStudentAccessCodes({ classCode, studentCode })
      setSession(session)
      setStatus({
        state: 'success',
        message: `Accés validat per a l’alumne ${session.studentId}.`,
      })
    } catch (error) {
      setStatus({ state: 'error', message: studentAccessErrorMessage(error) })
    }
  }

  if (session) {
    return <StudentOnboarding session={session} onLogout={signOutCurrentUser} />
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
  const [mode, setMode] = useState('student')

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">Company d’estudi</p>
        <h1>Base funcional d’accés i privacitat</h1>
        <p>
          Aquesta pantalla valida què veu cada rol. No és el disseny visual definitiu de l’aplicació.
        </p>
        <p className="firebase-status" role="status">
          Firebase:{' '}
          <strong>{isFirebaseConfigured ? `configurat · ${firebaseProjectId}` : 'pendent'}</strong>
        </p>
      </header>

      <OfflineStatusPanel />

      <nav className="mode-switcher" aria-label="Canvia la vista de privacitat">
        {[
          ['student', 'Alumne'],
          ['tutor', 'Tutor'],
          ['community', 'Comunitat'],
        ].map(([value, label]) => (
          <button
            type="button"
            aria-pressed={mode === value}
            className={mode === value ? 'active' : ''}
            key={value}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="layout">
        <ProfilePreview mode={mode} />
        <div className="panel-stack">
          <TutorLoginPanel />
          <StudentAccessForm />
          <CredentialDemo />
        </div>
      </div>
    </main>
  )
}
