import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireAuth from './RequireAuth'

function installLocation(path) {
  const replace = vi.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname: path, replace, href: `http://localhost${path}` },
  })
  return replace
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/sellio" element={<h1>Console</h1>} />
          <Route path="/demo/dashboard" element={<h1>Boutique</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('sends an anonymous visitor to the login page', () => {
    const replace = installLocation('/demo/dashboard')
    renderAt('/demo/dashboard')
    expect(replace).toHaveBeenCalledWith('/login')
    expect(screen.queryByRole('heading', { name: 'Boutique' })).not.toBeInTheDocument()
  })

  it('drops a customer session', () => {
    const replace = installLocation('/demo/dashboard')
    localStorage.setItem('accessToken', 'token-test')
    localStorage.setItem('user', JSON.stringify({ roleName: 'CLIENT' }))
    renderAt('/demo/dashboard')
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(replace).toHaveBeenCalledWith('/')
  })

  it('lets the Sellio team open the console', () => {
    installLocation('/sellio')
    localStorage.setItem('accessToken', 'token-test')
    localStorage.setItem('user', JSON.stringify({ roleName: 'SELLIO_ADMIN' }))
    renderAt('/sellio')
    expect(screen.getByRole('heading', { name: 'Console' })).toBeInTheDocument()
  })

  it('sends a merchant with a temporary password to the change screen', () => {
    const replace = installLocation('/demo/dashboard')
    localStorage.setItem('accessToken', 'token-test')
    localStorage.setItem('user', JSON.stringify({ roleName: 'ADMIN', mustChangePassword: true, shopSlug: 'demo' }))
    renderAt('/demo/dashboard')
    expect(replace).toHaveBeenCalledWith('/changer-mot-de-passe')
  })
})
