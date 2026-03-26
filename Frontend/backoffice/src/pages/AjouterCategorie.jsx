import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomSelect from '../components/ui/CustomSelect'
import { categoryApi } from '../api/categoryApi'

// ── Reusable helpers ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-brand' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
      {children}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none ${className}`}
      {...props}
    />
  )
}

// ── Parent options — fetched from API ──────────────────────────────────────────

export default function AjouterCategorie() {
  const navigate = useNavigate()

  const [parentOptions, setParentOptions] = useState([{ value: '', label: 'Aucun (catégorie racine)' }])
  const [allCats, setAllCats] = useState([])
  const [saving, setSaving] = useState(false)

  const [nom, setNom] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parent, setParent] = useState('')

  // Visibilité
  const [visMenu, setVisMenu] = useState(true)
  const [visHomepage, setVisHomepage] = useState(false)
  const [visMobile, setVisMobile] = useState(false)
  const [visFooter, setVisFooter] = useState(false)
  const [menuPosition, setMenuPosition] = useState(1)

  // Status
  const [statut, setStatut] = useState('actif')

  // Image — enhanced
  const [imageName, setImageName] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHoveringPreview, setIsHoveringPreview] = useState(false)
  const [showCrop, setShowCrop] = useState(false)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const fileInputRef = useRef(null)

  // Derived: type is automatic based on parent
  const type = parent ? 'Secondaire' : 'Principale'

  // Find selected parent data
  const selectedParent = parent ? allCats.find(c => String(c.id) === parent) : null
  const parentSlug = selectedParent?.slug || ''

  // Auto-compute default menu position based on type
  const existingCount = parent
    ? allCats.filter(c => c.parentId === selectedParent?.id).length
    : allCats.filter(c => !c.parentId).length
  const maxPosition = existingCount + 1

  // Auto-generate meta SEO
  const metaTitle = nom ? `${nom} — GMIR Jewelry` : ''
  const metaDesc = nom ? (description || `Découvrez notre sélection ${nom} chez GMIR Jewelry. Livraison rapide et retours gratuits.`) : ''

  // Auto-generate slug from nom + parent prefix
  const generateSlugPart = (val) => {
    return val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNomChange = (val) => {
    setNom(val)
    const part = generateSlugPart(val)
    if (parent && parentSlug) {
      setSlug(parentSlug + '/' + part)
    } else {
      setSlug('/' + part)
    }
  }

  // When parent changes, recalculate slug
  const handleParentChange = (val) => {
    setParent(val)
    if (nom) {
      const part = generateSlugPart(nom)
      const pCat = val ? allCats.find(c => String(c.id) === val) : null
      if (pCat?.slug) {
        setSlug(pCat.slug + '/' + part)
      } else {
        setSlug('/' + part)
      }
    }
    // Auto-set menu position to last for the new group
    const siblingCount = val
      ? allCats.filter(c => c.parentId === (allCats.find(x => String(x.id) === val)?.id)).length
      : allCats.filter(c => !c.parentId).length
    setMenuPosition(siblingCount + 1)
  }

  // Image handling
  const processFile = useCallback((file) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 Mo.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Seuls les fichiers image sont acceptés.')
      return
    }
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    setShowCrop(false)
    setCropOffset({ x: 0, y: 0 })
    setCropZoom(1)
  }, [])

  const clearImage = () => {
    setImageName('')
    setImagePreview(null)
    setShowCrop(false)
    setCropOffset({ x: 0, y: 0 })
    setCropZoom(1)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Fetch parent categories for dropdown
  useEffect(() => {
    categoryApi.getAll().then(data => {
      setAllCats(data)
      const roots = data.filter(c => !c.parentId)
      setParentOptions([
        { value: '', label: 'Aucun (catégorie racine)' },
        ...roots.map(c => ({ value: String(c.id), label: c.nom }))
      ])
      // Default position = last for root categories
      setMenuPosition(roots.length + 1)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nom.trim()) {
      toast.error('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nom,
        slug,
        description,
        parentId: parent ? Number(parent) : null,
        type,
        visMenu,
        visHomepage,
        visMobile,
        visFooter,
        menuPosition,
        statut,
        metaTitle: metaTitle,
        metaDescription: metaDesc,
        imageUrl: imagePreview || null,
      }
      await categoryApi.create(payload)
      toast.success(`Catégorie "${nom}" créée avec succès !`)
      navigate('/categories')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.error || data?.message || 'Erreur lors de la création.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/categories')}
            className="text-slate-400 hover:text-brand transition-colors p-1 rounded-lg hover:bg-brand/5">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Ajouter une catégorie</h1>
            <p className="text-xs text-slate-400">Remplissez les informations pour créer une nouvelle catégorie.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/categories')}
            className="px-5 py-2.5 rounded-custom text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-custom text-sm font-bold text-white bg-btn hover:bg-btn-dark transition-colors flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">{saving ? 'progress_activity' : 'save'}</span>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left Column (2/3) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations générales */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">info</span>
              <h2 className="text-sm font-bold text-slate-700">Informations générales</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label required>Nom de la catégorie</Label>
                <Input value={nom} onChange={(e) => handleNomChange(e.target.value)} placeholder="ex : Vêtements de travail" />
              </div>
              <div>
                <Label>Slug / URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200">votresite.com</span>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="/slug-auto-genere" className="font-mono text-xs" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Généré automatiquement à partir du nom. Modifiable manuellement.</p>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Description de la catégorie (visible sur le site)..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Hiérarchie & Organisation */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">account_tree</span>
              <h2 className="text-sm font-bold text-slate-700">Hiérarchie & Organisation</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label>Catégorie parente</Label>
                <CustomSelect value={parent} onChange={handleParentChange} options={parentOptions} placeholder="Sélectionner une catégorie parente" />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="material-symbols-outlined text-slate-400 text-lg">{type === 'Principale' ? 'folder' : 'subdirectory_arrow_right'}</span>
                <div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${type === 'Principale' ? 'bg-badge/10 text-badge' : 'bg-slate-100 text-slate-600'}`}>
                    {type.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {type === 'Principale' ? 'Apparaît comme catégorie principale dans le menu' : `Sous-catégorie de ${selectedParent?.nom || '...'}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Image — Enhanced ────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">image</span>
              <h2 className="text-sm font-bold text-slate-700">Image</h2>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Ratio 1:1</span>
            </div>
            <div className="p-5 space-y-3">
              {imagePreview ? (
                <div className="space-y-3">
                  {/* Image preview with hover effect */}
                  <div
                    className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-50 cursor-pointer group"
                    onMouseEnter={() => setIsHoveringPreview(true)}
                    onMouseLeave={() => setIsHoveringPreview(false)}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className={`w-full h-full object-cover transition-all duration-300 ${isHoveringPreview ? 'scale-110 brightness-90' : ''}`}
                      style={showCrop ? { transform: `scale(${cropZoom}) translate(${cropOffset.x}px, ${cropOffset.y}px)` } : undefined}
                    />
                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center gap-2 transition-opacity ${isHoveringPreview ? 'opacity-100' : 'opacity-0'}`}>
                      <button type="button" onClick={() => setShowCrop(!showCrop)}
                        className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-sm">crop</span>
                      </button>
                      <button type="button" onClick={clearImage}
                        className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                      </button>
                    </div>
                  </div>
                  {/* File name */}
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <span className="material-symbols-outlined text-brand text-sm">image</span>
                    <span className="text-xs text-slate-600 truncate flex-1">{imageName}</span>
                    <button type="button" onClick={clearImage} className="text-red-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* Crop controls */}
                  {showCrop && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-brand text-sm">crop</span>
                        <p className="text-xs font-bold text-slate-600">Recadrer l'image</p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zoom</label>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={cropZoom}
                          onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none bg-slate-200 mt-1 accent-brand"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Décalage X</label>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={cropOffset.x}
                            onChange={(e) => setCropOffset(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                            className="w-full h-1.5 rounded-full appearance-none bg-slate-200 mt-1 accent-brand"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Décalage Y</label>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={cropOffset.y}
                            onChange={(e) => setCropOffset(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                            className="w-full h-1.5 rounded-full appearance-none bg-slate-200 mt-1 accent-brand"
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => { setCropOffset({ x: 0, y: 0 }); setCropZoom(1) }}
                        className="text-[11px] text-brand font-bold hover:underline">
                        Réinitialiser
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-brand bg-brand/10 scale-[1.02] shadow-lg'
                      : 'border-slate-200 hover:border-brand/40 hover:bg-brand/5'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className={`transition-transform ${isDragging ? 'scale-110' : ''}`}>
                    <span className={`material-symbols-outlined text-4xl mb-2 block transition-colors ${isDragging ? 'text-brand' : 'text-slate-300'}`}>
                      {isDragging ? 'file_download' : 'cloud_upload'}
                    </span>
                    <p className="text-xs font-bold text-slate-500">
                      {isDragging ? 'Lâchez pour importer' : 'Cliquer ou glisser une image'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP — max 2 Mo</p>
                    <p className="text-[10px] text-brand/60 mt-1 font-medium">Ratio recommandé : 1:1 (carré)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => processFile(e.target.files?.[0])}
                  />
                </label>
              )}
              {/* Hidden file input for replacement */}
              {imagePreview && (
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => processFile(e.target.files?.[0])}
                />
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">toggle_on</span>
              <h2 className="text-sm font-bold text-slate-700">Statut</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label>Statut</Label>
                <CustomSelect value={statut} onChange={setStatut} options={[
                  { value: 'actif', label: 'Actif' },
                  { value: 'brouillon', label: 'Brouillon' },
                  { value: 'planifié', label: 'Planifié' },
                  { value: 'désactivé', label: 'Désactivé' },
                ]} />
              </div>
            </div>
          </div>

          {/* ── Visibilité — Enhanced ───────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">visibility</span>
              <h2 className="text-sm font-bold text-slate-700">Visibilité</h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Menu principal', desc: 'Afficher dans la navigation', state: visMenu, set: setVisMenu, icon: 'menu' },
                { label: 'Page d\'accueil', desc: 'Afficher sur la homepage', state: visHomepage, set: setVisHomepage, icon: 'home' },
                { label: 'Application mobile', desc: 'Visible sur le mobile', state: visMobile, set: setVisMobile, icon: 'smartphone' },
                { label: 'Footer', desc: 'Afficher dans le pied de page', state: visFooter, set: setVisFooter, icon: 'call_to_action' },
              ].map((v) => (
                <div key={v.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg">{v.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{v.label}</p>
                      <p className="text-[11px] text-slate-400">{v.desc}</p>
                    </div>
                  </div>
                  <Toggle checked={v.state} onChange={v.set} />
                </div>
              ))}

              {/* Separator */}
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-brand text-sm">sort</span>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Position dans le menu</p>
                </div>

                {/* Menu position — dynamic */}
                <div>
                  <Label>Position</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: maxPosition }, (_, i) => i + 1).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setMenuPosition(pos)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${
                          menuPosition === pos
                            ? 'border-brand bg-brand text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {type === 'Principale'
                      ? `${existingCount} catégorie${existingCount > 1 ? 's' : ''} principale${existingCount > 1 ? 's' : ''} — par défaut: position ${maxPosition}`
                      : `${existingCount} sous-catégorie${existingCount > 1 ? 's' : ''} sous ${selectedParent?.nom || '...'} — par défaut: position ${maxPosition}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* ── Right Column (1/3) — Sticky Aperçu ───────────────────── */}
        <div className="lg:sticky lg:top-[88px] lg:self-start space-y-6">

          {/* ── Aperçu Front Office (MEGA MENU PREVIEW) ─────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">storefront</span>
              <h2 className="text-sm font-bold text-slate-700">Aperçu Front Office</h2>
              <span className="ml-auto relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
            </div>
            <div className="p-4">
              {/* Mini mega-menu replica */}
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                {/* Fake top nav bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                  <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black tracking-[0.12em] text-[#005b3d]">GMIR</span>
                    <span className="text-[5px] tracking-[0.25em] text-[#005b3d]">JEWELRY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[10px]">person</span>
                    <span className="material-symbols-outlined text-slate-400 text-[10px]">shopping_bag</span>
                  </div>
                </div>

                {/* Mega menu body */}
                <div className="flex gap-0 bg-white" style={{ minHeight: 220 }}>
                  {/* Col 1: Main categories */}
                  <div className="w-[38%] py-3 pl-3 pr-2 flex flex-col gap-0.5">
                    {(() => {
                      // Real root categories from DB, sorted by menuPosition
                      const rootCats = allCats.filter(c => !c.parentId).sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0))
                      
                      if (type === 'Principale') {
                        // Show existing roots + the new one being created (highlighted)
                        const existingNames = rootCats.map(c => c.nom.toUpperCase())
                        const newName = (nom || 'CATÉGORIE').toUpperCase()
                        // Insert new category at the chosen menuPosition
                        const items = [...rootCats]
                        const insertIdx = Math.min(menuPosition - 1, items.length)
                        const newEntry = { id: 'new', nom: newName, isNew: true }
                        items.splice(insertIdx, 0, newEntry)
                        
                        return items.map((c, i) => (
                          <span key={c.id} className={`text-[${c.isNew ? '13' : '11'}px] font-black tracking-tight leading-tight ${c.isNew ? 'text-[#1a1a1a]' : 'text-slate-300'}`}>
                            {c.isNew ? newName : c.nom.toUpperCase()}
                          </span>
                        ))
                      } else {
                        // Subcategory: show all roots with parent highlighted
                        return rootCats.length > 0
                          ? rootCats.map(c => (
                            <span key={c.id} className={`text-[${c.id === selectedParent?.id ? '13' : '11'}px] font-black tracking-tight leading-tight ${c.id === selectedParent?.id ? 'text-[#1a1a1a]' : 'text-slate-300'}`}>
                              {c.nom.toUpperCase()}
                            </span>
                          ))
                          : <span className="text-[13px] font-black tracking-tight text-[#1a1a1a] leading-tight">PARENT</span>
                      }
                    })()}

                    <div className="mt-auto pt-3 flex flex-col gap-0.5">
                      <span className="text-[6px] tracking-wider text-slate-300 uppercase">AIDE</span>
                      <span className="text-[6px] tracking-wider text-slate-300 uppercase">MON COMPTE</span>
                    </div>
                  </div>

                  {/* Col 2: Season + sub-categories */}
                  <div className="w-[28%] py-3 pr-1">
                    <p className="text-[5px] tracking-[0.15em] text-slate-400 mb-2 uppercase">
                      SEASON 2026 / {type === 'Principale' ? (nom || 'CATÉGORIE').toUpperCase() : (selectedParent?.nom || 'PARENT').toUpperCase()}
                    </p>
                    <div className="flex flex-col gap-1">
                      {type === 'Secondaire' ? (
                        <>
                          {/* Show existing sibling subs under this parent */}
                          {allCats.filter(c => c.parentId === selectedParent?.id).sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0)).map(c => (
                            <span key={c.id} className="text-[7px] tracking-wider uppercase text-slate-400">{c.nom.toUpperCase()}</span>
                          ))}
                          <span className="text-[7px] font-bold tracking-wider uppercase text-[#1a1a1a] bg-amber-50 px-1 rounded">
                            {(nom || 'NOUVELLE').toUpperCase()} ← nouveau
                          </span>
                        </>
                      ) : (
                        <>
                          {/* For a new root category, show its existing children (none yet) or a placeholder */}
                          {allCats.filter(c => {
                            // If editing, show children of current. For new, show placeholder subs
                            const firstRoot = allCats.find(r => !r.parentId)
                            return c.parentId === firstRoot?.id
                          }).sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0)).slice(0, 6).map(c => (
                            <span key={c.id} className="text-[7px] tracking-wider uppercase text-slate-400">{c.nom.toUpperCase()}</span>
                          ))}
                          {allCats.filter(c => { const firstRoot = allCats.find(r => !r.parentId); return c.parentId === firstRoot?.id }).length === 0 && (
                            <span className="text-[7px] tracking-wider uppercase text-slate-300 italic">Sous-catégories...</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Editorial images */}
                  <div className="w-[34%] py-2 pr-2 grid grid-cols-2 gap-1">
                    <div className="relative rounded overflow-hidden bg-slate-100 aspect-[3/4]">
                      {imagePreview ? (
                        <img src={imagePreview} alt="" className="w-full h-full object-cover grayscale brightness-90" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full p-1.5 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-[6px] font-black text-white tracking-tight uppercase leading-tight">NOUVELLE COLLECTION</p>
                        <p className="text-[4px] text-white/80 tracking-wider">EXPLORE NOW</p>
                      </div>
                    </div>
                    <div className="relative rounded overflow-hidden bg-slate-100 aspect-[3/4]">
                      {imagePreview ? (
                        <img src={imagePreview} alt="" className="w-full h-full object-cover grayscale brightness-75" style={{ objectPosition: 'center 30%' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full p-1.5 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-[6px] font-black text-white tracking-tight uppercase leading-tight">SPRING SUMMER 2026</p>
                        <p className="text-[4px] text-white/80 tracking-wider">THE LOOKBOOK</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info badges below preview */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {visMenu && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">Menu #{menuPosition}</span>
                )}
                {visHomepage && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/5 px-2 py-0.5 rounded-full">Homepage</span>
                )}
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                Aperçu en temps réel — tel que vu sur le site
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
