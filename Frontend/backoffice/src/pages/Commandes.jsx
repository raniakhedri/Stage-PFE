import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const mockCommandes = [
  {
    id: '#ORD-9842',
    client: 'Marc Bernard',
    email: 'm.bernard@gmail.com',
    phone: '06 12 34 56 78',
    initials: 'MB',
    paiement: 'Carte',
    paiementBg: 'bg-badge/10 text-badge',
    statut: 'Livrée',
    statutBg: 'bg-badge/10 text-badge',
    livraison: 'Livré',
    livraisonBg: 'bg-slate-100 text-slate-600',
    total: '120.00 €',
    date: '12 Mar 2026',
    items: 3,
    urgent: false,
  },
  {
    id: '#ORD-9843',
    client: 'Alice Dubois',
    email: 'a.dubois@outlook.com',
    phone: '07 89 45 12 30',
    initials: 'AD',
    paiement: 'À la livraison',
    paiementBg: 'bg-amber-100 text-amber-800',
    statut: 'Confirmée',
    statutBg: 'bg-blue-100 text-blue-700',
    livraison: 'En préparation',
    livraisonBg: 'bg-blue-50 text-blue-600',
    total: '345.50 €',
    date: '12 Mar 2026',
    items: 5,
    urgent: true,
  },
  {
    id: '#ORD-9844',
    client: 'Julie Morel',
    email: 'jmorel@pro.fr',
    phone: '01 45 67 89 00',
    initials: 'JM',
    paiement: 'Échec',
    paiementBg: 'bg-red-100 text-red-800',
    statut: 'Annulée',
    statutBg: 'bg-red-100 text-red-700',
    livraison: '—',
    livraisonBg: 'bg-slate-50 text-slate-400',
    total: '56.00 €',
    date: '11 Mar 2026',
    items: 1,
    urgent: false,
  },
  {
    id: '#ORD-9845',
    client: 'Thomas Klein',
    email: 'tklein@gmail.com',
    phone: '06 00 11 22 33',
    initials: 'TK',
    paiement: 'Remboursé',
    paiementBg: 'bg-purple-100 text-purple-800',
    statut: 'Retournée',
    statutBg: 'bg-slate-700 text-white',
    livraison: 'Retour en cours',
    livraisonBg: 'bg-amber-50 text-amber-700',
    total: '890.00 €',
    date: '10 Mar 2026',
    items: 8,
    urgent: false,
  },
  {
    id: '#ORD-9846',
    client: 'Sophie Laurent',
    email: 's.laurent@email.com',
    phone: '06 55 44 33 22',
    initials: 'SL',
    paiement: 'Carte',
    paiementBg: 'bg-badge/10 text-badge',
    statut: 'En attente',
    statutBg: 'bg-amber-100 text-amber-700',
    livraison: 'En attente',
    livraisonBg: 'bg-amber-50 text-amber-600',
    total: '215.00 €',
    date: '10 Mar 2026',
    items: 2,
    urgent: true,
  },
  {
    id: '#ORD-9847',
    client: 'Pierre Garnier',
    email: 'p.garnier@pro.fr',
    phone: '06 77 88 99 00',
    initials: 'PG',
    paiement: 'Virement',
    paiementBg: 'bg-sky-100 text-sky-800',
    statut: 'Expédiée',
    statutBg: 'bg-indigo-100 text-indigo-700',
    livraison: 'En transit',
    livraisonBg: 'bg-indigo-50 text-indigo-600',
    total: '1 240.00 €',
    date: '09 Mar 2026',
    items: 12,
    urgent: false,
  },
  {
    id: '#ORD-9848',
    client: 'Nathalie Mercier',
    email: 'n.mercier@corp.com',
    phone: '01 23 45 67 89',
    initials: 'NM',
    paiement: 'Carte',
    paiementBg: 'bg-badge/10 text-badge',
    statut: 'Livrée',
    statutBg: 'bg-badge/10 text-badge',
    livraison: 'Livré',
    livraisonBg: 'bg-slate-100 text-slate-600',
    total: '78.50 €',
    date: '08 Mar 2026',
    items: 1,
    urgent: false,
  },
  {
    id: '#ORD-9849',
    client: 'David Roux',
    email: 'd.roux@email.com',
    phone: '06 11 22 33 44',
    initials: 'DR',
    paiement: 'À la livraison',
    paiementBg: 'bg-amber-100 text-amber-800',
    statut: 'Confirmée',
    statutBg: 'bg-blue-100 text-blue-700',
    livraison: 'En préparation',
    livraisonBg: 'bg-blue-50 text-blue-600',
    total: '432.00 €',
    date: '08 Mar 2026',
    items: 4,
    urgent: true,
  },
]

const kpiData = [
  {
    label: 'Total Commandes',
    value: '1 284',
    sub: '+12.5%',
    subColor: 'text-brand',
    icon: 'shopping_cart',
    iconBg: 'bg-badge/10 text-badge',
  },
  {
    label: "Chiffre d'affaires",
    value: '142 500 €',
    sub: '+8.3%',
    subColor: 'text-brand',
    icon: 'payments',
    iconBg: 'bg-badge/10 text-badge',
  },
  {
    label: 'En attente',
    value: '42',
    sub: '3 urgentes',
    subColor: 'text-amber-500',
    icon: 'pending_actions',
    iconBg: 'bg-amber-50 text-amber-500',
  },
  {
    label: 'Taux de livraison',
    value: '94.2%',
    sub: '+2.1%',
    subColor: 'text-brand',
    icon: 'local_shipping',
    iconBg: 'bg-blue-50 text-blue-500',
  },
]

const statutOptions = ['Tous', 'En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée', 'Retournée']
const paiementOptions = ['Tous', 'Carte', 'À la livraison', 'Virement', 'Remboursé', 'Échec']
const periodeOptions = ['Toutes', 'Aujourd\'hui', '7 derniers jours', '30 derniers jours', '90 derniers jours']

export default function Commandes() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const [filterPaiement, setFilterPaiement] = useState('Tous')
  const [filterPeriode, setFilterPeriode] = useState('Toutes')
  const [page, setPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const filtered = mockCommandes.filter((c) => {
    const matchSearch =
      search === '' ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === 'Tous' || c.statut === filterStatut
    const matchPaiement = filterPaiement === 'Tous' || c.paiement === filterPaiement
    return matchSearch && matchStatut && matchPaiement
  })

  const toggleRow = (id) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )

  const toggleAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filtered.map((c) => c.id))
    }
  }

  const resetFilters = () => {
    setSearch('')
    setFilterStatut('Tous')
    setFilterPaiement('Tous')
    setFilterPeriode('Toutes')
  }

  const handleBulkAction = (action) => {
    if (selectedRows.length === 0) {
      toast.error('Sélectionnez au moins une commande.')
      return
    }
    const count = selectedRows.length
    if (action === 'export') toast.success(`${count} commande(s) exportée(s).`)
    if (action === 'status') toast.success(`Statut mis à jour pour ${count} commande(s).`)
    setSelectedRows([])
  }

  // Delivery trend bars (static mock)
  const deliveryBars = [
    { label: 'LUN', h: 60 },
    { label: 'MAR', h: 80 },
    { label: 'MER', h: 95 },
    { label: 'JEU', h: 70 },
    { label: 'VEN', h: 85 },
    { label: 'SAM', h: 45 },
    { label: 'DIM', h: 30 },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ── Page Header ── */}
      <PageHeader title="Gestion des commandes">
        <PageHeader.SecondaryBtn icon="file_download" onClick={() => handleBulkAction('export')}>
          Exporter
        </PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={() => toast.info('Création manuelle à venir.')}>
          Nouvelle commande
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm p-5 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou ID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all outline-none"
          />
        </div>

        {/* Selects */}
        <CustomSelect value={filterPeriode} onChange={setFilterPeriode} options={periodeOptions} size="sm" className="min-w-[150px]" />
        <CustomSelect value={filterStatut} onChange={setFilterStatut} options={statutOptions} size="sm" className="min-w-[150px]" />
        <CustomSelect value={filterPaiement} onChange={setFilterPaiement} options={paiementOptions} size="sm" className="min-w-[150px]" />
        <button
          onClick={resetFilters}
          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Réinitialiser"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
        </button>
      </div>

      {/* ── Bulk actions bar ── */}
      {selectedRows.length > 0 && (
        <div className="bg-brand/5 border border-brand/20 rounded-custom p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-brand">
            {selectedRows.length} commande(s) sélectionnée(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('status')}
              className="px-4 py-2 bg-btn text-white text-xs font-bold rounded-lg hover:bg-btn-dark transition-colors"
            >
              Changer statut
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Exporter sélection
            </button>
            <button
              onClick={() => setSelectedRows([])}
              className="px-4 py-2 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Orders Table ── */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-brand focus:ring-brand"
                  />
                </th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">ID Commande</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Client</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Paiement</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Statut</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Livraison</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Total</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                    <p className="font-medium">Aucune commande trouvée</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-none ${
                      selectedRows.includes(c.id) ? 'bg-brand/5' : ''
                    }`}
                    onClick={() => navigate(`/commandes/${c.id.replace('#ORD-', '')}`)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(c.id)}
                        onChange={() => toggleRow(c.id)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand text-sm">{c.id}</span>
                        {c.urgent && (
                          <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Urgent" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                          {c.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{c.client}</p>
                          <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${c.paiementBg}`}>
                        {c.paiement}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${c.statutBg}`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${c.livraisonBg}`}>
                        {c.livraison}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-slate-800 text-sm">
                      {c.total}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{c.date}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/commandes/${c.id.replace('#ORD-', '')}`)}
                          className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button
                          onClick={() => toast.info(`Impression de ${c.id}`)}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Imprimer"
                        >
                          <span className="material-symbols-outlined text-lg">print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Affichage de {filtered.length} sur 1 284 commandes
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  page === p
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(3, page + 1))}
              disabled={page === 3}
              className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Insight Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery trends */}
        <div className="lg:col-span-2 bg-white rounded-custom border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800">Tendances de livraison</h4>
              <p className="text-xs text-slate-400 mt-0.5">Commandes expédiées cette semaine</p>
            </div>
            <span className="material-symbols-outlined text-brand">insights</span>
          </div>
          <div className="h-44 w-full flex items-end gap-3 px-2">
            {deliveryBars.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    bar.h === Math.max(...deliveryBars.map((b) => b.h))
                      ? 'bg-brand'
                      : 'bg-brand/20'
                  }`}
                  style={{ height: `${bar.h}%` }}
                />
                <span className="text-[10px] font-bold text-slate-500">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent CTA */}
        <div className="bg-brand rounded-custom p-6 flex flex-col justify-between text-white shadow-sm">
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <h4 className="text-lg font-bold mb-2">Traitement Rapide</h4>
            <p className="text-sm text-white/70 leading-relaxed">
              Vous avez <span className="font-bold text-white">3 commandes urgentes</span> à valider pour expédition avant 14h00.
            </p>
          </div>
          <button
            onClick={() => {
              setFilterStatut('En attente')
              toast.info('Filtre appliqué : commandes en attente.')
            }}
            className="w-full mt-6 py-3 bg-white text-brand rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Accéder aux urgences
          </button>
        </div>
      </div>
    </div>
  )
}
