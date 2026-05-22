import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomSelect from '../components/ui/CustomSelect'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import { productApi } from '../api/productApi'

// ── Helpers ────────────────────────────────────────────────────────────────────
function stockMeta(stock, status) {
  if (status === 'Rupture')  return { color: 'text-red-500',   bar: 'bg-red-500',   pct: 0 }
  if (status === 'Critique') return { color: 'text-amber-500', bar: 'bg-amber-500', pct: 15 }
  if (status === 'Faible')   return { color: 'text-amber-500', bar: 'bg-amber-500', pct: 40 }
  return                            { color: 'text-brand',     bar: 'bg-brand',     pct: Math.min(95, 40 + stock / 5) }
}

function firstBadge(p) {
  if (p.badgeNouveau)    return { label: 'New',        bg: 'bg-badge text-white' }
  if (p.badgeBestSeller) return { label: 'Best Seller', bg: 'bg-orange-500 text-white' }
  if (p.badgePromo)      return { label: 'Promo',       bg: 'bg-red-500 text-white' }
  if (p.badgeExclusif)   return { label: 'Exclusif',    bg: 'bg-purple-500 text-white' }
  return null
}

// ── Component ──────────────────────────────────────────────────────────────────
function Produits() {
  const navigate = useNavigate()

  const [products, setProducts]   = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState([])
  const [filterStatut, setFilterStatut] = useState('Statut: Tous')
  const [filterStock, setFilterStock] = useState('Stock: Tout')
  const [perPage, setPerPage]         = useState('10')
  const [page, setPage]               = useState(1)
  const [viewMode, setViewMode]       = useState('actifs')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [data, statsData] = await Promise.all([
        productApi.getAll(),
        productApi.getStats(),
      ])
      setProducts(data || [])
      setStats(statsData || null)
    } catch {
      toast.error('Erreur lors du chargement des produits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const displayed = useMemo(() => {
    return products.filter(p => {
      if (viewMode === 'archives' && p.statut !== 'archive') return false
      if (viewMode === 'actifs' && p.statut === 'archive') return false
      if (search) {
        const q = search.toLowerCase()
        if (!(p.nom||'').toLowerCase().includes(q) &&
            !(p.sku||'').toLowerCase().includes(q) &&
            !(p.categoryNom||'').toLowerCase().includes(q)) return false
      }
      if (filterStatut !== 'Statut: Tous') {
        const map = { 'Actif': 'actif', 'Désactivé': 'desactive', 'Draft': 'draft' }
        if (p.statut !== map[filterStatut]) return false
      }
      if (filterStock === 'Disponible' && p.stock === 0) return false
      if (filterStock === 'Rupture' && p.stock > 0) return false
      if (filterStock === 'Faible' && p.stock > 30) return false
      return true
    })
  }, [products, search, filterStatut, filterStock, viewMode])

  const perPageNum = parseInt(perPage, 10)
  const totalPages = Math.max(1, Math.ceil(displayed.length / perPageNum))
  const paginated = displayed.slice((page - 1) * perPageNum, page * perPageNum)

  const refreshStats = async () => {
    try { const s = await productApi.getStats(); setStats(s) } catch {}
  }

  const archiveProduct = async (id) => {
    try {
      const updated = await productApi.toggleArchive(id)
      setProducts(prev => prev.map(p => p.id === id ? updated : p))
      setSelected(prev => prev.filter(s => s !== id))
      toast.success(updated.statut === 'archive' ? 'Produit archivé.' : 'Produit restauré.')
      refreshStats()
    } catch { toast.error("Erreur lors de l'archivage.") }
  }

  const toggleDeactivate = async (id) => {
    try {
      const updated = await productApi.toggleDeactivate(id)
      setProducts(prev => prev.map(p => p.id === id ? updated : p))
      toast.success(updated.statut === 'desactive' ? 'Produit désactivé.' : 'Produit réactivé.')
    } catch { toast.error('Erreur lors du changement de statut.') }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Supprimer ce produit définitivement ?')) return
    try {
      await productApi.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => prev.filter(s => s !== id))
      toast.success('Produit supprimé.')
      refreshStats()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAll = () =>
    setSelected(selected.length === paginated.length ? [] : paginated.map(p => p.id))

  const kpiCards = [
    { label: 'Total Produits',   value: stats ? stats.total.toLocaleString('fr-FR')  : '—', sub: stats ? `${stats.actifs} actifs` : '', subColor: 'text-brand',    iconBg: 'bg-slate-50 text-slate-400',  icon: 'inventory' },
    { label: 'Produits Actifs',  value: stats ? stats.actifs.toLocaleString('fr-FR') : '—', sub: stats && stats.total > 0 ? `${Math.round(stats.actifs/stats.total*100)}% total` : '', subColor: 'text-slate-400', iconBg: 'bg-badge/10 text-badge', icon: 'check_circle' },
    { label: 'En rupture',       value: stats ? stats.rupture.toLocaleString('fr-FR'): '—', sub: 'Attention', subColor: 'text-red-500',    iconBg: 'bg-red-50 text-red-500',     icon: 'error' },
    { label: 'En promo',         value: stats ? stats.enPromo.toLocaleString('fr-FR'): '—', sub: '',          subColor: 'text-orange-500', iconBg: 'bg-orange-50 text-orange-500',icon: 'campaign' },
  ]

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      <PageHeader title="Produits">
        <PageHeader.SecondaryBtn icon="assignment_return" onClick={() => navigate('/retours')}>Retours</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="upload">Importer</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={() => navigate('/produits/nouveau')}>Ajouter Produit</PageHeader.PrimaryBtn>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map(k => <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} subColor={k.subColor} icon={k.icon} iconBg={k.iconBg} />)}
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-custom p-1 shadow-sm self-start w-fit">
        <button onClick={() => { setViewMode('actifs'); setPage(1) }}
          className={`px-4 py-2 rounded text-sm font-bold transition-all ${viewMode === 'actifs' ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
          Actifs
        </button>
        <button onClick={() => { setViewMode('archives'); setPage(1) }}
          className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'archives' ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
          <span className="material-symbols-outlined text-[18px]">archive</span>
          Archivés
          {stats && stats.archives > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full leading-none">{stats.archives}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-custom border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><span className="material-symbols-outlined text-xl">search</span></span>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher par nom, SKU ou catégorie..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CustomSelect value={filterStatut} onChange={v => { setFilterStatut(v); setPage(1) }} options={['Statut: Tous', 'Actif', 'Désactivé', 'Draft']} />
            <CustomSelect value={filterStock}  onChange={v => { setFilterStock(v);  setPage(1) }} options={['Stock: Tout', 'Disponible', 'Faible', 'Rupture']} />
            <button onClick={() => { setSearch(''); setFilterStatut('Statut: Tous'); setFilterStock('Stock: Tout'); setPage(1) }}
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-custom transition-colors" title="Réinitialiser">
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="bg-brand text-white px-6 py-3 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{selected.length} produit{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</span>
            <div className="h-4 w-px bg-white/20" />
            <button className="text-sm font-medium hover:underline flex items-center gap-1.5"><span className="material-symbols-outlined text-lg">campaign</span> Appliquer Promo</button>
          </div>
          <button onClick={() => setSelected([])} className="text-sm font-bold text-white/70 hover:text-white"><span className="material-symbols-outlined text-lg">close</span></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-5 w-10"><input type="checkbox" checked={paginated.length > 0 && selected.length === paginated.length} onChange={toggleAll} className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer" /></th>
                <th className="px-6 py-5">Visuel</th>
                <th className="px-6 py-5">Produit <span className="material-symbols-outlined text-[12px] align-middle">unfold_more</span></th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Prix / Marge</th>
                <th className="px-6 py-5">Stock</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 block">inventory_2</span>
                  {viewMode === 'archives' ? 'Aucun produit archivé.' : 'Aucun produit trouvé.'}
                </td></tr>
              ) : paginated.map(p => {
                const badge = firstBadge(p)
                const sm = stockMeta(p.stock, p.stockStatus)
                const colsList = p.collections ? p.collections.split(',').map(c => c.trim()).filter(Boolean) : []
                const isDeactivated = p.statut === 'desactive'
                const currentPrice = p.promoActive && p.promoPrice > 0 ? p.promoPrice : p.salePrice
                // Resolve display image: imageUrl → first colorImages slot → placeholder
                let displayImg = p.imageUrl || null
                if (!displayImg && p.colorImages) {
                  try {
                    const ci = JSON.parse(p.colorImages)
                    const firstColor = Object.values(ci).find(arr => Array.isArray(arr) && arr[0])
                    if (firstColor) displayImg = firstColor[0]
                  } catch { /* ignore */ }
                }
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer" /></td>
                    <td className="px-6 py-6">
                      <div className="w-16 h-20 rounded-lg bg-slate-200 border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm">
                        {displayImg ? <img src={displayImg} alt={p.nom} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400 text-2xl">image</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`font-bold text-sm ${isDeactivated ? 'text-slate-400' : 'text-slate-900'}`}>{p.nom}</span>
                          {badge && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${badge.bg}`}>{badge.label}</span>}
                          {isDeactivated && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded uppercase">Désactivé</span>}
                          {viewMode === 'archives' && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded uppercase">Archivé</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {p.parentCategoryNom && <span className="font-medium text-slate-600">{p.parentCategoryNom}</span>}
                          {p.parentCategoryNom && p.categoryNom && <><span>›</span><span className="text-slate-500">{p.categoryNom}</span></>}
                          {!p.parentCategoryNom && p.categoryNom && <span className="font-medium text-slate-600">{p.categoryNom}</span>}
                          {p.sku && <><span>•</span><span>SKU: {p.sku}</span></>}
                        </div>
                        {colsList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {colsList.map(col => <span key={col} className="px-1.5 py-0.5 bg-badge/10 text-badge text-[9px] font-bold rounded">{col}</span>)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {p.performance
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-badge uppercase bg-slate-100 text-slate-600">{p.performance}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isDeactivated ? 'text-slate-400' : 'text-slate-900'}`}>
                            {currentPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DT
                          </span>
                          {p.promoActive && p.promoPrice > 0 && p.salePrice > 0 && (
                            <span className="text-[11px] text-slate-400 line-through">{p.salePrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DT</span>
                          )}
                        </div>

                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                          <span className="text-slate-500">{p.stock} unités</span>
                          <span className={sm.color}>{p.stockStatus}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${sm.bar} rounded-full`} style={{ width: `${sm.pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-1">
                        <div className="flex items-center gap-1">
                          {viewMode === 'archives' ? (
                            <>
                              <button onClick={() => archiveProduct(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-brand/10 hover:text-brand transition-all" title="Restaurer"><span className="material-symbols-outlined text-lg">unarchive</span></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Supprimer définitivement"><span className="material-symbols-outlined text-lg">delete</span></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => navigate(`/produits/edit/${p.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all" title="Modifier"><span className="material-symbols-outlined text-lg">edit</span></button>
                              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all" title="Dupliquer"><span className="material-symbols-outlined text-lg">content_copy</span></button>
                              <button onClick={() => toggleDeactivate(p.id)}
                                className={`p-1.5 rounded-lg transition-all ${isDeactivated ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                title={isDeactivated ? 'Réactiver' : 'Désactiver'}>
                                <span className="material-symbols-outlined text-lg">{isDeactivated ? 'visibility' : 'visibility_off'}</span>
                              </button>
                              <button onClick={() => archiveProduct(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all" title="Archiver"><span className="material-symbols-outlined text-lg">archive</span></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Supprimer"><span className="material-symbols-outlined text-lg">delete</span></button>
                            </>
                          )}
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">more_vert</span></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 flex items-center justify-between bg-white border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {displayed.length === 0 ? '0' : `${(page-1)*perPageNum+1}–${Math.min(page*perPageNum, displayed.length)}`} sur {displayed.length} produit{displayed.length > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>Par page</span>
              <CustomSelect value={perPage} onChange={v => { setPerPage(v); setPage(1) }} options={['10', '25', '50']} size="sm" />
            </div>
            <div className="text-xs text-slate-500 font-bold">Page {page} de {totalPages}</div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span></button>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Produits
