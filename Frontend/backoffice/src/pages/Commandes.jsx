import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import apiClient from '../api/apiClient'

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
  REMBOURSEE: 'Remboursée',
}

const STATUS_BG = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  CONFIRMEE: 'bg-blue-100 text-blue-700',
  EN_PREPARATION: 'bg-indigo-100 text-indigo-700',
  EXPEDIEE: 'bg-indigo-100 text-indigo-700',
  LIVREE: 'bg-badge/10 text-badge',
  ANNULEE: 'bg-red-100 text-red-700',
  REMBOURSEE: 'bg-purple-100 text-purple-700',
}

const statutOptions = ['Tous', 'En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée']

// An order is archived when manually archived OR (terminal status AND older than 24h)
// manuallyArchived set is passed in at call site
const isArchivedAuto = (o) => {
  if (o.status !== 'LIVREE' && o.status !== 'ANNULEE') return false
  return Date.now() - new Date(o.createdAt).getTime() > 24 * 60 * 60 * 1000
}

function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '??'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Commandes() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('actives')

  // Active orders filters
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const [page, setPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  // Archive filters
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveCategory, setArchiveCategory] = useState('Toutes')
  const [archivePriceMin, setArchivePriceMin] = useState('')
  const [archivePriceMax, setArchivePriceMax] = useState('')
  const [archivePage, setArchivePage] = useState(1)

  const perPage = 10

  // Manually archived order IDs (persisted in localStorage)
  const [manuallyArchived, setManuallyArchived] = useState(() => {
    try {
      const stored = localStorage.getItem('archivedOrderIds')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })

  const archiveManually = (id) => {
    setManuallyArchived(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem('archivedOrderIds', JSON.stringify([...next])) } catch {}
      return next
    })
    toast.success('Commande archivée')
  }

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/admin/orders')
      setOrders(Array.isArray(data) ? data : (data?.content || []))
    } catch (err) {
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/admin/products?size=1000')
      const list = Array.isArray(data) ? data : (data?.content || [])
      setProducts(list)
    } catch {
      // silent — category filter degrades gracefully
    }
  }

  // KPIs — exclude cancelled & refunded from revenue
  const totalOrders = orders.length
  const revenueOrders = orders.filter(o => o.status !== 'ANNULEE' && o.status !== 'REMBOURSEE')
  const totalRevenueTTC = revenueOrders.reduce((s, o) => s + (o.total || 0), 0)
  const totalTva = revenueOrders.reduce((s, o) => s + (o.tvaAmount || 0), 0)
  const totalRevenueHT = totalRevenueTTC - totalTva
  const enAttente = orders.filter(o => o.status === 'EN_ATTENTE').length

  const kpiData = [
    { label: 'Total Commandes', value: String(totalOrders), icon: 'shopping_cart', iconBg: 'bg-badge/10 text-badge' },
    { label: "Chiffre d'affaires HT", value: `${totalRevenueHT.toFixed(2)} DT`, icon: 'payments', iconBg: 'bg-badge/10 text-badge' },
    { label: 'En attente', value: String(enAttente), sub: enAttente > 0 ? 'À traiter' : '', subColor: 'text-amber-500', icon: 'pending_actions', iconBg: 'bg-amber-50 text-amber-500' },
    { label: 'Total TVA collectée', value: `${totalTva.toFixed(2)} DT`, icon: 'receipt_long', iconBg: 'bg-purple-50 text-purple-500' },
  ]

  // Product → category map (productId → categoryNom)
  const productCategoryMap = useMemo(() => {
    const map = {}
    products.forEach(p => { map[p.id] = p.categoryNom || '' })
    return map
  }, [products])

  // Split active vs archived
  const isArchived = (o) => manuallyArchived.has(o.id) || isArchivedAuto(o)
  const activeOrders = orders.filter(o => !isArchived(o))
  const archivedOrders = orders.filter(o => isArchived(o))

  // Unique categories found in archived orders' items
  const archiveCategories = useMemo(() => {
    const cats = new Set()
    archivedOrders.forEach(o => {
      ;(o.items || []).forEach(item => {
        const cat = productCategoryMap[item.productId]
        if (cat) cats.add(cat)
      })
    })
    return ['Toutes', ...Array.from(cats).sort()]
  }, [archivedOrders, productCategoryMap])

  // Filter active orders
  const filtered = activeOrders.filter((o) => {
    const statusLabel = STATUS_LABELS[o.status] || o.status
    const matchSearch =
      search === '' ||
      (o.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (o.email || '').toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === 'Tous' || statusLabel === filterStatut
    return matchSearch && matchStatut
  })

  // Pagination for active orders
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  // Filter archived orders
  const filteredArchived = archivedOrders.filter(o => {
    const matchSearch =
      archiveSearch === '' ||
      (o.reference || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(archiveSearch.toLowerCase())
    const matchPrice =
      (!archivePriceMin || o.total >= parseFloat(archivePriceMin)) &&
      (!archivePriceMax || o.total <= parseFloat(archivePriceMax))
    const matchCategory =
      archiveCategory === 'Toutes' ||
      (o.items || []).some(item => productCategoryMap[item.productId] === archiveCategory)
    return matchSearch && matchPrice && matchCategory
  })
  const archiveTotalPages = Math.max(1, Math.ceil(filteredArchived.length / perPage))
  const archivedPaginated = filteredArchived.slice((archivePage - 1) * perPage, archivePage * perPage)

  const toggleRow = (id) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )

  const toggleAll = () => {
    if (selectedRows.length === paginated.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginated.map((c) => c.id))
    }
  }

  const resetFilters = () => {
    setSearch('')
    setFilterStatut('Tous')
    setPage(1)
  }

  const resetArchiveFilters = () => {
    setArchiveSearch('')
    setArchiveCategory('Toutes')
    setArchivePriceMin('')
    setArchivePriceMax('')
    setArchivePage(1)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ── Page Header ── */}
      <PageHeader title="Gestion des commandes">
        <PageHeader.SecondaryBtn icon="refresh" onClick={() => { fetchOrders(); fetchProducts() }}>
          Actualiser
        </PageHeader.SecondaryBtn>
      </PageHeader>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('actives')}
          className={`px-5 py-3 text-sm font-bold transition-colors relative ${
            activeTab === 'actives'
              ? 'text-brand after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Commandes actives
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'actives' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'}`}>
              {activeOrders.length}
            </span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-5 py-3 text-sm font-bold transition-colors relative ${
            activeTab === 'archive'
              ? 'text-brand after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Archive
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'archive' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'}`}>
              {archivedOrders.length}
            </span>
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════ ACTIVE ORDERS TAB ══════════════════════════════════════ */}
      {activeTab === 'actives' && (
        <>
          {/* ── Filters ── */}
          <div className="bg-white p-5 rounded-custom border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <span className="material-symbols-outlined text-xl">search</span>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Rechercher par référence, nom ou email..."
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <CustomSelect value={filterStatut} onChange={(v) => { setFilterStatut(v); setPage(1) }} options={statutOptions} size="sm" className="min-w-[150px]" />
                <button
                  onClick={resetFilters}
                  className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-custom transition-colors"
                  title="Réinitialiser"
                >
                  <span className="material-symbols-outlined text-lg">restart_alt</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Bulk actions bar ── */}
          {selectedRows.length > 0 && (
            <div className="bg-brand/5 border border-brand/20 rounded-custom p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-brand">
                {selectedRows.length} commande(s) sélectionnée(s)
              </span>
              <button
                onClick={() => setSelectedRows([])}
                className="px-4 py-2 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          )}

          {/* ── Orders Table ── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 block animate-spin">progress_activity</span>
                <p className="font-medium">Chargement...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === paginated.length && paginated.length > 0}
                            onChange={toggleAll}
                            className="rounded border-slate-300 text-brand focus:ring-brand"
                          />
                        </th>
                        <th className="px-5 py-4">Référence</th>
                        <th className="px-5 py-4">Client</th>
                        <th className="px-5 py-4">Paiement</th>
                        <th className="px-5 py-4">Statut</th>
                        <th className="px-5 py-4 text-right">Total</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                            <p className="font-medium">Aucune commande trouvée</p>
                          </td>
                        </tr>
                      ) : (
                        paginated.map((o) => (
                          <tr
                            key={o.id}
                            className={`group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-none ${
                              selectedRows.includes(o.id) ? 'bg-brand/5' : ''
                            }`}
                            onClick={() => navigate(`/commandes/${o.id}`)}
                          >
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(o.id)}
                                onChange={() => toggleRow(o.id)}
                                className="rounded border-slate-300 text-brand focus:ring-brand"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-brand text-sm">{o.reference}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                  {getInitials(o.firstName, o.lastName)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-sm truncate">{o.firstName} {o.lastName}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{o.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-badge bg-amber-100 text-amber-800">
                                Espèces
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${STATUS_BG[o.status] || 'bg-slate-100 text-slate-600'}`}>
                                {STATUS_LABELS[o.status] || o.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-extrabold text-slate-800 text-sm">
                              {(o.total || 0).toFixed(2)} DT
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500">{formatDate(o.createdAt)}</td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => navigate(`/commandes/${o.id}`)}
                                  className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                  title="Voir détails"
                                >
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </button>
                                {(o.status === 'LIVREE' || o.status === 'ANNULEE') && (
                                  <button
                                    onClick={() => archiveManually(o.id)}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Archiver maintenant"
                                  >
                                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                                  </button>
                                )}
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
                    Affichage de {paginated.length} sur {filtered.length} commandes
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
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
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════ ARCHIVE TAB ══════════════════════════════════════ */}
      {activeTab === 'archive' && (
        <>
          {/* ── Archive Filters ── */}
          <div className="bg-white p-5 rounded-custom border border-slate-200 shadow-sm space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtres de l'archive</p>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <span className="material-symbols-outlined text-xl">search</span>
                </span>
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => { setArchiveSearch(e.target.value); setArchivePage(1) }}
                  placeholder="Rechercher par référence ou nom..."
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
                />
              </div>
              {/* Category filter */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-xl">category</span>
                <select
                  value={archiveCategory}
                  onChange={(e) => { setArchiveCategory(e.target.value); setArchivePage(1) }}
                  className="border border-slate-200 bg-slate-50/50 rounded-custom px-3 py-2.5 text-sm text-slate-700 focus:ring-brand focus:border-brand outline-none"
                >
                  {archiveCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Price range */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-xl">payments</span>
                <input
                  type="number"
                  value={archivePriceMin}
                  onChange={(e) => { setArchivePriceMin(e.target.value); setArchivePage(1) }}
                  placeholder="Prix min"
                  min="0"
                  className="w-28 border border-slate-200 bg-slate-50/50 rounded-custom px-3 py-2.5 text-sm focus:ring-brand focus:border-brand outline-none"
                />
                <span className="text-slate-400 text-sm">—</span>
                <input
                  type="number"
                  value={archivePriceMax}
                  onChange={(e) => { setArchivePriceMax(e.target.value); setArchivePage(1) }}
                  placeholder="Prix max"
                  min="0"
                  className="w-28 border border-slate-200 bg-slate-50/50 rounded-custom px-3 py-2.5 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <button
                onClick={resetArchiveFilters}
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-custom transition-colors"
                title="Réinitialiser les filtres"
              >
                <span className="material-symbols-outlined text-lg">restart_alt</span>
              </button>
            </div>
          </div>

          {/* ── Archive Table ── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 block animate-spin">progress_activity</span>
                <p className="font-medium">Chargement...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-4">Référence</th>
                        <th className="px-5 py-4">Client</th>
                        <th className="px-5 py-4">Statut</th>
                        <th className="px-5 py-4 text-right">Total</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedPaginated.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                            <p className="font-medium">
                              {archivedOrders.length === 0
                                ? 'Aucune commande archivée pour le moment'
                                : 'Aucune commande ne correspond aux filtres'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        archivedPaginated.map((o) => (
                          <tr
                            key={o.id}
                            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-none"
                            onClick={() => navigate(`/commandes/${o.id}`)}
                          >
                            <td className="px-5 py-4">
                              <span className="font-bold text-brand text-sm">{o.reference}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                  {getInitials(o.firstName, o.lastName)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-sm truncate">{o.firstName} {o.lastName}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{o.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${STATUS_BG[o.status] || 'bg-slate-100 text-slate-600'}`}>
                                {STATUS_LABELS[o.status] || o.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-extrabold text-slate-800 text-sm">
                              {(o.total || 0).toFixed(2)} DT
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500">{formatDate(o.createdAt)}</td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => navigate(`/commandes/${o.id}`)}
                                  className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                  title="Voir détails"
                                >
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Archive Pagination */}
                {archivedOrders.length > 0 && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      Affichage de {archivedPaginated.length} sur {filteredArchived.length} commandes archivées
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setArchivePage(Math.max(1, archivePage - 1))}
                        disabled={archivePage === 1}
                        className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(archiveTotalPages, 5) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setArchivePage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            archivePage === p
                              ? 'bg-brand text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setArchivePage(Math.min(archiveTotalPages, archivePage + 1))}
                        disabled={archivePage === archiveTotalPages}
                        className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}