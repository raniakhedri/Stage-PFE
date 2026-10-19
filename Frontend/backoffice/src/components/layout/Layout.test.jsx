import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'

vi.mock('./Sidebar', () => ({
  // eslint-disable-next-line react/prop-types -- test double, not a product component
  default: function SidebarMock({ shop, user }) {
    return <nav>{shop?.name || user?.shopSlug || 'sans-boutique'}</nav>
  },
}))

vi.mock('../../api/apiClient', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { roleName: 'ADMIN', shopSlug: 'demo', permissions: { TABLEAU_DE_BORD: true } },
    }),
  },
}))

describe('Layout', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ roleName: 'ADMIN', shopSlug: 'demo' }))
    localStorage.setItem('accessToken', 'header.payload.sig')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Atelier', slug: 'demo', settings: '{}' }),
    }))
  })

  it('renders the shop returned by the public profile', async () => {
    window.history.pushState({}, '', '/demo/dashboard')
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<h1>Tableau</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Atelier')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tableau' })).toBeInTheDocument()
  })
})
