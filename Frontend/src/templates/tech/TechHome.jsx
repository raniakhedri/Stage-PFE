import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { useCopy } from '../shared/useCopy'
import { HomeSections } from '../shared/HomeSections'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'

function Title({ eyebrow, children, link }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-2">{eyebrow}</p>}
        <h2 className="t-heading font-headline text-3xl md:text-4xl text-ink">{children}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-accent hover:gap-2 transition-all">
          Tout voir <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

/** Tech: dark grid hero with a product stage, rounded category cards, key figures and gradient newsletter. */
export default function TechHome() {
  const { businessType } = useStore()
  const copy = useCopy()
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.tech
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : null


  // Sections the merchant can hide and reorder (backoffice > Page d’accueil).
  const blocks = {
    hero: (
      <>
        {/* Hero */}
        <section className="relative bg-primary text-white overflow-hidden">
          <div className="absolute inset-0 tech-grid" />
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/30 blur-[120px]" />
          <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="relative max-w-[1440px] mx-auto px-5 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 bg-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> {banner?.badgeText || hero.eyebrow}
              </p>
              <h1 className="font-headline text-4xl md:text-6xl leading-[1.05] mt-6">
                {banner?.title || hero.title}
              </h1>
              <p className="mt-5 text-lg text-slate-300 max-w-lg">{banner?.subtitle || hero.text}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <CtaLink to={bannerCtaTarget(banner, categories)} className="t-btn h-12 px-6 rounded-xl bg-accent text-white font-semibold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-accent/30">
                  {banner?.ctaText || copy.cta} <ArrowRight size={18} />
                </CtaLink>
                {categories[1] && (
                  <Link to={`/categories/${categories[1].slug}`} className="h-12 px-6 rounded-xl border border-white/20 font-semibold flex items-center hover:bg-white/10">
                    {categories[1].name}
                  </Link>
                )}
              </div>
              <div className="mt-12 grid grid-cols-3 gap-4 max-w-md">
                {copy.stats.map(([value, label]) => (
                  <div key={label}>
                    <p className="font-headline text-2xl md:text-3xl">{value}</p>
                    <p className="text-xs text-slate-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-white/5">
              <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
              {banners.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button onClick={data.prev} aria-label="Précédent" className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70"><ArrowLeft size={16} /></button>
                  <button onClick={data.next} aria-label="Suivant" className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70"><ArrowRight size={16} /></button>
                </div>
              )}
            </div>
          </div>
        </section>
      </>
    ),
    categories: (
      <>
        {/* Categories */}
        {categories.length > 0 && (
          <section className="max-w-[1440px] mx-auto px-5 md:px-8 pt-16">
            <Title eyebrow="Explorer">{copy.categoriesTitle}</Title>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 12).map((c) => (
                <Link key={c.slug} to={`/categories/${c.slug}`} className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-accent hover:shadow-lg hover:shadow-accent/10 transition-all">
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">{c.name}</p>
                  {c.productCount > 0 && <p className="text-xs text-slate-500">{c.productCount} produits</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </>
    ),
    products: (
      <>
        {/* New products */}
        {products.length > 0 && (
          <section className="max-w-[1440px] mx-auto px-5 md:px-8 pt-16">
            <Title eyebrow="Dernières arrivées" link={firstCat}>{copy.newTitle}</Title>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </>
    ),
    recommendations: (
      <>
        <RecommendedProducts kind="for-you" reloadKey="home" title={copy.recoTitle || "Recommandé pour vous"} eyebrow={copy.recoEyebrow || "D’après votre navigation"} />
      </>
    ),
    promises: (
      <>
        {/* Commitment band */}
        <section className="max-w-[1440px] mx-auto px-5 md:px-8 pt-20">
          <div className="rounded-3xl bg-primary text-white p-8 md:p-14 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center relative overflow-hidden">
            <div className="absolute inset-0 tech-grid opacity-60" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{copy.editorial.eyebrow}</p>
              <h2 className="font-headline text-3xl md:text-5xl mt-3">{copy.editorial.title}</h2>
              <p className="mt-4 text-slate-300 leading-relaxed max-w-xl">{copy.editorial.text}</p>
              {firstCat && (
                <Link to={firstCat} className="mt-8 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white text-primary font-semibold hover:gap-3 transition-all">
                  {copy.editorial.cta} <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className="relative grid grid-cols-2 gap-3">
              {copy.promises.map((p) => {
                const Icon = PROMISE_ICONS[p.icon]
                const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND.` : p.text
                return (
                  <div key={p.title} className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                    <span className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center"><Icon size={20} /></span>
                    <p className="font-semibold mt-3">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </>
    ),
    newsletter: (
      <>
        {/* Newsletter */}
        <section className="max-w-[1440px] mx-auto px-5 md:px-8 py-20">
          <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-accent to-violet-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="t-heading font-headline text-3xl md:text-4xl">{copy.newsletter.title}</h2>
              <p className="mt-2 text-white/80">{copy.newsletter.text}</p>
            </div>
            <NewsletterForm
              className="flex gap-2 w-full md:w-auto md:min-w-[420px]"
              inputClassName="flex-1 min-w-0 rounded-xl bg-white/15 border border-white/30 placeholder:text-white/60 px-4 py-3 text-sm outline-none focus:bg-white/25"
              buttonClassName="rounded-xl bg-white text-primary font-semibold px-5"
            />
          </div>
        </section>
      </>
    ),
  }

  return (
    <div className="bg-surface text-ink">
      <HomeSections layout="tech" blocks={blocks} />
    </div>
  )
}
