import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { CustomSelect, KpiCard, PageHeader } from '../components/ui'
import { collectionApi } from '../api/collectionApi'

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: '🟢 Actif' },
  { value: 'scheduled', label: '🟡 Programmée' },
  { value: 'draft', label: '⚫ Brouillon' },
  { value: 'expired', label: '🔴 Expirée' },
]

const typeOptions = [
  { value: 'all', label: 'Type: Tous' },
  { value: 'Manuel', label: 'Manuel' },
  { value: 'Automatique', label: 'Automatique' },
]

const visibilityOptions = [
  { value: 'all', label: 'Visibilité: Toutes' },
  { value: 'homepage', label: 'Homepage' },
  { value: 'menu', label: 'Menu' },
  { value: 'mobile', label: 'Mobile' },
]

const statusConfig = {
  active: {
    badge: 'bg-badge text-white',
    dot: 'bg-white animate-pulse',
    label: 'Active',
    pulse: true,
  },
  draft: {
    badge: 'bg-slate-700 text-white',
    dot: 'bg-slate-400',
    label: 'Brouillon',
    pulse: false,
  },
  expired: {
    badge: 'bg-red-600 text-white',
    dot: null,
    label: 'Expirée',
    icon: 'history',
  },
  scheduled: {
    badge: 'bg-amber-400 text-black',
    dot: 'bg-black animate-pulse',
    label: 'Programmée',
    pulse: true,
  },
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.draft
  return (
    <span className={`px-2 py-1 text-[10px] font-black font-badge uppercase tracking-wider rounded flex items-center gap-1 ${cfg.badge}`}>
      {cfg.icon
        ? <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
        : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      }
      {cfg.label}
    </span>
  )
}

function CollectionCard({ col, onToggleFeatured, onDelete }) {
  const navigate = useNavigate()
  const isExpired = col.statut === 'expired'

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden flex flex-col border border-slate-200 hover:shadow-xl transition-all duration-300 ${isExpired ? 'opacity-90 grayscale-[0.3]' : ''}`}>
      {/* Image header */}
      <div className="relative h-48 overflow-hidden">
        {col.imageUrl ? (
          <img src={col.imageUrl} alt={col.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-slate-300 text-5xl">collections</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        {/* Status + type badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <StatusBadge status={col.statut} />
          {col.featured && (
            <span className="px-2 py-1 bg-amber-400 text-black text-[10px] font-black font-badge uppercase tracking-wider rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
              Vedette
            </span>
          )}
          {col.type === 'auto' && (
            <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-black font-badge uppercase tracking-wider rounded">Automatique</span>
          )}
        </div>

        {/* Floating quick actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleFeatured(col.id)}
            className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-amber-500 hover:bg-white transition-colors shadow-sm"
            title={col.featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: col.featured ? "'FILL' 1" : "'FILL' 0" }}>star</span>
          </button>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div>
            <h4 className="text-lg font-black text-white leading-tight">{col.nom}</h4>
            {col.dateDebut && (
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">
                <span className="material-symbols-outlined text-xs mr-1">event</span>
                {col.dateDebut}{col.dateFin ? ` — ${col.dateFin}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Catégories liées */}
        {col.linkedCategories && col.linkedCategories.length > 0 && (
          <div className="mb-4">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">folder</span>
              Catégories liées
            </p>
            <div className="flex flex-wrap gap-1.5">
              {col.linkedCategories.map((cat) => (
                <span key={cat} className="px-2 py-0.5 bg-badge/10 text-badge text-[10px] font-bold font-badge rounded">{cat}</span>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex flex-col gap-1">
            <span className="opacity-60">Création</span>
            <span className="text-slate-800">{col.createdAt ? new Date(col.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="opacity-60">Mise à jour</span>
            <span className="text-slate-800">{col.updatedAt ? new Date(col.updatedAt).toLocaleDateString('fr-FR') : '—'}</span>
          </div>
        </div>

        {/* Visibility / draft notice */}
        {col.statut === 'brouillon' ? (
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl mb-4 text-red-600 font-bold text-[10px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-lg">visibility_off</span>
            Non visible sur la boutique
          </div>
        ) : (
          <div className="bg-slate-50 p-3 rounded-xl mb-4">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest">Visibilité</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'visHomepage', icon: 'home', label: 'Homepage' },
                { key: 'visMenu', icon: 'menu', label: 'Menu' },
                { key: 'visMobile', icon: 'smartphone', label: 'Mobile' },
              ].map(({ key, icon, label }) => (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border ${col[key] ? 'bg-white border-brand/10 text-brand' : 'bg-slate-100 border-transparent opacity-40'}`}
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                  <span className="text-[9px] font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/collections/${col.id}`)}
              className="flex-1 px-3 py-2 bg-btn text-white text-[11px] font-bold rounded-lg hover:bg-btn-dark transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">settings</span>
              Gérer
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/collections/${col.id}`)}
              className="p-2 flex-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors flex justify-center">
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button
              onClick={() => onDelete(col.id)}
              className="p-2 bg-slate-100 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Collections() {
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterVisibility, setFilterVisibility] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ── Fetch collections from API ─────────────────────────────────────
  useEffect(() => {
    collectionApi.getAll()
      .then((data) => setCollections(data))
      .catch(() => toast.error('Erreur lors du chargement des collections'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = collections.filter((c) => {
    if (search && !c.nom.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'all' && c.statut !== filterStatus) return false
    if (filterType !== 'all' && c.type !== filterType) return false
    if (filterVisibility !== 'all') {
      if (filterVisibility === 'homepage' && !c.visHomepage) return false
      if (filterVisibility === 'menu' && !c.visMenu) return false
      if (filterVisibility === 'mobile' && !c.visMobile) return false
    }
    return true
  })

  const total = collections.length
  const active = collections.filter((c) => c.statut === 'active').length
  const featured = collections.filter((c) => c.featured).length
  const drafts = collections.filter((c) => c.statut === 'brouillon').length

  const handleToggleFeatured = (id) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c))
    )
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await collectionApi.delete(deleteTarget)
      setCollections((prev) => prev.filter((c) => c.id !== deleteTarget))
      toast.success('Collection supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
    setDeleteTarget(null)
  }

  const handleReset = () => {
    setSearch('')
    setFilterStatus('all')
    setFilterType('all')
    setFilterVisibility('all')
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Page header */}
      <PageHeader title="Collections">
        <PageHeader.SecondaryBtn icon="upload">Importer</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={() => navigate('/collections/nouveau')}>Nouvelle collection</PageHeader.PrimaryBtn>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total collections"    value={total}    sub={`${total} au total`}  subColor="text-slate-400"    icon="category"     iconBg="bg-slate-50 text-slate-400" />
        <KpiCard label="Collections actives"  value={active}   sub={`${Math.round(active/total*100)||0}% total`} subColor="text-slate-400" icon="check_circle"  iconBg="bg-badge/10 text-badge" />
        <KpiCard label="En vedette"           value={featured} sub={featured > 0 ? 'Mise en avant' : '—'} subColor="text-amber-500"  icon="grade"        iconBg="bg-amber-50 text-amber-500" />
        <KpiCard label="Brouillons"           value={drafts}   sub={drafts > 0 ? 'À publier' : '—'}    subColor="text-slate-400"    icon="edit_note"    iconBg="bg-slate-50 text-slate-400" />
      </div>

      {/* Filters */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[240px] relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-lg">search</span>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="Rechercher une collection..."
              type="text"
            />
          </div>

          <CustomSelect value={filterStatus} onChange={setFilterStatus} options={statusOptions} size="sm" />
          <CustomSelect value={filterType} onChange={setFilterType} options={typeOptions} size="sm" />
          <CustomSelect value={filterVisibility} onChange={setFilterVisibility} options={visibilityOptions} size="sm" />

          {/* Période button */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            Période: Toutes
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand transition-all"
            title="Réinitialiser les filtres"
          >
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Collections grid */}
      {loading ? (
        <div className="mt-16 text-center py-12">
          <span className="material-symbols-outlined text-4xl text-brand animate-spin block mb-4">progress_activity</span>
          <p className="text-sm font-medium text-slate-500">Chargement des collections...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
          {filtered.map((col) => (
            <CollectionCard
              key={col.id}
              col={col}
              onToggleFeatured={handleToggleFeatured}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-4">inventory</span>
          <p className="text-sm font-medium text-slate-500">
            Aucune collection trouvée.{' '}
            <button onClick={handleReset} className="text-brand hover:underline font-bold">
              Réinitialiser les filtres
            </button>
          </p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/collections/nouveau')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        title="Nouvelle collection"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
        <span className="absolute right-full mr-4 px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
          Nouvelle collection
        </span>
      </button>

      {/* ── Delete confirmation modal (portal) ── */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-500 text-2xl">delete_forever</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Supprimer cette collection ?</h3>
              <p className="text-sm text-slate-500 mb-6">Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all">
                  Annuler
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-all">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
