import ProductCard from './ProductCard';
import { useStore } from '../context/StoreContext';
import { useRecommendations } from '../tracking/recommendations';
import { track } from '../tracking/tracker';

/**
 * Product rail fed by the recommendation engine.
 * kind: 'similar' (params.productId) · 'for-you' · 'bought-together' (params.ids) · 'popular'
 */
export default function RecommendedProducts({ kind, params = {}, reloadKey, title, eyebrow, limit = 4, exclude = [], bare = false }) {
  const { layout } = useStore();
  const { products } = useRecommendations(kind, { ...params, limit: String(limit + exclude.length) }, reloadKey);
  const items = products.filter((p) => !exclude.includes(p.id)).slice(0, limit);
  if (!items.length) return null;

  const onClick = (product) => (e) => {
    if (e.target.closest('button')) return;
    track('RECOMMENDATION_CLICK', { productId: product.id, price: product.price });
  };

  const heading = {
    bold: (
      <div className="flex items-end justify-between border-b-2 border-black pb-4 mb-8">
        <h2 className="t-heading font-headline uppercase text-4xl md:text-6xl leading-[0.85]">{title}</h2>
        {eyebrow && <span className="text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</span>}
      </div>
    ),
    luxury: (
      <div className="text-center mb-12">
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-4">{eyebrow}</p>}
        <h2 className="t-heading font-headline text-3xl md:text-5xl text-ink">{title}</h2>
      </div>
    ),
    minimal: (
      <div className="mb-8">
        {eyebrow && <p className="text-[12px] uppercase tracking-[0.16em] text-accent mb-2">{eyebrow}</p>}
        <h2 className="t-heading text-2xl md:text-[28px] font-headline font-semibold tracking-tight text-ink">{title}</h2>
      </div>
    ),
  }[layout] || null;

  return (
    <section className={bare ? 'pt-4 pb-20' : layout === 'bold' ? 'px-4 md:px-8 pt-20' : 'max-w-[1440px] mx-auto px-5 md:px-10 pt-20 md:pt-24'}>
      {heading}
      <div className={`grid grid-cols-2 lg:grid-cols-4 ${layout === 'bold' ? 'gap-x-4 gap-y-10' : 'gap-x-4 md:gap-x-6 gap-y-12'}`}>
        {items.map((p) => (
          <div key={p.id} onClickCapture={onClick(p)}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
