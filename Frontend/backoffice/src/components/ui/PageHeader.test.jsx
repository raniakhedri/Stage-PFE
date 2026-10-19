import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageHeader from './PageHeader'

describe('PageHeader', () => {
  it('renders nothing without actions', () => {
    const { container } = render(<PageHeader />)
    expect(container).toBeEmptyDOMElement()
  })

  it('fires the primary and danger actions', async () => {
    const add = vi.fn()
    const remove = vi.fn()
    const user = userEvent.setup()
    render(
      <PageHeader>
        <PageHeader.PrimaryBtn onClick={add}>Ajouter</PageHeader.PrimaryBtn>
        <PageHeader.DangerBtn onClick={remove} disabled>Supprimer</PageHeader.DangerBtn>
      </PageHeader>,
    )
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(add).toHaveBeenCalledOnce()
    expect(remove).not.toHaveBeenCalled()
  })
})
