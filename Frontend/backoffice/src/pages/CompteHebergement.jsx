import { useState } from 'react'
import { toast } from 'react-toastify'
import PageHeader from '../components/ui/PageHeader'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const paiements = [
  { id: '#WP-89231', date: '12 Oct 2024', montant: '299,00 DT', statut: 'Payé' },
  { id: '#WP-88412', date: '12 Sep 2023', montant: '299,00 DT', statut: 'Payé' },
  { id: '#WP-87002', date: '12 Sep 2022', montant: '249,00 DT', statut: 'Payé' },
]

const plans = [
  {
    id: 'starter',
    nom: 'Starter',
    prix: '29',
    periode: '/mois',
    description: 'Parfait pour les petites boutiques qui débutent.',
    icon: 'rocket_launch',
    iconBg: 'bg-blue-50 text-blue-500',
    features: [
      '1 000 produits',
      '5 Go de stockage',
      'Support email',
      'Rapports basiques',
      '1 utilisateur admin',
    ],
  },
  {
    id: 'premium',
    nom: 'Premium',
    prix: '299',
    periode: '/an',
    description: 'Pour les entreprises en pleine croissance.',
    icon: 'workspace_premium',
    iconBg: 'bg-badge/10 text-badge',
    badge: 'Actuel',
    features: [
      '10 000 produits',
      '50 Go de stockage',
      'Support prioritaire',
      'Rapports avancés',
      '5 utilisateurs admin',
      'API accès complet',
    ],
  },
  {
    id: 'enterprise',
    nom: 'Enterprise',
    prix: '799',
    periode: '/an',
    description: 'Solution complète pour les grandes organisations.',
    icon: 'corporate_fare',
    iconBg: 'bg-slate-900 text-white',
    features: [
      'Produits illimités',
      '500 Go de stockage',
      'Support dédié 24/7',
      'Rapports personnalisés',
      'Utilisateurs illimités',
      'API + Webhooks',
      'SLA garanti 99.9%',
    ],
  },
]

export default function CompteHebergement() {
  const [planActuel] = useState('premium')
  const [showPlans, setShowPlans] = useState(false)

  const handleChangePlan = (planId) => {
    if (planId === planActuel) return
    toast.success(`Demande de changement vers le plan "${plans.find(p => p.id === planId)?.nom}" envoyée.`)
    setShowPlans(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* Page Header */}
      <PageHeader title="Informations du Compte">
        <PageHeader.PrimaryBtn icon="credit_card" onClick={() => setShowPlans(!showPlans)}>
          {showPlans ? 'Masquer les plans' : 'Changer de plan'}
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hosting */}
        <div className="bg-white p-6 rounded-custom border border-slate-200 shadow-sm flex gap-4">
          <div className="w-12 h-12 bg-badge/10 text-badge rounded-custom flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">cloud_done</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Statut d'hébergement</p>
            <h3 className="text-xl font-bold text-slate-800 mt-2">Naturessence</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-badge bg-badge/10 text-badge">ACTIVE</span>
              <button className="text-brand text-xs font-bold hover:underline flex items-center">
                Détails du domaine
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white p-6 rounded-custom border border-slate-200 shadow-sm flex gap-4">
          <div className="w-12 h-12 bg-badge/10 text-badge rounded-custom flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">event_repeat</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Expiration du plan</p>
            <h3 className="text-xl font-bold text-slate-800 mt-2">Plan Premium</h3>
            <p className="text-sm text-slate-600 mt-1">Expire dans : <span className="font-bold">11 mois</span></p>
            <p className="text-[11px] text-slate-400 italic">Renouvellement le 12 Septembre 2025</p>
          </div>
        </div>
      </div>

      {/* Plans Selection */}
      {showPlans && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-brand text-xl">swap_horiz</span>
            <h3 className="text-lg font-bold text-slate-800">Choisissez votre plan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = plan.id === planActuel
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-custom border-2 p-6 shadow-sm transition-all ${
                    isCurrent
                      ? 'border-brand shadow-brand/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 right-5 px-3 py-0.5 rounded-full text-[10px] font-bold font-badge bg-brand text-white">
                      {plan.badge}
                    </span>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.iconBg}`}>
                      <span className="material-symbols-outlined text-xl">{plan.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{plan.nom}</h4>
                      <p className="text-[11px] text-slate-400">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.prix} DT</span>
                    <span className="text-sm text-slate-400 font-medium">{plan.periode}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="material-symbols-outlined text-brand text-sm">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-lg bg-badge/10 text-badge text-xs font-bold text-center">
                      Plan actuel
                    </div>
                  ) : (
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-btn hover:text-white hover:border-btn transition-all"
                    >
                      Passer à {plan.nom}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Paiements récents</h3>
          <button className="text-brand text-sm font-bold hover:underline">Tout télécharger</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">ID Paiement</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4 text-center">Statut</th>
              <th className="px-6 py-4 text-right">Facture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paiements.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5 text-sm font-medium text-slate-400">{p.id}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{p.date}</td>
                <td className="px-6 py-5 text-sm font-bold text-slate-800">{p.montant}</td>
                <td className="px-6 py-5 text-center">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-badge bg-badge/10 text-badge">{p.statut}</span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-slate-400 hover:text-brand transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
