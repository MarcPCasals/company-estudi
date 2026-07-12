const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const secureRandomBytes = (length) => {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

export const normalizeAccessCode = (value = '') =>
  value.trim().toUpperCase().replace(/[\s-]+/g, '')

export const createAccessCode = ({
  length,
  randomBytes = secureRandomBytes,
} = {}) => {
  if (!Number.isInteger(length) || length < 4) {
    throw new Error('La llargada del codi ha de ser un enter de 4 o més caràcters.')
  }

  const bytes = randomBytes(length)

  if (!(bytes instanceof Uint8Array) || bytes.length < length) {
    throw new Error('El generador aleatori no ha retornat prou bytes.')
  }

  return Array.from(
    bytes.slice(0, length),
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join('')
}

export const createClassCode = (randomBytes) =>
  createAccessCode({ length: 5, randomBytes })

export const createStudentCode = (randomBytes) =>
  createAccessCode({ length: 8, randomBytes })

export const isValidAccessCode = (value, expectedLength) => {
  const normalized = normalizeAccessCode(value)
  if (normalized.length !== expectedLength) return false
  return [...normalized].every((character) => CODE_ALPHABET.includes(character))
}

export const createStudentCredential = ({
  studentId,
  classId,
  randomBytes,
  now = () => new Date().toISOString(),
}) => ({
  studentId,
  classId,
  code: createStudentCode(randomBytes),
  version: 1,
  active: true,
  updatedAt: now(),
})

export const rotateStudentCredential = (
  credential,
  { randomBytes, now = () => new Date().toISOString() } = {},
) => ({
  ...credential,
  code: createStudentCode(randomBytes),
  version: credential.version + 1,
  active: true,
  updatedAt: now(),
})

export const revokeStudentCredential = (
  credential,
  now = () => new Date().toISOString(),
) => ({
  ...credential,
  active: false,
  version: credential.version + 1,
  updatedAt: now(),
})

export const isSessionAuthorized = ({ session, credential }) =>
  Boolean(
    credential.active &&
      session.studentId === credential.studentId &&
      session.classId === credential.classId &&
      session.credentialVersion === credential.version,
  )

