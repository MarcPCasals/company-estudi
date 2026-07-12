import { describe, expect, it } from 'vitest'
import { deriveStudentCredentials } from './technicalCredentials.js'

describe('credencials tècniques de l’alumne', () => {
  it('deriva les mateixes credencials a partir dels mateixos codis', async () => {
    const first = await deriveStudentCredentials({
      classCode: 'abc-de',
      studentCode: 'abcd-2345',
    })
    const second = await deriveStudentCredentials({
      classCode: 'ABCDE',
      studentCode: 'ABCD2345',
    })

    expect(first).toEqual(second)
    expect(first.email).not.toContain('abcde')
    expect(first.email).not.toContain('abcd2345')
    expect(first.password).toHaveLength(69)
  })

  it('canvia les credencials quan se’n regenera la versió', async () => {
    const first = await deriveStudentCredentials({
      classCode: 'ABCDE',
      studentCode: 'ABCD2345',
      credentialVersion: 1,
    })
    const rotated = await deriveStudentCredentials({
      classCode: 'ABCDE',
      studentCode: 'ABCD2345',
      credentialVersion: 2,
    })

    expect(rotated.email).not.toBe(first.email)
    expect(rotated.password).not.toBe(first.password)
  })

  it('rebutja codis amb format incorrecte', async () => {
    await expect(deriveStudentCredentials({
      classCode: 'CURT',
      studentCode: 'ABCD2345',
    })).rejects.toThrow('codi de classe')
  })
})
