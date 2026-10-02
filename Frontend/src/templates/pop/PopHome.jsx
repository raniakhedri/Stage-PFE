import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Star } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { useCopy } from '../shared/useCopy'
import { HomeSections } from '../shared/HomeSections'
import { HeroMedia, CtaLink, bannerCtaTarget, PROMISE_ICONS, NewsletterForm, hideBroken } from '../shared/ui'
import { POP_COLORS } from './PopHeader'

function Title({ children, link, emoji }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <h2 className="t-heading font-headline text-3xl md:text-5xl text-ink">
        {emoji && <span className="mr-2">{emoji}</span>}
        {children}
      </h2>
      {link && (
        <Link to={link} className="hidden sm:inline-flex items-center gap-2 font-headline bg-gold text-ink rounded-full px-5 py-2 hover:-translate-y-0.5 transition-transform">
          Tout voir <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}

/** Pop: colour block hero with floating shapes, sticker categories, rainbow statement and sunny newsletter. */
export default function PopHome() {
  const { businessType } = useStore()
  const copy = useCopy()
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.pop
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : null
  const rainbow = ['text-gold', 'text-accent', 'text-emerald-400', 'text-sky-400']


  // Sections the merchant can hide and reorder (backoffice > Page d’accueil).
  const blocks = {
    hero: (
      <>
        {/* Hero */}
        <section className="max-w-[1360px] mx-auto px-3 md:px-6 pt-6">
          <div className="relative rounded-[40px] bg-primary text-white overflow-hidden grid lg:grid-cols-2 items-center">
            <span className="pop-float absolute top-8 left-[46%] w-14 h-14 rounded-full bg-gold" style={{ '--r': '0deg' }} />
            <span className="pop-float absolute bottom-10 left-8 w-10 h-10 rounded-xl bg-accent" style={{ '--r': '20deg', animationDelay: '1s' }} />
            <Star className="pop-float absolute top-12 right-10 text-gold z-10" size={44} fill="currentColor" style={{ animationDelay: '2s' }} />
            <div className="relative z-10 px-8 md:px-14 py-14 md:py-20">
              <p className="inline-block font-headline bg-white text-primary rounded-full px-4 py-1.5 text-sm">{banner?.badgeText || hero.eyebrow}</p>
              <h1 className="font-headline text-5xl md:text-7xl leading-[1] mt-5">{banner?.title || hero.title}</h1>
              <p className="mt-5 text-lg text-white/85 max-w-md">{banner?.subtitle || hero.text}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <CtaLink to={bannerCtaTarget(banner, categories)} className="t-btn font-headline text-lg rounded-full bg-gold text-ink px-8 py-4 hover:scale-105 transition-transform inline-flex items-center gap-2">
                  {banner?.ctaText || copy.cta} <ArrowRight size={18} />
                </CtaLink>
                {banners.length > 1 && (
                  <div className="flex gap-2">
                    <button onClick={data.prev} aria-label="Précédent" className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"><ArrowLeft size={18} /></button>
                    <button onClick={data.next} aria-label="Suivant" className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"><ArrowRight size={18} /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative h-[340px] lg:h-[560px] m-4 lg:m-8 rounded-[48%_52%_42%_58%/55%_45%_55%_45%] overflow-hidden border-8 border-white/20">
              <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
            </div>
          </div>
        </section>
      </>
    ),
    categories: (
      <>
        {/* Categories */}
        {categories.length > 0 && (
          <section className="max-w-[1360px] mx-auto px-3 md:px-6 pt-16">
            <Title emoji="🧸">{copy.categoriesTitle}</Title>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((c, i) => (
                <Link
                  key={c.slug}
                  to={`/categories/${c.slug}`}
                  className={`group rounded-[28px] p-4 ${POP_COLORS[i % POP_COLORS.length]} hover:-rotate-2 hover:scale-[1.03] transition-transform`}
                >
                  <div className="aspect-square rounded-[22px] overflow-hidden bg-white/50">
                    {c.image && <img onError={hideBroken} src={c.image} alt={c.name} className="w-full h-full object-cover" />}
                  </div>
                  <p className="mt-3 font-headline text-xl text-ink text-center">{c.name}</p>
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
          <section className="max-w-[1360px] mx-auto px-3 md:px-6 pt-16">
            <Title emoji="✨" link={firstCat}>{copy.newTitle}</Title>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </>
    ),
    recommendations: (
      <>
        <RecommendedProducts kind="for-you" reloadKey="home" title={copy.recoTitle || "Rien que pour vous"} eyebrow={copy.recoEyebrow || "Vos coups de cœur"} />
      </>
    ),
    statement: (
      <>
        {/* Statement */}
        <section className="max-w-[1360px] mx-auto px-3 md:px-6 pt-16">
          <div className="rounded-[40px] bg-ink text-white px-8 py-14 md:py-20 text-center">
            <p className="font-headline text-5xl md:text-8xl leading-[1.05]">
              {copy.statement.map((word, i) => <span key={i} className={`${rainbow[i % rainbow.length]} mr-4`}>{word}</span>)}
            </p>
            <p className="mt-8 max-w-2xl mx-auto text-white/75 text-lg">{copy.editorial.text}</p>
            {firstCat && (
              <Link to={firstCat} className="mt-8 inline-flex font-headline rounded-full bg-white text-ink px-7 py-3 hover:scale-105 transition-transform">
                {copy.editorial.cta}
              </Link>
            )}
          </div>
        </section>
      </>
    ),
    promises: (
      <>
        {/* Promises */}
        <section className="max-w-[1360px] mx-auto px-3 md:px-6 pt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {copy.promises.map((p, i) => {
              const Icon = PROMISE_ICONS[p.icon]
              const text = p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND d'achat.` : p.text
              return (
                <div key={p.title} className={`rounded-[28px] p-6 ${POP_COLORS[(i + 2) % POP_COLORS.length]} ${i % 2 ? 'rotate-1' : '-rotate-1'}`}>
                  <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary"><Icon size={22} /></span>
                  <p className="font-headline text-xl mt-4 text-ink">{p.title}</p>
                  <p className="text-sm text-ink/70 mt-1">{text}</p>
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
        <section className="max-w-[1360px] mx-auto px-3 md:px-6 py-16">
          <div className="rounded-[40px] bg-gold px-8 py-12 md:px-16 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="t-heading font-headline text-4xl md:text-5xl text-ink">{copy.newsletter.title} 💌</h2>
              <p className="mt-3 text-ink/75">{copy.newsletter.text}</p>
            </div>
            <NewsletterForm
              className="flex gap-2"
              inputClassName="flex-1 min-w-0 rounded-full bg-white px-5 py-4 text-sm outline-none border-2 border-ink/10"
              buttonClassName="rounded-full bg-primary text-white font-headline px-6"
              buttonLabel="Je m’inscris"
            />
          </div>
        </section>
      </>
    ),
  }

  return (
    <div className="bg-surface text-ink">
      <HomeSections layout="pop" blocks={blocks} />
    </div>
  )
}
