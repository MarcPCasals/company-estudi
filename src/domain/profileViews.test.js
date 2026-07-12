import { describe, expect, it } from 'vitest'
import { demoProfile } from '../data/demoProfile.js'
import {
  getCommunityProfileView,
  getStudentProfileView,
  getTutorProfileView,
} from './profileViews.js'

describe('projeccions de perfil', () => {
  it('dona a l’alumne la seva informació completa', () => {
    const view = getStudentProfileView(demoProfile)
    expect(view.privateNotes).toBeDefined()
    expect(view.gamification.xp).toBeDefined()
    expect(view.weeklyReview.draft).toBeDefined()
  })

  it('no filtra notes, hores exactes, esborranys ni XP al tutor', () => {
    const view = getTutorProfileView(demoProfile)
    expect(view.privateNotes).toBeUndefined()
    expect(view.gamification).toBeUndefined()
    expect(view.weeklyReview).toEqual(demoProfile.weeklyReview.submitted)
    expect(view.academicTasks[0].privateNote).toBeUndefined()
    expect(view.studySessions[0].exactStart).toBeUndefined()
    expect(view.personalAvailability[0].label).toBe('Ocupat')
  })

  it('limita la vista comunitària a identitat visible i avatar compartit', () => {
    expect(getCommunityProfileView(demoProfile)).toEqual({
      studentId: demoProfile.studentId,
      classId: demoProfile.classId,
      displayName: demoProfile.displayName,
      avatar: demoProfile.gamification.sharedAvatar,
    })
  })
})

