import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/ui/CustomSelect'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'

// ── Static Data ────────────────────────────────────────────────────────────────
const kpiCards = [
  {
    label: 'Total Produits',
    value: '1,284',
    sub: '+12.5%',
    subColor: 'text-brand',
    iconBg: 'bg-slate-50 text-slate-400',
    icon: 'inventory',
  },
  {
    label: 'Produits Actifs',
    value: '1,150',
    sub: '90% total',
    subColor: 'text-slate-400',
    iconBg: 'bg-badge/10 text-badge',
    icon: 'check_circle',
  },
  {
    label: 'En rupture',
    value: '24',
    sub: 'Attention',
    subColor: 'text-red-500',
    iconBg: 'bg-red-50 text-red-500',
    icon: 'error',
  },
  {
    label: 'En promo',
    value: '86',
    sub: '15 campagnes',
    subColor: 'text-orange-500',
    iconBg: 'bg-orange-50 text-orange-500',
    icon: 'campaign',
  },
]

const products = [
  {
    id: 1,
    name: 'Urban Tech Hoodie',
    badge: 'New',
    badgeBg: 'bg-badge text-white',
    category: 'Vêtements',
    subCategory: 'T-shirts & Polos',
    collections: ['Summer 2026', 'Best Sellers'],
    sku: 'UH-4429',
    performance: '🔥 Best seller',
    perfBg: 'bg-orange-100 text-orange-700',
    price: '89,00 €',
    priceOld: null,
    cost: '22,50 €',
    margin: '74%',
    stock: 242,
    stockLabel: '242 unités',
    stockStatus: 'Optimal',
    stockColor: 'text-brand',
    stockBarColor: 'bg-brand',
    stockPct: 80,
    imgBg: 'bg-slate-200',
  },
  {
    id: 2,
    name: 'Nylon Cargo Pants',
    badge: 'Promo',
    badgeBg: 'bg-orange-500 text-white',
    category: 'Vêtements',
    subCategory: 'Pantalons',
    collections: ['Summer 2026', 'New Arrivals'],
    sku: 'CP-1200',
    performance: '📈 Trending',
    perfBg: 'bg-blue-100 text-blue-700',
    price: '45,00 €',
    priceOld: '65,00 €',
    cost: '14,00 €',
    margin: '68%',
    stock: 8,
    stockLabel: '8 unités',
    stockStatus: 'Critique',
    stockColor: 'text-amber-500',
    stockBarColor: 'bg-amber-500',
    stockPct: 15,
    imgBg: 'bg-stone-200',
  },
  {
    id: 3,
    name: 'Casque Sécurité Reflex',
    badge: null,
    category: 'EPI',
    subCategory: 'Casques',
    collections: ['Winter Essentials'],
    sku: 'EP-993',
    performance: '❄️ Low sales',
    perfBg: 'bg-slate-100 text-slate-600',
    price: '120,00 €',
    priceOld: null,
    cost: '45,00 €',
    margin: '62%',
    stock: 0,
    stockLabel: '0 unités',
    stockStatus: 'Rupture',
    stockColor: 'text-red-500',
    stockBarColor: 'bg-red-500',
    stockPct: 0,
    imgBg: 'bg-gray-300',
  },
]

// ── Component ──────────────────────────────────────────────────────────────────
function Produits() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [filterCat, setFilterCat] = useState('Catégorie: Toutes')
  const [filterStatut, setFilterStatut] = useState('Statut: Tous')
  const [filterStock, setFilterStock] = useState('Stock: Tout')
  const [perPage, setPerPage] = useState('10')

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )

  const toggleAll = () =>
    setSelected(selected.length === products.length ? [] : products.map((p) => p.id))

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* ── Page Header ── */}
      <PageHeader title="Produits">
        <PageHeader.SecondaryBtn icon="assignment_return" onClick={() => navigate('/retours')}>Retours</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="upload">Importer</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="add" onClick={() => navigate('/produits/nouveau')}>Ajouter Produit</PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} subColor={k.subColor} icon={k.icon} iconBg={k.iconBg} />
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, SKU ou marque..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CustomSelect
              value={filterCat}
              onChange={setFilterCat}
              options={['Catégorie: Toutes', 'Vêtements', 'Chaussures', 'EPI', 'Accessoires', 'Promotions']}
            />
            <CustomSelect
              value={filterStatut}
              onChange={setFilterStatut}
              options={['Statut: Tous', 'Actif', 'Draft', 'Archivé']}
            />
            <CustomSelect
              value={filterStock}
              onChange={setFilterStock}
              options={['Stock: Tout', 'Disponible', 'Faible', 'Rupture']}
            />
            <button className="px-4 py-2.5 border border-slate-200 rounded-custom text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-lg">tune</span> Filtres
            </button>
          </div>
        </div>
      </div>

      {/* ── Bulk Actions Bar (shown when items selected) ── */}
      {selected.length > 0 && (
        <div className="bg-brand text-white px-6 py-3 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">{selected.length} produit{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</span>
            <div className="h-4 w-px bg-white/20" />
            <button className="text-sm font-medium hover:underline flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">edit</span> Modifier
            </button>
            <button className="text-sm font-medium hover:underline flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">category</span> Changer Catégorie
            </button>
            <button className="text-sm font-medium hover:underline flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">campaign</span> Appliquer Promo
            </button>
          </div>
          <button className="text-sm font-bold text-red-200 hover:text-red-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">delete</span> Supprimer
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] bg-slate-50/80">
                <th className="px-6 py-5 w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === products.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                  />
                </th>
                <th className="px-6 py-5">Visuel</th>
                <th className="px-6 py-5">
                  Produit{' '}
                  <span className="material-symbols-outlined text-[12px] align-middle">unfold_more</span>
                </th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Prix / Marge</th>
                <th className="px-6 py-5">Stock</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products
                .filter((p) =>
                  search === '' ||
                  p.name.toLowerCase().includes(search.toLowerCase()) ||
                  p.sku.toLowerCase().includes(search.toLowerCase()) ||
                  p.category.toLowerCase().includes(search.toLowerCase())
                )
                .map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-6">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                      />
                    </td>

                    {/* Image */}
                    <td className="px-6 py-6">
                      <div className={`w-16 h-20 rounded-lg ${p.imgBg} border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm cursor-pointer`}>
                        <span className="material-symbols-outlined text-slate-400 text-2xl">image</span>
                      </div>
                    </td>

                    {/* Product Info */}
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          {p.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p.badgeBg}`}>
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{p.category}</span>
                          {p.subCategory && (
                            <><span>›</span><span className="text-slate-500">{p.subCategory}</span></>
                          )}
                          <span>•</span>
                          <span>SKU: {p.sku}</span>
                        </div>
                        {p.collections && p.collections.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.collections.map((col) => (
                              <span key={col} className="px-1.5 py-0.5 bg-badge/10 text-badge text-[9px] font-bold rounded">{col}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-badge uppercase ${p.perfBg}`}>
                        {p.performance}
                      </span>
                    </td>

                    {/* Price / Margin */}
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{p.price}</span>
                          {p.priceOld && (
                            <span className="text-[11px] text-slate-400 line-through">{p.priceOld}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Coût: {p.cost}{' '}
                          <span className="text-brand font-bold ml-1">({p.margin})</span>
                        </span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-6">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                          <span className="text-slate-500">{p.stockLabel}</span>
                          <span className={p.stockColor}>{p.stockStatus}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.stockBarColor} rounded-full`}
                            style={{ width: `${p.stockPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-1">
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button onClick={() => navigate(`/produits/edit/${p.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                          </button>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 flex items-center justify-between bg-white border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            3 sur 1,284 produits affichés
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>Produits par page</span>
              <CustomSelect
                value={perPage}
                onChange={setPerPage}
                options={['10', '25', '50']}
                size="sm"
              />
            </div>
            <div className="text-xs text-slate-500 font-bold">Page 1 de 128</div>
            <div className="flex items-center gap-1.5">
              <button disabled className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span>
              </button>
              <button disabled className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Produits
