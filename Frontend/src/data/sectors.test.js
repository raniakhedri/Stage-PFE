import { describe, expect, it } from 'vitest'
import { attributeValue, productDetail, sectorOf, sizeLabelOf } from './sectors'
import { needsSizeChoice, sizeOptions } from '../utils/cartLines'

describe('storefront sectors', () => {
  it('names what the customer chooses after the product type', () => {
    const ring = { attributes: JSON.stringify({ type: 'bague' }) }
    const shoes = { attributes: JSON.stringify({ type: 'chaussures' }) }
    expect(sizeLabelOf('JEWELRY', ring)).toBe('Tour de doigt')
    expect(sizeLabelOf('SPORTS', shoes)).toBe('Pointure')
    expect(sizeLabelOf('SPORTS', {})).toBe(sectorOf('SPORTS').sizeLabel)
  })

  it('shows the product type label, not its id', () => {
    expect(attributeValue('SPORTS', 'type', 'machine')).toBe('Machine fitness')
    expect(attributeValue('SPORTS', 'matiere', 'Mesh')).toBe('Mesh')
  })

  it('unknown sectors fall back to cosmetics', () => {
    expect(sectorOf('NOPE').id).toBe('COSMETICS')
  })

  it('builds a short card line from the characteristics', () => {
    const product = { couleur: 'Noir', attributes: { discipline: 'Trail', niveau: 'Confirmé' } }
    expect(productDetail('SPORTS', product)).toBe('Trail · Confirmé · Noir')
  })
})

describe('cart sizes', () => {
  it('asks for a size only when there is a real choice', () => {
    expect(needsSizeChoice({ tailles: ['S', 'M'] }, true)).toBe(true)
    expect(needsSizeChoice({ tailles: ['Taille unique'] }, true)).toBe(false)
    expect(sizeOptions({ tailles: ['S'] }, false)).toEqual([])
  })
})
