import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'

vi.mock('../../hooks/useAdminNotifications', () => ({
  useAdminNotifications: () => ({
    notifications: [{ id: 'n1', title: 'Commande en retard', message: 'CMD-1', severity: 'warning', icon: 'schedule', link: '/commandes' }],
  }),
}))

describe('Sidebar', () => {
  it('shows the modules an admin can open and the shop name', () => {
    render(
      <MemoryRouter>
        <Sidebar user={{ roleName: 'ADMIN', firstName: 'Rania', lastName: 'Test', shopSlug: 'demo', shopName: 'Atelier' }} shop={{ name: 'Atelier' }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Atelier')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tableau de bord/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Produits/ })).toBeInTheDocument()
    expect(screen.getByText('Rania Test · ADMIN')).toBeInTheDocument()
  })

  it('hides modules the team member cannot access', () => {
    render(
      <MemoryRouter>
        <Sidebar user={{ roleName: 'S12_CAISSE', permissions: { COMMANDES: true }, firstName: 'Sam', lastName: 'Caisse' }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Commandes/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Produits/ })).not.toBeInTheDocument()
  })

  it('opens the notification and marks it read', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Sidebar user={{ roleName: 'ADMIN', firstName: 'Rania', lastName: 'Test' }} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /Notifications/ }))
    expect(screen.getByText('Commande en retard')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('admin_notif_read'))).toContain('n1')
  })
})
