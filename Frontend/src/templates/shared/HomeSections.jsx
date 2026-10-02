import { Fragment, useEffect, useState } from 'react'
import ProductCard from '../../components/ProductCard'
import { fetchAllProducts } from '../../api/apiClient'
import { useStore } from '../../context/StoreContext'
import { sectionOrder } from './sectionRegistry'

/** "Sélection": a block of products the merchant picked, with their own title (backoffice > Page d'accueil). */
function SelectionSection({ selection }) {
  const ids = (selection?.productIds || []).map(String)
  const key = ids.join(',')
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!key) {
      setProducts([])
      return
    }
    let alive = true
    fetchAllProducts()
      .then((all) => {
        if (!alive) return
        const byId = new Map(all.map((p) => [String(p.id), p]))
        setProducts(key.split(',').map((id) => byId.get(id)).filter(Boolean))
      })
      .catch(() => alive && setProducts([]))
    return () => { alive = false }
  }, [key])

  if (!products.length) return null
  return (
    <section className="max-w-[1440px] mx-auto px-5 md:px-10 pt-24">
      <div className="mb-10">
        {selection.eyebrow && <p className="text-[12px] uppercase tracking-[0.16em] text-accent mb-2">{selection.eyebrow}</p>}
        <h2 className="t-heading font-headline text-2xl md:text-4xl font-semibold tracking-tight text-ink">{selection.title || 'Notre sélection'}</h2>
        {selection.text && <p className="mt-3 max-w-2xl text-ink/60">{selection.text}</p>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </section>
  )
}

/** Renders a template's home sections in the merchant's order, skipping the hidden ones. */
export function HomeSections({ layout, blocks }) {
  const { settings } = useStore()
  const home = settings?.home || {}
  return sectionOrder(layout, home.sections).map((id) => (
    <Fragment key={id}>
      {id === 'selection' ? <SelectionSection selection={home.selection} /> : blocks[id] || null}
    </Fragment>
  ))
}
