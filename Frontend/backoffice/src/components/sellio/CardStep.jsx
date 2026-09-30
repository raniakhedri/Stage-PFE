import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null

const BRAND_LABELS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover', unionpay: 'UnionPay', jcb: 'JCB' }

function CardForm({ value, onChange, theme }) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState(value?.cardholderName || '')
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    setError('')
    if (!name.trim()) {
      setError('Indiquez le nom du titulaire.')
      return
    }
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/public/stripe/setup-intent`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.clientSecret) throw new Error(data?.error || 'Service de paiement indisponible.')

      const card = elements.getElement(CardElement)
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: { name: name.trim() },
      })
      if (pmError) throw new Error(pmError.message)

      // Confirming the SetupIntent makes Stripe authenticate the card (3-D Secure when required).
      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(data.clientSecret, { payment_method: paymentMethod.id })
      if (setupError) throw new Error(setupError.message)
      if (setupIntent.status !== 'succeeded') throw new Error('La carte n’a pas pu être vérifiée.')

      onChange({
        cardholderName: name.trim(),
        cardBrand: paymentMethod.card.brand,
        cardLast4: paymentMethod.card.last4,
        cardExpMonth: paymentMethod.card.exp_month,
        cardExpYear: paymentMethod.card.exp_year,
        stripePaymentMethodId: paymentMethod.id,
        stripeSetupIntentId: setupIntent.id,
      })
    } catch (err) {
      setError(err.message || 'Vérification impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Titulaire de la carte</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom tel qu’il figure sur la carte" autoComplete="cc-name" className={`mt-1.5 w-full rounded-xl px-4 py-3 text-sm outline-none transition-all ${theme.t.input}`} />
      </label>
      <div>
        <span className="text-sm font-medium">Numéro, expiration et CVC</span>
        <div className={`mt-1.5 rounded-xl px-4 py-3.5 ${theme.t.input}`}>
          <CardElement
            onChange={(e) => { setComplete(e.complete); setError(e.error?.message || '') }}
            options={{
              hidePostalCode: true,
              style: {
                base: { color: theme.t.stripeText, fontSize: '15px', fontFamily: 'Inter, sans-serif', '::placeholder': { color: theme.t.stripePlaceholder } },
                invalid: { color: '#f87171' },
              },
            }}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="button" disabled={loading || !complete} onClick={verify} className={`w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2 ${theme.t.primaryBtn}`}>
        {loading && <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />}
        {loading ? 'Vérification…' : 'Vérifier la carte'}
      </button>
    </div>
  )
}

export function cardComplete(card) {
  return Boolean(card?.stripePaymentMethodId)
}

/** Card step: the number never touches Sellio servers, only Stripe's. */
export default function CardStep({ value, onChange, theme }) {
  if (cardComplete(value)) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 aspect-[1.6/1] max-w-sm shadow-2xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-3xl">contactless</span>
            <span className="text-sm font-semibold">{BRAND_LABELS[value.cardBrand] || value.cardBrand}</span>
          </div>
          <p className="absolute left-6 bottom-14 font-mono text-lg tracking-[0.2em]">•••• •••• •••• {value.cardLast4}</p>
          <div className="absolute left-6 right-6 bottom-5 flex justify-between text-xs uppercase tracking-wider">
            <span>{value.cardholderName}</span>
            <span>{String(value.cardExpMonth).padStart(2, '0')}/{String(value.cardExpYear).slice(-2)}</span>
          </div>
        </div>
        <p className="text-sm text-emerald-400 flex items-center gap-2"><span className="material-symbols-outlined text-base">verified</span>Carte vérifiée par Stripe</p>
        <button type="button" onClick={() => onChange(null)} className={`px-4 py-2 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Utiliser une autre carte</button>
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        Paiement non configuré : ajoutez <code>VITE_STRIPE_PUBLISHABLE_KEY</code> dans <code>Frontend/backoffice/.env</code> puis redémarrez le serveur du backoffice.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <Elements stripe={stripePromise}>
        <CardForm value={value} onChange={onChange} theme={theme} />
      </Elements>
      <div className={`text-xs space-y-1.5 ${theme.t.faint}`}>
        <p className="flex items-start gap-2"><span className="material-symbols-outlined text-sm">lock</span>Le numéro de carte est saisi dans un champ sécurisé Stripe : Sellio ne le reçoit jamais. Seuls la marque, les 4 derniers chiffres et la date d’expiration sont conservés.</p>
        <p className="flex items-start gap-2"><span className="material-symbols-outlined text-sm">info</span>Aucun montant n’est débité à cette étape.</p>
      </div>
    </div>
  )
}
