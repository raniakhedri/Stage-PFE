import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import { categoryApi } from '../api/categoryApi'

const statutMap = {
  'actif':     { bg: 'bg-badge/10 text-badge', label: 'ACTIF' },
  'brouillon': { bg: 'bg-slate-100 text-slate-600',     label: 'BROUILLON' },
  'planifié':  { bg: 'bg-blue-100 text-blue-700',       label: 'PLANIFIÉ' },
  'désactivé': { bg: 'bg-red-100 text-red-600',         label: 'DÉSACTIVÉ' },
}

const visBadge = {
  menu:     { bg: 'bg-badge/10 text-badge',      label: 'Menu' },
  homepage: { bg: 'bg-amber-100 text-amber-700',  label: 'Homepage' },
  mobile:   { bg: 'bg-purple-100 text-purple-700', label: 'Mobile' },
  footer:   { bg: 'bg-slate-100 text-slate-600',   label: 'Footer' },
}

const allStatuts = ['Tous', 'actif', 'brouillon', 'planifié', 'désactivé']
const allStatutsOpts = allStatuts.map((s) => ({ value: s, label: s === 'Tous' ? 'Statut: Tous' : s.charAt(0).toUpperCase() + s.slice(1) }))
const allTypes = ['Tous', 'Principale', 'Secondaire']
const allTypesOpts = allTypes.map((t) => ({ value: t, label: t === 'Tous' ? 'Type: Tous' : t }))
const allVisibilites = ['Tous', 'menu', 'homepage', 'mobile', 'footer']
const allVisibilitesOpts = allVisibilites.map((v) => ({ value: v, label: v === 'Tous' ? 'Visibilité: Tous' : v.charAt(0).toUpperCase() + v.slice(1) }))
const allNiveaux = ['Tous', '0', '1']
const allNiveauxOpts = allNiveaux.map((n) => ({ value: n, label: n === 'Tous' ? 'Niveau: Tous' : `Niveau ${n}` }))

export default function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous')
  const [filterType, setFilterType] = useState('Tous')
  const [filterVis, setFilterVis] = useState('Tous')
  const [filterNiveau, setFilterNiveau] = useState('Tous')
  const [expanded, setExpanded] = useState({})
  const [previewCat, setPreviewCat] = useState(null)

  // ── Map API response → UI row ──────────────────────────────────
  const mapCategory = (cat) => {
    const vis = []
    if (cat.visMenu) vis.push('menu')
    if (cat.visHomepage) vis.push('homepage')
    if (cat.visMobile) vis.push('mobile')
    if (cat.visFooter) vis.push('footer')
    return {
      id: cat.id,
      nom: cat.nom,
      slug: cat.slug || '',
      parent: cat.parentNom || null,
      parentId: cat.parentId || null,
      niveau: cat.niveau || 0,
      type: cat.type || 'Principale',
      produits: 0,
      sousCategories: cat.childrenCount || 0,
      visibilite: vis,
      statut: cat.statut || 'actif',
      ordre: cat.menuPosition || 0,
      vedette: cat.vedette || false,
      img: cat.imageUrl || null,
    }
  }

  // ── Fetch from API ─────────────────────────────────────────────
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const data = await categoryApi.getAll()
      setCategories(data.map(mapCategory))
    } catch (err) {
      toast.error('Erreur lors du chargement des catégories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  // ── KPI computed from data ─────────────────────────────────────
  const totalCats = categories.length
  const activeCats = categories.filter(c => c.statut === 'actif').length
  const maxNiveau = categories.reduce((m, c) => Math.max(m, c.niveau), 0)

  const kpiData = [
    { label: 'Total Catégories', value: String(totalCats), sub: '', subColor: 'text-slate-400', icon: 'folder', iconBg: 'bg-slate-50 text-slate-500' },
    { label: 'Catégories Actives', value: String(activeCats), sub: totalCats ? `${Math.round(activeCats/totalCats*100)}% total` : '0%', subColor: 'text-slate-400', icon: 'check_circle', iconBg: 'bg-badge/10 text-badge' },
    { label: 'Produits Catégorisés', value: '—', sub: '', subColor: 'text-slate-400', icon: 'inventory_2', iconBg: 'bg-blue-50 text-blue-500' },
    { label: 'Niveaux Max', value: String(maxNiveau + 1), sub: `${maxNiveau + 1} niveaux`, subColor: 'text-slate-400', icon: 'account_tree', iconBg: 'bg-purple-50 text-purple-500' },
  ]

  // ── Helpers ────────────────────────────────────────────────────────
  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleActive = async (id) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    const newStatut = cat.statut === 'actif' ? 'désactivé' : 'actif'
    try {
      await categoryApi.update(id, { nom: cat.nom, statut: newStatut })
      setCategories(prev => prev.map(c => c.id === id ? { ...c, statut: newStatut } : c))
    } catch { toast.error('Erreur lors de la mise à jour.') }
  }

  const toggleVedette = async (id) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    try {
      await categoryApi.update(id, { nom: cat.nom, vedette: !cat.vedette })
      setCategories(prev => prev.map(c => c.id === id ? { ...c, vedette: !c.vedette } : c))
    } catch { toast.error('Erreur lors de la mise à jour.') }
  }

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleDelete = async (id) => {
    try {
      await categoryApi.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id))
      toast.success('Catégorie supprimée.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression.')
    } finally {
      setDeleteConfirm(null)
    }
  }

  // ── Drag & Drop (group-aware: parents with parents, children with same-parent children) ──
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const handleDragStart = (catId) => { dragItem.current = catId }
  const handleDragEnter = (catId) => { dragOver.current = catId }
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null
      dragOver.current = null
      return
    }

    const dragCat = categories.find(c => c.id === dragItem.current)
    const overCat = categories.find(c => c.id === dragOver.current)
    if (!dragCat || !overCat) { dragItem.current = null; dragOver.current = null; return }

    // Only allow reorder within same group (same parentId, or both root)
    const dragGroup = dragCat.parentId || null
    const overGroup = overCat.parentId || null
    if (dragGroup !== overGroup) {
      dragItem.current = null
      dragOver.current = null
      toast.error('Glissez uniquement dans le même groupe (parents ou sous-catégories du même parent).')
      return
    }

    // Get all items in this group, ordered
    const group = categories
      .filter(c => (c.parentId || null) === dragGroup)
      .sort((a, b) => a.ordre - b.ordre)

    // Reorder within group
    const fromIdx = group.findIndex(c => c.id === dragItem.current)
    const toIdx = group.findIndex(c => c.id === dragOver.current)
    const reordered = [...group]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    // Assign new positions
    const orderedIds = reordered.map(c => c.id)
    const newPositions = {}
    reordered.forEach((c, i) => { newPositions[c.id] = i + 1 })

    // Update local state immediately
    setCategories(prev => prev.map(c => newPositions[c.id] != null ? { ...c, ordre: newPositions[c.id] } : c))

    // Persist to backend
    try {
      await categoryApi.reorder(orderedIds)
    } catch {
      toast.error('Erreur lors de la sauvegarde de l\'ordre.')
      fetchCategories() // rollback
    }

    dragItem.current = null
    dragOver.current = null
  }

  // ── Filter ────────────────────────────────────────────────────────
  const filtered = categories.filter((c) => {
    if (search && !c.nom.toLowerCase().includes(search.toLowerCase()) && !c.slug.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatut !== 'Tous' && c.statut !== filterStatut) return false
    if (filterType !== 'Tous' && c.type !== filterType) return false
    if (filterVis !== 'Tous' && !c.visibilite.includes(filterVis)) return false
    if (filterNiveau !== 'Tous' && c.niveau !== Number(filterNiveau)) return false
    return true
  })

  // Build tree view (sorted by menuPosition)
  const parents = filtered.filter((c) => c.niveau === 0).sort((a, b) => a.ordre - b.ordre)
  const getChildren = (parentId) => filtered.filter((c) => c.parentId === parentId).sort((a, b) => a.ordre - b.ordre)

  const renderRow = (cat, isChild = false) => (
    <tr
      key={cat.id}
      draggable
      onDragStart={() => handleDragStart(cat.id)}
      onDragEnter={() => handleDragEnter(cat.id)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className="hover:bg-slate-50/80 transition-colors group"
    >
      {/* Drag Handle + Ordre */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-300 cursor-grab active:cursor-grabbing text-lg group-hover:text-slate-500 transition-colors">drag_indicator</span>
          <span className="text-xs font-bold text-slate-400 w-5 text-center">{cat.ordre}</span>
        </div>
      </td>
      {/* Image */}
      <td className="px-3 py-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden">
          {cat.img ? (
            <img src={cat.img} alt={cat.nom} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-slate-300 text-lg">
              {cat.niveau === 0 ? 'folder' : 'subdirectory_arrow_right'}
            </span>
          )}
        </div>
      </td>
      {/* Nom (hiérarchique) */}
      <td className="px-3 py-3">
        <div className={`flex items-center gap-2 ${isChild ? 'pl-6' : ''}`}>
          {cat.sousCategories > 0 && (
            <button onClick={() => toggleExpand(cat.id)} className="text-slate-400 hover:text-brand transition-colors">
              <span className="material-symbols-outlined text-lg">
                {expanded[cat.id] ? 'expand_more' : 'chevron_right'}
              </span>
            </button>
          )}
          {isChild && (
            <span className="text-slate-300 text-sm select-none">└</span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{cat.nom}</span>
              {cat.vedette && (
                <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
              )}
              {cat.sousCategories > 0 && (
                <span className="text-[10px] text-slate-400 font-medium">({cat.sousCategories})</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{cat.slug}</p>
          </div>
        </div>
      </td>
      {/* Type */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.type === 'Principale' ? 'bg-badge/10 text-badge' : 'bg-slate-100 text-slate-500'}`}>
          {cat.type.toUpperCase()}
        </span>
      </td>
      {/* Produits */}
      <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-slate-800">{cat.produits}</td>
      {/* Visibilité */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {cat.visibilite.map((v) => (
            <span key={v} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${visBadge[v]?.bg}`}>
              {visBadge[v]?.label}
            </span>
          ))}
        </div>
      </td>
      {/* Statut */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${statutMap[cat.statut]?.bg}`}>
          {statutMap[cat.statut]?.label}
        </span>
      </td>
      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {/* Toggle actif */}
          <button
            onClick={() => toggleActive(cat.id)}
            title={cat.statut === 'actif' ? 'Désactiver' : 'Activer'}
            className={`p-1 rounded transition-colors ${cat.statut === 'actif' ? 'text-brand hover:bg-brand/5' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-lg">
              {cat.statut === 'actif' ? 'toggle_on' : 'toggle_off'}
            </span>
          </button>
          {/* Preview */}
          <button onClick={() => setPreviewCat(cat)} title="Voir sur le site" className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
            <span className="material-symbols-outlined text-lg">language</span>
          </button>
          {/* Modifier */}
          <button onClick={() => navigate(`/categories/edit/${cat.id}`)} title="Modifier" className="p-1 rounded text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          {/* Supprimer */}
          <button onClick={() => setDeleteConfirm(cat)} title="Supprimer" className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </td>
    </tr>
  )

  // Flatten rows for display
  const tableRows = []
  parents.forEach((p) => {
    tableRows.push(renderRow(p))
    if (expanded[p.id]) {
      getChildren(p.id).forEach((child) => {
        tableRows.push(renderRow(child, true))
      })
    }
  })
  // Also show orphan children (when filtering shows children without parents)
  const orphanChildren = filtered.filter((c) => c.niveau === 1 && !parents.find((p) => p.id === c.parentId))
  orphanChildren.forEach((c) => {
    tableRows.push(renderRow(c, true))
  })

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* Page Header */}
      <PageHeader title="Catégories">
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="upload">Importer</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={() => navigate('/categories/nouveau')}>
          Ajouter Catégorie
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((k) => <KpiCard key={k.label} {...k} />)}
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
              placeholder="Rechercher par nom ou slug..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <CustomSelect value={filterStatut} onChange={setFilterStatut} options={allStatutsOpts} size="sm" />
            <CustomSelect value={filterType} onChange={setFilterType} options={allTypesOpts} size="sm" />
            <CustomSelect value={filterVis} onChange={setFilterVis} options={allVisibilitesOpts} size="sm" />
            <CustomSelect value={filterNiveau} onChange={setFilterNiveau} options={allNiveauxOpts} size="sm" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-3 py-3 w-20">Position</th>
              <th className="px-3 py-3 w-16">Image</th>
              <th className="px-3 py-3">Nom / Slug</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Produits</th>
              <th className="px-3 py-3">Visibilité</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3 w-52">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2 animate-spin">progress_activity</span>
                  Chargement des catégories...
                </td>
              </tr>
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">search_off</span>
                  Aucune catégorie trouvée
                </td>
              </tr>
            ) : (
              tableRows
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>{filtered.length} catégorie{filtered.length > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
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
      {/* Preview Modal — Mega Menu */}
      {previewCat && (() => {
        // Build tree: only ACTIVE parent categories sorted by ordre (live)
        const mainCats = categories.filter(c => !c.parentId && c.statut === 'actif').sort((a, b) => a.ordre - b.ordre)
        const getChildrenSorted = (parentId) => categories.filter(c => c.parentId === parentId && c.statut === 'actif').sort((a, b) => a.ordre - b.ordre)
        // If the previewed category is a child, highlight its parent
        const activePId = previewCat.parentId || previewCat.id
        const activeSubs = getChildrenSorted(activePId)
        const activeParent = categories.find(c => c.id === activePId)

        const defaultImages = [
          { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJQhRHs1LQR4UNja_x9yQVfMHehbR_t-JIfaodRdtY4gD7xGXGYbDNbH-ZCjVj1sU49UMJXNID8_gK5ixOXUkbYLuzVxLgTPbANWWA2NpnrSIENSDMeJsLgfI1QUzOlJNQUTPl2j8tVCGCDACAE7tPOyL4kvRBflemJSgA3d0NwSMzcRM1pW5KLD6S7bzKTsRzULtqXAaOuHxp-w4FuDUR8tNF8ONTrEdN6diqAnSmhNObnBhxOo-AEEcbNdaznDnWjEB7h2blfdBD', title: 'NOUVELLE COLLECTION', sub: 'EXPLORE NOW' },
          { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcrZZpKULBR9lw_-0agerJ7Vlll61-gUQyag-3Ntn5s3sS3Lpeooo8T53p3a3C_fKNy_9Q_RldRM90HQ9xyxFUv1guhMdxJ28Uw-So7asGh_Xu06SPKCCzNSWHOB2TqbBi2zzrPsmEwucnLlkktTwgWC3IBsrSR1gKeeGPzf0HUQZDgs0LiMKJrA4XGCQhwYJcJv0EinPAF2xa_4Yn104m57zyiCSyPlbVdP3XD4aUCjjDKTXlOzg12fnCKHqTMg_PrC8FbHaSjY-d', title: 'SPRING SUMMER 2026', sub: 'THE LOOKBOOK' },
        ]

        const parentImg = activeParent?.img
        const images = parentImg
          ? [{ src: parentImg, title: (activeParent?.nom || '').toUpperCase(), sub: 'DÉCOUVRIR' }, defaultImages[1]]
          : defaultImages

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPreviewCat(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[94vw] max-w-6xl h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header — same original style */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-brand">storefront</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Aperçu Front Office — Menu</h3>
                    <p className="text-[11px] text-slate-400">Vue en direct · L'ordre et les modifications se reflètent immédiatement</p>
                  </div>
                </div>
                <button onClick={() => setPreviewCat(null)} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              {/* Mega Menu inside the card */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Fake nav bar */}
                <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="material-symbols-outlined text-[20px] text-slate-800">search</span>
                    <span className="text-[11px] tracking-[0.15em] font-medium uppercase text-slate-400">SEARCH</span>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl font-black tracking-[0.15em] uppercase text-[#005b3d]">GMIR</span>
                      <span className="text-[9px] font-medium tracking-[0.35em] uppercase text-[#005b3d]">JEWELRY</span>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-end items-center gap-5">
                    <span className="material-symbols-outlined text-[20px] text-slate-800">person</span>
                    <span className="material-symbols-outlined text-[20px] text-slate-800">shopping_bag</span>
                    <span className="material-symbols-outlined text-[20px] text-slate-800">close</span>
                  </div>
                </nav>

                {/* 3-column mega menu content */}
                <div className="flex-1 flex flex-col md:flex-row gap-8 px-8 pt-8 pb-6 overflow-y-auto">
                  {/* Column 1: Main Categories */}
                  <div className="md:w-[28%] flex flex-col">
                    <nav className="flex flex-col space-y-1">
                      {mainCats.map((cat) => (
                        <button
                          key={cat.id}
                          onMouseEnter={() => setPreviewCat(cat)}
                          className={`text-left font-black text-3xl xl:text-4xl tracking-tighter transition-colors duration-300 leading-tight ${
                            (cat.id === activePId) ? 'text-slate-900' : 'text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          {cat.nom.toUpperCase()}
                        </button>
                      ))}
                    </nav>
                    <div className="mt-auto pt-8 flex flex-col space-y-2 text-[11px] tracking-[0.1em] text-slate-400">
                      <span>AIDE</span>
                      <span>MON COMPTE</span>
                      <span>CONNEXION</span>
                    </div>
                  </div>

                  {/* Column 2: Sub-categories */}
                  <div className="md:w-[22%] pt-1">
                    <h2 className="text-[10px] tracking-[0.2em] font-medium text-slate-400 mb-6 uppercase">
                      SEASON 2026 / {(activeParent?.nom || previewCat.nom).toUpperCase()}
                    </h2>
                    <nav className="flex flex-col space-y-3 text-[13px] tracking-widest uppercase">
                      {activeSubs.length > 0 ? activeSubs.map((sub, i) => (
                        <span
                          key={sub.id}
                          className={`${i === 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}
                        >
                          {sub.nom}
                        </span>
                      )) : (
                        <span className="text-slate-900 font-bold">TOUT VOIR</span>
                      )}
                      <div className="pt-6">
                        <span className="text-[10px] tracking-[0.2em] border-b border-slate-800 pb-1 inline-block">VIEW ALL</span>
                      </div>
                    </nav>
                  </div>

                  {/* Column 3: Editorial Images */}
                  <div className="md:w-[50%] grid grid-cols-2 gap-3">
                    {images.map((img, i) => (
                      <div key={`${activePId}-${i}`} className="relative aspect-[3/4] group overflow-hidden bg-slate-100 rounded-lg">
                        <img
                          className="w-full h-full object-cover grayscale brightness-90 group-hover:scale-105 transition-transform duration-700"
                          src={img.src}
                          alt={img.title}
                        />
                        <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/40 to-transparent">
                          <h3 className="text-white text-lg font-black tracking-tighter uppercase">{img.title}</h3>
                          <p className="text-white/80 text-[10px] tracking-[0.15em] mt-1">{img.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center px-8 pt-8 pb-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Supprimer cette catégorie ?</h3>
              <p className="text-sm text-slate-500 mt-2">
                Êtes-vous sûr de vouloir supprimer <strong className="text-slate-700">"{deleteConfirm.nom}"</strong> ?
                {deleteConfirm.sousCategories > 0 && (
                  <span className="block text-red-500 font-bold mt-1">
                    ⚠ Cette catégorie contient {deleteConfirm.sousCategories} sous-catégorie{deleteConfirm.sousCategories > 1 ? 's' : ''}.
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 px-8 py-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
