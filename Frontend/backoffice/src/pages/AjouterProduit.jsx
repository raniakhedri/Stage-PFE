import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/ui/CustomSelect'

// ── Initial variant rows ───────────────────────────────────────────────────────
const initialVariants = [
  { id: 1, colorSwatch: 'bg-slate-900', label: 'Noir - S',  sku: 'WW-BLK-S', price: '',      stock: 50 },
  { id: 2, colorSwatch: 'bg-slate-900', label: 'Noir - M',  sku: 'WW-BLK-M', price: '45.00', stock: 32 },
]

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

// ── Category hierarchy (matches Categories page) ─────────────────────────────
const categoryTree = {
  'Vêtements':   ['Vestes & Parkas', 'Pantalons', 'T-shirts & Polos'],
  'Chaussures':  ['Sécurité S3', 'Bottes'],
  'EPI':         ['Casques', 'Gants'],
  'Accessoires': [],
  'Promotions':  [],
}

const allCollections = ['Summer 2026', 'Heavy Duty 2025', 'Winter Essentials']

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

// ── Main Page ──────────────────────────────────────────────────────────────────
function AjouterProduit() {
  const navigate = useNavigate()

  // General info
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [collections, setCollections] = useState([])
  const [category, setCategory] = useState('Vêtements')
  const [subCategory, setSubCategory] = useState('Vestes & Parkas')
  const [description, setDescription] = useState('')

  // Pricing
  const [salePrice, setSalePrice] = useState('89.00')
  const [promoActive, setPromoActive] = useState(false)
  const [promoPrice, setPromoPrice] = useState('')
  const [promoStart, setPromoStart] = useState('')
  const [promoEnd, setPromoEnd] = useState('')

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
    landing: false,
    category: true,
  })
  const [metaTitle, setMetaTitle] = useState('')

  // Variants
  const [colors, setColors] = useState('Noir, Orange')
  const [sizes, setSizes] = useState('S, M, L, XL')
  const [variants, setVariants] = useState(initialVariants)

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

  const removeVariant = (id) =>
    setVariants((prev) => prev.filter((v) => v.id !== id))

  const toggleBadge = (key) =>
    setBadges((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleVisibility = (key) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleCollection = (col) =>
    setCollections((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    )

  const handleCategoryChange = (newCat) => {
    setCategory(newCat)
    const subs = categoryTree[newCat] || []
    setSubCategory(subs[0] || '')
  }

  const hasPromo = promoActive && parseFloat(promoPrice) > 0 && parseFloat(promoPrice) < parseFloat(salePrice)

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* ── Page title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nouveau produit</h2>
            <p className="text-slate-500 text-sm mt-1">Remplissez les informations pour ajouter un produit au catalogue.</p>
          </div>
          <button
            onClick={() => navigate('/produits')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour aux produits
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Informations générales */}
            <Section title="Informations générales">
              <div className="space-y-6">
                <div>
                  <Label required>Nom du produit</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Veste Softshell Haute Visibilité Orange"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Référence (SKU Parent)</Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="WW-VS-2024"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label required>Catégorie</Label>
                    <Select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                      {Object.keys(categoryTree).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Sous-catégorie</Label>
                    {(categoryTree[category] || []).length > 0 ? (
                      <Select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                        {(categoryTree[category] || []).map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
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
                    {allCollections.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => toggleCollection(col)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          collections.includes(col)
                            ? 'border-badge bg-badge/10 text-badge'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {collections.includes(col) && (
                          <span className="material-symbols-outlined text-xs align-middle mr-1">check</span>
                        )}
                        {col}
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

            {/* Média & Galerie */}
            <Section
              title="Média & Galerie"
              rightSlot={
                <button className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Gérer les formats
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Main image */}
                <div className="md:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                    Image Principale
                  </p>
                  <div className="aspect-square rounded-custom border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-brand transition-all group">
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-brand text-3xl mb-1">
                      photo_camera
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium group-hover:text-brand">
                      Télécharger
                    </p>
                  </div>
                </div>

                {/* Gallery */}
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Galerie Photos
                  </p>
                  <div className="grid grid-cols-4 gap-4">
                    {/* Placeholder slot with image */}
                    <div className="aspect-square rounded-lg border border-slate-200 bg-slate-100 relative group cursor-pointer overflow-hidden flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400 text-2xl">image</span>
                      <button className="absolute top-1 right-1 w-6 h-6 bg-white shadow-sm rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                      <div className="absolute bottom-1 left-0 right-0 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-full py-1 bg-brand/90 text-white text-[9px] font-bold rounded">
                          Assigner variant
                        </button>
                      </div>
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-brand hover:text-brand transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Variantes */}
            <Section
              title="Variantes du produit"
              rightSlot={
                <button className="text-xs font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-full hover:bg-brand/20 transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  Générer les combinaisons
                </button>
              }
            >
              <div className="space-y-8">
                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                  <div>
                    <Label>Couleurs</Label>
                    <Input
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                      placeholder="Noir, Blanc, Orange (séparés par virgule)"
                    />
                  </div>
                  <div>
                    <Label>Tailles</Label>
                    <Input
                      value={sizes}
                      onChange={(e) => setSizes(e.target.value)}
                      placeholder="S, M, L, XL (séparés par virgule)"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        {['Variante', 'SKU', 'Prix (€)', 'Stock', 'Action'].map((h, i) => (
                          <th
                            key={h}
                            className={`pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 ${i === 4 ? 'text-right' : ''}`}
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
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${v.colorSwatch} rounded border border-slate-200 flex-shrink-0`} />
                              <span className="text-sm font-medium text-slate-700">{v.label}</span>
                            </div>
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
                              value={v.price}
                              onChange={(e) => updateVariant(v.id, 'price', e.target.value)}
                              placeholder="Prix standard"
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

                <button
                  onClick={() =>
                    setVariants((prev) => [
                      ...prev,
                      {
                        id: Date.now(),
                        colorSwatch: 'bg-orange-400',
                        label: 'Nouvelle variante',
                        sku: '',
                        price: '',
                        stock: 0,
                      },
                    ])
                  }
                  className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Ajouter une variante
                </button>
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
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* Tarification */}
            <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="font-bold text-slate-800">Tarification</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <Label required>Prix de vente (€)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">€</span>
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
                      <Label>Prix en promotion (€)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">€</span>
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
                          <span className="text-slate-400 line-through text-sm">{salePrice}€</span>
                          <span className="material-symbols-outlined text-brand text-sm">arrow_forward</span>
                          <span className="text-brand font-bold text-lg">{parseFloat(promoPrice).toFixed(2)}€</span>
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
                  { key: 'site',     title: 'Public',       sub: 'Visible sur le site' },
                  { key: 'landing',  title: 'Landing Page', sub: 'Mettre en avant' },
                  { key: 'category', title: 'Catégorie',    sub: 'Afficher en tête' },
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
            <button className="bg-btn hover:bg-btn-dark text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand/20">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Enregistrer le produit
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AjouterProduit
