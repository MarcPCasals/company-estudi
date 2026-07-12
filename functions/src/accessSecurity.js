import { createHmac, timingSafeEqual } from 'node:crypto'

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
