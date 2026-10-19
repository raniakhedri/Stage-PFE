import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'
import ThemeEditor, { themeFromShop, themePayload, EMPTY_THEME } from './ThemeEditor'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('theme helpers', () => {
  it('reads column colours and ignores invalid theme json', () => {
    const values = themeFromShop({ primaryColor: '#112233', theme: '{not json' })
    expect(values.primaryColor).toBe('#112233')
    expect(values.headingColor).toBe('')
  })

  it('keeps only valid extra colours in the payload', () => {
    const payload = themePayload({ ...EMPTY_THEME, primaryColor: '#abcdef', headingColor: 'red', navBg: '#010203' })
    expect(payload.primaryColor).toBe('#abcdef')
    expect(JSON.parse(payload.theme)).toEqual({ navBg: '#010203' })
    expect(JSON.parse(payload.theme).headingColor).toBeUndefined()
  })
})

describe('ThemeEditor', () => {
  it('saves a preset and shows an error from the api', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Réseau indisponible'))
    const user = userEvent.setup()
    render(<ThemeEditor shop={{}} layout="minimal" shopName="Atelier" onSave={onSave} showPreview={false} />)
    await user.click(screen.getByRole('button', { name: /Classique/ }))
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(onSave).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Réseau indisponible')
  })

  it('flags a colour that is not a hex code', async () => {
    const user = userEvent.setup()
    render(<ThemeEditor shop={{ primaryColor: '' }} layout="minimal" shopName="Atelier" onSave={vi.fn()} showPreview={false} />)
    const fields = screen.getAllByPlaceholderText('Par défaut')
    await user.type(fields[0], 'bleu')
    expect(screen.getByText('Format attendu : #RRGGBB')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })
})
