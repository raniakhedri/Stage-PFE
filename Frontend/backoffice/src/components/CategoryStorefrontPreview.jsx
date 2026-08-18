import { storefrontCategoryUrl } from '../lib/storefront'

export default function CategoryStorefrontPreview({
  allCats = [],
  nom = '',
  slug = '',
  type = 'Principale',
  parentId = null,
  menuPosition = 1,
  visMenu = false,
  visFooter = false,
  visHomepage = false,
  visMobile = false,
  imageUrl = '',
  productCount = null,
  currentId = null,
}) {
  const displayName = (nom || 'Catégorie').trim() || 'Catégorie'
  const selectedParent = allCats.find((c) => c.id === parentId) || null

  const rootCats = allCats
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0))

  const navItems = (() => {
    if (!visMenu) {
      return rootCats.filter((c) => c.visMenu !== false)
    }
    if (type === 'Principale') {
      const others = rootCats.filter((c) => c.id !== currentId)
      const items = others.map((c) => ({ id: c.id, nom: c.nom, current: false }))
      const insertIdx = Math.max(0, Math.min((Number(menuPosition) || 1) - 1, items.length))
      items.splice(insertIdx, 0, { id: currentId || 'current', nom: displayName, current: true })
      return items
    }
    return rootCats.map((c) => ({
      id: c.id,
      nom: c.nom,
      current: selectedParent?.id === c.id,
    }))
  })()

  const subcats = (() => {
    if (type === 'Secondaire') {
      const siblings = allCats
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0))
      const others = siblings.filter((c) => c.id !== currentId)
      const items = others.map((c) => ({ id: c.id, nom: c.nom, current: false }))
      const insertIdx = Math.max(0, Math.min((Number(menuPosition) || 1) - 1, items.length))
      items.splice(insertIdx, 0, { id: currentId || 'current', nom: displayName, current: true })
      return items
    }
    return allCats
      .filter((c) => c.parentId === currentId)
      .sort((a, b) => (a.menuPosition || 0) - (b.menuPosition || 0))
      .map((c) => ({ id: c.id, nom: c.nom, current: false }))
  })()

  const liveUrl = storefrontCategoryUrl(slug)

  return (
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
        <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-[#fef8f3]">
          <div className="bg-[#2d4a3e] text-white text-[8px] tracking-[0.12em] uppercase px-3 py-1.5">
            Livraison gratuite dès 49 TND d'achat
          </div>

          <div className="bg-white px-3 py-2.5 flex items-center gap-3 border-b border-slate-100">
            <span className="text-[13px] font-bold tracking-tight text-[#163328] shrink-0">NaturEssence</span>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar min-w-0">
              {visMenu && navItems.length > 0 ? navItems.map((item) => (
                <span
                  key={item.id}
                  className={`text-[8px] font-bold whitespace-nowrap pb-0.5 ${
                    item.current
                      ? 'text-[#C4A55A] border-b border-[#C4A55A]'
                      : 'text-[#546349]'
                  }`}
                >
                  {item.nom}
                </span>
              )) : (
                <span className="text-[8px] text-slate-400 italic">Non visible dans le menu</span>
              )}
            </div>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#163328] leading-tight truncate">{displayName}</p>
                {productCount != null && (
                  <p className="text-[9px] text-slate-500 mt-0.5">{productCount} produit{productCount !== 1 ? 's' : ''}</p>
                )}
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="" className="h-10 w-10 rounded-md object-cover bg-slate-100 shrink-0" />
              )}
            </div>

            {subcats.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-[#163328] text-white">Tout voir</span>
                {subcats.map((s) => (
                  <span
                    key={s.id}
                    className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                      s.current ? 'bg-[#C4A55A] text-white' : 'bg-white text-[#163328] border border-slate-200'
                    }`}
                  >
                    {s.nom}
                  </span>
                ))}
              </div>
            )}

            {visFooter && (
              <div className="bg-[#163328] rounded-md px-3 py-2">
                <p className="text-[7px] font-bold tracking-widest uppercase text-[#C4A55A] mb-1">Navigation · Footer</p>
                <p className="text-[8px] text-white/80 truncate">{displayName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {visMenu && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">Menu #{menuPosition}</span>
          )}
          {visHomepage && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Homepage</span>
          )}
          {visFooter && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Footer</span>
          )}
          {visMobile && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Mobile</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">info</span>
            Tel que vu sur le site (navbar + page catégorie)
          </p>
          {slug && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-brand hover:underline flex items-center gap-0.5"
            >
              Voir sur le site
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
