import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const mockOrders = {
  9842: {
    id: '#ORD-9842',
    statut: 'Livrée',
    statutBg: 'bg-badge/10 text-badge',
    date: '12 Mars 2026, 14:32',
    client: {
      nom: 'Marc Bernard',
      initials: 'MB',
      email: 'm.bernard@gmail.com',
      phone: '+33 6 12 34 56 78',
      adresse: '8 Avenue des Champs\n75008 Paris, France',
      depuis: 'Client depuis 2023',
    },
    paiement: { methode: 'Carte Bancaire', detail: 'Visa **** 8821', statut: 'Payé', statutBg: 'bg-badge/10 text-badge' },
    livraison: { transporteur: 'Colissimo Standard', statut: 'Livré', statutBg: 'bg-badge/10 text-badge', tracking: 'COL-826491037FR', adresse: 'Marc Bernard\n8 Avenue des Champs\n75008 Paris, FR' },
    produits: [
      { id: 1, nom: 'Veste Softshell Haute Visibilité', variante: 'Taille: XL • Couleur: Jaune Fluo', qte: 2, prix: 59.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKXF5KJf-5qjAInOrBqY6twprQuJWqcjiS17KWrBr5lZ37w5uWaIhnvyKoBhxDgcIUc--VnTAZAa1mZQa7td7bfkvPPQhnr2h7TbJEBP-WPN3qV1PeqoEUZv-8H51L3EXSf6UF4C8F2jCJ5cMupzGUu3AiAaYEpUVCiGm6q1Y9bg6WIqP_B0a7U9Q5NSPnnUEMAOickG5R8Ezrd4yBLG5QTOby2hiJ8cMr8ARrhrsQGVgjFBKdthdRQlBG3_g4_27KmfGTfgb8ies0' },
    ],
    sousTotal: 118.00,
    fraisLivraison: 5.00,
    tva: 2.46,
    remise: 5.00,
    total: 120.46,
    notes: 'Livrer avant 17h si possible.',
    timeline: [
      { label: 'Commande créée', date: '12 Mar 2026, 14:32', icon: 'shopping_cart', color: 'bg-slate-400' },
      { label: 'Paiement confirmé', date: '12 Mar 2026, 14:33', icon: 'check_circle', color: 'bg-brand' },
      { label: 'En préparation', date: '12 Mar 2026, 15:10', icon: 'inventory_2', color: 'bg-blue-500' },
      { label: 'Expédiée', date: '13 Mar 2026, 09:45', icon: 'local_shipping', color: 'bg-indigo-500' },
      { label: 'Livrée', date: '15 Mar 2026, 11:20', icon: 'done_all', color: 'bg-brand' },
    ],
  },
  9843: {
    id: '#ORD-9843',
    statut: 'Confirmée',
    statutBg: 'bg-blue-100 text-blue-700',
    date: '12 Mars 2026, 09:15',
    client: {
      nom: 'Alice Dubois',
      initials: 'AD',
      email: 'a.dubois@outlook.com',
      phone: '+33 7 89 45 12 30',
      adresse: '45 Rue de la Liberté\n69003 Lyon, France',
      depuis: 'Client depuis 2024',
    },
    paiement: { methode: 'Paiement à la livraison', detail: 'Contre remboursement', statut: 'En attente', statutBg: 'bg-amber-100 text-amber-800' },
    livraison: { transporteur: 'DPD Standard', statut: 'En préparation', statutBg: 'bg-blue-100 text-blue-700', tracking: '—', adresse: 'Alice Dubois\n45 Rue de la Liberté\n69003 Lyon, FR' },
    produits: [
      { id: 1, nom: 'Pantalon Cargo Renforcé', variante: 'Taille: 42 • Couleur: Noir', qte: 3, prix: 45.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCufEpXhPgJAUz1-voW0sXr3eMSNLHj5AT-xGwfwUGRAVBQhKYTZW0JKbm05nNvS9z7TzN9kGzV77NSM-1riT9HzbHJiplJ2G0auBx63vAVYfcDUpEhAGEV8pVBPVQ_N_NvNrTTCa0hlFZzYLQIEVYGkKXiE_Kl-W-5IfjBa-usajAglKPQ27f-9cu98-GAsUW6NX7PfIn_gi-HZR_lEvJPkXonHpRQAvlqIKpb2ZKDOQmXM7Q3nJ2uBkxcNEtPJtY-Xw1J8QJW9Qeu' },
      { id: 2, nom: 'Chaussures Sécurité S3 Pro', variante: 'Pointure: 43 • Embout Acier', qte: 1, prix: 112.50, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUGo4qPxYIhuPmMJ7UjFLi0mMrHTXFwsUmj3HyNmQoUoDRRwNx0mz6lDJN_vaO1shw30t4buZBL1UVdckpbe68GYnOxSo4t9Q3j62IzZXLqYWjeDqhQjTbRcyebVOR039fJTX7lLgTKcjjhtH-LNLWZ4v_b_H7azW1mnmXZm30uutQoSWOJmPgA96qVeZEKigJ5tDv3OyXUC4QDdLKoHgQLTF51QlabZwrlMHJNpElN4ASTBiRLxwb4I4G-IJ3yxdKnNZmPnTTsqCs' },
      { id: 3, nom: 'Gants Multi-Grip Premium', variante: 'Taille: L • EN 388', qte: 5, prix: 8.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEj2rOtUr4FyZsWeSKGKz-kvLXd1H_K0O1-OG6VNWPony0oSosGbyeXVYNUlDC-ow-Jh0VuG9xN6v3g4e0vRGeWBM7LgzbsbVewAMnRwrFSa92XemDBoAEfxEbzS374E3MMqr0GBX__-dfJsBcVb739dY1y3E1zc0yHGpflYVE2AzQ5bICqQRXzLtsQyZXwhAhYiPhIS_pCG1IROKqDLqQn2WfdsNDTNtSwKbAfWHTJWmQBbWTLum32fRrwECheUmLZmuTscQ9FSKK' },
    ],
    sousTotal: 287.50,
    fraisLivraison: 8.00,
    tva: 59.10,
    remise: 9.10,
    total: 345.50,
    notes: '',
    timeline: [
      { label: 'Commande créée', date: '12 Mar 2026, 09:15', icon: 'shopping_cart', color: 'bg-slate-400' },
      { label: 'Confirmée', date: '12 Mar 2026, 09:20', icon: 'check_circle', color: 'bg-blue-500' },
    ],
  },
  9844: {
    id: '#ORD-9844',
    statut: 'Annulée',
    statutBg: 'bg-red-100 text-red-700',
    date: '11 Mars 2026, 16:45',
    client: {
      nom: 'Julie Morel',
      initials: 'JM',
      email: 'jmorel@pro.fr',
      phone: '+33 1 45 67 89 00',
      adresse: '3 Boulevard Hausmann\n75009 Paris, France',
      depuis: 'Client depuis 2025',
    },
    paiement: { methode: 'Carte Bancaire', detail: 'Échec paiement', statut: 'Échec', statutBg: 'bg-red-100 text-red-800' },
    livraison: { transporteur: '—', statut: '—', statutBg: 'bg-slate-100 text-slate-500', tracking: '—', adresse: 'Julie Morel\n3 Boulevard Hausmann\n75009 Paris, FR' },
    produits: [
      { id: 1, nom: 'Casque Sécurité Reflex', variante: 'Couleur: Blanc • Norme EN 397', qte: 1, prix: 56.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASR17itPbPtHgXqAFzuvp50hRQ1zu6E6y4OJ4TrlCiz9gD8uEQTA5qCBEz5Wr9-RaXvWikgS84Y_GpcbojYKt86TVT0EuGVgGqG8dR8uaUuL8WRMLran_6PYTeTeiO20qovSmddqkG0Yrh_Wr-Nr1aEkfacCWVnG6z6krBTkyFgLaHwh7hfVdA2x3cXWeYqL8cXRq7Zt7qS7vIRKwHQD1KYzvvKYAQd63IMMuCLwHpWzakP2z8H0v6q7zbrP9KMzN6cWZmc9_WRrua' },
    ],
    sousTotal: 56.00,
    fraisLivraison: 0,
    tva: 0,
    remise: 0,
    total: 56.00,
    notes: 'Paiement échoué — commande annulée automatiquement.',
    timeline: [
      { label: 'Commande créée', date: '11 Mar 2026, 16:45', icon: 'shopping_cart', color: 'bg-slate-400' },
      { label: 'Paiement échoué', date: '11 Mar 2026, 16:46', icon: 'error', color: 'bg-red-500' },
      { label: 'Annulée', date: '11 Mar 2026, 16:46', icon: 'cancel', color: 'bg-red-600' },
    ],
  },
  9845: {
    id: '#ORD-9845',
    statut: 'Retournée',
    statutBg: 'bg-slate-700 text-white',
    date: '10 Mars 2026, 08:00',
    client: {
      nom: 'Thomas Klein',
      initials: 'TK',
      email: 'tklein@gmail.com',
      phone: '+33 6 00 11 22 33',
      adresse: '22 Rue Principale\n67000 Strasbourg, France',
      depuis: 'Client depuis 2022',
    },
    paiement: { methode: 'Carte Bancaire', detail: 'Remboursé', statut: 'Remboursé', statutBg: 'bg-purple-100 text-purple-800' },
    livraison: { transporteur: 'Chronopost Express', statut: 'Retour en cours', statutBg: 'bg-amber-100 text-amber-700', tracking: 'CHR-991827364FR', adresse: 'Thomas Klein\n22 Rue Principale\n67000 Strasbourg, FR' },
    produits: [
      { id: 1, nom: 'Parka Pro X Hiver', variante: 'Taille: XXL • Couleur: Marine', qte: 2, prix: 189.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjICHsBgeRQx2E_0RVN3bGQZCvYUMVqmq3dFxsitbv8h1POJnL1ihnIVvo5KENqMO1gqYyqJvgoz3fIwuR4dOXRdFzFKIyB_QHhxGPn9TpuOcV62vjrLIJ3qtKyvi0ZnFCunWteUzVrxWwD_avuYbPOIUAwLcHMGQth1TwzL0thphv2qxUFQ6njNG08K49lIn5I6GM_0HpNey8pMughpfJAPKBSrRYd51KyDARBmo3oZFtlucA3JMIcjcoWuQ3vr60AiLaU8FKeMEc' },
      { id: 2, nom: 'Veste Granite Protection XL', variante: 'Taille: XL • Couleur: Gris', qte: 1, prix: 129.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKXF5KJf-5qjAInOrBqY6twprQuJWqcjiS17KWrBr5lZ37w5uWaIhnvyKoBhxDgcIUc--VnTAZAa1mZQa7td7bfkvPPQhnr2h7TbJEBP-WPN3qV1PeqoEUZv-8H51L3EXSf6UF4C8F2jCJ5cMupzGUu3AiAaYEpUVCiGm6q1Y9bg6WIqP_B0a7U9Q5NSPnnUEMAOickG5R8Ezrd4yBLG5QTOby2hiJ8cMr8ARrhrsQGVgjFBKdthdRQlBG3_g4_27KmfGTfgb8ies0' },
      { id: 3, nom: 'Pantalon Cargo Noir', variante: 'Taille: 44 • Noir', qte: 4, prix: 65.50, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCufEpXhPgJAUz1-voW0sXr3eMSNLHj5AT-xGwfwUGRAVBQhKYTZW0JKbm05nNvS9z7TzN9kGzV77NSM-1riT9HzbHJiplJ2G0auBx63vAVYfcDUpEhAGEV8pVBPVQ_N_NvNrTTCa0hlFZzYLQIEVYGkKXiE_Kl-W-5IfjBa-usajAglKPQ27f-9cu98-GAsUW6NX7PfIn_gi-HZR_lEvJPkXonHpRQAvlqIKpb2ZKDOQmXM7Q3nJ2uBkxcNEtPJtY-Xw1J8QJW9Qeu' },
    ],
    sousTotal: 769.00,
    fraisLivraison: 12.00,
    tva: 156.20,
    remise: 47.20,
    total: 890.00,
    notes: 'Retour demandé : parka non conforme à la taille.',
    timeline: [
      { label: 'Commande créée', date: '10 Mar 2026, 08:00', icon: 'shopping_cart', color: 'bg-slate-400' },
      { label: 'Paiement confirmé', date: '10 Mar 2026, 08:01', icon: 'check_circle', color: 'bg-brand' },
      { label: 'Expédiée', date: '11 Mar 2026, 10:30', icon: 'local_shipping', color: 'bg-indigo-500' },
      { label: 'Livrée', date: '13 Mar 2026, 14:00', icon: 'done_all', color: 'bg-brand' },
      { label: 'Retour demandé', date: '15 Mar 2026, 09:00', icon: 'assignment_return', color: 'bg-amber-500' },
      { label: 'Remboursé', date: '18 Mar 2026, 11:30', icon: 'payments', color: 'bg-purple-500' },
    ],
  },
  9846: {
    id: '#ORD-9846',
    statut: 'En attente',
    statutBg: 'bg-amber-100 text-amber-700',
    date: '10 Mars 2026, 11:00',
    client: {
      nom: 'Sophie Laurent',
      initials: 'SL',
      email: 's.laurent@email.com',
      phone: '+33 6 55 44 33 22',
      adresse: '17 Rue du Faubourg\n31000 Toulouse, France',
      depuis: 'Client depuis 2025',
    },
    paiement: { methode: 'Carte Bancaire', detail: 'Visa **** 3012', statut: 'Payé', statutBg: 'bg-badge/10 text-badge' },
    livraison: { transporteur: 'Mondial Relay', statut: 'En attente', statutBg: 'bg-amber-100 text-amber-700', tracking: '—', adresse: 'Sophie Laurent\n17 Rue du Faubourg\n31000 Toulouse, FR' },
    produits: [
      { id: 1, nom: 'T-shirt Technique Respirant', variante: 'Taille: M • Couleur: Bleu', qte: 4, prix: 28.00, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEj2rOtUr4FyZsWeSKGKz-kvLXd1H_K0O1-OG6VNWPony0oSosGbyeXVYNUlDC-ow-Jh0VuG9xN6v3g4e0vRGeWBM7LgzbsbVewAMnRwrFSa92XemDBoAEfxEbzS374E3MMqr0GBX__-dfJsBcVb739dY1y3E1zc0yHGpflYVE2AzQ5bICqQRXzLtsQyZXwhAhYiPhIS_pCG1IROKqDLqQn2WfdsNDTNtSwKbAfWHTJWmQBbWTLum32fRrwECheUmLZmuTscQ9FSKK' },
      { id: 2, nom: 'Casquette Anti-heurt', variante: 'Taille: Unique • Noir', qte: 2, prix: 37.50, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASR17itPbPtHgXqAFzuvp50hRQ1zu6E6y4OJ4TrlCiz9gD8uEQTA5qCBEz5Wr9-RaXvWikgS84Y_GpcbojYKt86TVT0EuGVgGqG8dR8uaUuL8WRMLran_6PYTeTeiO20qovSmddqkG0Yrh_Wr-Nr1aEkfacCWVnG6z6krBTkyFgLaHwh7hfVdA2x3cXWeYqL8cXRq7Zt7qS7vIRKwHQD1KYzvvKYAQd63IMMuCLwHpWzakP2z8H0v6q7zbrP9KMzN6cWZmc9_WRrua' },
    ],
    sousTotal: 187.00,
    fraisLivraison: 5.00,
    tva: 38.40,
    remise: 15.40,
    total: 215.00,
    notes: 'Commande urgente — client professionnel.',
    timeline: [
      { label: 'Commande créée', date: '10 Mar 2026, 11:00', icon: 'shopping_cart', color: 'bg-slate-400' },
      { label: 'Paiement confirmé', date: '10 Mar 2026, 11:01', icon: 'check_circle', color: 'bg-brand' },
    ],
  },
}

const statusFlow = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée']
const statusColors = {
  'En attente': 'bg-amber-100 text-amber-700',
  'Confirmée': 'bg-blue-100 text-blue-700',
  'En préparation': 'bg-indigo-100 text-indigo-700',
  'Expédiée': 'bg-indigo-100 text-indigo-700',
  'Livrée': 'bg-badge/10 text-badge',
  'Annulée': 'bg-red-100 text-red-700',
  'Retournée': 'bg-slate-700 text-white',
}

export default function DetailCommande() {
  const { id } = useParams()
  const navigate = useNavigate()
  const order = mockOrders[Number(id)] || mockOrders[9842]

  const [statut, setStatut] = useState(order.statut)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [noteInterne, setNoteInterne] = useState(order.notes)

  const handleChangeStatut = (newStatut) => {
    setStatut(newStatut)
    setShowStatusMenu(false)
    toast.success(`Statut mis à jour : ${newStatut}`)
  }

  const currentStatusBg = statusColors[statut] || order.statutBg

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">Détails de la Commande</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black font-badge uppercase tracking-widest ${currentStatusBg}`}>
              {statut}
            </span>
          </div>
          <p className="text-slate-500 font-medium">
            ID de commande : <span className="font-mono text-brand font-bold">{order.id}</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-slate-400">{order.date}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/commandes')}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors rounded-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour
          </button>
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors rounded-xl border border-slate-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">sync</span>
              Changer statut
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-20 py-2">
                {statusFlow.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleChangeStatut(s)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                      statut === s ? 'font-bold text-brand' : 'text-slate-600'
                    }`}
                  >
                    {statut === s && <span className="material-symbols-outlined text-sm mr-2 align-middle">check</span>}
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => toast.info('Facture PDF en cours de génération...')}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors rounded-xl border border-slate-200 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            Facture
          </button>
          <button
            onClick={() => toast.info('Ouverture de la messagerie...')}
            className="px-5 py-2.5 bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-all rounded-xl shadow-lg shadow-brand/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            Contacter client
          </button>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ══ Left Column (8/12) ═══════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-8">

          {/* Produits commandés */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-brand">inventory_2</span>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Produits commandés</h3>
              <span className="ml-auto text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {order.produits.length} article(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Produit</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Qté</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Prix Unit.</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.produits.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                            <img src={p.image} alt={p.nom} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{p.nom}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{p.variante}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {p.qte}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                        {p.prix.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-brand">
                        {(p.prix * p.qte).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé de facturation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-brand">receipt_long</span>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Résumé de facturation</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sous-total produits</span>
                <span className="font-medium text-slate-700">{order.sousTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frais de livraison</span>
                <span className="font-medium text-slate-700">{order.fraisLivraison.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">TVA (20%)</span>
                <span className="font-medium text-slate-700">{order.tva.toFixed(2)} €</span>
              </div>
              {order.remise > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand">Remise</span>
                  <span className="font-medium text-brand">-{order.remise.toFixed(2)} €</span>
                </div>
              )}
              <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="font-black text-xs text-slate-500 uppercase tracking-widest">Total final</span>
                <span className="text-2xl font-black text-brand">{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Notes internes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-brand">sticky_note_2</span>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Notes internes</h3>
            </div>
            <div className="p-6">
              <textarea
                value={noteInterne}
                onChange={(e) => setNoteInterne(e.target.value)}
                rows={3}
                placeholder="Ajouter une note interne..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all outline-none resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => toast.success('Note enregistrée.')}
                  className="px-4 py-2 bg-btn text-white text-xs font-bold rounded-lg hover:bg-btn-dark transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Right Column (4/12) ══════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">

          {/* Client */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client</h4>
              <button
                onClick={() => navigate(`/clients/1`)}
                className="text-brand text-[10px] font-bold uppercase tracking-widest hover:underline"
              >
                Voir profil
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                {order.client.initials}
              </div>
              <div>
                <p className="font-bold text-slate-800">{order.client.nom}</p>
                <p className="text-[11px] text-slate-400">{order.client.depuis}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
                <span className="text-slate-600">{order.client.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-sm">call</span>
                <span className="text-slate-600">{order.client.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">location_on</span>
                <span className="text-slate-600 whitespace-pre-line leading-relaxed">{order.client.adresse}</span>
              </div>
            </div>
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Paiement</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500">credit_card</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{order.paiement.methode}</p>
                  <p className="text-[10px] text-slate-400">{order.paiement.detail}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold font-badge rounded-full ${order.paiement.statutBg}`}>
                {order.paiement.statut}
              </span>
            </div>
          </div>

          {/* Livraison */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Livraison</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{order.livraison.transporteur}</p>
                <span className={`px-2.5 py-1 text-[10px] font-bold font-badge rounded-full ${order.livraison.statutBg}`}>
                  {order.livraison.statut}
                </span>
              </div>
              {order.livraison.tracking !== '—' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">N° de suivi</p>
                  <p className="text-sm font-mono font-bold text-brand">{order.livraison.tracking}</p>
                </div>
              )}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Adresse d'expédition</p>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{order.livraison.adresse}</p>
              </div>
              <button
                onClick={() => toast.info('Étiquette d\'envoi générée.')}
                className="w-full py-2.5 border-2 border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors"
              >
                Générer étiquette d'envoi
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Historique</h4>
            <div className="space-y-0">
              {order.timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${event.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-white text-sm">{event.icon}</span>
                    </div>
                    {i < order.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate-200 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-slate-800">{event.label}</p>
                    <p className="text-[10px] text-slate-400">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Actions rapides</p>
            <button
              onClick={() => toast.info('Impression de la facture...')}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Imprimer facture
            </button>
            <button
              onClick={() => toast.info('Envoi du récapitulatif au client...')}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">forward_to_inbox</span>
              Renvoyer confirmation
            </button>
            <button
              onClick={() => {
                toast.info('Remboursement initié.')
                navigate('/retours')
              }}
              className="w-full py-3 bg-white hover:bg-red-50 text-red-500 font-bold text-xs rounded-xl border border-red-100 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              Initier un remboursement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
