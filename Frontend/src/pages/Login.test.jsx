import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

vi.mock('../context/StoreContext', () => ({
  useStore: () => ({ storeName: 'Atelier Test' }),
}))

const setTokens = vi.fn()
vi.mock('../api/tokenStorage', () => ({
  setTokens: (...args) => setTokens(...args),
  scheduleAutoLogout: vi.fn(),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

function loginForm() {
  return within(document.querySelector('form'))
}

describe('Login', () => {
  beforeEach(() => {
    setTokens.mockReset()
    window.history.pushState({}, '', '/atelier/login')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the shop name', () => {
    renderLogin()
    expect(screen.getAllByText('Atelier Test').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Mon Compte' })).toBeInTheDocument()
  })

  it('shows the error returned by the api', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'E-mail ou mot de passe incorrect.' }),
    })
    const user = userEvent.setup()
    renderLogin()
    await user.type(loginForm().getByPlaceholderText('votre@email.com'), 'ada@example.com')
    await user.type(loginForm().getByPlaceholderText('••••••••'), 'secret')
    await user.click(loginForm().getByRole('button', { name: /Se connecter/ }))
    expect(await screen.findByText('E-mail ou mot de passe incorrect.')).toBeInTheDocument()
    expect(setTokens).not.toHaveBeenCalled()
  })

  it('refuses a merchant account on the storefront', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { roleName: 'ADMIN', mustChangePassword: false },
      }),
    })
    const user = userEvent.setup()
    renderLogin()
    await user.type(loginForm().getByPlaceholderText('votre@email.com'), 'ada@example.com')
    await user.type(loginForm().getByPlaceholderText('••••••••'), 'password1')
    await user.click(loginForm().getByRole('button', { name: /Se connecter/ }))
    expect(await screen.findByText('Les marchands se connectent sur Sellio.')).toBeInTheDocument()
    expect(setTokens).not.toHaveBeenCalled()
  })
})
