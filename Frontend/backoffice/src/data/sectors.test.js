import { describe, expect, it } from 'vitest'
import { SECTORS, attributesPayload, fieldsOf, optionKeysFor, sectorOf, sizesOf, typeOf } from './sectors'
import { OPTION_LABELS, PRESETS } from './catalogOptions'

describe('backoffice sectors', () => {
  it('never guesses an unknown sector', () => {
    expect(sectorOf('COSMETICS').id).toBe('COSMETICS')
    expect(sectorOf(undefined)).toBeNull()
    expect(sectorOf('NOPE')).toBeNull()
  })

  it('each product type has its own sizes and fields', () => {
    const jewelry = sectorOf('JEWELRY')
    expect(sizesOf(jewelry, 'bague').label).toBe('Tour de doigt')
    expect(sizesOf(jewelry, 'montre')).toBeNull()
    expect(fieldsOf(jewelry, 'montre').map((f) => f.key)).toContain('mouvement')
    expect(typeOf(jewelry, 'unknown').id).toBe('bague')
  })

  it('fields are never listed twice', () => {
    SECTORS.filter((s) => s.types).forEach((sector) => sector.types.forEach((type) => {
      const keys = fieldsOf(sector, type.id).map((f) => f.key)
      expect(new Set(keys).size).toBe(keys.length)
    }))
  })

  it('switching type drops the fields of the previous type', () => {
    const sports = sectorOf('SPORTS')
    const payload = JSON.parse(attributesPayload({ type: 'machine', machine: 'Rameur', terrain: 'Trail', discipline: 'Running' }, sports))
    expect(payload).toEqual({ type: 'machine', machine: 'Rameur', discipline: 'Running' })
    expect(attributesPayload({ type: '' }, sports)).toBeNull()
  })

  it('every option list used by a sheet has preset values and a label', () => {
    SECTORS.forEach((sector) => {
      optionKeysFor(sector.id).forEach((key) => {
        expect(OPTION_LABELS[key], `${sector.id}: label of ${key}`).toBeTruthy()
        expect(PRESETS[key]?.length, `${sector.id}: presets of ${key}`).toBeGreaterThan(0)
      })
    })
  })
})
