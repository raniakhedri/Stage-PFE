import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('shows the text and the default colour', () => {
    render(<Badge>Actif</Badge>)
    expect(screen.getByText('Actif')).toHaveClass('bg-blue-100')
  })

  it('uses the requested colour', () => {
    render(<Badge color="red">Bloqué</Badge>)
    expect(screen.getByText('Bloqué')).toHaveClass('text-red-800')
  })
})
