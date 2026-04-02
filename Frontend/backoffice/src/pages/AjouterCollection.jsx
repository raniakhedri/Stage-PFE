import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomSelect from '../components/ui/CustomSelect'
import PageHeader from '../components/ui/PageHeader'
import { collectionApi } from '../api/collectionApi'
import { categoryApi } from '../api/categoryApi'

// ── Reusable helpers ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? 'bg-brand' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
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

const performanceOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'best-sellers', label: 'Best Sellers' },
  { value: 'nouveautes', label: 'Nouveautés' },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AjouterCollection() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const bentoFileInputRef = useRef(null)

  // Informations générales
  const [nom, setNom] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('manuel')

  // Règles dynamiques
  const [tags, setTags] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [performance, setPerformance] = useState('standard')

  // Paramètres
  const [statut, setStatut] = useState('active')
  const [featured, setFeatured] = useState(false)
  const [priorite, setPriorite] = useState('')

  // Visibilité
  const [homepagePosition, setHomepagePosition] = useState('') // '' | 'principale' | 'secondaire-haut' | 'secondaire-bas'
  const [visMenu, setVisMenu] = useState(true)
  const [visMobile, setVisMobile] = useState(true)
  const [menuParentCategory, setMenuParentCategory] = useState('')
  const [menuFeatured, setMenuFeatured] = useState(false)

  // Période
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  // Catégories liées (from API)
  const [allCategories, setAllCategories] = useState([])
  const [linkedCategories, setLinkedCategories] = useState([])

  // Image menu
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageName, setImageName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isHoveringPreview, setIsHoveringPreview] = useState(false)

  // Image homepage bento
  const [bentoImagePreview, setBentoImagePreview] = useState(null)
  const [bentoImageName, setBentoImageName] = useState('')
  const [isBentoDragging, setIsBentoDragging] = useState(false)
  const [isHoveringBentoPreview, setIsHoveringBentoPreview] = useState(false)

  // SEO
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Produits (Manuel mode)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')

  // Existing collections for Aperçu
  const [existingCollections, setExistingCollections] = useState([])

  // Saving
  const [saving, setSaving] = useState(false)

  // ── Auto-slug ────────────────────────────────────────────────────────
  const generateSlug = (text) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNomChange = (e) => {
    const v = e.target.value
    setNom(v)
    setSlug(generateSlug(v))
  }

  // Auto SEO
  useEffect(() => {
    if (nom) {
      setMetaTitle(`${nom} — Collection`)
      setMetaDescription(`Découvrez notre collection ${nom}. Pièces exclusives et sélection raffinée.`)
    } else {
      setMetaTitle('')
      setMetaDescription('')
    }
  }, [nom])

  // ── Fetch categories + existing collections ──────────────────────────
  useEffect(() => {
    categoryApi.getAll().then(setAllCategories).catch(() => {})
    collectionApi.getAll().then((cols) => {
      setExistingCollections(cols)
      setPriorite(cols.length + 1)
    }).catch(() => {})
  }, [])

  // ── Auto-derive menuParentCategory from linkedCategories ─────────────
  useEffect(() => {
    const rootNames = allCategories.filter(c => !c.parentId).map(c => c.nom)
    setMenuParentCategory(linkedCategories.find(name => rootNames.includes(name)) || '')
  }, [linkedCategories, allCategories])

  // ── Image handlers ───────────────────────────────────────────────────
  const processFile = useCallback((file) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop lourde (max 2 Mo)'); return }
    setImageFile(file)
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }, [])

  const processBentoFile = useCallback((file) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop lourde (max 2 Mo)'); return }
    setBentoImageName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setBentoImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }, [])

  const clearImage = () => { setImageFile(null); setImagePreview(null); setImageName('') }
  const clearBentoImage = () => { setBentoImagePreview(null); setBentoImageName('') }

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files?.[0]) }
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleBentoDrop = (e) => { e.preventDefault(); setIsBentoDragging(false); processBentoFile(e.dataTransfer.files?.[0]) }
  const handleBentoDragOver = (e) => { e.preventDefault(); setIsBentoDragging(true) }
  const handleBentoDragLeave = () => setIsBentoDragging(false)

  // ── Category toggle (single root, multiple children) ─────────────────
  const toggleCategory = (catNom) => {
    const clicked = allCategories.find(c => c.nom === catNom)
    const isRoot = clicked && !clicked.parentId
    setLinkedCategories((prev) => {
      if (isRoot) {
        if (prev.includes(catNom)) {
          // Deselect root + all its children
          const childNames = allCategories.filter(c => c.parentId === clicked.id).map(c => c.nom)
          return prev.filter(n => n !== catNom && !childNames.includes(n))
        } else {
          // Select new root — remove all other roots and their children first
          const rootNames = allCategories.filter(c => !c.parentId).map(c => c.nom)
          const filtered = prev.filter(n => !rootNames.includes(n) && !allCategories.some(c => rootNames.includes(allCategories.find(r => r.id === c.parentId)?.nom) && c.nom === n))
          return [...filtered, catNom]
        }
      } else {
        // Child: simple toggle
        return prev.includes(catNom) ? prev.filter(n => n !== catNom) : [...prev, catNom]
      }
    })
  }

  // ── Remove product ────────────────────────────────────────────────
  const removeProduct = (idx) =>
    setSelectedProducts((prev) => prev.filter((_, i) => i !== idx))

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nom.trim()) { toast.error('Le nom de la collection est requis.'); return }
    setSaving(true)
    try {
      const payload = {
        nom: nom.trim(),
        slug,
        description,
        imageUrl: imagePreview || null,
        bannerUrl: bentoImagePreview || null,
        type,
        tags: tags || null,
        prixMax: prixMax ? parseFloat(prixMax) : null,
        performance,
        statut,
        featured,
        priorite: priorite ? parseInt(priorite, 10) : 0,
        visHomepage: !!homepagePosition, homepagePosition: homepagePosition || null,
        visMenu,
        visMobile,
        menuParentCategory: menuParentCategory || null,
        menuFeatured,
        dateDebut: dateDebut || null,
        dateFin: dateFin || null,
        linkedCategories,
        metaTitle,
        metaDescription,
      }
      await collectionApi.create(payload)
      toast.success('Collection créée avec succès !')
      navigate('/collections')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Left Column (2/3) ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Page Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/collections')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h2 className="text-xl font-bold text-slate-900">Ajouter une collection</h2>
            </div>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-btn text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-btn/20 hover:bg-btn-dark transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">{saving ? 'hourglass_empty' : 'save'}</span>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {/* ── Informations générales ─────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">info</span>
              <h2 className="text-sm font-bold text-slate-700">Informations générales</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label required>Nom de la collection</Label>
                <Input value={nom} onChange={handleNomChange} placeholder="ex: Summer Series 2026" />
              </div>
              <div>
                <Label>Slug</Label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-xs text-slate-400 font-mono">/collections/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-mono text-brand outline-none"
                    placeholder="slug-auto"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Décrivez l'esprit de cette collection..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                />
              </div>

              {/* Type */}
              <div className="pt-4 border-t border-slate-100">
                <Label>Type de collection</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    { value: 'manuel', title: 'Manuel', desc: 'Choisissez les produits un par un' },
                    { value: 'auto', title: 'Automatique', desc: 'Basé sur des règles dynamiques' },
                  ].map((opt) => (
                    <label key={opt.value} onClick={() => setType(opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        type === opt.value ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${type === opt.value ? 'border-brand' : 'border-slate-300'}`}>
                        {type === opt.value && <div className="w-2 h-2 rounded-full bg-brand" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{opt.title}</p>
                        <p className="text-[10px] text-slate-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Règles dynamiques — affiché uniquement en mode Automatique */}
              {type === 'auto' && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <Label>Règles dynamiques</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Tags</label>
                    <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: Été, Promo" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Prix inférieur à</label>
                    <div className="relative">
                      <Input type="number" value={prixMax} onChange={(e) => setPrixMax(e.target.value)} placeholder="0.00" className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">DT</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Performance</label>
                    <CustomSelect value={performance} onChange={setPerformance} options={performanceOptions} size="sm" />
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* ── Images ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">image</span>
              <h2 className="text-sm font-bold text-slate-700">Images</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── Image Menu ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">menu</span>
                  <p className="text-xs font-bold text-slate-600">Image Menu</p>
                  <span className="ml-auto text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">600 × 600 px</span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-1">Affichée dans la navigation (carrousel de catégories). Format carré.</p>
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-50 cursor-pointer group"
                      onMouseEnter={() => setIsHoveringPreview(true)} onMouseLeave={() => setIsHoveringPreview(false)}>
                      <img src={imagePreview} alt="Aperçu menu" className={`w-full h-full object-cover transition-all duration-300 ${isHoveringPreview ? 'scale-110 brightness-90' : ''}`} />
                      <div className={`absolute inset-0 bg-black/30 flex items-center justify-center gap-2 transition-opacity ${isHoveringPreview ? 'opacity-100' : 'opacity-0'}`}>
                        <button type="button" onClick={clearImage} className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-sm">swap_horiz</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <span className="material-symbols-outlined text-brand text-sm">image</span>
                      <span className="text-xs text-slate-600 truncate flex-1">{imageName}</span>
                      <button type="button" onClick={clearImage} className="text-red-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-brand bg-brand/10 scale-[1.02] shadow-lg' : 'border-slate-200 hover:border-brand/40 hover:bg-brand/5'}`}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                    <div className={`transition-transform ${isDragging ? 'scale-110' : ''}`}>
                      <span className={`material-symbols-outlined text-4xl mb-2 block transition-colors ${isDragging ? 'text-brand' : 'text-slate-300'}`}>{isDragging ? 'file_download' : 'cloud_upload'}</span>
                      <p className="text-xs font-bold text-slate-500">{isDragging ? 'Lâchez pour importer' : 'Cliquer ou glisser'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP — max 2 Mo</p>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => processFile(e.target.files?.[0])} />
                  </label>
                )}
                {imagePreview && <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => processFile(e.target.files?.[0])} />}
              </div>

              {/* ── Image Homepage Bento ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">home</span>
                  <p className="text-xs font-bold text-slate-600">Image Page d'accueil</p>
                  {homepagePosition && (() => {
                    const dim = homepagePosition === 'principale' ? '800 × 850 px' : '600 × 420 px'
                    return <span className="ml-auto text-[10px] font-mono bg-brand/10 text-brand px-2 py-0.5 rounded-full">{dim}</span>
                  })()}
                  {!homepagePosition && <span className="ml-auto text-[10px] font-mono bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Choisir une position</span>}
                </div>
                {homepagePosition ? (
                  <>
                    <p className="text-[10px] text-slate-400 -mt-1">
                      {homepagePosition === 'principale'
                        ? 'Grande carte gauche — format portrait 800 × 850 px (ratio ~16:17)'
                        : homepagePosition === 'secondaire-haut'
                          ? 'Carte droite haute — format paysage 600 × 420 px (ratio ~10:7)'
                          : 'Carte droite basse — format paysage 600 × 420 px (ratio ~10:7)'}
                    </p>
                    {bentoImagePreview ? (
                      <div
                        className={`relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group ${homepagePosition === 'principale' ? 'aspect-[16/17]' : 'aspect-[10/7]'}`}
                        onMouseEnter={() => setIsHoveringBentoPreview(true)} onMouseLeave={() => setIsHoveringBentoPreview(false)}>
                        <img src={bentoImagePreview} alt="Aperçu homepage" className={`w-full h-full object-cover transition-all duration-300 ${isHoveringBentoPreview ? 'scale-110 brightness-90' : ''}`} />
                        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center gap-2 transition-opacity ${isHoveringBentoPreview ? 'opacity-100' : 'opacity-0'}`}>
                          <button type="button" onClick={clearBentoImage} className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                          <button type="button" onClick={() => bentoFileInputRef.current?.click()} className="p-2 rounded-lg bg-white/90 text-slate-700 hover:bg-white transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isBentoDragging ? 'border-brand bg-brand/10 scale-[1.02] shadow-lg' : 'border-slate-200 hover:border-brand/40 hover:bg-brand/5'}`}
                        onDrop={handleBentoDrop} onDragOver={handleBentoDragOver} onDragLeave={handleBentoDragLeave}>
                        <div className={`transition-transform ${isBentoDragging ? 'scale-110' : ''}`}>
                          <span className={`material-symbols-outlined text-4xl mb-2 block transition-colors ${isBentoDragging ? 'text-brand' : 'text-slate-300'}`}>{isBentoDragging ? 'file_download' : 'cloud_upload'}</span>
                          <p className="text-xs font-bold text-slate-500">{isBentoDragging ? 'Lâchez pour importer' : 'Cliquer ou glisser'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP — max 2 Mo</p>
                        </div>
                        <input ref={bentoFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => processBentoFile(e.target.files?.[0])} />
                      </label>
                    )}
                    {bentoImagePreview && <input ref={bentoFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => processBentoFile(e.target.files?.[0])} />}
                  </>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
                    <span className="material-symbols-outlined text-3xl text-slate-200 mb-2 block">home</span>
                    <p className="text-xs text-slate-400">Sélectionnez d'abord une position dans la section <span className="font-bold">Visibilité</span> pour activer cette image.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Catégories liées (hiérarchique) ────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">category</span>
              <h2 className="text-sm font-bold text-slate-700">Catégories liées</h2>
              <span className="ml-auto text-xs font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded-full">
                {linkedCategories.length}
              </span>
            </div>
            <div className="p-6">
              <p className="text-[10px] text-slate-400 mb-4">Sélectionnez les catégories principales, puis leurs sous-catégories.</p>
              {allCategories.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chargement des catégories...</p>
              ) : (
                <div className="space-y-3">
                  {allCategories.filter((c) => !c.parentId).map((parent) => {
                    const isParentSelected = linkedCategories.includes(parent.nom)
                    const children = allCategories.filter((c) => c.parentId === parent.id)
                    return (
                      <div key={parent.id}>
                        {/* Parent category */}
                        <button type="button" onClick={() => toggleCategory(parent.nom)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                            isParentSelected ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isParentSelected ? 'border-brand bg-brand' : 'border-slate-300'
                          }`}>
                            {isParentSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{parent.nom}</p>
                            {children.length > 0 && (
                              <p className="text-[10px] text-slate-400">{children.length} sous-catégorie{children.length > 1 ? 's' : ''}</p>
                            )}
                          </div>
                          {children.length > 0 && (
                            <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform ${isParentSelected ? 'rotate-180' : ''}`}>expand_more</span>
                          )}
                        </button>

                        {/* Children — visible only when parent is selected */}
                        {isParentSelected && children.length > 0 && (
                          <div className="ml-8 mt-2 flex flex-wrap gap-2">
                            {children.map((child) => {
                              const isChildSelected = linkedCategories.includes(child.nom)
                              return (
                                <button key={child.id} type="button" onClick={() => toggleCategory(child.nom)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    isChildSelected ? 'border-badge bg-badge/10 text-badge' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                  }`}>
                                  {isChildSelected && <span className="material-symbols-outlined text-xs align-middle mr-1">check</span>}
                                  {child.nom}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Produits de la collection (Manuel uniquement) ──────── */}
          {type === 'manuel' && (
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-lg">inventory_2</span>
                <h2 className="text-sm font-bold text-slate-700">Produits de la collection</h2>
              </div>
              <span className="text-xs font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded-full">
                {selectedProducts.length}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {/* Search bar */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher un produit par nom..."
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Selected products list */}
              {selectedProducts.length > 0 ? (
                <div className="space-y-2">
                  {selectedProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 group">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                        {p.image ? (
                          <img src={p.image} alt={p.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-400 text-sm">image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{p.nom}</p>
                        {p.prix && <p className="text-[10px] text-slate-500">{p.prix} DT</p>}
                      </div>
                      <button type="button" onClick={() => removeProduct(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">inventory_2</span>
                  <p className="text-sm font-medium text-slate-400">Aucun produit ajouté</p>
                  <p className="text-[10px] text-slate-400 mt-1">Le module Produits n'est pas encore disponible.<br/>Les produits pourront être ajoutés ultérieurement.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* ── Statut ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">toggle_on</span>
              <h2 className="text-sm font-bold text-slate-700">Statut</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label>Statut</Label>
                <CustomSelect value={statut} onChange={setStatut} options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'brouillon', label: 'Brouillon' },
                  { value: 'planifié', label: 'Planifié' },
                  { value: 'désactivé', label: 'Désactivé' },
                ]} />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">En vedette</p>
                  <p className="text-[11px] text-slate-500">Carrousel principal</p>
                </div>
                <Toggle checked={featured} onChange={setFeatured} />
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-brand text-sm">sort</span>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Priorité d'affichage</p>
                </div>
                <div>
                  <Label>Position</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: existingCollections.length + 1 }, (_, i) => i + 1).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPriorite(pos)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${
                          Number(priorite) === pos
                            ? 'border-brand bg-brand text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {existingCollections.length} collection{existingCollections.length > 1 ? 's' : ''} existante{existingCollections.length > 1 ? 's' : ''} — par défaut: position {existingCollections.length + 1}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Visibilité ─────────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">visibility</span>
              <h2 className="text-sm font-bold text-slate-700">Visibilité</h2>
            </div>
            <div className="p-6 space-y-4">

              {/* Page d'accueil — position bento */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">home</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Page d'accueil</p>
                    <p className="text-[11px] text-slate-400">Choisissez l'emplacement dans la grille bento</p>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-2 h-28">
                  {/* Left large — principale */}
                  <button type="button"
                    onClick={() => setHomepagePosition(homepagePosition === 'principale' ? '' : 'principale')}
                    className={`col-span-7 relative rounded-lg border-2 overflow-hidden transition-all ${
                      homepagePosition === 'principale' ? 'border-brand shadow-md' : 'border-slate-200 hover:border-brand/40'
                    }`}>
                    <div className="absolute inset-0 bg-slate-100" />
                    <span className="relative text-[9px] font-bold uppercase tracking-wider px-1 ${
                      homepagePosition === 'principale' ? 'text-white bg-brand rounded px-1.5 py-0.5' : 'text-slate-500'
                    }">{homepagePosition === 'principale' ? '✓ Principale' : 'Principale'}</span>
                  </button>
                  {/* Right column */}
                  <div className="col-span-5 grid grid-rows-2 gap-2">
                    <button type="button"
                      onClick={() => setHomepagePosition(homepagePosition === 'secondaire-haut' ? '' : 'secondaire-haut')}
                      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                        homepagePosition === 'secondaire-haut' ? 'border-brand shadow-md' : 'border-slate-200 hover:border-brand/40'
                      }`}>
                      <div className="absolute inset-0 bg-slate-100" />
                      <span className="relative text-[9px] font-bold uppercase tracking-wider ${
                        homepagePosition === 'secondaire-haut' ? 'text-white bg-brand rounded px-1.5 py-0.5' : 'text-slate-500'
                      }">{homepagePosition === 'secondaire-haut' ? '✓ Haut' : 'Haut'}</span>
                    </button>
                    <button type="button"
                      onClick={() => setHomepagePosition(homepagePosition === 'secondaire-bas' ? '' : 'secondaire-bas')}
                      className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                        homepagePosition === 'secondaire-bas' ? 'border-brand shadow-md' : 'border-slate-200 hover:border-brand/40'
                      }`}>
                      <div className="absolute inset-0 bg-slate-100" />
                      <span className="relative text-[9px] font-bold uppercase tracking-wider ${
                        homepagePosition === 'secondaire-bas' ? 'text-white bg-brand rounded px-1.5 py-0.5' : 'text-slate-500'
                      }">{homepagePosition === 'secondaire-bas' ? '✓ Bas' : 'Bas'}</span>
                    </button>
                  </div>
                </div>
                {homepagePosition && (
                  <p className="text-[10px] text-brand flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Affiché en position «&nbsp;{homepagePosition}&nbsp;» sur la homepage
                  </p>
                )}
              </div>

              {[
                { label: 'Menu principal', desc: 'Afficher dans la navigation', state: visMenu, set: setVisMenu, icon: 'menu' },
                { label: 'Application mobile', desc: 'Visible sur le mobile', state: visMobile, set: setVisMobile, icon: 'smartphone' },
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

              {/* En vedette dans le menu — catégorie déduite automatiquement des "Catégories liées" */}
              {visMenu && (
                <div className="pt-4 border-t border-slate-100">
                  {menuParentCategory ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-brand text-sm">auto_awesome</span>
                        <p className="text-[11px] text-slate-500">Catégorie parente déduite :</p>
                        <span className="text-[11px] font-bold text-badge bg-badge/10 px-2 py-0.5 rounded-full">{menuParentCategory}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
                          <div>
                            <p className="text-sm font-bold text-slate-700">En vedette dans le menu</p>
                            <p className="text-[10px] text-slate-400">Afficher cette collection dans les 2 images du menu pour cette catégorie</p>
                          </div>
                        </div>
                        <Toggle checked={menuFeatured} onChange={setMenuFeatured} />
                      </div>
                      {menuFeatured && (() => {
                        const otherFeatured = existingCollections.filter(c => c.menuFeatured && c.menuParentCategory === menuParentCategory)
                        return otherFeatured.length >= 2 ? (
                          <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">warning</span>
                            Il y a déjà {otherFeatured.length} collection(s) en vedette pour « {menuParentCategory} ». Maximum recommandé : 2.
                          </p>
                        ) : null
                      })()}
                    </>
                  ) : (
                    <p className="text-[10px] text-amber-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      Liez une catégorie principale dans « Catégories liées » pour que la collection apparaisse dans le menu.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Période ────────────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">calendar_month</span>
              <h2 className="text-sm font-bold text-slate-700">Période</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date début</Label>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none" />
                </div>
                <div>
                  <Label>Date fin</Label>
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none" />
                </div>
              </div>
              <div className="p-3 bg-brand/5 rounded-xl border border-brand/10 flex gap-3">
                <span className="material-symbols-outlined text-brand text-sm flex-shrink-0">info</span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Laissez la date de fin vide pour une collection permanente.
                </p>
              </div>
            </div>
          </div>

          {/* ── SEO ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">search</span>
              <h2 className="text-sm font-bold text-slate-700">SEO</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Meta Title</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Titre SEO" />
                <p className="text-[10px] text-slate-400 mt-1">{metaTitle.length}/60 caractères</p>
              </div>
              <div>
                <Label>Meta Description</Label>
                <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3}
                  placeholder="Description pour les moteurs de recherche..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none" />
                <p className="text-[10px] text-slate-400 mt-1">{metaDescription.length}/160 caractères</p>
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
                      const rootCats = allCategories.filter(c => !c.parentId).sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0))
                      const selectedName = menuParentCategory?.toUpperCase() || ''
                      return rootCats.length > 0
                        ? rootCats.map(c => (
                          <span key={c.id} className={`${c.nom.toUpperCase() === selectedName ? 'text-[13px] text-[#1a1a1a]' : 'text-[11px] text-slate-300'} font-black tracking-tight leading-tight`}>
                            {c.nom.toUpperCase()}
                          </span>
                        ))
                        : <span className="text-[13px] font-black tracking-tight text-slate-300 leading-tight">CATÉGORIES...</span>
                    })()}
                    <div className="mt-auto pt-3 flex flex-col gap-0.5">
                      <span className="text-[6px] tracking-wider text-slate-300 uppercase">AIDE</span>
                      <span className="text-[6px] tracking-wider text-slate-300 uppercase">MON COMPTE</span>
                    </div>
                  </div>

                  {/* Col 2: Sub-categories + collections sorted by priority + VIEW ALL */}
                  <div className="w-[28%] py-3 pr-1">
                    <p className="text-[5px] tracking-[0.15em] text-slate-400 mb-1 uppercase">
                      SEASON 2026 / {menuParentCategory ? menuParentCategory.toUpperCase() : 'CATÉGORIE'}
                    </p>
                    <div className="flex flex-col gap-1">
                      {/* Sub-categories of chosen parent */}
                      {(() => {
                        const parentCat = allCategories.find(c => !c.parentId && c.nom === menuParentCategory)
                        const subs = parentCat ? allCategories.filter(c => c.parentId === parentCat.id).sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0)) : []
                        return subs.map(c => (
                          <span key={c.id} className="text-[7px] tracking-wider uppercase text-slate-400">{c.nom.toUpperCase()}</span>
                        ))
                      })()}
                      {/* All collections under same parent — sorted by priority */}
                      {(() => {
                        const others = existingCollections
                          .filter(c => c.visMenu && c.menuParentCategory === menuParentCategory)
                          .map(c => ({ ...c, _current: false }))
                        const thisColl = visMenu && menuParentCategory ? [{ id: 'new', nom: nom || 'NOUVELLE', priorite: priorite ? parseInt(priorite, 10) : 0, _current: true }] : []
                        const all = [...others, ...thisColl].sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
                        return all.map(c => (
                          <span key={c.id} className={`text-[7px] tracking-wider uppercase ${c._current ? 'font-bold text-[#1a1a1a] bg-amber-50 px-1 rounded' : 'text-slate-400'}`}>
                            {c.nom.toUpperCase()}{c._current ? ' ← nouveau' : ''}
                          </span>
                        ))
                      })()}
                      {!menuParentCategory && visMenu && (
                        <span className="text-[7px] tracking-wider uppercase text-slate-300 italic">Sélectionnez une catégorie...</span>
                      )}
                    </div>
                    <p className="text-[6px] tracking-wider text-slate-400 underline mt-3">VIEW ALL</p>
                  </div>

                  {/* Col 3: Editorial images — show 2 featured collections */}
                  <div className="w-[34%] py-2 pr-2 grid grid-cols-2 gap-1">
                    {(() => {
                      const otherFeatured = existingCollections
                        .filter(c => c.menuFeatured && c.menuParentCategory === menuParentCategory)
                        .sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
                      const thisFeatured = menuFeatured && menuParentCategory
                        ? [{ src: imagePreview, name: nom || 'NOUVELLE', sub: 'DÉCOUVRIR', priorite: priorite ? parseInt(priorite, 10) : 0 }]
                        : []
                      const allFeatured = [
                        ...thisFeatured,
                        ...otherFeatured.map(c => ({ src: c.imageUrl, name: c.nom, sub: 'DÉCOUVRIR', priorite: c.priorite || 0 }))
                      ].sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
                      const previewImages = allFeatured.slice(0, 2)
                      while (previewImages.length < 2) previewImages.push({ src: null, name: 'COLLECTION', sub: previewImages.length === 0 ? 'DÉCOUVRIR' : 'THE LOOKBOOK' })
                      if (previewImages.length > 1) previewImages[1].sub = 'THE LOOKBOOK'
                      return previewImages.map((img, idx) => (
                        <div key={idx} className="relative rounded overflow-hidden bg-slate-100 aspect-[3/4]">
                          {img.src ? (
                            <img src={img.src} alt="" className={`w-full h-full object-cover grayscale ${idx === 0 ? 'brightness-90' : 'brightness-75'}`} style={idx === 1 ? { objectPosition: 'center 30%' } : undefined} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 w-full p-1.5 bg-gradient-to-t from-black/50 to-transparent">
                            <p className="text-[6px] font-black text-white tracking-tight uppercase leading-tight">{img.name}</p>
                            <p className="text-[4px] text-white/80 tracking-wider">{img.sub}</p>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>

              {/* Visibility badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {visMenu && menuParentCategory && <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">Menu → {menuParentCategory}</span>}
                {menuFeatured && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">★ En vedette</span>}
                {homepagePosition && <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/5 px-2 py-0.5 rounded-full">Homepage</span>}
                {visMobile && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Mobile</span>}
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                Aperçu en temps réel — tel que vu dans le menu du site
              </p>
            </div>
          </div>

          {/* ── SEO Preview ────────────────────────────────────────── */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand text-lg">search</span>
              <h2 className="text-sm font-bold text-slate-700">Aperçu Google</h2>
            </div>
            <div className="p-4">
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <p className="text-[13px] text-blue-700 font-medium truncate">
                  {metaTitle || 'Titre de la collection — GMIR JEWELRY'}
                </p>
                <p className="text-[11px] text-brand truncate mt-0.5">
                  www.gmir-jewelry.com/collections/{slug || 'slug'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {metaDescription || 'Découvrez notre collection exclusive. Pièces uniques et raffinées.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
