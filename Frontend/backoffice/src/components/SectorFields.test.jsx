import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SECTORS } from '../data/sectors'
import SectorFields, { emptySector, sectorPayload } from './SectorFields'

vi.mock('../hooks/useShopOptions', () => ({
  useShopOptions: () => ({
    options: () => ['Trail'],
    customFor: () => [],
    addOption: vi.fn(),
  }),
}))

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const sports = SECTORS.find((sector) => sector.id === 'SPORTS')

describe('sector helpers', () => {
  it('preselects the first product type', () => {
    expect(emptySector(sports).attributes.type).toBe(sports.types[0].id)
  })

  it('drops sizes when the type has none', () => {
    const value = { tailles: 'S', couleur: 'Noir', couleurHex: 'nope', attributes: { type: sports.types[0].id } }
    const payload = sectorPayload(value, sports)
    expect(payload.couleur).toBe('Noir')
    expect(payload.couleurHex).toBeNull()
  })
})

describe('SectorFields', () => {
  it('switches the sheet when another type is chosen', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SectorFields sector={sports} value={emptySector(sports)} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /Chaussures/ }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      tailles: '',
      attributes: expect.objectContaining({ type: 'chaussures' }),
    }))
  })
})
