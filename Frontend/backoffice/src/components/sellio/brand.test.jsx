import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SellioLogo, TechBackdrop } from './brand'
import AuthShell, { Field, SubmitButton } from './AuthShell'

describe('Sellio brand', () => {
  it('links the logo to the home page', () => {
    render(<MemoryRouter><SellioLogo /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Sellio' })).toHaveAttribute('href', '/')
  })

  it('renders the decorative backdrop as hidden', () => {
    const { container } = render(<TechBackdrop />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AuthShell', () => {
  it('shows the form title, a field and a loading submit', () => {
    render(
      <MemoryRouter>
        <AuthShell eyebrow="Compte" title="Connexion" subtitle="Accédez au backoffice" footer={<span>Pas de compte</span>}>
          <Field label="E-mail"><input aria-label="E-mail" /></Field>
          <SubmitButton loading loadingLabel="Connexion…">Se connecter</SubmitButton>
        </AuthShell>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Connexion…/ })).toBeDisabled()
    expect(screen.getByText('Pas de compte')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Accueil/ })).toHaveAttribute('href', '/')
  })
})
