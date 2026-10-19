import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPromptModal from './LoginPromptModal'

describe('LoginPromptModal', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<MemoryRouter><LoginPromptModal open={false} onClose={() => {}} /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })

  it('closes when the visitor continues without an account', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPromptModal open onClose={onClose} redirectTo="/produit" /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Ajoutez à vos favoris' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Se connecter/ })).toHaveAttribute('href', '/login')
    await user.click(screen.getByRole('button', { name: 'Continuer sans se connecter' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
