import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw, Package, ChevronDown, Clock, CheckCircle, XCircle,
  AlertCircle, ShoppingBag, Calendar, ArrowRight,
} from 'lucide-react';
import { fetchMyReturns, fetchReturnPolicy } from '../api/apiClient';
import { getUser } from '../api/tokenStorage';

const STATUS_CONFIG = {
  EN_ATTENTE: {
    label: 'En attente de traitement',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-400',
    icon: Clock,
  },
  INSPECTE: {
    label: 'En cours d\'inspection',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
    icon: AlertCircle,
  },
  REMBOURSE: {
    label: 'Retour accepté / Remboursé',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    icon: CheckCircle,
  },
  FERME: {
    label: 'Retour refusé',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-400',
    icon: XCircle,
  },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MesRetours() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policy, setPolicy] = useState(null);
  const navigate = useNavigate();

  const user = getUser();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
    fetchReturnPolicy().then(setPolicy).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyReturns();
      setReturns(Array.isArray(data) ? data : []);
    } catch {
      setError('Impossible de charger vos demandes de retour.');
    } finally {
      setLoading(false);
    }
  };

  const pending = returns.filter(r => r.status === 'EN_ATTENTE').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige/40 to-white">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronDown size={14} className="-rotate-90" />
            <Link to="/commandes" className="hover:text-white transition-colors">Mes commandes</Link>
            <ChevronDown size={14} className="-rotate-90" />
            <span className="text-white">Mes retours</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-white mb-1">Mes retours</h1>
          <p className="text-white/70 font-body">
            {pending > 0
              ? `${pending} demande${pending > 1 ? 's' : ''} en attente de traitement`
              : 'Historique de vos demandes de retour'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 -mt-4">

        {/* Policy banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-0.5">
            <p><strong className="font-semibold">Politique de retour :</strong> Retours acceptés dans les{' '}
              <strong>{policy?.dureeJours ?? 30} jours</strong> suivant la réception,
              pour tout produit{policy?.eligibilite ? ` ${policy.eligibilite.toLowerCase()}` : ' non ouvert ou présentant un défaut'}.
              Notre équipe traite les demandes sous <strong>2–3 jours ouvrés</strong>.
            </p>
            {policy?.modeRemboursement && (
              <p><strong>Remboursement :</strong> {policy.modeRemboursement}
                {policy.fraisRetour ? <> · <strong>Frais :</strong> {policy.fraisRetour}</> : null}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-secondary">Chargement...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button onClick={load} className="flex items-center gap-2 mx-auto bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              <RefreshCw size={16} /> Réessayer
            </button>
          </div>
        ) : returns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-12 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5">
              <RefreshCw size={36} className="text-primary/40" />
            </div>
            <h3 className="text-xl font-headline font-bold text-primary mb-2">Aucune demande de retour</h3>
            <p className="text-secondary mb-6">Vous n'avez encore effectué aucune demande de retour.</p>
            <Link to="/commandes" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              <ShoppingBag size={18} /> Voir mes commandes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => {
              const cfg = STATUS_CONFIG[ret.status] || STATUS_CONFIG.EN_ATTENTE;
              const StatusIcon = cfg.icon;
              return (
                <div key={ret.id} className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon size={22} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-headline font-bold text-primary text-[15px]">{ret.reference}</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(ret.createdAt)}</span>
                        <span className="text-secondary/50">·</span>
                        <span>Commande <strong className="text-primary">{ret.orderReference}</strong></span>
                      </div>
                    </div>
                    {ret.amount != null && (
                      <div className="text-right flex-shrink-0">
                        <div className="font-headline font-bold text-primary text-lg">{Number(ret.amount).toFixed(2)} <span className="text-sm font-body font-normal">TND</span></div>
                        <div className="text-[10px] text-secondary uppercase tracking-wider">Montant</div>
                      </div>
                    )}
                  </div>

                  {/* Product row */}
                  <div className="border-t border-outline-variant/10 px-5 py-4 flex gap-4 items-start">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-beige flex-shrink-0 border border-outline-variant/10">
                      {ret.productImage
                        ? <img src={ret.productImage} alt={ret.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-sage" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary text-sm leading-tight">{ret.productName}</p>
                      <p className="text-xs text-secondary mt-1">
                        <span className="font-medium">Raison :</span> {ret.raison}
                      </p>
                      {ret.commentaire && (
                        <p className="text-xs text-secondary mt-0.5 italic">"{ret.commentaire}"</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  {ret.status === 'EN_ATTENTE' && (
                    <div className="border-t border-outline-variant/10 px-5 py-3 bg-orange-50/50 flex items-center gap-2">
                      <RefreshCw size={13} className="text-orange-500 animate-spin flex-shrink-0" />
                      <p className="text-xs text-orange-700">Votre demande est en cours d'examen. Vous recevrez une réponse sous 2–3 jours ouvrés.</p>
                    </div>
                  )}
                  {ret.status === 'INSPECTE' && (
                    <div className="border-t border-outline-variant/10 px-5 py-3 bg-blue-50/50 flex items-center gap-2">
                      <AlertCircle size={13} className="text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-blue-700">Votre produit est en cours d'inspection par notre équipe.</p>
                    </div>
                  )}
                  {ret.status === 'REMBOURSE' && (
                    <div className="border-t border-outline-variant/10 px-5 py-3 bg-emerald-50/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                        <p className="text-xs text-emerald-700">Retour accepté et remboursement effectué. Merci pour votre confiance.</p>
                      </div>
                      {ret.ibanClient && (
                        <p className="text-xs text-emerald-700 ml-5"><span className="font-semibold">Virement vers :</span> <span className="font-mono">{ret.ibanClient}</span></p>
                      )}
                    </div>
                  )}
                  {ret.status === 'FERME' && (
                    <div className="border-t border-outline-variant/10 px-5 py-3 bg-red-50/50 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <XCircle size={13} className="text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-700 font-semibold">Demande refusée.</p>
                      </div>
                      {ret.motifRefus && (
                        <p className="text-xs text-red-600 ml-5"><span className="font-semibold">Motif :</span> {ret.motifRefus}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back to orders */}
        {!loading && (
          <div className="mt-8 text-center">
            <Link to="/commandes" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm">
              <ArrowRight size={14} className="rotate-180" /> Retour à mes commandes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
