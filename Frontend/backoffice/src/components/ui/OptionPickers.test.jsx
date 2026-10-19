import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionSelect, AddCustomOption, ColorSelect } from './OptionPickers'

vi.mock('../../hooks/useShopOptions', () => ({
  useShopOptions: () => ({
    options: () => ['Lin', 'Coton'],
    customFor: () => [],
    addOption: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('OptionSelect', () => {
  it('picks a fixed option and can clear it', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<OptionSelect optionKey="tissu" value="Lin" onChange={onChange} options={['Lin', 'Coton']} />)
    await user.click(screen.getByRole('button', { name: /Lin/ }))
    await user.click(screen.getByRole('button', { name: 'Coton' }))
    expect(onChange).toHaveBeenCalledWith('Coton')
  })
})

describe('AddCustomOption', () => {
  it('stays closed until asked, then can be cancelled', async () => {
    const user = userEvent.setup()
    render(<AddCustomOption optionKey="tissu" />)
    await user.click(screen.getByRole('button', { name: /Ajouter une valeur/ }))
    expect(screen.getByPlaceholderText('Nouvelle valeur')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByPlaceholderText('Nouvelle valeur')).not.toBeInTheDocument()
  })
})

describe('ColorSelect', () => {
  it('writes the preset name and hex', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ColorSelect name="" hex="" onChange={onChange} />)
    await user.click(screen.getByTitle('Noir'))
    expect(onChange).toHaveBeenCalledWith({ couleur: 'Noir', couleurHex: '#111111' })
  })
})
