import { Link } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { useCopy } from '../shared/useCopy'
import { HomeSections } from '../shared/HomeSections'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'

const small = 'text-[11px] uppercase tracking-[0.28em]'

function Ornament({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="w-10 h-px bg-current opacity-40" />
      <span className="w-1.5 h-1.5 rotate-45 border border-current opacity-60" />
      <span className="w-10 h-px bg-current opacity-40" />
    </div>
  )
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="text-center mb-14 md:mb-16">
      {eyebrow && <p className={`${small} text-accent mb-4`}>{eyebrow}</p>}
      <h2 className="t-heading font-headline text-4xl md:text-6xl text-ink">{title}</h2>
      <Ornament className="mt-6 text-ink" />
    </div>
  )
}

export default function LuxuryHome() {
  const { businessType, storeName } = useStore()
  const copy = useCopy()
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.luxury
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : '/'
  const second = products.length > 4 ? products.slice(4, 8) : []


  // Sections the merchant can hide and reorder (backoffice > Page d’accueil).
  const blocks = {
    hero: (
      <>
        {/* Hero */}
        <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-neutral-900">
          <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/50" />
          <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-6 pt-28">
            <p className={`${small} text-white/85 mb-6`}>{banner?.badgeText || hero.eyebrow}</p>
            <h1 className="font-headline text-5xl sm:text-6xl md:text-8xl leading-[1.02] max-w-5xl">
              {banner?.title || hero.title}
            </h1>
            <p className="mt-7 max-w-lg text-white/80 text-base md:text-lg font-light leading-relaxed">{banner?.subtitle || hero.text}</p>
            <CtaLink
              to={bannerCtaTarget(banner, categories)}
              className={`${small} mt-12 border border-white/70 px-10 py-4 hover:bg-white hover:text-ink transition-colors duration-500`}
            >
              {banner?.ctaText || copy.cta}
            </CtaLink>
          </div>
          {banners.length > 1 ? (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => data.setBannerIndex(i)}
                  aria-label={`Bannière ${i + 1}`}
                  className={`h-px transition-all duration-500 ${i === bannerIndex ? 'w-14 bg-white' : 'w-7 bg-white/40'}`}
                />
              ))}
            </div>
          ) : (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/70">
              <span className={small}>Défiler</span>
              <span className="w-px h-10 bg-white/50 scroll-cue" />
            </div>
          )}
        </section>
      </>
    ),
    statement: (
      <>
        {/* Manifesto */}
        <section className="px-6 py-24 md:py-36 text-center">
          <p className={`${small} text-accent`}>{storeName || 'La maison'}</p>
          <p className="font-headline italic text-3xl md:text-5xl leading-[1.3] max-w-4xl mx-auto mt-8 text-neutral-800">{copy.quote}</p>
          <Ornament className="mt-10 text-ink" />
        </section>
      </>
    ),
    categories: (
      <>
        {/* Categories as arches */}
        {categories.length > 0 && (
          <section className="px-6 md:px-12 max-w-[1440px] mx-auto">
            <SectionTitle eyebrow="Univers" title={copy.categoriesTitle} />
            <div className={`grid gap-6 md:gap-10 ${categories.length >= 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
              {categories.slice(0, 6).map((c, i) => (
                <Link key={c.slug} to={`/categories/${c.slug}`} className={`group text-center ${categories.length >= 3 && i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className="aspect-[3/4] rounded-t-full overflow-hidden bg-surface-container-low">
                    {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[1400ms] ease-out" />}
                  </div>
                  <h3 className="font-headline text-2xl md:text-3xl mt-6">{c.name}</h3>
                  <span className={`${small} inline-block mt-3 text-neutral-500 border-b border-transparent group-hover:border-neutral-500 pb-1 transition-colors`}>Découvrir</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </>
    ),
    products: (
      <>
        {/* Selection */}
        {products.length > 0 && (
          <section className="px-6 md:px-12 max-w-[1440px] mx-auto pt-28 md:pt-40">
            <SectionTitle eyebrow="Sélection" title={copy.newTitle} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 md:gap-x-8 gap-y-14">
              {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="text-center mt-16">
              <Link to={firstCat} className={`${small} inline-block border border-ink px-10 py-4 hover:bg-primary hover:border-primary hover:text-white transition-colors duration-500`}>
                Voir toute la collection
              </Link>
            </div>
          </section>
        )}
      </>
    ),
    recommendations: (
      <>
        <RecommendedProducts kind="for-you" reloadKey="home" title={copy.recoTitle || "Recommandé pour vous"} eyebrow={copy.recoEyebrow || "Selon vos goûts"} />
      </>
    ),
    editorial: (
      <>
        {/* Editorial split */}
        <section className={`mt-28 md:mt-40 grid bg-surface-container-low ${data.editorialImage ? 'lg:grid-cols-2' : ''}`}>
          {data.editorialImage && (
            <div className="relative min-h-[420px] lg:min-h-[720px] overflow-hidden">
              <img onError={hideBroken} src={data.editorialImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center justify-center px-8 md:px-20 py-20 md:py-28">
            <div className={`max-w-md text-center ${data.editorialImage ? 'lg:text-left' : ''}`}>
              <p className={`${small} text-accent`}>{copy.editorial.eyebrow}</p>
              <h2 className="t-heading font-headline text-4xl md:text-5xl leading-[1.15] mt-6">{copy.editorial.title}</h2>
              <p className="mt-8 text-neutral-600 leading-loose">{copy.editorial.text}</p>
              <Link to={firstCat} className={`${small} inline-block mt-12 border-b border-ink pb-1.5 hover:opacity-60 transition-opacity`}>
                {copy.editorial.cta}
              </Link>
            </div>
          </div>
        </section>
      </>
    ),
    bestsellers: (
      <>
        {/* Second selection */}
        {second.length > 0 && (
          <section className="px-6 md:px-12 max-w-[1440px] mx-auto pt-28 md:pt-40">
            <SectionTitle eyebrow="Signature" title={copy.bestTitle} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 md:gap-x-8 gap-y-14">
              {second.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </>
    ),
    promises: (
      <>
        {/* Services */}
        <section className="px-6 md:px-12 max-w-[1440px] mx-auto pt-28 md:pt-40">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 border-y border-ink/10 py-14">
            {copy.promises.map((p) => {
              const Icon = PROMISE_ICONS[p.icon]
              const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND d'achat.` : p.text
              return (
                <div key={p.title} className="text-center px-4">
                  <Icon size={24} strokeWidth={1} className="mx-auto text-ink" />
                  <p className={`${small} mt-5 text-ink`}>{p.title}</p>
                  <p className="text-sm text-neutral-500 mt-3 font-light">{text}</p>
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
        <section className="px-6 py-28 md:py-40 text-center">
          <p className={`${small} text-accent`}>Newsletter</p>
          <h2 className="t-heading font-headline text-4xl md:text-6xl mt-5">{copy.newsletter.title}</h2>
          <p className="mt-5 text-neutral-500 font-light">{copy.newsletter.text}</p>
          <NewsletterForm
            className="mt-12 max-w-md mx-auto flex items-center border-b border-ink"
            inputClassName="flex-1 min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400 font-light"
            buttonClassName={`${small} py-3 pl-4 hover:opacity-60`}
          />
        </section>
      </>
    ),
  }

  return (
    <div className="bg-surface text-ink">
      <HomeSections layout="luxury" blocks={blocks} />
    </div>
  )
}
