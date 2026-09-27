import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { copyFor } from '../shared/content'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'

function Heading({ children, count, right }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b-2 border-black pb-4 mb-8">
      <h2 className="font-headline uppercase text-5xl md:text-8xl leading-[0.85]">
        {children}
        {count > 0 && <sup className="text-lg md:text-2xl align-top ml-2">({count})</sup>}
      </h2>
      {right}
    </div>
  )
}

export default function BoldHome() {
  const { businessType } = useStore()
  const copy = copyFor(businessType)
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.bold
  const rail = useRef(null)
  const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : '/'
  const spotlight = products.length > 4 ? products.slice(4, 8) : products.slice(0, 4)

  return (
    <div className="bg-surface text-ink">
      {/* Hero */}
      <section className="relative h-[100svh] min-h-[600px] overflow-hidden bg-black text-white">
        <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <div className="absolute inset-x-0 bottom-0 px-4 md:px-8 pb-8 md:pb-12">
          <p className="inline-block bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 mb-6">
            {banner?.badgeText || hero.eyebrow}
          </p>
          <h1 className="font-headline uppercase leading-[0.85] text-[15vw] md:text-[10vw] max-w-[14ch] break-words">
            {banner?.title || hero.title}
          </h1>
          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <p className="max-w-md text-base md:text-lg text-white/80 font-medium">{banner?.subtitle || hero.text}</p>
            <div className="flex items-center gap-3">
              {banners.length > 1 && (
                <>
                  <button onClick={data.prev} aria-label="Précédent" className="w-14 h-14 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"><ArrowLeft size={20} /></button>
                  <button onClick={data.next} aria-label="Suivant" className="w-14 h-14 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"><ArrowRight size={20} /></button>
                </>
              )}
              <CtaLink to={bannerCtaTarget(banner, categories)} className="h-14 px-8 bg-white text-black font-bold uppercase tracking-wider text-sm flex items-center gap-3 hover:gap-5 transition-all">
                {banner?.ctaText || copy.cta} <ArrowRight size={18} strokeWidth={2.5} />
              </CtaLink>
            </div>
          </div>
        </div>
        {banners.length > 1 && (
          <div className="absolute top-32 right-4 md:right-8 font-headline text-2xl tabular-nums">
            {String(bannerIndex + 1).padStart(2, '0')}<span className="opacity-40">/{String(banners.length).padStart(2, '0')}</span>
          </div>
        )}
      </section>

      {/* Marquee */}
      <div className="bg-black text-white border-y-2 border-black overflow-hidden whitespace-nowrap py-5">
        <div className="marquee-track marquee-slow inline-flex">
          {[...copy.marquee, ...copy.marquee, ...copy.marquee, ...copy.marquee].map((t, i) => (
            <span key={i} className={`font-headline uppercase text-3xl md:text-5xl px-6 ${i % 2 ? 'text-outline' : ''}`}>{t} ✦</span>
          ))}
        </div>
      </div>

      {/* Categories: two big tiles + index list */}
      {categories.length > 0 && (
        <section className="px-4 md:px-8 pt-20 md:pt-28">
          <Heading count={categories.length}>Shop</Heading>
          <div className="grid md:grid-cols-2 gap-4">
            {categories.slice(0, 2).map((c) => (
              <Link key={c.slug} to={`/categories/${c.slug}`} className="group relative aspect-[4/5] md:aspect-[5/6] overflow-hidden bg-neutral-300">
                {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex items-end justify-between text-white">
                  <h3 className="font-headline uppercase text-5xl md:text-7xl leading-[0.85]">{c.name}</h3>
                  <span className="w-14 h-14 bg-white text-black flex items-center justify-center group-hover:rotate-45 transition-transform shrink-0"><ArrowUpRight size={24} /></span>
                </div>
              </Link>
            ))}
          </div>
          {categories.length > 2 && (
            <div className="mt-4 border-t-2 border-black">
              {categories.slice(2).map((c, i) => (
                <Link key={c.slug} to={`/categories/${c.slug}`} className="group relative flex items-center gap-6 border-b-2 border-black py-5 md:py-6 px-2 hover:bg-black hover:text-white transition-colors">
                  <span className="text-sm font-bold w-8">{String(i + 3).padStart(2, '0')}</span>
                  <span className="font-headline uppercase text-4xl md:text-6xl leading-none">{c.name}</span>
                  {c.image && (
                    <img onError={hideBroken} src={c.image} alt="" className="hidden md:block absolute right-32 top-1/2 -translate-y-1/2 w-40 h-28 object-cover opacity-0 group-hover:opacity-100 -rotate-3 group-hover:rotate-0 transition-all duration-500 pointer-events-none" />
                  )}
                  <span className="ml-auto text-sm font-bold uppercase hidden sm:block">{c.productCount > 0 ? `${c.productCount} produits` : 'Voir'}</span>
                  <ArrowUpRight size={28} />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* New products rail */}
      {products.length > 0 && (
        <section className="pt-20 md:pt-28">
          <div className="px-4 md:px-8">
            <Heading
              count={products.length}
              right={
                <div className="hidden md:flex gap-2">
                  <button onClick={() => scroll(-1)} aria-label="Précédent" className="w-12 h-12 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white"><ArrowLeft size={18} /></button>
                  <button onClick={() => scroll(1)} aria-label="Suivant" className="w-12 h-12 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white"><ArrowRight size={18} /></button>
                </div>
              }
            >
              {copy.newTitle}
            </Heading>
          </div>
          <div ref={rail} className="flex gap-4 overflow-x-auto hide-scrollbar snap-x px-4 md:px-8">
            {products.map((p, i) => (
              <div key={p.id} className="snap-start shrink-0 w-[72vw] sm:w-[42vw] lg:w-[23vw]">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Statement */}
      <section className="mt-20 md:mt-28 bg-black text-white px-4 md:px-8 py-20 md:py-32 overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
          <p className="font-headline uppercase leading-[0.85] text-[16vw] lg:text-[9vw]">
            {copy.statement.map((w, i) => (
              <span key={i} className={`block ${i % 2 ? 'text-outline-light' : ''}`}>{w}</span>
            ))}
          </p>
          {data.editorialImage && (
            <div className="relative w-full lg:w-[28vw] aspect-[3/4]">
              <img onError={hideBroken} src={data.editorialImage} alt="" className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            </div>
          )}
        </div>
        <Link to={firstCat} className="mt-12 inline-flex h-14 px-8 bg-white text-black font-bold uppercase tracking-wider text-sm items-center gap-3 hover:gap-5 transition-all">
          {copy.editorial.cta} <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </section>

      {/* Spotlight grid */}
      {spotlight.length > 0 && (
        <section className="px-4 md:px-8 pt-20 md:pt-28">
          <Heading>{copy.bestTitle}</Heading>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
            {spotlight.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Promises */}
      <section className="px-4 md:px-8 pt-20 md:pt-28">
        <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-black">
          {copy.promises.map((p, i) => {
            const Icon = PROMISE_ICONS[p.icon]
            const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND.` : p.text
            return (
              <div key={p.title} className={`p-6 md:p-8 border-black ${i % 2 ? 'border-l-2' : ''} ${i > 1 ? 'border-t-2 lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l-2' : ''}`}>
                <div className="flex items-center justify-between mb-10">
                  <span className="font-headline text-4xl">{String(i + 1).padStart(2, '0')}</span>
                  <Icon size={26} strokeWidth={2} />
                </div>
                <p className="font-bold uppercase text-sm tracking-wide">{p.title}</p>
                <p className="text-sm text-neutral-600 mt-1">{text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-4 md:px-8 py-20 md:py-28">
        <div className="bg-primary text-white p-8 md:p-16">
          <h2 className="font-headline uppercase text-5xl md:text-8xl leading-[0.85] max-w-4xl">{copy.newsletter.title}</h2>
          <p className="mt-6 text-white/70 max-w-md font-medium">{copy.newsletter.text}</p>
          <NewsletterForm
            className="mt-10 flex flex-col sm:flex-row gap-0 max-w-2xl border-2 border-white"
            inputClassName="flex-1 min-w-0 bg-transparent px-5 py-4 text-white placeholder:text-white/50 uppercase font-bold text-sm tracking-wider outline-none"
            buttonClassName="bg-white text-black px-8 py-4 font-bold uppercase text-sm tracking-wider"
            placeholder="Ton email"
            buttonLabel="Je m'inscris"
          />
        </div>
      </section>
    </div>
  )
}
