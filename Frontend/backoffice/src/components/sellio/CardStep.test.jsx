import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardStep, { cardComplete } from './CardStep'

const theme = { t: { input: '', primaryBtn: '', secondaryBtn: '', stripeText: '#111', stripePlaceholder: '#999', faint: '' } }

describe('cardComplete', () => {
  it('is true only after Stripe returned a payment method', () => {
    expect(cardComplete(null)).toBe(false)
    expect(cardComplete({ cardLast4: '4242' })).toBe(false)
    expect(cardComplete({ stripePaymentMethodId: 'pm_test' })).toBe(true)
  })
})

describe('CardStep', () => {
  it('explains that Stripe is not configured', () => {
    render(<CardStep value={{}} onChange={() => {}} theme={theme} />)
    expect(screen.getByText(/Paiement non configuré/)).toBeInTheDocument()
  })

  it('shows the verified card and lets the merchant replace it', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CardStep
        theme={theme}
        onChange={onChange}
        value={{
          stripePaymentMethodId: 'pm_test',
          cardBrand: 'visa',
          cardLast4: '4242',
          cardholderName: 'Ada Lovelace',
          cardExpMonth: 3,
          cardExpYear: 2030,
        }}
      />,
    )
    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.getByText(/4242/)).toBeInTheDocument()
    expect(screen.getByText('Carte vérifiée par Stripe')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Utiliser une autre carte' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
