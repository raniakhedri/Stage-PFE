import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
        <CheckCircle size={48} className="text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary mb-3">Commande confirmée !</h1>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Merci pour votre commande. Vous recevrez un e-mail de confirmation très bientôt. Votre commande sera expédiée sous 48h.
        </p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
      >
        <ShoppingBag size={18} />
        Continuer mes achats
      </Link>
    </div>
  );
}
