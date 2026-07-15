export const COTUTOR_INVITATION_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
})

export const COTUTOR_INVITATION_DAYS = 7

export const normalizeTeacherEmail = (email) =>
  String(email ?? '').trim().toLocaleLowerCase('en-US')

export const validateCotutorEmail = ({ email, currentEmail = '' }) => {
  const normalizedEmail = normalizeTeacherEmail(email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Escriu un correu electrònic vàlid.')
  }
  if (normalizedEmail === normalizeTeacherEmail(currentEmail)) {
    throw new Error('No et pots convidar a tu mateix com a cotutor.')
  }
  return normalizedEmail
}

export const invitationHasExpired = (invitation, now = Date.now()) => {
  const expiresAt = invitation?.expiresAt?.toMillis?.()
    ?? invitation?.expiresAt?.getTime?.()
    ?? Number(invitation?.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt <= now
}

export const effectiveInvitationStatus = (invitation, now = Date.now()) =>
  invitation?.status === COTUTOR_INVITATION_STATUS.PENDING
    && invitationHasExpired(invitation, now)
    ? COTUTOR_INVITATION_STATUS.EXPIRED
    : invitation?.status

export const isResponsibleTutor = (classroom, tutorId) =>
  classroom?.tutorId === tutorId

export const isAcceptedCotutor = (classroom, tutorId) =>
  classroom?.teacherIds?.includes(tutorId) && classroom?.tutorId !== tutorId

export const teacherRoleLabel = (classroom, tutorId) =>
  isResponsibleTutor(classroom, tutorId) ? 'Tutor responsable' : 'Cotutor'
