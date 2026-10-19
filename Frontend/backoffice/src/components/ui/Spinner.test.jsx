import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Spinner from './Spinner'

describe('Spinner', () => {
  it('uses the large size classes', () => {
    const { container } = render(<Spinner size="lg" />)
    expect(container.querySelector('.w-12')).toBeInTheDocument()
  })

  it('defaults to the medium size', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.w-8')).toBeInTheDocument()
  })
})
