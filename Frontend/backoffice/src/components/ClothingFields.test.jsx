import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { clothingPayload, emptyClothing } from './ClothingFields'
import ClothingFields from './ClothingFields'

vi.mock('../hooks/useShopOptions', () => ({
  useShopOptions: () => ({
    options: (key) => (key === 'entretien' ? ['Lavage 30°'] : ['Coton']),
    customFor: () => [],
    addOption: vi.fn(),
  }),
}))

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('clothingPayload', () => {
  it('drops blanks and an invalid hex', () => {
    expect(clothingPayload({ ...emptyClothing, tissu: '  Lin ', couleurHex: 'bleu', tailles: 'S,M' })).toEqual({
      tissu: 'Lin',
      couleur: null,
      couleurHex: null,
      coupe: null,
      col: null,
      manches: null,
      entretien: null,
      tailles: 'S,M',
      saison: null,
      genre: null,
    })
  })

  it('keeps a real hex colour', () => {
    expect(clothingPayload({ ...emptyClothing, couleur: 'Noir', couleurHex: '#111111' }).couleurHex).toBe('#111111')
  })
})

describe('ClothingFields', () => {
  it('shows the clothing sections', () => {
    render(<ClothingFields value={emptyClothing} onChange={() => {}} />)
    expect(screen.getByText('Tailles disponibles')).toBeInTheDocument()
    expect(screen.getByText('Tissu')).toBeInTheDocument()
    expect(screen.getByText('Lavage 30°')).toBeInTheDocument()
  })
})
