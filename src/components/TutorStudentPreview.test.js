import { describe, expect, it } from 'vitest'
import { TUTOR_STUDENT_PREVIEW_VIEW_IDS } from './TutorStudentPreview.jsx'

describe('navegació de la previsualització de l’alumne', () => {
  it('inclou totes les destinacions disponibles des de la pantalla inicial', () => {
    expect(TUTOR_STUDENT_PREVIEW_VIEW_IDS).toEqual(expect.arrayContaining([
      'home',
      'today',
      'tasks',
      'community',
      'progress',
      'study',
    ]))
  })
})
