import {
  isValidAccessCode,
  normalizeAccessCode,
} from './accessCodes.js'

const bytesToHex = (bytes) =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')

export const deriveStudentCredentials = async ({
  classCode,
  studentCode,
  credentialVersion = 1,
}) => {
  const normalizedClassCode = normalizeAccessCode(classCode)
  const normalizedStudentCode = normalizeAccessCode(studentCode)

  if (!isValidAccessCode(normalizedClassCode, 5)) {
    throw new Error('El codi de classe no és vàlid.')
  }
  if (!isValidAccessCode(normalizedStudentCode, 8)) {
    throw new Error('El codi personal no és vàlid.')
  }
  if (!Number.isInteger(credentialVersion) || credentialVersion < 1) {
    throw new Error('La versió de la credencial no és vàlida.')
  }

  const source = [
    'company-estudi',
    'student-access',
    credentialVersion,
    normalizedClassCode,
    normalizedStudentCode,
  ].join(':')
  const digest = bytesToHex(await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source),
  ))

  return {
    email: `student.${digest.slice(0, 40)}@access.company-estudi.invalid`,
    password: `CE!${digest}a9`,
    normalizedClassCode,
    normalizedStudentCode,
    credentialVersion,
  }
}
