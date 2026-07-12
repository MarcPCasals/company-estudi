import test from 'node:test'
import assert from 'node:assert/strict'
import {
  constantTimeEqual,
  credentialDigest,
  isValidAccessCode,
  normalizeAccessCode,
} from './accessSecurity.js'

test('normalitza codis abans de validar-los', () => {
  assert.equal(normalizeAccessCode(' ab-c 23 '), 'ABC23')
  assert.equal(isValidAccessCode('abcd-2', 5), true)
  assert.equal(isValidAccessCode('ABCI2', 5), false)
})

test('genera resums estables però separats segons el tipus', () => {
  const input = { code: 'ABCDE', pepper: 'secret-de-prova' }
  const classDigest = credentialDigest({ ...input, kind: 'class' })
  const repeatedDigest = credentialDigest({ ...input, kind: 'class' })
  const studentDigest = credentialDigest({ ...input, kind: 'student:class-1' })

  assert.equal(classDigest, repeatedDigest)
  assert.notEqual(classDigest, studentDigest)
  assert.equal(constantTimeEqual(classDigest, repeatedDigest), true)
  assert.equal(constantTimeEqual(classDigest, studentDigest), false)
})
