import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomSelect from '../components/ui/CustomSelect'
import PageHeader from '../components/ui/PageHeader'
import { productApi } from '../api/productApi'
import { categoryApi } from '../api/categoryApi'
import { collectionApi } from '../api/collectionApi'

// ── Catalogue de contenances (cosmétiques) ───────────────────────────────────
const VOLUME_CATALOG = {
  liquides: { label: 'Liquides (ml)', volumes: ['5ml', '10ml', '15ml', '30ml', '50ml', '100ml', '200ml', '250ml'] },
  solides:  { label: 'Solides (g)',   volumes: ['50g', '100g', '150g', '200g', '250g', '500g'] },
}



// ── Toggle component ───────────────────────────────────────────────────────────
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

// ── Label ──────────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  )
}

// ── Field input ────────────────────────────────────────────────────────────────
function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none ${className}`}
      {...props}
    />
  )
}

// Adapter: converts <option> children API → CustomSelect options API
function Select({ value, onChange, children }) {
  const childArray = Array.isArray(children) ? children : [children]
  const options = childArray.map((c) => ({
    value: c.props.value !== undefined ? String(c.props.value) : String(c.props.children),
    label: String(c.props.children),
  }))
  return (
    <CustomSelect
      value={value}
      onChange={(v) => onChange({ target: { value: v } })}
      options={options}
    />
  )
}


// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children, rightSlot }) {
  return (
    <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">{title}</h3>
        {rightSlot}
      </div>
      <div className="p-8">{children}</div>
    </div>
  )
}
// Resolve image URL: /uploads/xxx → full backend URL, http(s) URLs → as-is
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080'
function resolveImgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}
// ── Main Page ──────────────────────────────────────────────────────────────────
function AjouterProduit() {
  const navigate = useNavigate()

  // General info
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [collections, setCollections] = useState([])
  const [category, setCategory] = useState('')          // stores category id (string)
  const [subCategory, setSubCategory] = useState('')     // stores subcategory id (string)
  const [description, setDescription] = useState('')

  // Dynamic data from API
  const [parentCategories, setParentCategories] = useState([])  // [{id, nom, children:[]}]
  const [allCollections, setAllCollections] = useState([])       // [{id, nom}]

  useEffect(() => {
    categoryApi.getAll().then((cats) => {
      const parents = cats.filter((c) => !c.parentId).map((p) => ({
        ...p,
        children: cats.filter((c) => c.parentId === p.id),
      }))
      setParentCategories(parents)
      if (parents.length > 0) {
        setCategory(String(parents[0].id))
        const firstSub = (parents[0].children || [])[0]
        setSubCategory(firstSub ? String(firstSub.id) : '')
      }
    }).catch(() => {})
    collectionApi.getAll().then((cols) => {
      setAllCollections(cols)
    }).catch(() => {})
  }, [])

  // Pricing
  const [salePrice, setSalePrice] = useState('')
  const [promoActive, setPromoActive] = useState(false)
  const [promoPrice, setPromoPrice] = useState('')
  const [promoStart, setPromoStart] = useState('')
  const [promoEnd, setPromoEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Badges
  const [badges, setBadges] = useState({
    nouveau: true,
    bestSeller: false,
    promo: true,
    exclusif: false,
  })

  // Visibility
  const [visibility, setVisibility] = useState({
    site: true,
    category: true,
    pinnedSub: false,
  })
  const [metaTitle, setMetaTitle] = useState('')

  // Cosmetics-specific
  const [latin, setLatin] = useState('')
  const [bio, setBio] = useState(false)
  const [origine, setOrigine] = useState('')
  const [usageInstructions, setUsageInstructions] = useState('')
  const [precautions, setPrecautions] = useState('')
  const [inciComposition, setInciComposition] = useState('')
  const [certifications, setCertifications] = useState('')

  // Variants (volume-based)
  const [volumeType, setVolumeType] = useState('liquides')
  const [selectedVolumes, setSelectedVolumes] = useState([])
  const [variants, setVariants] = useState([])
  const [productImages, setProductImages] = useState([null, null, null, null, null])
  const [uploadingIdx, setUploadingIdx] = useState(null)

  // Shipping
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [specificFees, setSpecificFees] = useState(false)

  // Upsell tags
  const [upsellTags] = useState(['Pantalon Cargo HV', 'Casque Reflex'])

  const updateVariant = (id, field, value) =>
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)))

  // Keep variants in sync with selected volumes
  const toggleVolume = (vol) => {
    const isSelected = selectedVolumes.includes(vol)
    if (isSelected) {
      setSelectedVolumes((prev) => prev.filter((x) => x !== vol))
      setVariants((prev) => prev.filter((v) => v.label !== vol))
    } else {
      setSelectedVolumes((prev) => [...prev, vol])
      setVariants((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), label: vol, sku: '', price: '', stock: 0 },
      ])
    }
  }

  const generateVariants = () => {
    if (selectedVolumes.length === 0) return
    const generated = selectedVolumes.map((vol) => ({
      id: Date.now() + Math.random(),
      label: vol,
      sku: '',
      price: '',
      stock: 0,
    }))
    setVariants(generated)
  }

  const removeVariant = (id) => {
    const v = variants.find((x) => x.id === id)
    if (v) setSelectedVolumes((prev) => prev.filter((x) => x !== v.label))
    setVariants((prev) => prev.filter((x) => x.id !== id))
  }

  const toggleBadge = (key) =>
    setBadges((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleVisibility = (key) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleCollection = (colId) =>
    setCollections((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    )

  const handleCategoryChange = (newCatId) => {
    setCategory(newCatId)
    const parent = parentCategories.find((p) => String(p.id) === newCatId)
    const subs = parent?.children || []
    setSubCategory(subs.length > 0 ? String(subs[0].id) : '')
    setCollections([])  // reset collections when category changes
  }

  // Helpers to get nom from id
  const getCategoryNom = (id) => {
    for (const p of parentCategories) {
      if (String(p.id) === id) return p.nom
      for (const s of (p.children || [])) {
        if (String(s.id) === id) return s.nom
      }
    }
    return id
  }
  const subCategories = parentCategories.find((p) => String(p.id) === category)?.children || []
  const selectedCategoryNom = parentCategories.find((p) => String(p.id) === category)?.nom || ''
  const filteredCollections = allCollections.filter((col) =>
    col.menuParentCategory === selectedCategoryNom ||
    (Array.isArray(col.linkedCategories) && col.linkedCategories.includes(selectedCategoryNom))
  )

  const hasPromo = promoActive && parseFloat(promoPrice) > 0 && parseFloat(promoPrice) < parseFloat(salePrice)

  const activeBadge = badges.nouveau ? 'NEW' : badges.bestSeller ? 'BEST' : badges.promo ? 'PROMO' : badges.exclusif ? 'EXCLU' : null

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Le nom du produit est requis.')
    setSubmitting(true)
    try {
      const payload = {
        nom: name.trim(),
        sku,
        description,
        latin: latin.trim() || null,
        bio,
        volumes: selectedVolumes.join(','),
        categoryId: subCategory ? parseInt(subCategory) : (category ? parseInt(category) : null),
        collectionIds: collections.map((id) => parseInt(id)),
        salePrice: parseFloat(salePrice) || 0,
        promoActive,
        promoPrice: promoActive ? (parseFloat(promoPrice) || 0) : 0,
        promoStart: promoStart || null,
        promoEnd: promoEnd || null,
        stock: variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0),
        statut: 'actif',
        badgeNouveau: badges.nouveau,
        badgeBestSeller: badges.bestSeller,
        badgePromo: badges.promo,
        badgeExclusif: badges.exclusif,
        visibleSite: visibility.site,
        visibleCategory: visibility.category,
        pinnedInSubCategory: visibility.pinnedSub,
        metaTitle: metaTitle || null,
        weight: parseFloat(weight) || 0,
        dimensionLength: parseFloat(length) || 0,
        dimensionWidth: parseFloat(width) || 0,
        dimensionHeight: parseFloat(height) || 0,
        specificFees,
        imageUrl: productImages.filter(Boolean)[0] || null,
        images: productImages.filter(Boolean).join(',') || null,
        origine: origine.trim() || null,
        usageInstructions: usageInstructions.trim() || null,
        precautions: precautions.trim() || null,
        inciComposition: inciComposition.trim() || null,
        certifications: certifications.trim() || null,
        variants: variants.map((v) => ({
          label: v.label,
          sku: v.sku,
          price: parseFloat(v.price) || parseFloat(salePrice) || 0,
          stock: parseInt(v.stock) || 0,
        })),
      }
      await productApi.create(payload)
      toast.success('Produit créé avec succès !')
      navigate('/produits')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

        {/* ── Page title ── */}
        <PageHeader title="Nouveau produit" subtitle="Remplissez les informations pour ajouter un produit au catalogue.">
          <PageHeader.SecondaryBtn icon="arrow_back" onClick={() => navigate('/produits')}>Retour</PageHeader.SecondaryBtn>
        </PageHeader>

        <div className="grid grid-cols-12 gap-8 items-start">

          {/* ── COLONNE GAUCHE — Formulaire ── */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Informations générales */}
            <Section title="Informations générales">
              <div className="space-y-6">
                <div>
                  <Label required>Nom du produit</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Huile Essentielle de Lavande Vraie"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nom latin / INCI</Label>
                    <Input
                      value={latin}
                      onChange={(e) => setLatin(e.target.value)}
                      placeholder="Ex: Lavandula angustifolia"
                    />
                  </div>
                  <div>
                    <Label>Référence (SKU)</Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="NE-LAV-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 cursor-pointer" onClick={() => setBio(!bio)}>
                  <input type="checkbox" checked={bio} onChange={() => setBio(!bio)} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Certification Bio</p>
                    <p className="text-[10px] text-slate-400">Produit certifié agriculture biologique</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label required>Catégorie</Label>
                    {parentCategories.length > 0 ? (
                      <Select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                        {parentCategories.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>{cat.nom}</option>
                        ))}
                      </Select>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2.5">Chargement...</p>
                    )}
                  </div>
                  <div>
                    <Label>Sous-catégorie</Label>
                    {subCategories.length > 0 ? (
                      <Select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                        {subCategories.map((sub) => (
                          <option key={sub.id} value={String(sub.id)}>{sub.nom}</option>
                        ))}
                      </Select>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2.5">Aucune sous-catégorie disponible</p>
                    )}
                  </div>
                </div>

                {/* Collections (multi-select) */}
                <div>
                  <Label>Collections</Label>
                  <p className="text-[10px] text-slate-400 mb-3">Un produit peut appartenir à plusieurs collections.</p>
                  <div className="flex flex-wrap gap-2">
                    {filteredCollections.length === 0 && selectedCategoryNom && (
                      <p className="text-xs text-slate-400 italic">Aucune collection pour cette catégorie.</p>
                    )}
                    {filteredCollections.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => toggleCollection(String(col.id))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          collections.includes(String(col.id))
                            ? 'border-badge bg-badge/10 text-badge'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {collections.includes(String(col.id)) && (
                          <span className="material-symbols-outlined text-xs align-middle mr-1">check</span>
                        )}
                        {col.nom}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Description complète</Label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez les caractéristiques techniques..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                  />
                </div>
              </div>
            </Section>

            {/* Fiche Cosmétique */}
            <Section title="Fiche Cosmétique">
              <div className="space-y-6">
                <div>
                  <Label>Origine / Provenance</Label>
                  <Input value={origine} onChange={(e) => setOrigine(e.target.value)} placeholder="Ex: France / Méditerranée" />
                </div>
                <div>
                  <Label>Certifications</Label>
                  <Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="Ex: Écocert,Cosmos Natural,USDA Organic" />
                  <p className="text-[10px] text-slate-400 mt-1">Séparez plusieurs certifications par des virgules.</p>
                </div>
                <div>
                  <Label>Composition INCI</Label>
                  <textarea
                    rows={4}
                    value={inciComposition}
                    onChange={(e) => setInciComposition(e.target.value)}
                    placeholder="Lavandula angustifolia (Oil), Limonene*, Linalool*..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ingrédients selon la nomenclature INCI. *Composants naturellement présents.</p>
                </div>
                <div>
                  <Label>Précautions d'emploi</Label>
                  <textarea
                    rows={3}
                    value={precautions}
                    onChange={(e) => setPrecautions(e.target.value)}
                    placeholder="⚠️ Ne pas utiliser pur. Déconseillé aux femmes enceintes..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                  />
                </div>
                <div>
                  <Label>Conseils d'utilisation</Label>
                  <textarea
                    rows={5}
                    value={usageInstructions}
                    onChange={(e) => setUsageInstructions(e.target.value)}
                    placeholder="Diffusion: Verser 5-10 gouttes dans un diffuseur.\nMassage: Diluer 2 gouttes dans une huile végétale.\nBain: 5 gouttes mélangées à un dispersant."
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Un conseil par ligne. Format recommandé : "Mode d'emploi: description"</p>
                </div>
              </div>
            </Section>

            {/* Variantes */}
            <Section
              title="Variantes du produit"
              rightSlot={
                <button
                  type="button"
                  onClick={generateVariants}
                  className="text-xs font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-full hover:bg-brand/20 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Régénérer les variantes
                </button>
              }
            >
              <div className="space-y-8">
                {/* Volume type + selection */}
                <div className="space-y-6 pb-8 border-b border-slate-100">
                  <div>
                    <Label>Contenances</Label>
                    <p className="text-[10px] text-slate-400 mb-3">Choisissez d'abord le type, puis les contenances disponibles.</p>
                    {/* Choix du type */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(VOLUME_CATALOG).map(([key, { label }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setVolumeType(key); setSelectedVolumes([]); setVariants([]) }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            volumeType === key
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {volumeType === key && (
                            <span className="material-symbols-outlined text-xs align-middle mr-1">check</span>
                          )}
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Boutons de contenance */}
                    {volumeType && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                        {VOLUME_CATALOG[volumeType].volumes.map((vol) => {
                          const active = selectedVolumes.includes(vol)
                          return (
                            <button
                              key={vol}
                              type="button"
                              onClick={() => toggleVolume(vol)}
                              className={`min-w-[2.75rem] px-2 py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                                active
                                  ? 'border-brand bg-brand text-white'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {vol}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        {['Contenance', 'SKU', 'Stock', 'Action'].map((h, i) => (
                          <th
                            key={h}
                            className={`pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 ${i === 3 ? 'text-right' : ''}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {variants.map((v) => (
                        <tr key={v.id} className="group hover:bg-slate-50/50">
                          <td className="py-4 px-2">
                            <span className="text-sm font-medium text-slate-700">{v.label}</span>
                          </td>
                          <td className="py-4 px-2">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded text-xs py-1.5 px-2 focus:ring-1 focus:ring-brand outline-none"
                            />
                          </td>
                          <td className="py-4 px-2">
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => updateVariant(v.id, 'stock', e.target.value)}
                              className="w-20 bg-white border border-slate-200 rounded text-xs py-1.5 px-2 focus:ring-1 focus:ring-brand outline-none"
                            />
                          </td>
                          <td className="py-4 px-2 text-right">
                            <button
                              onClick={() => removeVariant(v.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Hint when no volumes selected */}
                {selectedVolumes.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Sélectionnez des contenances ci-dessus pour créer les variantes.</p>
                )}
              </div>
            </Section>

            {/* Média & Galerie */}
            <Section title="Média & Galerie">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Photos du produit <span className="normal-case font-normal">(max 5)</span>
                  </p>
                  <div className="grid grid-cols-5 gap-4">
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const img = productImages[idx]
                      const isUploading = uploadingIdx === idx
                      return (
                        <div key={idx} className="relative group">
                          {img ? (
                            <div className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative">
                              <img src={resolveImgUrl(img)} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setProductImages(prev => {
                                  const arr = [...prev]
                                  arr[idx] = null
                                  return arr
                                })}
                                className="absolute top-1 right-1 w-6 h-6 bg-white shadow-sm rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                              {idx === 0 && (
                                <span className="absolute bottom-1 left-1 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Principale
                                </span>
                              )}
                            </div>
                          ) : (
                            <label className={`block ${isUploading ? '' : 'cursor-pointer'}`}>
                              <div className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                                isUploading ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 text-slate-300 hover:border-brand hover:text-brand'
                              }`}>
                                {isUploading ? (
                                  <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-2xl mb-1">
                                      {idx === 0 ? 'add_photo_alternate' : 'add'}
                                    </span>
                                    {idx === 0 && <p className="text-[9px] font-bold">Principale</p>}
                                  </>
                                )}
                              </div>
                              {!isUploading && (
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (!file) return
                                    setUploadingIdx(idx)
                                    try {
                                      const { url } = await productApi.uploadImage(file)
                                      setProductImages(prev => {
                                        const arr = [...prev]
                                        arr[idx] = url
                                        return arr
                                      })
                                    } catch {
                                      toast.error('Erreur lors de l\'upload de l\'image.')
                                    } finally {
                                      setUploadingIdx(null)
                                    }
                                  }}
                                />
                              )}
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Section>

            {/* Livraison & Dimensions */}
            <Section title="Livraison & Dimensions">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Poids (kg)',     value: weight,  set: setWeight,  placeholder: '0.5',  step: '0.1' },
                    { label: 'Longueur (cm)',  value: length,  set: setLength,  placeholder: '30' },
                    { label: 'Largeur (cm)',   value: width,   set: setWidth,   placeholder: '20' },
                    { label: 'Hauteur (cm)',   value: height,  set: setHeight,  placeholder: '10' },
                  ].map((f) => (
                    <div key={f.label}>
                      <Label>{f.label}</Label>
                      <Input
                        type="number"
                        value={f.value}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        step={f.step}
                      />
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer"
                  onClick={() => setSpecificFees(!specificFees)}
                >
                  <input
                    type="checkbox"
                    checked={specificFees}
                    onChange={() => setSpecificFees(!specificFees)}
                    className="w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
                  />
                  <label className="text-sm font-medium text-slate-700 cursor-pointer">
                    Appliquer des frais de port spécifiques pour ce produit
                  </label>
                </div>
              </div>
            </Section>

            {/* Produits Associés */}
            <Section title="Produits Associés & Ventes Croisées">
              <div>
                <Label>Produits Similaires (Upsell)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                    search
                  </span>
                  <Input className="pl-10" placeholder="Rechercher par nom ou SKU..." />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {upsellTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-200"
                    >
                      {tag}
                      <button className="hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Tarification */}
            <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="font-bold text-slate-800">Tarification</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <Label required>Prix de vente (DT)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">DT</span>
                    <input
                      type="number"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="89.00"
                      className="w-full pl-9 rounded-lg border border-slate-200 bg-white py-2.5 text-sm focus:ring-2 focus:ring-brand outline-none"
                    />
                  </div>
                </div>


                {/* Promotion toggle */}
                <button
                  type="button"
                  onClick={() => setPromoActive((v) => !v)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    promoActive
                      ? 'bg-badge/10 text-badge border-badge/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{promoActive ? 'remove_circle' : 'local_offer'}</span>
                  {promoActive ? 'Retirer la promotion' : 'Ajouter une promotion'}
                </button>

                {/* Promo section — visible only when toggled */}
                {promoActive && (
                  <div className="space-y-5 pt-1">
                    <div>
                      <Label>Prix en promotion (DT)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">DT</span>
                        <input
                          type="number"
                          step="0.01"
                          value={promoPrice}
                          onChange={(e) => setPromoPrice(e.target.value)}
                          placeholder="Ex: 69.00"
                          className="w-full pl-9 rounded-lg border border-brand/30 bg-white py-2.5 text-sm focus:ring-2 focus:ring-brand outline-none"
                        />
                      </div>
                    </div>

                    {/* Promo preview */}
                    {hasPromo && (
                      <div className="bg-brand/5 p-4 rounded-xl flex items-center justify-between border border-brand/10">
                        <span className="text-xs font-bold text-brand uppercase tracking-wider">
                          Aperçu Promotion
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-sm">{salePrice} DT</span>
                          <span className="material-symbols-outlined text-brand text-sm">arrow_forward</span>
                          <span className="text-brand font-bold text-lg">{parseFloat(promoPrice).toFixed(2)} DT</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Début Promo
                        </label>
                        <input
                          type="date"
                          value={promoStart}
                          onChange={(e) => setPromoStart(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs focus:ring-2 focus:ring-brand outline-none px-3"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Fin Promo
                        </label>
                        <input
                          type="date"
                          value={promoEnd}
                          onChange={(e) => setPromoEnd(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs focus:ring-2 focus:ring-brand outline-none px-3"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Étiquettes marketing */}
            <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="font-bold text-slate-800">Étiquettes de marketing</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'nouveau',    label: 'Nouveauté' },
                  { key: 'bestSeller', label: 'Best-Seller' },
                  { key: 'promo',      label: 'Promotion Active' },
                  { key: 'exclusif',   label: 'Exclusivité Web' },
                ].map((b) => (
                  <div
                    key={b.key}
                    onClick={() => toggleBadge(b.key)}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <label className="text-sm font-medium text-slate-700 cursor-pointer">{b.label}</label>
                    <input
                      type="checkbox"
                      checked={badges[b.key]}
                      onChange={() => toggleBadge(b.key)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer accent-brand"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Visibilité & SEO */}
            <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="font-bold text-slate-800">Visibilité &amp; SEO</h3>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { key: 'site',      title: 'Actif',                    sub: 'Produit activé / désactivé' },
                  { key: 'category',  title: 'Catégorie',                sub: 'Épingler en tête de catégorie' },
                  { key: 'pinnedSub', title: 'Sous-catégorie',           sub: 'Épingler en tête de sous-catégorie' },
                ].map((v) => (
                  <div key={v.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{v.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{v.sub}</p>
                    </div>
                    <Toggle
                      checked={visibility[v.key]}
                      onChange={(val) => toggleVisibility(v.key, val)}
                    />
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-100">
                  <Label>Meta-Titre (SEO)</Label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Auto-généré à partir du nom..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── COLONNE DROITE — Aperçu STICKY ── */}
          <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start space-y-6">

            {/* ── Aperçu Front Office ── */}
            <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-lg">storefront</span>
                <h2 className="text-sm font-bold text-slate-700">Aperçu Front Office</h2>
                <span className="ml-auto relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/60 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                </span>
              </div>
              <div className="p-4">
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded px-2 py-0.5">
                      <span className="text-[9px] text-slate-400">localhost:3001/produits</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {[0,1,2,3,4,5].map((i) => i === 1 ? (
                      <div key={i} className="ring-2 ring-brand rounded-sm">
                        <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                          {activeBadge && (
                            <div className="absolute top-1 left-1 bg-black text-white text-[5px] font-bold uppercase tracking-widest px-1 py-0.5 leading-none">
                              {activeBadge}
                            </div>
                          )}
                          {hasPromo && salePrice && promoPrice && (
                            <div className="absolute top-1 right-1 bg-badge text-white text-[5px] font-bold uppercase px-1 py-0.5 rounded leading-none">
                              -{Math.round(((parseFloat(salePrice) - parseFloat(promoPrice)) / parseFloat(salePrice)) * 100)}%
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300 text-xl">image</span>
                          </div>
                        </div>
                        <div className="p-1">
                          <p className="text-[7px] font-bold uppercase tracking-tight leading-tight line-clamp-1">
                            {name || <span className="text-slate-300 font-normal">Nom…</span>}
                          </p>
                          <p className="text-[7px] text-slate-600 mt-0.5">
                            {hasPromo && promoPrice
                              ? `${parseFloat(promoPrice).toFixed(2)} DT`
                              : salePrice
                              ? `${parseFloat(salePrice).toFixed(2)} DT`
                              : '—'}
                          </p>
                          <div className="flex gap-0.5 mt-0.5">
                            {variants.slice(0, 3).map((v) => (
                              <span key={v.id} className="text-[5px] font-bold text-slate-400 bg-slate-100 px-0.5 rounded">{v.label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="opacity-40">
                        <div className="aspect-[3/4] bg-slate-200 rounded-sm" />
                        <div className="h-1 bg-slate-300 rounded mt-1 w-3/4" />
                        <div className="h-1 bg-slate-200 rounded mt-0.5 w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {badges.nouveau && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Nouveauté</span>
                  )}
                  {badges.bestSeller && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Best-Seller</span>
                  )}
                  {hasPromo && (
                    <span className="text-[9px] bg-badge/10 text-badge font-bold px-2 py-0.5 rounded-full">Promo active</span>
                  )}
                  {!visibility.site && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Masqué</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  Aperçu en temps réel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Global Actions ── */}
        <div className="flex items-center justify-between py-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-400 text-sm italic">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Dernière modification : il y a 2 minutes par Admin
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/produits')}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Annuler les modifications
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-btn hover:bg-btn-dark text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">
                {submitting ? 'hourglass_top' : 'check_circle'}
              </span>
              {submitting ? 'Enregistrement...' : 'Enregistrer le produit'}
            </button>
          </div>
        </div>

    </div>
  )
}

export default AjouterProduit
