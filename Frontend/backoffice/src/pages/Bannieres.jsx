import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const positionColors = {
  'Homepage Hero': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Section Promo': 'bg-amber-50 text-amber-700 border-amber-100',
  'Popup':         'bg-pink-50 text-pink-700 border-pink-100',
  'Page Catégorie':'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Footer':        'bg-slate-100 text-slate-600 border-slate-200',
}

const statutConfig = {
  'Actif':      { bg: 'bg-badge/10 text-badge', dot: 'bg-badge' },
  'Programmé':  { bg: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  'Expiré':     { bg: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400' },
  'Brouillon':  { bg: 'bg-yellow-100 text-yellow-700',   dot: 'bg-yellow-500' },
}

const prioriteConfig = {
  1: { label: 'Haute',   icon: 'local_fire_department', color: 'text-red-500' },
  2: { label: 'Moyenne', icon: 'north',                 color: 'text-amber-500' },
  3: { label: 'Faible',  icon: 'south',                 color: 'text-slate-400' },
}

const mockBannieres = [
  {
    id: 1,
    titre: 'Summer Industrial Essentials',
    sousTitre: 'Collection Éclat d\'Été 2024',
    image: 'summer-industrial.jpg',
    position: 'Homepage Hero',
    ciblage: ['Desktop', 'Mobile'],
    audience: 'B2B Clients',
    priorite: 1,
    statut: 'Actif',
    dateDebut: '24 Oct 2023',
    dateFin: 'Indéfini',
    vues: 12500,
    clics: 820,
    ctr: 6.56,
    ctaTexte: 'Découvrir',
    ctaType: 'catégorie',
    actif: true,
    abTest: true,
  },
  {
    id: 2,
    titre: 'Heavy Duty Accessories',
    sousTitre: 'Protection & Durabilité Extrême',
    image: 'heavy-duty.jpg',
    position: 'Section Promo',
    ciblage: ['Desktop'],
    audience: 'Tous Clients',
    priorite: 2,
    statut: 'Programmé',
    dateDebut: '01 Nov 2023',
    dateFin: '15 Déc 2023',
    vues: 0,
    clics: 0,
    ctr: 0,
    ctaTexte: 'Acheter',
    ctaType: 'produit',
    actif: true,
    abTest: false,
  },
  {
    id: 3,
    titre: 'Flash Sale Winter 23',
    sousTitre: 'Campagne Hiver Passée',
    image: 'winter-flash.jpg',
    position: 'Popup',
    ciblage: ['Mobile'],
    audience: 'Nouveaux Clients',
    priorite: 3,
    statut: 'Expiré',
    dateDebut: '01 Sep 2023',
    dateFin: '15 Sep 2023',
    vues: 7500,
    clics: 38,
    ctr: 0.51,
    ctaTexte: 'Shop Now',
    ctaType: 'lien externe',
    actif: false,
    abTest: false,
  },
  {
    id: 4,
    titre: 'Rentrée Pro 2024',
    sousTitre: 'Équipez vos équipes à prix réduit',
    image: 'rentree-pro.jpg',
    position: 'Homepage Hero',
    ciblage: ['Desktop', 'Mobile'],
    audience: 'Clients VIP',
    priorite: 1,
    statut: 'Actif',
    dateDebut: '01 Sep 2024',
    dateFin: '31 Oct 2024',
    vues: 9800,
    clics: 610,
    ctr: 6.22,
    ctaTexte: 'Voir la collection',
    ctaType: 'catégorie',
    actif: true,
    abTest: true,
  },
  {
    id: 5,
    titre: 'Promo Chaussures Sécurité',
    sousTitre: '-30% sur toute la gamme',
    image: 'chaussures-secu.jpg',
    position: 'Page Catégorie',
    ciblage: ['Desktop'],
    audience: 'Tous Clients',
    priorite: 2,
    statut: 'Brouillon',
    dateDebut: '',
    dateFin: '',
    vues: 0,
    clics: 0,
    ctr: 0,
    ctaTexte: 'Acheter maintenant',
    ctaType: 'catégorie',
    actif: false,
    abTest: false,
  },
  {
    id: 6,
    titre: 'Black Friday Workwear',
    sousTitre: 'Offres exclusives -50%',
    image: 'black-friday.jpg',
    position: 'Section Promo',
    ciblage: ['Desktop', 'Mobile'],
    audience: 'Tous Clients',
    priorite: 1,
    statut: 'Programmé',
    dateDebut: '25 Nov 2024',
    dateFin: '02 Déc 2024',
    vues: 0,
    clics: 0,
    ctr: 0,
    ctaTexte: 'Profiter',
    ctaType: 'produit',
    actif: true,
    abTest: false,
  },
]

const statutOptions = ['Tous les statuts', 'Actif', 'Programmé', 'Expiré', 'Brouillon']
const positionOptions = ['Toutes positions', 'Homepage Hero', 'Section Promo', 'Popup', 'Page Catégorie', 'Footer']
const ctaTypeOptions = ['Tous les CTA', 'produit', 'catégorie', 'lien externe']
const periodeOptions = ['Toutes les dates', 'Actif maintenant', 'Prochaine semaine', 'Ce mois']

// ── Component ──────────────────────────────────────────────────────────────────
export default function Bannieres() {
  const navigate = useNavigate()

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous les statuts')
  const [filterPosition, setFilterPosition] = useState('Toutes positions')
  const [filterCta, setFilterCta] = useState('Tous les CTA')
  const [filterPeriode, setFilterPeriode] = useState('Toutes les dates')

  // Data state
  const [bannieres, setBannieres] = useState(mockBannieres)
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

  // Filtered
  const filtered = bannieres.filter((b) => {
    if (search && !b.titre.toLowerCase().includes(search.toLowerCase()) && !b.position.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatut !== 'Tous les statuts' && b.statut !== filterStatut) return false
    if (filterPosition !== 'Toutes positions' && b.position !== filterPosition) return false
    if (filterCta !== 'Tous les CTA' && b.ctaType !== filterCta) return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  // KPIs
  const actives = bannieres.filter((b) => b.statut === 'Actif').length
  const programmees = bannieres.filter((b) => b.statut === 'Programmé').length
  const expirees = bannieres.filter((b) => b.statut === 'Expiré').length

  // Smart Insights
  const sorted = [...bannieres].filter((b) => b.vues > 0).sort((a, b) => b.ctr - a.ctr)
  const best = sorted[0] || null
  const worst = sorted[sorted.length - 1] || null

  // Toggle actif
  const toggleActif = (id) => {
    setBannieres((prev) => prev.map((b) => b.id === id ? { ...b, actif: !b.actif } : b))
    toast.success('Statut mis à jour')
  }

  // Duplicate
  const dupliquer = (id) => {
    const original = bannieres.find((b) => b.id === id)
    if (!original) return
    const copy = { ...original, id: Date.now(), titre: original.titre + ' (copie)', vues: 0, clics: 0, ctr: 0, statut: 'Brouillon', actif: false }
    setBannieres((prev) => [...prev, copy])
    toast.success('Bannière dupliquée')
  }

  // Delete
  const supprimer = (id) => {
    setBannieres((prev) => prev.filter((b) => b.id !== id))
    toast.success('Bannière supprimée')
  }

  // Drag & Drop reorder
  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => { e.preventDefault(); setOverIdx(idx) }
  const handleDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return }
    const reordered = [...bannieres]
    const [removed] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, removed)
    setBannieres(reordered)
    setDragIdx(null)
    setOverIdx(null)
    toast.success('Ordre mis à jour')
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  // Hover preview
  const handleImageMouseEnter = (e, b) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHoverPos({ top: r.bottom + 8, left: r.left })
    setHoverBanner(b)
  }
  const handleImageMouseLeave = () => setHoverBanner(null)

  // Reset filters
  const resetFilters = () => {
    setSearch(''); setFilterStatut('Tous les statuts'); setFilterPosition('Toutes positions'); setFilterCta('Tous les CTA'); setFilterPeriode('Toutes les dates')
  }

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
        <KpiCard label="Bannières Actives" value={actives} sub={`+2 ce mois`} subColor="text-brand" icon="check_circle" iconBg="bg-badge/10 text-badge" progress={75} progressColor="bg-brand" />
        <KpiCard label="Programmées" value={String(programmees).padStart(2, '0')} sub="Prochaine: Lundi" subColor="text-blue-600" icon="schedule" iconBg="bg-blue-50 text-blue-600" progress={30} progressColor="bg-blue-500" />
        <KpiCard label="Expirées" value={expirees} sub="Archivées" subColor="text-slate-400" icon="history" iconBg="bg-slate-100 text-slate-500" progress={100} progressColor="bg-slate-400" />
      </div>

      {/* Smart Insights */}
      <div className="bg-gradient-to-r from-brand/5 to-brand/5 rounded-xl border border-brand/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-brand">psychology</span>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Smart Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {best && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2 bg-brand/5 rounded-lg">
                <span className="material-symbols-outlined text-brand">emoji_events</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Meilleure bannière</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{best.titre}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">CTR: <span className="font-bold text-brand">{best.ctr}%</span></span>
                  <span className="text-xs text-slate-500">{best.clics.toLocaleString()} clics</span>
                  <span className="text-xs text-slate-500">{best.vues.toLocaleString()} vues</span>
                </div>
              </div>
            </div>
          )}
          {worst && worst.id !== best?.id && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <span className="material-symbols-outlined text-amber-600">warning</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">À améliorer</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{worst.titre}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">CTR: <span className="font-bold text-red-500">{worst.ctr}%</span></span>
                  <span className="text-xs text-slate-500">{worst.clics.toLocaleString()} clics</span>
                  <span className="text-xs text-slate-500">{worst.vues.toLocaleString()} vues</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, position ou client..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all outline-none"
            />
          </div>
          <CustomSelect value={filterStatut} onChange={setFilterStatut} options={statutOptions} size="sm" className="min-w-[150px]" />
          <CustomSelect value={filterPosition} onChange={setFilterPosition} options={positionOptions} size="sm" className="min-w-[150px]" />
          <CustomSelect value={filterCta} onChange={setFilterCta} options={ctaTypeOptions} size="sm" className="min-w-[140px]" />
          <CustomSelect value={filterPeriode} onChange={setFilterPeriode} options={periodeOptions} size="sm" className="min-w-[150px]" />
          <button onClick={resetFilters} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Réinitialiser">
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-3 w-8"></th>
                <th className="px-4 py-3 w-24">Image</th>
                <th className="px-4 py-3 min-w-[180px]">Titre & Détails</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Ciblage</th>
                <th className="px-4 py-3 text-center">Priorité</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Diffusion</th>
                <th className="px-4 py-3 text-center">Actif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((b, idx) => {
                const stat = statutConfig[b.statut] || statutConfig['Brouillon']
                const prio = prioriteConfig[b.priorite] || prioriteConfig[3]
                const posClass = positionColors[b.position] || 'bg-slate-100 text-slate-600 border-slate-200'
                const isExpired = b.statut === 'Expiré'
                const realIdx = bannieres.findIndex((x) => x.id === b.id)
                return (
                  <tr
                    key={b.id}
                    draggable
                    onDragStart={() => handleDragStart(realIdx)}
                    onDragOver={(e) => handleDragOver(e, realIdx)}
                    onDrop={() => handleDrop(realIdx)}
                    onDragEnd={handleDragEnd}
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
                        onMouseEnter={(e) => handleImageMouseEnter(e, b)}
                        onMouseLeave={handleImageMouseLeave}
                        onClick={() => setPreviewBanner(b)}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-brand/40 text-xl">image</span>
                        </div>
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-2.5">
                      <p className={`text-sm font-bold leading-tight uppercase ${isExpired ? 'text-slate-400' : 'text-slate-900'}`}>{b.titre}</p>
                      <p className={`text-[11px] mt-0.5 ${isExpired ? 'text-slate-300' : 'text-slate-500'}`}>{b.sousTitre}</p>
                      {b.abTest && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded border border-violet-100 uppercase">
                          <span className="material-symbols-outlined text-[10px]">science</span> A/B Test
                        </span>
                      )}
                    </td>

                    {/* Position badge */}
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-badge uppercase tracking-wide border ${posClass}`}>
                        {b.position}
                      </span>
                    </td>

                    {/* Ciblage */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {b.ciblage.includes('Desktop') && <span className="material-symbols-outlined text-slate-400 text-sm">desktop_windows</span>}
                          {b.ciblage.includes('Mobile') && <span className="material-symbols-outlined text-slate-400 text-sm">smartphone</span>}
                          <span className="text-[10px] text-slate-300">|</span>
                          <span className="text-[11px] text-slate-600 font-medium">{b.audience}</span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1" title={`Priorité ${prio.label}`}>
                        <span className={`material-symbols-outlined text-[16px] ${prio.color}`}>{prio.icon}</span>
                        <span className="text-xs font-bold text-slate-600">{b.priorite}</span>
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="px-4 py-2.5">
                      {b.vues > 0 ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-slate-400 text-[13px]">visibility</span>
                            <span className="text-[11px] text-slate-600">{b.vues.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-slate-400 text-[13px]">ads_click</span>
                            <span className="text-[11px] text-slate-600">{b.clics.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`material-symbols-outlined text-[13px] ${b.ctr >= 3 ? 'text-brand' : b.ctr >= 1 ? 'text-amber-600' : 'text-red-500'}`}>trending_up</span>
                            <span className={`text-[11px] font-bold ${b.ctr >= 3 ? 'text-brand' : b.ctr >= 1 ? 'text-amber-600' : 'text-red-500'}`}>{b.ctr}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">Aucune donnée</span>
                      )}
                    </td>

                    {/* Diffusion / Status */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold font-badge ${stat.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`}></span>
                          {b.statut.toUpperCase()}
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
                        <button className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-all" title="Voir sur site">
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </button>
                        <button onClick={() => dupliquer(b.id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all" title="Dupliquer">
                          <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        </button>
                        <button onClick={() => supprimer(b.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" title="Supprimer">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">
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
            Affichage de <span className="font-bold text-slate-700">{((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)}</span> sur <span className="font-bold text-slate-700">{filtered.length}</span> bannières
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
          <div className="w-72 h-40 rounded-xl overflow-hidden border-2 border-brand/20 shadow-2xl bg-gradient-to-br from-brand/20 to-brand/5">
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <span className="material-symbols-outlined text-brand/30 text-4xl mb-2">image</span>
              <p className="text-sm font-bold text-slate-700">{hoverBanner.titre}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{hoverBanner.position} • {hoverBanner.ciblage.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen preview modal */}
      {previewBanner && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-8" onClick={() => setPreviewBanner(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{previewBanner.titre}</h3>
                <p className="text-xs text-slate-500">{previewBanner.sousTitre}</p>
              </div>
              <button onClick={() => setPreviewBanner(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            {/* Preview area */}
            <div className="p-6">
              <div className="w-full aspect-[16/5] bg-gradient-to-br from-brand/10 to-brand/5 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-badge/20">
                <span className="material-symbols-outlined text-brand/30 text-6xl mb-3">view_carousel</span>
                <p className="text-lg font-bold text-slate-700">{previewBanner.titre}</p>
                <p className="text-sm text-slate-500 mt-1">{previewBanner.sousTitre}</p>
                {previewBanner.ctaTexte && (
                  <button className="mt-4 px-6 py-2 bg-btn text-white font-bold rounded-lg text-sm shadow-lg">
                    {previewBanner.ctaTexte}
                  </button>
                )}
              </div>
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Position</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{previewBanner.position}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">CTR</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{previewBanner.ctr}%</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Vues</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{previewBanner.vues.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Clics</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{previewBanner.clics.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
