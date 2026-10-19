import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KpiCard from './KpiCard'

describe('KpiCard', () => {
  it('shows the label, value and sub text', () => {
    render(<KpiCard label="Chiffre" value="120 TND" sub="+4 %" subColor="text-brand" icon="payments" />)
    expect(screen.getByText('Chiffre')).toBeInTheDocument()
    expect(screen.getByText('120 TND')).toBeInTheDocument()
    expect(screen.getByText('+4 %')).toHaveClass('text-brand')
  })

  it('clamps the progress bar between 0 and 100', () => {
    const { container } = render(<KpiCard label="Taux" value="2" progress={140} />)
    expect(container.querySelector('[style]')).toHaveStyle({ width: '100%' })
  })
})
