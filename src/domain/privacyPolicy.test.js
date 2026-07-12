import { describe, expect, it } from 'vitest'
import { canEditResource, canViewResource, ROLES, VISIBILITY } from './privacyPolicy.js'

const owner = { role: ROLES.STUDENT, studentId: 'student-1', classIds: ['class-1'] }
const classmate = { role: ROLES.STUDENT, studentId: 'student-2', classIds: ['class-1'] }
const outsider = { role: ROLES.STUDENT, studentId: 'student-3', classIds: ['class-2'] }
const tutor = { role: ROLES.TUTOR, classIds: ['class-1'] }

const resource = (visibility, extra = {}) => ({
  visibility,
  ownerStudentId: 'student-1',
  classId: 'class-1',
  createdByRole: ROLES.STUDENT,
  ...extra,
})

describe('política de privacitat', () => {
  it('manté els recursos personals fora de la vista del tutor i companys', () => {
    const personal = resource(VISIBILITY.PERSONAL)
    expect(canViewResource({ viewer: owner, resource: personal })).toBe(true)
    expect(canViewResource({ viewer: tutor, resource: personal })).toBe(false)
    expect(canViewResource({ viewer: classmate, resource: personal })).toBe(false)
  })

  it('comparteix recursos tutorials només amb propietari i tutor de la classe', () => {
    const tutorial = resource(VISIBILITY.TUTORIAL)
    expect(canViewResource({ viewer: owner, resource: tutorial })).toBe(true)
    expect(canViewResource({ viewer: tutor, resource: tutorial })).toBe(true)
    expect(canViewResource({ viewer: classmate, resource: tutorial })).toBe(false)
  })

  it('limita els recursos comunitaris als membres de la classe', () => {
    const community = resource(VISIBILITY.COMMUNITY)
    expect(canViewResource({ viewer: classmate, resource: community })).toBe(true)
    expect(canViewResource({ viewer: tutor, resource: community })).toBe(true)
    expect(canViewResource({ viewer: outsider, resource: community })).toBe(false)
  })

  it('reserva els agregats per al tutor de la classe', () => {
    const aggregated = resource(VISIBILITY.AGGREGATED)
    expect(canViewResource({ viewer: tutor, resource: aggregated })).toBe(true)
    expect(canViewResource({ viewer: owner, resource: aggregated })).toBe(false)
  })

  it('impedeix que el tutor editi contingut creat per l’alumne', () => {
    const tutorial = resource(VISIBILITY.TUTORIAL)
    expect(canEditResource({ viewer: owner, resource: tutorial })).toBe(true)
    expect(canEditResource({ viewer: tutor, resource: tutorial })).toBe(false)
  })

  it('impedeix que l’alumne editi feedback creat pel tutor', () => {
    const tutorFeedback = resource(VISIBILITY.TUTORIAL, {
      createdByRole: ROLES.TUTOR,
    })
    expect(canEditResource({ viewer: owner, resource: tutorFeedback })).toBe(false)
    expect(canEditResource({ viewer: tutor, resource: tutorFeedback })).toBe(true)
  })
})
