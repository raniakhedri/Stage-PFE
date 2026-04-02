import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import { bannerApi } from '../api/bannerApi'

// ── Enums → Display helpers ─────────────────────────────────────────────────
const positionColors = {
  'HOMEPAGE_HERO': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'SECTION_PROMO': 'bg-amber-50 text-amber-700 border-amber-100',
  'POPUP':         'bg-pink-50 text-pink-700 border-pink-100',
  'PAGE_CATEGORIE':'bg-cyan-50 text-cyan-700 border-cyan-100',
  'FOOTER':        'bg-slate-100 text-slate-600 border-slate-200',
}

const statutConfig = {
  'ACTIF':      { bg: 'bg-badge/10 text-badge',           dot: 'bg-badge' },
  'PROGRAMME':  { bg: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-500' },
  'EXPIRE':     { bg: 'bg-slate-100 text-slate-500',      dot: 'bg-slate-400' },
  'BROUILLON':  { bg: 'bg-yellow-100 text-yellow-700',    dot: 'bg-yellow-500' },
}

const audienceBadge = {
  'ALL':     'bg-slate-100 text-slate-600',
  'VIP':     'bg-amber-50 text-amber-700 border border-amber-100',
  'NOUVEAU': 'bg-blue-50 text-blue-700 border border-blue-100',
  'FIDELE':  'bg-green-50 text-green-700 border border-green-100',
  'INACTIF': 'bg-gray-100 text-gray-500',
}

const prioriteConfig = {
  1: { label: 'Haute',   icon: 'local_fire_department', color: 'text-red-500' },
  2: { label: 'Moyenne', icon: 'north',                 color: 'text-amber-500' },
  3: { label: 'Faible',  icon: 'south',                 color: 'text-slate-400' },
}

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIF', label: 'Actif' },
  { value: 'PROGRAMME', label: 'Programmé' },
  { value: 'EXPIRE', label: 'Expiré' },
  { value: 'BROUILLON', label: 'Brouillon' },
]
const positionOptions = [
  { value: '', label: 'Toutes positions' },
  { value: 'HOMEPAGE_HERO', label: 'Homepage Hero' },
  { value: 'SECTION_PROMO', label: 'Section Promo' },
  { value: 'POPUP', label: 'Popup' },
  { value: 'PAGE_CATEGORIE', label: 'Page Catégorie' },
  { value: 'FOOTER', label: 'Footer' },
]
const periodeOptions = [
  { value: '', label: 'Toutes les dates' },
  { value: 'now', label: 'Actif maintenant' },
  { value: 'week', label: 'Prochaine semaine' },
  { value: 'month', label: 'Ce mois' },
]

// ── Component ──────────────────────────────────────────────────────────────────
export default function Bannieres() {
  const navigate = useNavigate()

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [filterPeriode, setFilterPeriode] = useState('')

  // Data state
  const [bannieres, setBannieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  // Preview
  const [previewBanner, setPreviewBanner] = useState(null)
  const [hoverBanner, setHoverBanner] = useState(null)
  const hoverRef = useRef(null)
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 })

  // Pagination
  const [page, setPage] = useState(1)
  const perPage = 10

  // ── Fetch banners ─────────────────────────────────────────────────────────
  const fetchBanners = async () => {
    try {
      setLoading(true)
      const list = await bannerApi.getAll()
      setBannieres(list)
    } catch {
      toast.error('Erreur lors du chargement des bannières')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBanners() }, [])

  // Filtered
  const filtered = bannieres.filter((b) => {
    if (search && !b.titre.toLowerCase().includes(search.toLowerCase()) && !(b.positionLabel || b.position).toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatut && b.statut !== filterStatut) return false
    if (filterPosition && b.position !== filterPosition) return false
    if (filterPeriode === 'now') {
      const today = new Date()
      const start = b.dateDebut ? new Date(b.dateDebut) : null
      const end = b.dateFin ? new Date(b.dateFin) : null
      if (start && today < start) return false
      if (end && today > end) return false
    }
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  // KPIs
  const actives    = bannieres.filter((b) => b.statut === 'ACTIF').length
  const programmees = bannieres.filter((b) => b.statut === 'PROGRAMME').length
  const expirees   = bannieres.filter((b) => b.statut === 'EXPIRE').length

  // Smart Insights — best priorité=1 active, next scheduled
  const bestActive  = bannieres.find((b) => b.statut === 'ACTIF' && b.priorite === 1) || bannieres.find((b) => b.statut === 'ACTIF') || null
  const nextSched   = bannieres.find((b) => b.statut === 'PROGRAMME') || null

  // Toggle actif
  const toggleActif = async (id) => {
    try {
      const updated = await bannerApi.toggleActif(id)
      setBannieres((prev) => prev.map((b) => b.id === id ? { ...b, actif: updated.actif } : b))
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  // Delete
  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette bannière ?')) return
    try {
      await bannerApi.remove(id)
      setBannieres((prev) => prev.filter((b) => b.id !== id))
      toast.success('Bannière supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // Drag & Drop reorder (local visual-only)
  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => { e.preventDefault(); setOverIdx(idx) }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  // Hover preview
  const handleImageMouseEnter = (e, b) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHoverPos({ top: r.bottom + 8, left: r.left })
    setHoverBanner(b)
  }
  const handleImageMouseLeave = () => setHoverBanner(null)

  // Close modal on escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setPreviewBanner(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <PageHeader title="Bannières">
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="upload">Importer</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={() => navigate('/bannieres/nouveau')}>
          Ajouter une bannière
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Bannières Actives" value={actives} sub={`${bannieres.length} au total`} subColor="text-brand" icon="check_circle" iconBg="bg-badge/10 text-badge" progress={bannieres.length ? Math.round(actives / bannieres.length * 100) : 0} progressColor="bg-brand" />
        <KpiCard label="Programmées" value={String(programmees).padStart(2, '0')} sub={nextSched ? `Prochaine: ${nextSched.titre.slice(0, 20)}` : 'Aucune planifiée'} subColor="text-blue-600" icon="schedule" iconBg="bg-blue-50 text-blue-600" progress={30} progressColor="bg-blue-500" />
        <KpiCard label="Expirées" value={expirees} sub="Archivées" subColor="text-slate-400" icon="history" iconBg="bg-slate-100 text-slate-500" progress={100} progressColor="bg-slate-400" />
      </div>

      {/* Smart Insights */}
      <div className="bg-gradient-to-r from-brand/5 to-brand/5 rounded-xl border border-brand/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-brand">psychology</span>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Smart Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestActive ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2 bg-brand/5 rounded-lg">
                <span className="material-symbols-outlined text-brand">emoji_events</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Bannière prioritaire active</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{bestActive.titre}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">Position: <span className="font-bold text-slate-700">{bestActive.positionLabel}</span></span>
                  <span className="text-xs text-slate-500">Audience: <span className="font-bold text-slate-700">{bestActive.audienceLabel}</span></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-slate-200 p-4 flex items-center justify-center text-slate-300 text-xs">
              Aucune bannière active
            </div>
          )}
          {nextSched ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <span className="material-symbols-outlined text-blue-600">schedule</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Prochaine bannière programmée</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{nextSched.titre}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">Début: <span className="font-bold text-slate-700">{nextSched.dateDebut || '—'}</span></span>
                  <span className="text-xs text-slate-500">Fin: <span className="font-bold text-slate-700">{nextSched.dateFin || '—'}</span></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-slate-200 p-4 flex items-center justify-center text-slate-300 text-xs">
              Aucune bannière programmée
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-custom border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, position ou client..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
          <CustomSelect value={filterStatut} onChange={setFilterStatut} options={statutOptions} size="sm" className="min-w-[150px]" />
          <CustomSelect value={filterPosition} onChange={setFilterPosition} options={positionOptions} size="sm" className="min-w-[150px]" />
          <CustomSelect value={filterPeriode} onChange={setFilterPeriode} options={periodeOptions} size="sm" className="min-w-[150px]" />
          <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterPosition(''); setFilterPeriode('') }} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-custom transition-colors" title="Réinitialiser">
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-3 w-8"></th>
                <th className="px-4 py-3 w-24">Image</th>
                <th className="px-4 py-3 min-w-[180px]">Titre & Détails</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3 text-center">Priorité</th>
                <th className="px-4 py-3">Diffusion</th>
                <th className="px-4 py-3 text-center">Actif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="material-symbols-outlined text-4xl text-slate-200 animate-spin">progress_activity</span>
                      <span className="text-sm">Chargement des bannières…</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((b, idx) => {
                const stat = statutConfig[b.statut] || statutConfig['BROUILLON']
                const prio = prioriteConfig[b.priorite] || prioriteConfig[3]
                const posClass = positionColors[b.position] || 'bg-slate-100 text-slate-600 border-slate-200'
                const audClass = audienceBadge[b.audience] || audienceBadge['ALL']
                const isExpired = b.statut === 'EXPIRE'
                const realIdx = bannieres.findIndex((x) => x.id === b.id)
                return (
                  <tr
                    key={b.id}
                    draggable
                    onDragStart={() => setDragIdx(realIdx)}
                    onDragOver={(e) => { e.preventDefault(); setOverIdx(realIdx) }}
                    onDrop={() => {
                      if (dragIdx === null || dragIdx === realIdx) { setDragIdx(null); setOverIdx(null); return }
                      const reordered = [...bannieres]
                      const [removed] = reordered.splice(dragIdx, 1)
                      reordered.splice(realIdx, 0, removed)
                      setBannieres(reordered)
                      setDragIdx(null); setOverIdx(null)
                      toast.success('Ordre mis à jour')
                    }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                    className={`hover:bg-slate-50 transition-colors group ${isExpired ? 'bg-slate-50/30' : ''} ${overIdx === realIdx ? 'border-t-2 border-brand' : ''}`}
                  >
                    {/* Drag handle */}
                    <td className="px-2 py-2.5">
                      <span className="material-symbols-outlined text-slate-300 hover:text-slate-500 cursor-grab text-base">drag_indicator</span>
                    </td>

                    {/* Image with hover preview */}
                    <td className="px-4 py-2.5">
                      <div
                        className={`w-16 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shadow-sm cursor-pointer relative group-hover:scale-105 transition-transform duration-300 ${isExpired ? 'opacity-50 grayscale' : ''}`}
                        onMouseEnter={(e) => {
                          const r = e.currentTarget.getBoundingClientRect()
                          setHoverPos({ top: r.bottom + 8, left: r.left })
                          setHoverBanner(b)
                        }}
                        onMouseLeave={() => setHoverBanner(null)}
                        onClick={() => setPreviewBanner(b)}
                      >
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.titre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-brand/40 text-xl">image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-2.5">
                      <p className={`text-sm font-bold leading-tight uppercase ${isExpired ? 'text-slate-400' : 'text-slate-900'}`}>{b.titre}</p>
                      <p className={`text-[11px] mt-0.5 ${isExpired ? 'text-slate-300' : 'text-slate-500'}`}>{b.sousTitre}</p>
                    </td>

                    {/* Position badge */}
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-badge uppercase tracking-wide border ${posClass}`}>
                        {b.positionLabel || b.position}
                      </span>
                    </td>

                    {/* Audience */}
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${audClass}`}>
                        {b.audienceLabel || b.audience}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1" title={`Priorité ${prio.label}`}>
                        <span className={`material-symbols-outlined text-[16px] ${prio.color}`}>{prio.icon}</span>
                        <span className="text-xs font-bold text-slate-600">{b.priorite}</span>
                      </div>
                    </td>

                    {/* Diffusion / Status */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold font-badge ${stat.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`}></span>
                          {b.statutLabel || b.statut}
                        </span>
                        {(b.dateDebut || b.dateFin) && (
                          <div className="text-[10px] text-slate-500 whitespace-nowrap">
                            <span className="font-medium text-slate-600">{b.dateDebut || '—'}</span> – <span className="font-medium text-slate-600">{b.dateFin || '—'}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Toggle */}
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => toggleActif(b.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.actif ? 'bg-brand' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${b.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/bannieres/edit/${b.id}`)} className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-md transition-all" title="Éditer">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setPreviewBanner(b)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="Aperçu">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button onClick={() => supprimer(b.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" title="Supprimer">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 block">image_not_supported</span>
                    Aucune bannière ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Affichage de <span className="font-bold text-slate-700">{filtered.length === 0 ? 0 : ((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)}</span> sur <span className="font-bold text-slate-700">{filtered.length}</span> bannières
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hover Preview Portal */}
      {hoverBanner && (
        <div
          ref={hoverRef}
          style={{ position: 'fixed', top: hoverPos.top, left: hoverPos.left, zIndex: 9999 }}
          className="pointer-events-none animate-in fade-in"
        >
          <div className="w-72 h-40 rounded-xl overflow-hidden border-2 border-brand/20 shadow-2xl">
            {hoverBanner.imageUrl ? (
              <img src={hoverBanner.imageUrl} alt={hoverBanner.titre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/5 flex flex-col items-center justify-center p-4 text-center">
                <span className="material-symbols-outlined text-brand/30 text-4xl mb-2">image</span>
                <p className="text-sm font-bold text-slate-700">{hoverBanner.titre}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{hoverBanner.positionLabel} • {hoverBanner.audienceLabel}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-screen hero preview — identical to Home.jsx */}
      {previewBanner && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Background image — exactly like Home.jsx */}
          <div className="absolute inset-0 bg-neutral-900">
            {previewBanner.imageUrl ? (
              <img
                src={previewBanner.imageUrl}
                alt={previewBanner.titre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20 text-[120px]">image</span>
              </div>
            )}
          </div>

          {/* Dark gradient overlay — identical to Home.jsx */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-[1]" />

          {/* Text content — identical layout/styles to Home.jsx */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-12 z-10">
            <div className="flex flex-col items-center gap-8">
              <h1 className="text-white text-5xl md:text-8xl font-black tracking-[-0.04em] uppercase text-center leading-none drop-shadow-lg">
                {previewBanner.titre || 'NOUVELLE COLLECTION'}
              </h1>
              {previewBanner.sousTitre && (
                <p className="text-white/80 text-lg md:text-xl font-medium text-center tracking-wide drop-shadow">
                  {previewBanner.sousTitre}
                </p>
              )}
              {previewBanner.ctaTexte && (
                <span className="bg-white text-black px-10 py-4 font-bold tracking-[0.1em] text-[12px] uppercase cursor-default">
                  {previewBanner.ctaTexte}
                </span>
              )}
            </div>
          </div>

          {/* Top-left badge */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[15px]">preview</span>
            Aperçu — Home Page
          </div>

          {/* Close button */}
          <button
            onClick={() => setPreviewBanner(null)}
            className="absolute top-6 right-6 z-20 w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white hover:bg-white hover:text-black transition-all duration-300"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Click outside to close */}
          <div className="absolute inset-0 z-[5]" onClick={() => setPreviewBanner(null)} />
        </div>
      )}
    </div>
  )
}
