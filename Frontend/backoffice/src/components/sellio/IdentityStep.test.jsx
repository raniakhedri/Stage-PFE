import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentityStep, { compressImage, emptyIdentity, identityError } from './IdentityStep'

const theme = { dark: false, t: { muted: '', input: '' } }

describe('identityError', () => {
  it('asks for an 8 digit CIN before the photos', () => {
    expect(identityError({ ...emptyIdentity, documentNumber: '12' })).toMatch(/8 chiffres/)
  })

  it('accepts a complete passport file', () => {
    expect(identityError({
      ...emptyIdentity,
      documentType: 'PASSPORT',
      documentNumber: 'ab1234',
      documentFront: 'data:image/jpeg;base64,abc',
      selfie: 'data:image/jpeg;base64,def',
    })).toBe('')
  })
})

describe('compressImage', () => {
  it('rejects a file that is not an image', async () => {
    await expect(compressImage({ type: 'text/plain', size: 10 })).rejects.toThrow(/image/)
  })

  it('rejects an image over 15 Mo', async () => {
    await expect(compressImage({ type: 'image/png', size: 16 * 1024 * 1024 })).rejects.toThrow(/15 Mo/)
  })
})

describe('IdentityStep', () => {
  it('switches the number hint when the document type changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<IdentityStep value={emptyIdentity} onChange={onChange} onError={() => {}} theme={theme} />)
    expect(screen.getByText('Numéro de CIN')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Passeport/ }))
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls.at(-1)[0]
    expect(next.documentType).toBe('PASSPORT')
  })
})
