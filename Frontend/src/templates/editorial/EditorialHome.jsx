import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import RecommendedProducts from '../../components/RecommendedProducts'
import { useStore } from '../../context/StoreContext'
import { useHomeData } from '../shared/useHomeData'
import { copyFor } from '../shared/content'
import { HeroMedia, CtaLink, bannerCtaTarget, NewsletterForm, hideBroken } from '../shared/ui'

function Rubric({ number, label, title, link }) {
  return (
    <div className="flex items-end justify-between gap-6 border-t-[3px] border-double border-ink pt-4 mb-10">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50"><span className="text-accent">{number}</span> — {label}</p>
        <h2 className="t-heading font-headline italic text-4xl md:text-6xl text-ink mt-2">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.16em] border-b border-ink pb-0.5 hover:text-accent hover:border-accent">
          Lire la suite <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  )
}

/** Éditorial: asymmetric cover, numbered table of contents with hover preview, magazine product grid and a pull quote. */
export default function EditorialHome() {
  const { businessType } = useStore()
  const copy = copyFor(businessType)
  const data = useHomeData()
  const { banner, banners, bannerIndex, categories, products } = data
  const hero = copy.hero.editorial
  const firstCat = categories[0] ? `/categories/${categories[0].slug}` : null
  const [hovered, setHovered] = useState(0)
  const preview = categories[hovered]?.image || data.fallbackImage

  return (
    <div className="bg-surface text-ink">
      {/* Cover */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-10 pt-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          <figure className="lg:col-span-7">
            <div className="relative aspect-[4/5] md:aspect-[5/6] overflow-hidden bg-surface-container-low">
              <HeroMedia banner={banner} fallbackImage={data.fallbackImage} index={bannerIndex} />
            </div>
            <figcaption className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink/50">
              <span>Fig. {bannerIndex + 1} — {banner?.badgeText || hero.eyebrow}</span>
              {banners.length > 1 && (
                <span className="flex gap-3">
                  <button onClick={data.prev} aria-label="Précédent" className="hover:text-accent"><ArrowLeft size={16} /></button>
                  <button onClick={data.next} aria-label="Suivant" className="hover:text-accent"><ArrowRight size={16} /></button>
                </span>
              )}
            </figcaption>
          </figure>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">À la une</p>
            <h1 className="font-headline italic text-5xl md:text-7xl leading-[0.98] mt-4">{banner?.title || hero.title}</h1>
            <p className="mt-8 text-lg leading-relaxed text-ink/75 first-letter:[font-family:'Playfair_Display',Georgia,serif] first-letter:text-6xl first-letter:float-left first-letter:mr-2 first-letter:leading-[0.85] first-letter:text-accent">
              {banner?.subtitle || hero.text}
            </p>
            <CtaLink to={bannerCtaTarget(banner, categories)} className="t-btn mt-10 self-start bg-ink text-surface uppercase tracking-[0.16em] text-xs px-8 py-4 hover:bg-accent transition-colors inline-flex items-center gap-3">
              {banner?.ctaText || copy.cta} <ArrowRight size={14} />
            </CtaLink>
          </div>
        </div>
      </section>

      {/* Table of contents */}
      {categories.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 md:px-10 pt-24">
          <Rubric number="01" label="Sommaire" title={copy.categoriesTitle} />
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <ol className="lg:col-span-7">
              {categories.slice(0, 8).map((c, i) => (
                <li key={c.slug} onMouseEnter={() => setHovered(i)}>
                  <Link to={`/categories/${c.slug}`} className="group flex items-baseline gap-6 py-5 border-b border-ink/15">
                    <span className="font-headline italic text-2xl text-ink/30 group-hover:text-accent w-12">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-headline text-3xl md:text-5xl group-hover:italic group-hover:translate-x-2 transition-all">{c.name}</span>
                    {c.productCount > 0 && <span className="ml-auto text-xs uppercase tracking-[0.16em] text-ink/40">{c.productCount} pièces</span>}
                  </Link>
                </li>
              ))}
            </ol>
            <div className="hidden lg:block lg:col-span-5 sticky top-24">
              <div className="aspect-[3/4] overflow-hidden bg-surface-container-low">
                {preview && <img key={preview} onError={hideBroken} src={preview} alt="" className="w-full h-full object-cover hero-anim-fade" />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products: magazine grid, first item as the lead */}
      {products.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-5 md:px-10 pt-24">
          <Rubric number="02" label="Nouveautés" title={copy.newTitle} link={firstCat} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.slice(0, 7).map((p, i) => (
              <div key={p.id} className={i === 0 ? 'col-span-2 row-span-2' : ''}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      <RecommendedProducts kind="for-you" reloadKey="home" title="Votre sélection" eyebrow="Choisi pour vous" />

      {/* Pull quote + article */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-10 pt-24">
        <Rubric number="03" label={copy.editorial.eyebrow} title={copy.editorial.title} />
        <div className="grid lg:grid-cols-12 gap-10">
          <blockquote className="lg:col-span-5 font-headline italic text-3xl md:text-4xl leading-snug text-accent">
            {copy.quote}
          </blockquote>
          <div className="lg:col-span-7 md:columns-2 gap-10 text-ink/75 leading-relaxed">
            <p className="first-letter:[font-family:'Playfair_Display',Georgia,serif] first-letter:text-6xl first-letter:float-left first-letter:mr-2 first-letter:leading-[0.85] first-letter:text-ink">
              {copy.editorial.text}
            </p>
            <ul className="mt-6 space-y-3 break-inside-avoid">
              {copy.promises.map((p, i) => (
                <li key={p.title} className="flex gap-3">
                  <span className="font-headline italic text-accent">{String(i + 1).padStart(2, '0')}</span>
                  <span><strong className="text-ink font-semibold">{p.title}.</strong> {p.icon === 'truck' && data.freeShipping ? `Offerte dès ${data.freeShipping} TND d'achat.` : p.text}</span>
                </li>
              ))}
            </ul>
            {firstCat && (
              <Link to={firstCat} className="mt-8 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] border-b border-ink pb-0.5 hover:text-accent hover:border-accent">
                {copy.editorial.cta} <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-10 py-24">
        <div className="border-y-[3px] border-double border-ink py-14 grid md:grid-cols-2 gap-8 items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">04 — La lettre</p>
            <h2 className="t-heading font-headline italic text-4xl md:text-6xl mt-3">{copy.newsletter.title}</h2>
            <p className="mt-3 text-ink/60">{copy.newsletter.text}</p>
          </div>
          <NewsletterForm
            className="flex items-end gap-4"
            inputClassName="flex-1 min-w-0 bg-transparent border-0 border-b-2 border-ink px-0 py-3 text-lg font-headline italic outline-none focus:ring-0 focus:border-accent placeholder:text-ink/30"
            buttonClassName="bg-ink text-surface uppercase tracking-[0.16em] text-xs px-6 py-4 hover:bg-accent"
            buttonLabel="S’abonner"
          />
        </div>
      </section>
    </div>
  )
}
