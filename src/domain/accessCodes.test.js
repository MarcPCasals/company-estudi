import { describe, expect, it } from 'vitest'
import {
  createClassCode,
  createStudentCode,
  createStudentCredential,
  isSessionAuthorized,
  isValidAccessCode,
  normalizeAccessCode,
  revokeStudentCredential,
  rotateStudentCredential,
} from './accessCodes.js'

const bytes = (...values) => () => Uint8Array.from(values)

describe('codis d’accés', () => {
  it('normalitza espais, guions i minúscules', () => {
    expect(normalizeAccessCode(' ab-c 23 ')).toBe('ABC23')
  })

  it('genera codis de classe i alumne amb llargades diferents', () => {
    expect(createClassCode(bytes(0, 1, 2, 3, 4))).toHaveLength(5)
    expect(createStudentCode(bytes(0, 1, 2, 3, 4, 5, 6, 7))).toHaveLength(8)
  })

  it('valida només caràcters no ambigus', () => {
    expect(isValidAccessCode('ABCD-2345', 8)).toBe(true)
    expect(isValidAccessCode('ABCI2345', 8)).toBe(false)
  })

  it('invalida sessions anteriors quan es regenera el codi', () => {
    const credential = createStudentCredential({
      studentId: 'student-1',
      classId: 'class-1',
      randomBytes: bytes(0, 1, 2, 3, 4, 5, 6, 7),
      now: () => '2026-07-12T10:00:00.000Z',
    })
    const session = {
      studentId: 'student-1',
      classId: 'class-1',
      credentialVersion: 1,
    }

    expect(isSessionAuthorized({ session, credential })).toBe(true)

    const rotated = rotateStudentCredential(credential, {
      randomBytes: bytes(8, 9, 10, 11, 12, 13, 14, 15),
      now: () => '2026-07-12T11:00:00.000Z',
    })

    expect(rotated.version).toBe(2)
    expect(rotated.code).not.toBe(credential.code)
    expect(isSessionAuthorized({ session, credential: rotated })).toBe(false)
  })

  it('invalida totes les sessions quan es revoca la credencial', () => {
    const credential = createStudentCredential({
      studentId: 'student-1',
      classId: 'class-1',
      randomBytes: bytes(0, 1, 2, 3, 4, 5, 6, 7),
      now: () => '2026-07-12T10:00:00.000Z',
    })
    const session = {
      studentId: 'student-1',
      classId: 'class-1',
      credentialVersion: 1,
    }

    const revoked = revokeStudentCredential(
      credential,
      () => '2026-07-12T11:00:00.000Z',
    )

    expect(revoked.active).toBe(false)
    expect(revoked.version).toBe(2)
    expect(isSessionAuthorized({ session, credential: revoked })).toBe(false)
  })
})
