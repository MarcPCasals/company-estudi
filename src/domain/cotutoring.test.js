import { describe, expect, it } from 'vitest'
import {
  effectiveInvitationStatus,
  isAcceptedCotutor,
  normalizeTeacherEmail,
  teacherRoleLabel,
  validateCotutorEmail,
} from './cotutoring.js'

describe('cotutoria', () => {
  it('normalitza i valida el correu convidat', () => {
    expect(normalizeTeacherEmail('  DOCENT@Educand.AD ')).toBe('docent@educand.ad')
    expect(validateCotutorEmail({ email: 'DOCENT@educand.ad', currentEmail: 'altre@educand.ad' }))
      .toBe('docent@educand.ad')
    expect(() => validateCotutorEmail({ email: 'docent@educand.ad', currentEmail: 'DOCENT@EDUCAND.AD' }))
      .toThrow('tu mateix')
  })

  it('calcula la caducitat sense modificar la invitació', () => {
    expect(effectiveInvitationStatus({ status: 'pending', expiresAt: 99 }, 100)).toBe('expired')
    expect(effectiveInvitationStatus({ status: 'accepted', expiresAt: 99 }, 100)).toBe('accepted')
  })

  it('distingeix tutor responsable i cotutor', () => {
    const classroom = { tutorId: 'owner', teacherIds: ['owner', 'co'] }
    expect(teacherRoleLabel(classroom, 'owner')).toBe('Tutor responsable')
    expect(teacherRoleLabel(classroom, 'co')).toBe('Cotutor')
    expect(isAcceptedCotutor(classroom, 'co')).toBe(true)
  })
})
