import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const remboursements = [
  { id: '#RMB-001', retour: '#RET-4831', client: 'Luc Bernard',      montant: 15.50,  date: '20/03/2026', mode: 'Carte bancaire', statut: 'Complété' },
  { id: '#RMB-002', retour: '#RET-4828', client: 'Sophie Martin',    montant: 67.00,  date: '18/03/2026', mode: 'Virement',       statut: 'Complété' },
  { id: '#RMB-003', retour: '#RET-4820', client: 'Paul Rousseau',    montant: 120.00, date: '15/03/2026', mode: 'Carte bancaire', statut: 'Complété' },
  { id: '#RMB-004', retour: '#RET-4815', client: 'Emma Leroy',       montant: 42.50,  date: '12/03/2026', mode: 'Avoir',          statut: 'Complété' },
  { id: '#RMB-005', retour: '#RET-4808', client: 'Marc Durand',      montant: 89.00,  date: '10/03/2026', mode: 'Carte bancaire', statut: 'Complété' },
  { id: '#RMB-006', retour: '#RET-4801', client: 'Léa Bonnet',       montant: 220.00, date: '05/03/2026', mode: 'Virement',       statut: 'Complété' },
  { id: '#RMB-007', retour: '#RET-4795', client: 'Thomas Petit',     montant: 35.99,  date: '02/03/2026', mode: 'Carte bancaire', statut: 'Complété' },
  { id: '#RMB-008', retour: '#RET-4788', client: 'Julie Moreau',     montant: 78.00,  date: '28/02/2026', mode: 'Avoir',          statut: 'Complété' },
  { id: '#RMB-009', retour: '#RET-4782', client: 'Nicolas Faure',    montant: 156.00, date: '25/02/2026', mode: 'Virement',       statut: 'Complété' },
  { id: '#RMB-010', retour: '#RET-4770', client: 'Claire Dupuis',    montant: 44.90,  date: '20/02/2026', mode: 'Carte bancaire', statut: 'Complété' },
  { id: '#RMB-011', retour: '#RET-4765', client: 'Antoine Garcia',   montant: 199.00, date: '18/02/2026', mode: 'Carte bancaire', statut: 'En cours' },
  { id: '#RMB-012', retour: '#RET-4760', client: 'Sarah Blanc',      montant: 112.50, date: '15/02/2026', mode: 'Virement',       statut: 'En cours' },
]

const total = remboursements.reduce((acc, r) => acc + r.montant, 0)
const totalCompletes = remboursements.filter((r) => r.statut === 'Complété').reduce((acc, r) => acc + r.montant, 0)
const enCours = remboursements.filter((r) => r.statut === 'En cours')

const kpiData = [
  {
    label: 'Total Remboursé',
    value: totalCompletes.toFixed(2).replace('.', ',') + ' €',
    sub: 'Complétés',
    subColor: 'text-slate-400',
    icon: 'payments',
    iconBg: 'bg-badge/10 text-badge',
  },
  {
    label: 'Nombre de Remboursements',
    value: String(remboursements.length),
    sub: `${enCours.length} en cours`,
    subColor: 'text-amber-500',
    icon: 'receipt_long',
    iconBg: 'bg-blue-50 text-blue-500',
  },
  {
    label: 'Montant Moyen',
    value: (total / remboursements.length).toFixed(2).replace('.', ',') + ' €',
    sub: 'par remboursement',
    subColor: 'text-slate-400',
    icon: 'calculate',
    iconBg: 'bg-purple-50 text-purple-500',
  },
  {
    label: 'En Cours de Traitement',
    value: enCours.reduce((acc, r) => acc + r.montant, 0).toFixed(2).replace('.', ',') + ' €',
    sub: `${enCours.length} demandes`,
    subColor: 'text-amber-500',
    icon: 'hourglass_top',
    iconBg: 'bg-amber-50 text-amber-500',
  },
]

const modeOptions = ['Tous les modes', 'Carte bancaire', 'Virement', 'Avoir']
const statutOptions = ['Tous les statuts', 'Complété', 'En cours']

export default function HistoriqueRemboursements() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState('Tous les modes')
  const [filterStatut, setFilterStatut] = useState('Tous les statuts')

  const filtered = remboursements.filter((r) => {
    const matchSearch =
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.retour.toLowerCase().includes(search.toLowerCase())
    const matchMode = filterMode === 'Tous les modes' || r.mode === filterMode
    const matchStatut = filterStatut === 'Tous les statuts' || r.statut === filterStatut
    return matchSearch && matchMode && matchStatut
  })

  const filteredTotal = filtered.reduce((acc, r) => acc + r.montant, 0)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* Page Header */}
      <PageHeader title="Historique des Remboursements">
        <PageHeader.SecondaryBtn icon="arrow_back" onClick={() => navigate('/retours')}>
          Retour aux demandes
        </PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="download">Exporter CSV</PageHeader.SecondaryBtn>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-custom border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par client, ID remboursement ou ID retour..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <CustomSelect value={filterMode} onChange={setFilterMode} options={modeOptions} size="sm" />
            <CustomSelect value={filterStatut} onChange={setFilterStatut} options={statutOptions} size="sm" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Retour Associé</th>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4">Montant</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Mode</th>
              <th className="px-5 py-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">search_off</span>
                  Aucun remboursement trouvé
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-brand text-sm whitespace-nowrap">{r.id}</td>
                  <td className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">{r.retour}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800 text-sm whitespace-nowrap">{r.client}</td>
                  <td className="px-5 py-4 font-bold text-slate-900 text-sm whitespace-nowrap">{r.montant.toFixed(2).replace('.', ',')} €</td>
                  <td className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">{r.date}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      r.mode === 'Carte bancaire' ? 'text-blue-600' :
                      r.mode === 'Virement' ? 'text-purple-600' : 'text-amber-600'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {r.mode === 'Carte bancaire' ? 'credit_card' :
                         r.mode === 'Virement' ? 'account_balance' : 'card_giftcard'}
                      </span>
                      {r.mode}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${
                      r.statut === 'Complété'
                        ? 'bg-badge/10 text-badge'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.statut.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''} — Total affiché : <span className="text-slate-700">{filteredTotal.toFixed(2).replace('.', ',')} €</span>
          </span>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <button className="p-1 hover:text-brand transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="bg-brand text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">1</span>
            <button className="p-1 hover:text-brand transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
