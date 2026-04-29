import { createPortal } from 'react-dom';
import { Heart, LogIn, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LoginPromptModal({ open, onClose, redirectTo = '/' }) {
  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative animate-in fade-in zoom-in-95 duration-200">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-outline hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
              <Heart size={30} className="text-rose-400" fill="currentColor" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-7">
            <h2 className="font-headline font-bold text-xl text-primary mb-2">
              Ajoutez à vos favoris
            </h2>
            <p className="text-secondary text-sm leading-relaxed">
              Souhaitez-vous vous connecter d'abord pour sauvegarder cet article dans vos favoris ?
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: redirectTo }}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
            >
              <LogIn size={17} />
              Se connecter
            </Link>
            <Link
              to="/inscription"
              state={{ from: redirectTo }}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full border-2 border-primary text-primary py-3 rounded-full font-bold hover:bg-primary/5 transition-colors"
            >
              Créer un compte
            </Link>
            <button
              onClick={onClose}
              className="text-sm text-outline hover:text-secondary transition-colors py-1"
            >
              Continuer sans se connecter
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
