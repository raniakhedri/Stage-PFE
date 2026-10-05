import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { useCopy } from '../shared/useCopy'
import { HomeSections } from '../shared/HomeSections'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'

/** Hand-drawn underline under a heading. */
function Squiggle({ className = '' }) {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" className={`w-32 h-3 ${className}`} aria-hidden>
      <path d="M2 8 C 40 2, 70 12, 100 6 S 160 2, 198 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Title({ eyebrow, children, link }) {
  return (
    <div className="text-center mb-10">
      {eyebrow && <p className="font-headline italic text-accent text-lg">{eyebrow}</p>}
      <h2 className="t-heading font-headline text-3xl md:text-5xl text-ink mt-1">{children}</h2>
      <Squiggle className="mx-auto mt-3 text-accent/60" />
      {link && (
        <Link to={link} className="inline-flex mt-4 items-center gap-2 text-sm text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary">
          Tout voir <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

/** Artisan: rounded hero card, circular categories, story collage, warm promises and a terracotta newsletter. */
export default function ArtisanHome() {
  const { businessType } = useStore()
  const copy = useCopy()
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.artisan
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : null
  const images = [...categories.map((c) => c.image), ...products.map((p) => p.image)].filter(Boolean)


  // Sections the merchant can hide and reorder (backoffice > Page d’accueil).
  const blocks = {
    hero: (
      <>
        {/* Hero */}
        <section className="max-w-[1320px] mx-auto px-4 md:px-8 pt-6">
          <div className="grid lg:grid-cols-[1.15fr_1fr] rounded-[32px] overflow-hidden bg-surface-container-low border border-primary/10">
            <div className="relative min-h-[340px] lg:min-h-[600px]">
              <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
            </div>
            <div className="flex flex-col justify-center px-7 md:px-14 py-14">
              <p className="font-headline italic text-accent text-xl">{banner?.badgeText || hero.eyebrow}</p>
              <h1 className="font-headline text-4xl md:text-6xl leading-[1.05] text-ink mt-3">{banner?.title || hero.title}</h1>
              <Squiggle className="mt-4 text-accent" />
              <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-md">{banner?.subtitle || hero.text}</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <CtaLink to={bannerCtaTarget(banner, categories)} className="t-btn rounded-full bg-primary text-surface px-7 py-3.5 text-[15px] hover:opacity-90 inline-flex items-center gap-2">
                  {banner?.ctaText || copy.cta} <ArrowRight size={16} />
                </CtaLink>
                {banners.length > 1 && (
                  <div className="flex gap-2">
                    <button onClick={data.prev} aria-label="Précédent" className="w-11 h-11 rounded-full border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/10"><ArrowLeft size={16} /></button>
                    <button onClick={data.next} aria-label="Suivant" className="w-11 h-11 rounded-full border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/10"><ArrowRight size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </>
    ),
    categories: (
      <>
        {/* Categories */}
        {categories.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-4 md:px-8 pt-20">
            <Title eyebrow="Faites votre marché">{copy.categoriesTitle}</Title>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {categories.slice(0, 8).map((c) => (
                <Link key={c.slug} to={`/categories/${c.slug}`} className="group w-28 md:w-36 text-center">
                  <div className="aspect-square rounded-full overflow-hidden border-4 border-surface shadow-md ring-1 ring-primary/15 bg-surface-container-low">
                    {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                  </div>
                  <p className="mt-3 font-headline text-lg text-ink group-hover:text-primary">{c.name}</p>
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
          <section className="max-w-[1320px] mx-auto px-4 md:px-8 pt-20">
            <Title eyebrow="Tout juste arrivés" link={firstCat}>{copy.newTitle}</Title>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
              {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </>
    ),
    recommendations: (
      <>
        <RecommendedProducts kind="for-you" reloadKey="home" title={copy.recoTitle || "Choisis pour vous"} eyebrow={copy.recoEyebrow || "Selon vos envies"} />
      </>
    ),
    editorial: (
      <>
        {/* Story */}
        <section className="max-w-[1320px] mx-auto px-4 md:px-8 pt-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[420px] md:h-[520px]">
              {images[0] && (
                <div className="absolute left-0 top-0 w-[68%] h-[78%] rounded-[28px] overflow-hidden shadow-lg">
                  <img onError={hideBroken} src={data.editorialImage || images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {images[1] && (
                <div className="absolute right-0 bottom-0 w-[52%] h-[58%] rounded-[28px] overflow-hidden border-8 border-surface shadow-xl rotate-2">
                  <img onError={hideBroken} src={images[1]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {!images.length && <div className="absolute inset-0 rounded-[28px] bg-primary/10" />}
            </div>
            <div>
              <p className="font-headline italic text-accent text-xl">{copy.editorial.eyebrow}</p>
              <h2 className="t-heading font-headline text-3xl md:text-5xl text-ink mt-2 leading-tight">{copy.editorial.title}</h2>
              <p className="mt-6 text-ink/70 leading-relaxed text-lg">{copy.editorial.text}</p>
              <blockquote className="mt-8 pl-5 border-l-4 border-accent/50 font-headline italic text-xl text-primary">{copy.quote}</blockquote>
              {firstCat && (
                <Link to={firstCat} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-primary text-primary px-6 py-3 hover:bg-primary hover:text-surface transition-colors">
                  {copy.editorial.cta} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>
      </>
    ),
    promises: (
      <>
        {/* Promises */}
        <section className="max-w-[1320px] mx-auto px-4 md:px-8 pt-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {copy.promises.map((p) => {
              const Icon = PROMISE_ICONS[p.icon]
              const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND d'achat.` : p.text
              return (
                <div key={p.title} className="rounded-3xl border-2 border-dashed border-primary/25 p-6 text-center">
                  <span className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Icon size={22} /></span>
                  <p className="font-headline text-xl mt-4 text-ink">{p.title}</p>
                  <p className="text-sm text-ink/60 mt-1">{text}</p>
                </div>
              )
            })}
          </div>
        </section>
      </>
    ),
    newsletter: (
      <>
        {/* Newsletter */}
        <section className="max-w-[1320px] mx-auto px-4 md:px-8 py-20">
          <div className="rounded-[32px] bg-primary text-surface px-7 py-14 md:px-16 text-center">
            <h2 className="t-heading font-headline italic text-3xl md:text-5xl">{copy.newsletter.title}</h2>
            <p className="mt-3 text-surface/80">{copy.newsletter.text}</p>
            <NewsletterForm
              className="mt-8 max-w-lg mx-auto flex gap-2"
              inputClassName="flex-1 min-w-0 rounded-full bg-surface text-ink px-5 py-3.5 text-sm outline-none"
              buttonClassName="rounded-full bg-accent text-white px-6 text-sm"
            />
          </div>
        </section>
      </>
    ),
  }

  return (
    <div className="bg-surface text-ink artisan-paper">
      <HomeSections layout="artisan" blocks={blocks} />
    </div>
  )
}
