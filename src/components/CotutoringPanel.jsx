import { useEffect, useState } from 'react'
import {
  inviteCotutor,
  leaveSharedClass,
  observeClassCotutorInvitations,
  removeCotutor,
  revokeCotutorInvitation,
  transferClassOwnership,
} from '../services/cotutoringService.js'
import { isResponsibleTutor, teacherRoleLabel } from '../domain/cotutoring.js'

const errorMessage = (error) => error?.message ?? 'No s’ha pogut completar l’operació.'

export function CotutorInvitationInbox({ invitations, onRespond, busy }) {
  if (!invitations.length) return null
  return (
    <section className="cotutor-inbox" aria-labelledby="cotutor-inbox-title">
      <p className="eyebrow">Accés compartit</p>
      <h3 id="cotutor-inbox-title">Invitacions de cotutoria</h3>
      {invitations.map((invitation) => (
        <article key={invitation.id} className="cotutor-card">
          <div>
            <strong>{invitation.className}</strong>
            <span>{invitation.classCourse} · Tutor responsable: {invitation.ownerDisplayName}</span>
            <p>Compartiràs el seguiment pedagògic de la classe. La gestió de codis, alumnes i propietat continuarà reservada al tutor responsable.</p>
          </div>
          <div className="cotutor-actions">
            <button type="button" disabled={busy} onClick={() => onRespond(invitation, true)}>Accepta</button>
            <button type="button" className="secondary" disabled={busy} onClick={() => onRespond(invitation, false)}>Rebutja</button>
          </div>
        </article>
      ))}
    </section>
  )
}

export default function CotutoringPanel({ classroom, tutorId, user, onStatus }) {
  const [email, setEmail] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [busy, setBusy] = useState(false)
  const owner = isResponsibleTutor(classroom, tutorId)

  useEffect(() => {
    if (!owner) {
      setInvitations([])
      return () => {}
    }
    return observeClassCotutorInvitations({
      classId: classroom.id,
      onInvitations: setInvitations,
      onError: (error) => onStatus('error', errorMessage(error)),
    })
  }, [classroom.id, onStatus, owner])

  const pendingInvitation = invitations.find(({ effectiveStatus }) => effectiveStatus === 'pending')
  const act = async (message, action) => {
    setBusy(true)
    try {
      await action()
      onStatus('success', message)
    } catch (error) {
      onStatus('error', errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const submitInvitation = async (event) => {
    event.preventDefault()
    if (!confirming) {
      setConfirming(true)
      return
    }
    await act('Invitació enviada. No tindrà accés fins que l’accepti.', () => inviteCotutor({ classroom, email }))
    setEmail('')
    setConfirming(false)
  }

  return (
    <section className="cotutoring-panel" aria-labelledby="cotutoring-title">
      <p className="eyebrow">Cotutoria</p>
      <h4 id="cotutoring-title">Accés docent compartit</h4>
      <p className="role-badge">El teu rol: <strong>{teacherRoleLabel(classroom, tutorId)}</strong></p>
      <p className="helper-text">Tutor responsable: {classroom.ownerDisplayName ?? (owner ? user?.displayName : 'Docent responsable')}</p>
      {classroom.cotutorId && <p>Cotutor actual: <strong>{classroom.cotutorDisplayName ?? 'Docent convidat'}</strong></p>}

      {owner ? (
        <>
          {!classroom.cotutorId && !pendingInvitation && (
            <form onSubmit={submitInvitation} className="cotutor-invite-form">
              <label>Correu del cotutor<input type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setConfirming(false) }} placeholder="docent@educand.ad" /></label>
              {confirming && <p className="confirmation-note">Confirma que vols convidar <strong>{email.trim()}</strong>. Podrà veure i modificar les dades pedagògiques compartides.</p>}
              <button type="submit" disabled={busy}>{confirming ? 'Confirma i envia' : 'Convida un cotutor'}</button>
            </form>
          )}
          {pendingInvitation && (
            <div className="cotutor-card">
              <span>Invitació pendent per a <strong>{pendingInvitation.inviteeEmailNormalized}</strong></span>
              <button type="button" className="secondary" disabled={busy} onClick={() => act('Invitació revocada.', () => revokeCotutorInvitation(pendingInvitation.id))}>Revoca</button>
            </div>
          )}
          {classroom.cotutorId && (
            <div className="cotutor-danger-actions">
              <button type="button" className="secondary" disabled={busy} onClick={() => globalThis.confirm('Vols retirar immediatament l’accés del cotutor?') && act('Accés del cotutor retirat.', () => removeCotutor({ classroom }))}>Retira l’accés</button>
              <button type="button" className="secondary" disabled={busy} onClick={() => globalThis.confirm('La persona cotutora passarà a ser responsable i tu quedaràs com a cotutor. Ho confirmes?') && act('Propietat transferida.', () => transferClassOwnership({ classroom }))}>Transfereix la responsabilitat</button>
            </div>
          )}
        </>
      ) : (
        <button type="button" className="secondary" disabled={busy} onClick={() => globalThis.confirm('Vols deixar aquesta classe compartida? Les dades es conservaran.') && act('Has deixat la classe compartida.', () => leaveSharedClass({ classroom }))}>Deixa la classe compartida</button>
      )}
    </section>
  )
}
