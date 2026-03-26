import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import CustomSelect from '../components/ui/CustomSelect'

/* ══════════════════════════════════════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════════════════════════════════ */
const typeConfig = {
  pourcentage:  { label: 'Pourcentage',       icon: 'percent',         badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  fixe:         { label: 'Montant fixe',       icon: 'payments',        badge: 'bg-badge/5 text-badge border-badge/10' },
  livraison:    { label: 'Livraison gratuite', icon: 'local_shipping',  badge: 'bg-purple-50 text-purple-700 border-purple-100' },
  cadeau:       { label: 'Cadeau',             icon: 'redeem',          badge: 'bg-pink-50 text-pink-700 border-pink-100' },
  bogo:         { label: 'BOGO',               icon: 'shopping_bag',    badge: 'bg-amber-50 text-amber-700 border-amber-100' },
}

const statutConfig = {
  actif:    { label: 'ACTIF',    bg: 'bg-badge text-white' },
  expire:   { label: 'EXPIRÉ',   bg: 'bg-slate-400 text-white' },
  brouillon:{ label: 'BROUILLON',bg: 'bg-amber-400 text-white' },
  planifie: { label: 'PLANIFIÉ', bg: 'bg-blue-500 text-white' },
}

const initialCoupons = [
  {
    id: 1, code: 'SUMMER24', type: 'pourcentage', valeur: 20, montantMin: 50,
    dateDebut: '2024-06-01', dateFin: '2024-08-31', heureDebut: '00:00', heureFin: '23:59',
    statut: 'actif', utilisations: 45, limiteGlobale: 100, limiteClient: 1,
    segment: 'tous', categories: ['Vestes'], produits: [],
    revenus: 2850, commandes: 45, conversion: 42, auto: false,
  },
  {
    id: 2, code: 'WELCOME10', type: 'pourcentage', valeur: 10, montantMin: 0,
    dateDebut: '2024-01-01', dateFin: '', heureDebut: '00:00', heureFin: '23:59',
    statut: 'actif', utilisations: 128, limiteGlobale: 0, limiteClient: 1,
    segment: 'nouveaux', categories: [], produits: [],
    revenus: 4200, commandes: 128, conversion: 38, auto: true,
  },
  {
    id: 3, code: 'WINTER23', type: 'pourcentage', valeur: 15, montantMin: 30,
    dateDebut: '2023-11-01', dateFin: '2023-12-31', heureDebut: '00:00', heureFin: '23:59',
    statut: 'expire', utilisations: 89, limiteGlobale: 200, limiteClient: 2,
    segment: 'tous', categories: [], produits: [],
    revenus: 1560, commandes: 89, conversion: 5, auto: false,
  },
  {
    id: 4, code: 'FREESHIP', type: 'livraison', valeur: 0, montantMin: 75,
    dateDebut: '2024-03-01', dateFin: '2024-06-30', heureDebut: '08:00', heureFin: '22:00',
    statut: 'actif', utilisations: 210, limiteGlobale: 500, limiteClient: 3,
    segment: 'fideles', categories: [], produits: [],
    revenus: 6300, commandes: 210, conversion: 28, auto: false,
  },
  {
    id: 5, code: 'VIP-BOGO', type: 'bogo', valeur: 0, montantMin: 100,
    dateDebut: '2024-07-01', dateFin: '2024-07-15', heureDebut: '00:00', heureFin: '23:59',
    statut: 'planifie', utilisations: 0, limiteGlobale: 50, limiteClient: 1,
    segment: 'vip', categories: ['Chaussures'], produits: [],
    revenus: 0, commandes: 0, conversion: 0, auto: false,
  },
  {
    id: 6, code: 'GIFT-20', type: 'cadeau', valeur: 20, montantMin: 150,
    dateDebut: '2024-04-01', dateFin: '2024-04-30', heureDebut: '00:00', heureFin: '23:59',
    statut: 'brouillon', utilisations: 0, limiteGlobale: 30, limiteClient: 1,
    segment: 'tous', categories: [], produits: ['Casque Pro'],
    revenus: 0, commandes: 0, conversion: 0, auto: false,
  },
  {
    id: 7, code: 'BIRTHDAY', type: 'fixe', valeur: 15, montantMin: 0,
    dateDebut: '', dateFin: '', heureDebut: '', heureFin: '',
    statut: 'actif', utilisations: 64, limiteGlobale: 0, limiteClient: 1,
    segment: 'tous', categories: [], produits: [],
    revenus: 960, commandes: 64, conversion: 72, auto: true,
  },
]

const segmentOptions = [
  { value: 'tous', label: 'Tous les clients' },
  { value: 'vip', label: 'Clients VIP' },
  { value: 'nouveaux', label: 'Nouveaux clients' },
  { value: 'fideles', label: 'Clients fidèles' },
  { value: 'inactifs', label: 'Clients inactifs' },
]

const typeOptions = [
  { value: 'pourcentage', label: 'Pourcentage (%)' },
  { value: 'fixe', label: 'Montant fixe (€)' },
  { value: 'livraison', label: 'Livraison gratuite' },
  { value: 'cadeau', label: 'Cadeau' },
  { value: 'bogo', label: 'BOGO (1 acheté = 1 offert)' },
]

const categorieOptions = ['Vestes', 'Chaussures', 'Pantalons', 'Gants', 'Casques', 'Accessoires']

const filterStatutOptions = ['Tous les statuts', 'Actif', 'Expiré', 'Brouillon', 'Planifié']
const filterTypeOptions = ['Tous les types', 'Pourcentage', 'Montant fixe', 'Livraison gratuite', 'Cadeau', 'BOGO']

const autoTriggers = [
  { icon: 'cake', label: 'Anniversaire client', desc: 'Cadeau automatique le jour de l\'anniversaire', color: 'text-pink-500' },
  { icon: 'redeem', label: 'Première commande', desc: 'Bienvenue -10% sur le 1er achat', color: 'text-brand' },
  { icon: 'remove_shopping_cart', label: 'Panier abandonné', desc: 'Relance -5% après 24h d\'abandon', color: 'text-amber-500' },
  { icon: 'psychology', label: 'Client hésitant', desc: 'Détecte hésitation → -10% flash auto', color: 'text-blue-500' },
]

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════════ */
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = 'AUTO-'
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)]
  return c
}

function ProgressBar({ value, max, color = 'bg-brand' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{value}{max > 0 ? ` / ${max}` : ''}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function Promotions() {
  /* ── Tab ── */
  const [tab, setTab] = useState('coupons') // 'coupons' | 'remise'

  /* ── Coupons state ── */
  const [coupons, setCoupons] = useState(initialCoupons)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous les statuts')
  const [filterType, setFilterType] = useState('Tous les types')
  const [page, setPage] = useState(1)
  const perPage = 10

  /* ── Modal create coupon ── */
  const [showCreate, setShowCreate] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState('pourcentage')
  const [newValeur, setNewValeur] = useState('')
  const [newMontantMin, setNewMontantMin] = useState('')
  const [newDateDebut, setNewDateDebut] = useState('')
  const [newDateFin, setNewDateFin] = useState('')
  const [newHeureDebut, setNewHeureDebut] = useState('00:00')
  const [newHeureFin, setNewHeureFin] = useState('23:59')
  const [newLimiteGlobale, setNewLimiteGlobale] = useState('')
  const [newLimiteClient, setNewLimiteClient] = useState('1')
  const [newSegment, setNewSegment] = useState('tous')
  const [newCategories, setNewCategories] = useState([])
  const [newAuto, setNewAuto] = useState(false)

  /* ── Modal détail / performances ── */
  const [detailCoupon, setDetailCoupon] = useState(null)

  /* ── Remise rapide ── */
  const [remiseProduit, setRemiseProduit] = useState('')
  const [remiseType, setRemiseType] = useState('pourcentage')
  const [remiseValeur, setRemiseValeur] = useState('')
  const [remiseCategorie, setRemiseCategorie] = useState('')
  const [remisePrixOriginal] = useState(100) // demo

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return coupons.filter(c => {
      if (filterStatut !== 'Tous les statuts') {
        const map = { 'Actif': 'actif', 'Expiré': 'expire', 'Brouillon': 'brouillon', 'Planifié': 'planifie' }
        if (c.statut !== map[filterStatut]) return false
      }
      if (filterType !== 'Tous les types') {
        const map = { 'Pourcentage': 'pourcentage', 'Montant fixe': 'fixe', 'Livraison gratuite': 'livraison', 'Cadeau': 'cadeau', 'BOGO': 'bogo' }
        if (c.type !== map[filterType]) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!c.code.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [coupons, filterStatut, filterType, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  /* ── KPIs ── */
  const actifs = coupons.filter(c => c.statut === 'actif').length
  const totalRevenus = coupons.reduce((s, c) => s + c.revenus, 0)
  const totalUtilisations = coupons.reduce((s, c) => s + c.utilisations, 0)
  const avgConversion = coupons.filter(c => c.conversion > 0).length > 0
    ? Math.round(coupons.filter(c => c.conversion > 0).reduce((s, c) => s + c.conversion, 0) / coupons.filter(c => c.conversion > 0).length)
    : 0

  /* ── Smart insights ── */
  const bestCoupon = [...coupons].filter(c => c.conversion > 0).sort((a, b) => b.conversion - a.conversion)[0]
  const worstCoupon = [...coupons].filter(c => c.statut !== 'brouillon' && c.statut !== 'planifie' && c.utilisations > 0).sort((a, b) => a.conversion - b.conversion)[0]

  /* ── Actions ── */
  const copierCode = (code) => {
    navigator.clipboard?.writeText(code)
    toast.success(`Code "${code}" copié !`)
  }

  const supprimerCoupon = (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id))
    toast.success('Coupon supprimé.')
  }

  const toggleStatut = (id) => {
    setCoupons(prev => prev.map(c => {
      if (c.id !== id) return c
      if (c.statut === 'actif') return { ...c, statut: 'brouillon' }
      if (c.statut === 'brouillon' || c.statut === 'planifie') return { ...c, statut: 'actif' }
      return c
    }))
  }

  const openCreate = () => {
    setNewCode('')
    setNewType('pourcentage')
    setNewValeur('')
    setNewMontantMin('')
    setNewDateDebut('')
    setNewDateFin('')
    setNewHeureDebut('00:00')
    setNewHeureFin('23:59')
    setNewLimiteGlobale('')
    setNewLimiteClient('1')
    setNewSegment('tous')
    setNewCategories([])
    setNewAuto(false)
    setShowCreate(true)
  }

  const submitCreate = () => {
    if (!newCode.trim()) return toast.error('Le code est obligatoire.')
    if ((newType === 'pourcentage' || newType === 'fixe') && !newValeur) return toast.error('La valeur est obligatoire.')
    const coupon = {
      id: Date.now(),
      code: newCode.trim().toUpperCase(),
      type: newType,
      valeur: parseFloat(newValeur) || 0,
      montantMin: parseFloat(newMontantMin) || 0,
      dateDebut: newDateDebut,
      dateFin: newDateFin,
      heureDebut: newHeureDebut,
      heureFin: newHeureFin,
      statut: newDateDebut && new Date(newDateDebut) > new Date() ? 'planifie' : 'actif',
      utilisations: 0,
      limiteGlobale: parseInt(newLimiteGlobale) || 0,
      limiteClient: parseInt(newLimiteClient) || 0,
      segment: newSegment,
      categories: newCategories,
      produits: [],
      revenus: 0,
      commandes: 0,
      conversion: 0,
      auto: newAuto,
    }
    setCoupons(prev => [coupon, ...prev])
    setShowCreate(false)
    toast.success(`Coupon "${coupon.code}" créé avec succès !`)
  }

  const toggleCatSelection = (cat) => {
    setNewCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const resetFilters = () => {
    setSearch('')
    setFilterStatut('Tous les statuts')
    setFilterType('Tous les types')
    setPage(1)
  }

  /* ── Remise preview ── */
  const remiseMontant = remiseType === 'pourcentage'
    ? (remisePrixOriginal * (parseFloat(remiseValeur) || 0) / 100)
    : (parseFloat(remiseValeur) || 0)
  const prixFinal = Math.max(0, remisePrixOriginal - remiseMontant)

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ── Header ── */}
      <PageHeader title="Coupons & Remises">
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={openCreate}>Ajouter un coupon</PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Coupons actifs" value={actifs} sub={`${coupons.length} total`} subColor="text-slate-400" icon="sell" iconBg="bg-badge/10 text-badge" />
        <KpiCard label="Revenus générés" value={`${totalRevenus.toLocaleString()} €`} sub="+18% ce mois" subColor="text-brand" icon="payments" iconBg="bg-blue-50 text-blue-600" />
        <KpiCard label="Taux d'utilisation" value={totalUtilisations} sub="utilisations totales" subColor="text-slate-400" icon="receipt_long" iconBg="bg-amber-50 text-amber-600" />
        <KpiCard label="Conversion moyenne" value={`${avgConversion}%`} sub={avgConversion >= 30 ? 'Excellent' : 'À améliorer'} subColor={avgConversion >= 30 ? 'text-brand' : 'text-amber-600'} icon="trending_up" iconBg="bg-purple-50 text-purple-600" />
      </div>

      {/* ── Smart Insights ── */}
      <div className="bg-gradient-to-r from-brand/5 to-brand/5 rounded-xl border border-brand/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-brand">psychology</span>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Smart Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bestCoupon && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2 bg-brand/5 rounded-lg"><span className="material-symbols-outlined text-brand">local_fire_department</span></div>
              <div>
                <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Meilleur coupon</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{bestCoupon.code}</p>
                <p className="text-xs text-slate-500 mt-0.5">{bestCoupon.conversion}% conversion · {bestCoupon.revenus.toLocaleString()} € revenus</p>
              </div>
            </div>
          )}
          {worstCoupon && worstCoupon.id !== bestCoupon?.id && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg"><span className="material-symbols-outlined text-amber-600">warning</span></div>
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">À améliorer</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{worstCoupon.code}</p>
                <p className="text-xs text-slate-500 mt-0.5">{worstCoupon.conversion}% conversion seulement</p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><span className="material-symbols-outlined text-blue-600">lightbulb</span></div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Recommandation</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">Flash promo &lt;48h</p>
              <p className="text-xs text-slate-500 mt-0.5">+35% de conversion avec expiration courte</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-8 border-b border-slate-200">
        <button onClick={() => setTab('coupons')} className={`pb-3 text-sm font-bold transition-colors ${tab === 'coupons' ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-800'}`}>
          Coupons
        </button>
        <button onClick={() => setTab('remise')} className={`pb-3 text-sm font-bold transition-colors ${tab === 'remise' ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-800'}`}>
          Remises sur Produits
        </button>
        <button onClick={() => setTab('auto')} className={`pb-3 text-sm font-bold transition-colors ${tab === 'auto' ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-800'}`}>
          Coupons Automatiques
        </button>
      </div>

      {/* ════════════ TAB : Coupons ════════════ */}
      {tab === 'coupons' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher un code coupon..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all outline-none" />
              </div>
              <CustomSelect value={filterStatut} onChange={v => { setFilterStatut(v); setPage(1) }} options={filterStatutOptions} size="sm" className="min-w-[160px]" />
              <CustomSelect value={filterType} onChange={v => { setFilterType(v); setPage(1) }} options={filterTypeOptions} size="sm" className="min-w-[160px]" />
              <button onClick={resetFilters} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Réinitialiser">
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Code</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Remise</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Segment</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Utilisation</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Expiration</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Statut</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Perf.</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(c => {
                    const tc = typeConfig[c.type] || typeConfig.pourcentage
                    const sc = statutConfig[c.statut] || statutConfig.actif
                    const isInactive = c.statut === 'expire'
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Code */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${isInactive ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-brand/5 text-brand border-brand/10'}`}>
                              {c.code}
                            </span>
                            {c.auto && (
                              <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded border border-violet-100 uppercase">Auto</span>
                            )}
                            {c.conversion >= 30 && c.statut === 'actif' && (
                              <span className="material-symbols-outlined text-[14px] text-orange-500" title="Performant">local_fire_department</span>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-badge uppercase tracking-wide border ${tc.badge}`}>
                            <span className="material-symbols-outlined text-[12px]">{tc.icon}</span>
                            {tc.label}
                          </span>
                        </td>

                        {/* Remise */}
                        <td className="px-6 py-3.5">
                          <span className={`text-sm font-bold ${isInactive ? 'text-slate-400' : 'text-slate-800'}`}>
                            {c.type === 'pourcentage' ? `${c.valeur}%` : c.type === 'fixe' ? `${c.valeur} €` : c.type === 'livraison' ? 'Gratuite' : c.type === 'bogo' ? '1+1' : `${c.valeur} €`}
                          </span>
                          {c.montantMin > 0 && <p className="text-[10px] text-slate-400">Min. {c.montantMin} €</p>}
                        </td>

                        {/* Segment */}
                        <td className="px-6 py-3.5">
                          <span className="text-xs text-slate-600 font-medium">{segmentOptions.find(s => s.value === c.segment)?.label || c.segment}</span>
                          {c.categories.length > 0 && <p className="text-[10px] text-slate-400">{c.categories.join(', ')}</p>}
                        </td>

                        {/* Utilisation */}
                        <td className="px-6 py-3.5 min-w-[140px]">
                          <ProgressBar value={c.utilisations} max={c.limiteGlobale} color={c.statut === 'actif' ? 'bg-brand' : 'bg-slate-300'} />
                        </td>

                        {/* Expiration */}
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {c.dateFin ? c.dateFin : <span className="text-slate-300">—</span>}
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-3.5 text-center">
                          <button onClick={() => toggleStatut(c.id)} title="Cliquer pour changer">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-badge uppercase tracking-wider ${sc.bg}`}>{sc.label}</span>
                          </button>
                        </td>

                        {/* Performance */}
                        <td className="px-6 py-3.5 text-center">
                          {c.conversion > 0 ? (
                            <div className="text-center">
                              <span className={`text-sm font-bold ${c.conversion >= 30 ? 'text-brand' : c.conversion >= 15 ? 'text-amber-600' : 'text-red-500'}`}>{c.conversion}%</span>
                              <p className="text-[10px] text-slate-400">{c.revenus.toLocaleString()} €</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copierCode(c.code)} className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-md transition-all" title="Copier code">
                              <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                            <button onClick={() => setDetailCoupon(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="Détails & perf.">
                              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                            </button>
                            <button onClick={() => toast.info(`Partage du code ${c.code} par email...`)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all" title="Envoyer par email">
                              <span className="material-symbols-outlined text-[18px]">mail</span>
                            </button>
                            <button onClick={() => supprimerCoupon(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" title="Supprimer">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginated.length === 0 && (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">
                      <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 block">sell</span>Aucun coupon trouvé.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">{filtered.length === 0 ? 0 : ((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)}</span> sur <span className="font-bold text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom: Conseil Marketing ── */}
          <div className="bg-brand/5 border border-brand/10 p-6 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-brand shrink-0">
              <span className="material-symbols-outlined text-2xl">lightbulb</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Conseil Marketing</h4>
              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                Les coupons avec une date d'expiration courte (&lt;48h) ont un taux de conversion <span className="font-bold text-brand">+35%</span> plus élevé.
                Essayez une <span className="font-bold">flash promo</span> ciblée sur vos clients VIP.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ════════════ TAB : Remises sur Produits ════════════ */}
      {tab === 'remise' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire remise */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-badge/10 text-badge rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">label</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Remise Rapide sur Produit</h4>
                <p className="text-slate-500 text-sm">Appliquez une baisse de prix à un article ou une catégorie.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Rechercher un produit</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input value={remiseProduit} onChange={e => setRemiseProduit(e.target.value)} placeholder="Nom du produit ou SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Appliquer à une catégorie</label>
                <CustomSelect value={remiseCategorie} onChange={setRemiseCategorie} options={['', ...categorieOptions]} placeholder="Catégorie entière (optionnel)" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Type de remise</label>
                <CustomSelect value={remiseType} onChange={setRemiseType} options={[{ value: 'pourcentage', label: 'Pourcentage (%)' }, { value: 'fixe', label: 'Montant fixe (€)' }]} />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Valeur</label>
                <input type="number" value={remiseValeur} onChange={e => setRemiseValeur(e.target.value)} placeholder="Ex: 15"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
              </div>
            </div>

            <button onClick={() => toast.success('Remise appliquée avec succès !')}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all">
              Appliquer la remise immédiate
            </button>
          </div>

          {/* Prévisualisation */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">preview</span>
                Prévisualisation prix
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Prix original</span>
                  <span className="text-sm font-bold text-slate-800">{remisePrixOriginal.toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between text-red-500">
                  <span className="text-sm">Remise {remiseType === 'pourcentage' ? `(${remiseValeur || 0}%)` : `(${remiseValeur || 0} €)`}</span>
                  <span className="text-sm font-bold">-{remiseMontant.toFixed(2)} €</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Prix final</span>
                  <span className="text-xl font-bold text-brand">{prixFinal.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="bg-brand/5 border border-brand/10 p-5 rounded-xl text-center">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-brand">
                <span className="material-symbols-outlined text-2xl">lightbulb</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Astuce</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Remises entre 15-25% → meilleur ratio marge/conversion. Au-delà de 30%, l'impact sur la marge dépasse le gain de volume.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ TAB : Coupons Automatiques ════════════ */}
      {tab === 'auto' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {autoTriggers.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-start gap-4">
                <div className={`w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center ${t.color} shrink-0`}>
                  <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm">{t.label}</h4>
                    <button onClick={() => toast.success(`Trigger "${t.label}" activé !`)}
                      className="px-3 py-1 bg-badge/10 text-badge text-[10px] font-bold rounded-lg hover:bg-badge/20 transition-colors uppercase">
                      Activer
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">smart_toy</span>
              Coupons intelligents actifs
            </h4>
            <div className="space-y-3">
              {coupons.filter(c => c.auto).map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-brand/5 text-brand font-bold text-sm rounded-lg border border-brand/10">{c.code}</span>
                    <span className="text-xs text-slate-500">{c.type === 'pourcentage' ? `${c.valeur}%` : `${c.valeur} €`} · {segmentOptions.find(s => s.value === c.segment)?.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand">{c.utilisations} utilisations</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-badge ${statutConfig[c.statut]?.bg}`}>{statutConfig[c.statut]?.label}</span>
                  </div>
                </div>
              ))}
              {coupons.filter(c => c.auto).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Aucun coupon automatique configuré.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL : Créer coupon ══════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Créer un coupon</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Code */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Code du coupon</label>
                <div className="flex gap-2">
                  <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="Ex: PROMO20"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none font-bold uppercase" />
                  <button onClick={() => setNewCode(genCode())} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap" title="Générer un code automatique">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">casino</span>Auto
                  </button>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type de coupon</label>
                <CustomSelect value={newType} onChange={setNewType} options={typeOptions} />
              </div>

              {/* Valeur */}
              {(newType === 'pourcentage' || newType === 'fixe' || newType === 'cadeau') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valeur {newType === 'pourcentage' ? '(%)' : '(€)'}</label>
                  <input type="number" value={newValeur} onChange={e => setNewValeur(e.target.value)} placeholder="Ex: 15"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
              )}

              {/* Montant minimum */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Montant minimum (€)</label>
                <input type="number" value={newMontantMin} onChange={e => setNewMontantMin(e.target.value)} placeholder="0 = pas de minimum"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
              </div>

              {/* Segment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Segment client</label>
                <CustomSelect value={newSegment} onChange={setNewSegment} options={segmentOptions} />
              </div>

              {/* Auto */}
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button type="button" onClick={() => setNewAuto(!newAuto)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${newAuto ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${newAuto ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-sm font-medium text-slate-700">Coupon automatique</span>
                </label>
              </div>
            </div>

            {/* Planification */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Planification</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date début</label>
                  <input type="date" value={newDateDebut} onChange={e => setNewDateDebut(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Heure début</label>
                  <input type="time" value={newHeureDebut} onChange={e => setNewHeureDebut(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date fin</label>
                  <input type="date" value={newDateFin} onChange={e => setNewDateFin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Heure fin</label>
                  <input type="time" value={newHeureFin} onChange={e => setNewHeureFin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
              </div>
            </div>

            {/* Limites */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Limites d'utilisation</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Limite globale (0 = illimité)</label>
                  <input type="number" value={newLimiteGlobale} onChange={e => setNewLimiteGlobale(e.target.value)} placeholder="Ex: 100"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Limite par client (0 = illimité)</label>
                  <input type="number" value={newLimiteClient} onChange={e => setNewLimiteClient(e.target.value)} placeholder="Ex: 1"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
                </div>
              </div>
            </div>

            {/* Conditions — Catégories */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Produits ciblés (optionnel)</p>
              <div className="flex flex-wrap gap-2">
                {categorieOptions.map(cat => (
                  <button key={cat} type="button" onClick={() => toggleCatSelection(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${newCategories.includes(cat) ? 'border-badge bg-badge/10 text-badge' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={submitCreate} className="px-6 py-2.5 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors shadow-md">Créer le coupon</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL : Détail & Performances ══════════ */}
      {detailCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailCoupon(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-brand/5 text-brand font-bold text-lg rounded-lg border border-brand/10">{detailCoupon.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-badge ${statutConfig[detailCoupon.statut]?.bg}`}>{statutConfig[detailCoupon.statut]?.label}</span>
              </div>
              <button onClick={() => setDetailCoupon(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{typeConfig[detailCoupon.type]?.label}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Valeur</p>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {detailCoupon.type === 'pourcentage' ? `${detailCoupon.valeur}%` : detailCoupon.type === 'fixe' ? `${detailCoupon.valeur} €` : detailCoupon.type === 'livraison' ? 'Gratuite' : detailCoupon.type === 'bogo' ? '1+1' : `${detailCoupon.valeur} €`}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Segment</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{segmentOptions.find(s => s.value === detailCoupon.segment)?.label}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Min. commande</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{detailCoupon.montantMin > 0 ? `${detailCoupon.montantMin} €` : 'Aucun'}</p>
              </div>
            </div>

            {/* Perf */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Performances</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-brand/5 rounded-lg p-4">
                  <p className="text-2xl font-bold text-brand">{detailCoupon.revenus.toLocaleString()} €</p>
                  <p className="text-[10px] text-brand font-bold uppercase mt-1">Revenus générés</p>
                </div>
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-700">{detailCoupon.commandes}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Commandes</p>
                </div>
                <div className="text-center bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-700">{detailCoupon.conversion}%</p>
                  <p className="text-[10px] text-purple-600 font-bold uppercase mt-1">Conversion</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Utilisation</p>
                <ProgressBar value={detailCoupon.utilisations} max={detailCoupon.limiteGlobale} color="bg-brand" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => { copierCode(detailCoupon.code); setDetailCoupon(null) }} className="px-4 py-2 text-sm font-semibold text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">content_copy</span>Copier code
              </button>
              <button onClick={() => { toast.info(`Email envoyé avec le code ${detailCoupon.code}`); setDetailCoupon(null) }} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">mail</span>Partager par email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
