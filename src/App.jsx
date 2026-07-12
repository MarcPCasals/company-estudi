import { useMemo, useState } from 'react'
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
  isFirebaseConfigured,
} from './lib/firebase.js'

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
        <CredentialDemo />
      </div>
    </main>
  )
}
