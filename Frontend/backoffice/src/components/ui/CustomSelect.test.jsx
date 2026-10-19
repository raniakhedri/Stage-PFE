import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomSelect from './CustomSelect'

describe('CustomSelect', () => {
  it('shows the selected label and reports a new choice', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CustomSelect
        value="actif"
        onChange={onChange}
        options={[{ value: 'actif', label: 'Actif' }, { value: 'brouillon', label: 'Brouillon' }]}
      />,
    )
    expect(screen.getByRole('button', { name: /Actif/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Actif/ }))
    await user.click(screen.getByRole('button', { name: 'Brouillon' }))
    expect(onChange).toHaveBeenCalledWith('brouillon')
  })

  it('falls back to the placeholder when nothing matches', () => {
    render(<CustomSelect value="" onChange={() => {}} options={[]} placeholder="Choisir un statut" />)
    expect(screen.getByRole('button', { name: 'Choisir un statut' })).toBeInTheDocument()
  })
})
