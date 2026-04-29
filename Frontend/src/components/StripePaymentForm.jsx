import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function StripePaymentForm({ onSuccess, onBack, total, error, setError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Paiement échoué');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      await onSuccess();
    } else {
      setError('Statut de paiement inattendu. Veuillez contacter le support.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-secondary">
        <ShieldCheck size={14} className="text-primary" />
        Paiement sécurisé par Stripe — vos données bancaires sont chiffrées.
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-outline-variant text-primary font-medium text-sm hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-primary text-white py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {processing ? 'Traitement...' : `Payer ${total.toFixed(2)} TND`}
        </button>
      </div>
    </form>
  );
}
