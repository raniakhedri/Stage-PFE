import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { copyFor } from '../shared/content'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'

function SectionTitle({ eyebrow, title, link }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-10">
      <div>
        {eyebrow && <p className="text-[12px] uppercase tracking-[0.16em] text-accent mb-2">{eyebrow}</p>}
        <h2 className="t-heading text-2xl md:text-[32px] font-headline font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:inline-flex items-center gap-2 text-sm text-ink hover:gap-3 transition-all">
          Tout voir <ArrowRight size={15} />
        </Link>
      )}
    </div>
  )
}

export default function MinimalHome() {
  const { businessType } = useStore()
  const copy = copyFor(businessType)
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.minimal
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : null

  return (
    <div className="bg-surface">
      {/* Hero — split */}
      <section className="max-w-[1440px] mx-auto px-5 md:px-10 pt-5 md:pt-8">
        <div className="grid lg:grid-cols-2 rounded-xl overflow-hidden bg-neutral-100 min-h-[560px] lg:h-[78vh] lg:max-h-[760px]">
          <div className="order-2 lg:order-1 flex flex-col justify-center px-7 md:px-16 py-14">
            <p className="text-[12px] uppercase tracking-[0.18em] text-accent mb-5">{banner?.badgeText || hero.eyebrow}</p>
            <h1 className="font-headline text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-ink max-w-xl">
              {banner?.title || hero.title}
            </h1>
            <p className="mt-6 text-base md:text-lg text-neutral-600 leading-relaxed max-w-md">{banner?.subtitle || hero.text}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <CtaLink to={bannerCtaTarget(banner, categories)} className="bg-primary text-white px-7 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity">
                {banner?.ctaText || copy.cta}
              </CtaLink>
              {categories[1] && (
                <Link to={`/categories/${categories[1].slug}`} className="px-7 py-3.5 text-sm font-medium border border-neutral-300 rounded hover:border-ink transition-colors">
                  {categories[1].name}
                </Link>
              )}
            </div>
            {banners.length > 1 && (
              <div className="mt-12 flex items-center gap-4">
                <button onClick={data.prev} aria-label="Précédent" className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-white"><ArrowLeft size={16} /></button>
                <span className="text-sm tabular-nums text-neutral-500">{bannerIndex + 1} / {banners.length}</span>
                <button onClick={data.next} aria-label="Suivant" className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-white"><ArrowRight size={16} /></button>
              </div>
            )}
          </div>
          <div className="order-1 lg:order-2 relative min-h-[320px] overflow-hidden">
            <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-5 md:px-10 pt-24">
          <SectionTitle title={copy.categoriesTitle} />
          <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto hide-scrollbar -mx-5 px-5 md:mx-0 md:px-0 snap-x">
            {categories.slice(0, 8).map((c) => (
              <Link key={c.slug} to={`/categories/${c.slug}`} className="group min-w-[62vw] sm:min-w-[40vw] md:min-w-0 snap-start">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100">
                  {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[15px] text-ink">{c.name}</span>
                  <ArrowRight size={15} className="text-neutral-400 group-hover:text-ink group-hover:translate-x-1 transition-all" />
                </div>
                {c.productCount > 0 && <p className="text-[13px] text-neutral-500">{c.productCount} produits</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New products */}
      {products.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-5 md:px-10 pt-24">
          <SectionTitle eyebrow="À découvrir" title={copy.newTitle} link={firstCat} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
            {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <RecommendedProducts kind="for-you" reloadKey="home" title="Recommandé pour vous" eyebrow="Selon vos goûts" />

      {/* Editorial */}
      <section className="max-w-[1440px] mx-auto px-5 md:px-10 pt-28">
        <div className={data.editorialImage ? 'grid md:grid-cols-2 gap-10 md:gap-20 items-center' : 'bg-neutral-50 rounded-xl px-7 py-20 md:py-28 flex justify-center text-center'}>
          {data.editorialImage && (
            <div className="aspect-[4/5] md:aspect-[5/6] rounded-xl overflow-hidden bg-neutral-100">
              <img onError={hideBroken} src={data.editorialImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className={data.editorialImage ? 'max-w-md' : 'max-w-2xl'}>
            <p className="text-[12px] uppercase tracking-[0.18em] text-accent mb-5">{copy.editorial.eyebrow}</p>
            <h2 className="t-heading font-headline text-3xl md:text-[44px] font-semibold tracking-tight leading-[1.1] text-ink">{copy.editorial.title}</h2>
            <p className="mt-6 text-neutral-600 leading-relaxed">{copy.editorial.text}</p>
            {firstCat && (
              <Link to={firstCat} className="mt-10 inline-flex items-center gap-2 text-sm font-medium border-b border-ink pb-1 hover:gap-3 transition-all">
                {copy.editorial.cta} <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="max-w-[1440px] mx-auto px-5 md:px-10 pt-28">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border-y border-neutral-200">
          {copy.promises.map((p) => {
            const Icon = PROMISE_ICONS[p.icon]
            const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND d'achat.` : p.text
            return (
              <div key={p.title} className="bg-surface py-10 px-5 md:px-8">
                <Icon size={22} strokeWidth={1.5} className="text-ink mb-4" />
                <p className="text-[15px] font-medium text-ink">{p.title}</p>
                <p className="text-sm text-neutral-500 mt-1">{text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-[1440px] mx-auto px-5 md:px-10 py-28">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="t-heading font-headline text-3xl md:text-4xl font-semibold tracking-tight text-ink">{copy.newsletter.title}</h2>
          <p className="mt-4 text-neutral-500">{copy.newsletter.text}</p>
          <NewsletterForm
            className="mt-8 flex gap-2"
            inputClassName="flex-1 min-w-0 border border-neutral-300 rounded px-4 py-3.5 text-sm outline-none focus:border-ink"
            buttonClassName="bg-primary text-white px-6 text-sm font-medium"
          />
        </div>
      </section>
    </div>
  )
}
