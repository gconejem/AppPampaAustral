import assert from 'node:assert/strict'
import test from 'node:test'

import { createObraLookup, resolveObraId } from './lab-history-obra-map.mjs'

test('resuelve la muestra 194221 de la obra 9594 al ID interno 9367', () => {
  const lookup = createObraLookup([{ obraId: 9367, numeroObra: '9594' }])

  assert.deepEqual(resolveObraId('9594', lookup), { status: 'found', obraId: 9367 })
})

test('no confunde numeroObra con un ID interno coincidente', () => {
  const lookup = createObraLookup([{ obraId: 9594, numeroObra: '1234' }])

  assert.deepEqual(resolveObraId('9594', lookup), { status: 'missing' })
})

test('rechaza numeros de obra ambiguos', () => {
  const lookup = createObraLookup([
    { obraId: 9367, numeroObra: '9594' },
    { obraId: 12000, numeroObra: '9594' }
  ])

  assert.deepEqual(resolveObraId('9594', lookup), { status: 'ambiguous' })
})
