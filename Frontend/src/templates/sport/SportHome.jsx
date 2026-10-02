import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { copyFor } from '../shared/content'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'

function Title({ kicker, children, link }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        {kicker && <p className="font-bold uppercase italic text-sm text-primary/60 mb-1">// {kicker}</p>}
        <h2 className="t-heading font-headline text-5xl md:text-7xl leading-[0.9] text-ink">{children}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:inline-flex sport-skew bg-primary text-white font-bold uppercase italic text-sm px-5 py-2.5 hover:bg-accent hover:text-primary transition-colors">
          <span className="flex items-center gap-2">Tout voir <ArrowRight size={16} /></span>
        </Link>
      )}
    </div>
  )
}

/** Sport: diagonal hero with key figures, numbered disciplines, lime marquee and a dark statement block. */
export default function SportHome() {
  const { businessType } = useStore()
  const copy = copyFor(businessType)
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.sport
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : null

  return (
    <div className="bg-surface text-ink">
      {/* Hero */}
      <section className="relative bg-primary text-white sport-cut min-h-[640px] overflow-hidden">
        <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} className="opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="relative max-w-[1440px] mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-28">
          <p className="inline-flex items-center gap-2 bg-accent text-primary font-extrabold uppercase italic text-sm px-3 py-1 sport-skew">
            <span className="flex items-center gap-1.5"><Zap size={14} fill="currentColor" /> {banner?.badgeText || hero.eyebrow}</span>
          </p>
          <h1 className="font-headline mt-6 text-[17vw] md:text-[8.5vw] leading-[0.82] max-w-[12ch]">{banner?.title || hero.title}</h1>
          <p className="mt-6 max-w-lg text-lg text-white/80">{banner?.subtitle || hero.text}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <CtaLink to={bannerCtaTarget(banner, categories)} className="t-btn sport-skew bg-accent text-primary font-extrabold uppercase italic text-lg px-8 py-4 hover:bg-white transition-colors">
              <span className="flex items-center gap-3">{banner?.ctaText || copy.cta} <ArrowRight size={20} strokeWidth={3} /></span>
            </CtaLink>
            {banners.length > 1 && (
              <div className="flex gap-2">
                <button onClick={data.prev} aria-label="Précédent" className="w-12 h-12 border-2 border-white/60 flex items-center justify-center hover:border-accent hover:text-accent"><ArrowLeft size={18} /></button>
                <button onClick={data.next} aria-label="Suivant" className="w-12 h-12 border-2 border-white/60 flex items-center justify-center hover:border-accent hover:text-accent"><ArrowRight size={18} /></button>
              </div>
            )}
          </div>
          <div className="mt-14 grid grid-cols-3 gap-4 max-w-3xl">
            {copy.stats.map(([value, label]) => (
              <div key={label} className="border-l-4 border-accent pl-3">
                <p className="font-headline text-3xl md:text-5xl text-white leading-none">{value}</p>
                <p className="text-xs md:text-sm uppercase font-semibold text-white/70 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines */}
      {categories.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-5 md:px-8 pt-16">
          <Title kicker="Choisis ton terrain">{copy.categoriesTitle}</Title>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((c, i) => (
              <Link key={c.slug} to={`/categories/${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded bg-ink">
                {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />}
                <span className="absolute top-2 right-3 font-headline text-6xl text-white/25">{String(i + 1).padStart(2, '0')}</span>
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-primary to-transparent">
                  <p className="font-headline text-3xl text-white leading-none">{c.name}</p>
                  <p className="mt-2 text-xs font-bold uppercase text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Go <ArrowRight size={14} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Marquee */}
      <div className="mt-16 bg-accent text-primary py-4 overflow-hidden -rotate-1">
        <div className="marquee-track flex whitespace-nowrap w-max">
          {[...copy.marquee, ...copy.marquee, ...copy.marquee, ...copy.marquee].map((item, i) => (
            <span key={i} className="font-headline text-3xl px-6">{item} <span className="opacity-40">✦</span></span>
          ))}
        </div>
      </div>

      {/* New products */}
      {products.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-5 md:px-8 pt-16">
          <Title kicker="Fraîchement arrivé" link={firstCat}>{copy.newTitle}</Title>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
            {products.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      <RecommendedProducts kind="for-you" reloadKey="home" title="Ta sélection" eyebrow="Selon ton activité" />

      {/* Statement */}
      <section className="mt-20 bg-primary text-white">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            {copy.statement.map((word, i) => (
              <p key={i} className={`font-headline text-6xl md:text-8xl leading-[0.85] ${i % 2 ? 'text-accent' : 'text-white'}`}>{word}</p>
            ))}
          </div>
          <div>
            <p className="font-bold uppercase italic text-accent">{copy.editorial.eyebrow}</p>
            <h3 className="font-headline text-4xl mt-2">{copy.editorial.title}</h3>
            <p className="mt-4 text-white/75 leading-relaxed">{copy.editorial.text}</p>
            {firstCat && (
              <Link to={firstCat} className="mt-8 inline-flex sport-skew bg-white text-primary font-extrabold uppercase italic px-6 py-3 hover:bg-accent transition-colors">
                <span className="flex items-center gap-2">{copy.editorial.cta} <ArrowRight size={16} /></span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="max-w-[1440px] mx-auto px-5 md:px-8 pt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {copy.promises.map((p) => {
            const Icon = PROMISE_ICONS[p.icon]
            const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND d'achat.` : p.text
            return (
              <div key={p.title} className="bg-white rounded p-6 border-b-4 border-accent">
                <Icon size={26} strokeWidth={2.2} className="text-primary" />
                <p className="font-headline text-2xl mt-3 leading-none">{p.title}</p>
                <p className="text-sm text-secondary mt-2">{text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-[1440px] mx-auto px-5 md:px-8 py-16">
        <div className="bg-accent text-primary rounded p-8 md:p-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="t-heading font-headline text-5xl md:text-6xl leading-[0.9]">{copy.newsletter.title}</h2>
            <p className="mt-3 font-semibold">{copy.newsletter.text}</p>
          </div>
          <NewsletterForm
            className="flex gap-2"
            inputClassName="flex-1 min-w-0 bg-white border-2 border-primary rounded px-4 py-4 text-sm outline-none"
            buttonClassName="bg-primary text-white font-extrabold uppercase italic px-6 rounded"
            buttonLabel="Go !"
          />
        </div>
      </section>
    </div>
  )
}
