import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from './Card'

describe('Card', () => {
  it('hides the heading when no title is given', () => {
    render(<Card>Contenu</Card>)
    expect(screen.getByText('Contenu')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders the title', () => {
    render(<Card title="Commandes">3</Card>)
    expect(screen.getByRole('heading', { name: 'Commandes' })).toBeInTheDocument()
  })
})
