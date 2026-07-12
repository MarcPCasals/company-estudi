import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const normalizeAccessCode = (value = '') =>
  String(value).trim().toUpperCase().replace(/[\s-]+/g, '')

export const isValidAccessCode = (value, expectedLength) => {
  const normalized = normalizeAccessCode(value)
  return normalized.length === expectedLength
    && [...normalized].every((character) => CODE_ALPHABET.includes(character))
}

export const credentialDigest = ({ kind, code, pepper }) =>
  createHmac('sha256', pepper)
    .update(`${kind}:${normalizeAccessCode(code)}`)
    .digest('hex')

export const constantTimeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))

  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer)
}

export const createAccessCode = (length, nextIndex = (max) => randomInt(max)) => {
  if (!Number.isInteger(length) || length < 4) {
    throw new Error('La llargada del codi ha de ser de quatre caràcters o més.')
  }

  return Array.from(
    { length },
    () => CODE_ALPHABET[nextIndex(CODE_ALPHABET.length)],
  ).join('')
}
