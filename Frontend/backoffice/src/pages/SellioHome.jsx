import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellioLogo, TechBackdrop, DISPLAY, MONO } from '../components/sellio/brand'
import { readUser } from '../lib/sellio'

const FEATURES = [
  {
    icon: 'storefront',
    title: 'Trois vitrines premium',
    text: 'Minimal, Bold ou Luxury : chaque modèle a son en-tête, ses menus et sa page d’accueil. Changez-en en un clic.',
    wide: true,
  },
  { icon: 'view_in_ar', title: 'Essayage virtuel IA', text: 'Vos clientes essaient les vêtements en direct depuis la fiche produit.' },
  { icon: 'palette', title: 'Votre palette', text: 'Couleurs principales, accent, fond, boutons : la vitrine prend votre identité.' },
  { icon: 'checkroom', title: 'Catalogue structuré', text: 'Tailles, couleurs, tissus, contenances : des listes prêtes, extensibles à volonté.' },
  { icon: 'local_shipping', title: 'Commandes & retours', text: 'Suivi, TVA, zones de livraison et remboursements au même endroit.' },
  { icon: 'insights', title: 'Analyse & churn', text: 'Tableau de bord temps réel et prédiction des clients sur le départ.', wide: true },
  { icon: 'campaign', title: 'Marketing intégré', text: 'Promotions, codes, fidélité par segments et campagnes e-mail.' },
]

const STEPS = [
  { n: '01', title: 'Créez votre compte', text: 'Un e-mail, un mot de passe. Pas de carte bancaire.' },
  { n: '02', title: 'Choisissez votre vitrine', text: 'Activité, modèle, logo et couleurs — l’aperçu se met à jour en direct.' },
  { n: '03', title: 'Vendez', text: 'Ajoutez vos produits : votre boutique est en ligne sur son propre lien.' },
]

const STATS = [
  ['3', 'modèles de vitrine'],
  ['2', 'secteurs : mode & cosmétique'],
  ['TND', 'prix, TVA et livraison locales'],
  ['24/7', 'boutique toujours ouverte'],
]

/** Tiny CSS-only renderings of the three storefront templates for the hero mock-up. */
function TemplateMock({ kind }) {
  if (kind === 'bold') {
    return (
      <div className="h-full bg-neutral-100 text-black">
        <div className="bg-black text-white text-[7px] font-bold uppercase tracking-widest py-1 overflow-hidden whitespace-nowrap">
          <span className="inline-block sellio-marquee">Livraison offerte ✦ Nouveau drop ✦ Paiement sécurisé ✦ Livraison offerte ✦ Nouveau drop ✦</span>
        </div>
        <div className="bg-black text-white px-3 py-2 flex justify-between items-center text-[8px] font-bold uppercase">
          <span>☰ Menu</span><span className="text-sm" style={{ fontFamily: 'Impact, sans-serif' }}>VOTRE MARQUE</span><span>Panier (2)</span>
        </div>
        <div className="relative h-[46%] bg-gradient-to-br from-neutral-700 to-neutral-950 p-3 flex flex-col justify-end">
          <p className="text-white uppercase leading-[0.85] text-3xl" style={{ fontFamily: 'Impact, sans-serif' }}>Porte-le.<br />Assume-le.</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-2">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-neutral-300" />
              <div className="border-t-2 border-black mt-1 pt-0.5 text-[7px] font-bold uppercase">Pièce 0{i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'luxury') {
    return (
      <div className="h-full bg-[#f6f1ea] text-[#1c1917]">
        <div className="relative h-[58%] bg-gradient-to-b from-[#3b3530] to-[#1c1917] flex flex-col items-center justify-center text-white">
          <span className="absolute top-2 text-[10px] tracking-[0.3em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>Maison</span>
          <p className="text-[8px] tracking-[0.3em] uppercase opacity-70">La collection</p>
          <p className="text-2xl mt-1" style={{ fontFamily: 'Georgia, serif' }}>L’élégance, sans effort.</p>
          <span className="mt-3 border border-white/60 px-3 py-1 text-[7px] tracking-[0.25em] uppercase">Découvrir</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="text-center">
              <div className="aspect-[3/4] rounded-t-full bg-[#e3d9cb]" />
              <p className="text-[8px] mt-1" style={{ fontFamily: 'Georgia, serif' }}>Univers {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="h-full bg-white text-neutral-900">
      <div className="bg-neutral-900 text-white text-[7px] text-center py-1">Livraison gratuite dès 200 TND</div>
      <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 text-[8px]">
        <span className="font-semibold text-[10px]">Votre marque</span>
        <span className="text-neutral-500">Nouveautés · Robes · Soins</span>
        <span>⌕ ♡ ◫</span>
      </div>
      <div className="m-2 grid grid-cols-2 rounded-md overflow-hidden bg-neutral-100 h-[42%]">
        <div className="p-3 flex flex-col justify-center">
          <p className="text-[7px] uppercase tracking-widest text-neutral-500">Nouvelle collection</p>
          <p className="text-sm font-semibold leading-tight mt-1">Des pièces simples, faites pour durer.</p>
          <span className="mt-2 self-start bg-neutral-900 text-white text-[7px] px-2 py-1 rounded">Découvrir</span>
        </div>
        <div className="bg-gradient-to-br from-neutral-300 to-neutral-400" />
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="aspect-[4/5] rounded bg-neutral-100" />
            <p className="text-[7px] mt-0.5">Produit {i + 1}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroMock() {
  const kinds = ['minimal', 'bold', 'luxury']
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % kinds.length), 3500)
    return () => clearInterval(id)
  }, [kinds.length])

  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
      <div className="relative rounded-2xl bg-[#0c0d10] border border-white/10 shadow-[0_40px_120px_-20px_rgba(124,58,237,0.45)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/40" style={MONO}>
            sellio.tn/<span className="text-white/70">votre-boutique</span>
          </span>
          <div className="hidden sm:flex gap-1">
            {kinds.map((k, i) => (
              <button
                key={k}
                onClick={() => setActive(i)}
                className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider transition-colors ${active === i ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                style={MONO}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="relative aspect-[16/10]">
          {kinds.map((k, i) => (
            <div key={k} className={`absolute inset-0 transition-all duration-700 ${active === i ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}>
              <TemplateMock kind={k} />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:flex absolute -left-10 bottom-10 items-center gap-3 rounded-xl bg-[#111318]/90 backdrop-blur border border-white/10 px-4 py-3 shadow-2xl">
        <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-lg">shopping_bag</span>
        <div>
          <p className="text-[11px] text-white/50">Nouvelle commande</p>
          <p className="text-sm font-medium text-white" style={MONO}>+ 189,00 TND</p>
        </div>
      </div>
      <div className="hidden md:flex absolute -right-8 top-16 items-center gap-3 rounded-xl bg-[#111318]/90 backdrop-blur border border-white/10 px-4 py-3 shadow-2xl">
        <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center material-symbols-outlined text-lg">auto_awesome</span>
        <div>
          <p className="text-[11px] text-white/50">Essayage IA</p>
          <p className="text-sm font-medium text-white">Actif sur 12 produits</p>
        </div>
      </div>
    </div>
  )
}

export default function SellioHome() {
  const user = readUser()
  const signedIn = Boolean(localStorage.getItem('accessToken')) && user?.roleName && user.roleName !== 'CLIENT'
  const spaceLink = user?.roleName === 'SUPER_ADMIN' ? '/sellio' : user?.shopSlug ? `/${user.shopSlug}/dashboard` : '/nouvelle-boutique'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#07080a] text-white antialiased selection:bg-violet-500/40" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes sellioMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .sellio-marquee { animation: sellioMarquee 12s linear infinite }
        @keyframes sellioShine { from { background-position: 200% 0 } to { background-position: -200% 0 } }
        .sellio-shine { background-size: 200% 100%; animation: sellioShine 6s linear infinite }
        @media (prefers-reduced-motion: reduce) { .sellio-marquee, .sellio-shine { animation: none } }
      `}</style>

      {/* Nav */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? 'bg-[#07080a]/80 backdrop-blur-xl border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <SellioLogo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#modeles" className="hover:text-white transition-colors">Modèles</a>
            <a href="#etapes" className="hover:text-white transition-colors">Comment ça marche</a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <a href={spaceLink} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90">Mon espace →</a>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg text-sm text-white/80 hover:text-white">Se connecter</Link>
                <Link to="/inscription" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90">Créer ma boutique</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 md:pt-44 pb-24 overflow-hidden">
        <TechBackdrop />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" />
            Nouveau · Essayage virtuel par IA
          </span>
          <h1 className="mt-7 text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-[-0.04em] leading-[0.95]" style={DISPLAY}>
            Votre boutique en ligne,
            <br />
            <span className="bg-gradient-to-r from-white via-violet-300 to-cyan-200 bg-clip-text text-transparent sellio-shine">prête en quelques minutes.</span>
          </h1>
          <p className="mt-7 max-w-2xl mx-auto text-base md:text-lg text-white/55 leading-relaxed">
            Sellio est la plateforme e-commerce pensée pour les marques de mode et de cosmétique :
            vitrines premium, catalogue structuré, paiements, livraisons et analyses — sans une ligne de code.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={signedIn ? spaceLink : '/inscription'} className="group w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2">
              {signedIn ? 'Ouvrir mon espace' : 'Commencer gratuitement'}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a href="#modeles" className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] text-sm font-medium hover:bg-white/[0.07] transition-colors">
              Voir les modèles
            </a>
          </div>
          <p className="mt-5 text-xs text-white/35" style={MONO}>Sans carte bancaire · Prêt en 3 étapes · Hébergé en Tunisie</p>

          <div id="modeles" className="mt-20 max-w-5xl mx-auto scroll-mt-24">
            <HeroMock />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
          {STATS.map(([value, label]) => (
            <div key={label} className="py-10 px-6 md:px-8 bg-[#08090b]">
              <p className="text-4xl md:text-5xl font-semibold tracking-tight" style={DISPLAY}>{value}</p>
              <p className="mt-2 text-sm text-white/45">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="relative py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80" style={MONO}>// Fonctionnalités</p>
          <h2 className="mt-4 text-4xl md:text-6xl font-semibold tracking-[-0.03em] max-w-3xl leading-[1.02]" style={DISPLAY}>
            Tout ce qu’il faut pour vendre. Rien de superflu.
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 overflow-hidden hover:border-white/20 transition-colors ${f.wide ? 'md:col-span-2' : ''}`}
              >
                <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-violet-500/0 group-hover:bg-violet-500/10 blur-3xl transition-colors duration-700" />
                <span className="relative w-11 h-11 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center material-symbols-outlined text-[22px] text-white/90">{f.icon}</span>
                <h3 className="relative mt-6 text-xl font-semibold tracking-tight" style={DISPLAY}>{f.title}</h3>
                <p className="relative mt-2 text-sm text-white/50 leading-relaxed max-w-md">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="etapes" className="py-28 border-t border-white/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[1fr_1.4fr] gap-14">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80" style={MONO}>// Comment ça marche</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]" style={DISPLAY}>
              De l’idée à la première vente.
            </h2>
            <p className="mt-5 text-white/50 max-w-md">Chaque compte Sellio possède sa boutique, son lien et son backoffice. Vos données restent séparées de celles des autres marchands.</p>
          </div>
          <ol className="space-y-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span className="text-sm text-violet-300" style={MONO}>{s.n}</span>
                <div>
                  <p className="text-lg font-semibold" style={DISPLAY}>{s.title}</p>
                  <p className="text-sm text-white/50 mt-1">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-8 pb-28">
        <div className="relative max-w-7xl mx-auto rounded-3xl border border-white/10 overflow-hidden px-8 py-20 md:py-24 text-center">
          <TechBackdrop />
          <h2 className="relative text-4xl md:text-6xl font-semibold tracking-[-0.03em]" style={DISPLAY}>Lancez votre marque aujourd’hui.</h2>
          <p className="relative mt-5 text-white/55 max-w-xl mx-auto">Créez votre compte, choisissez votre vitrine et publiez votre premier produit en moins de dix minutes.</p>
          <div className="relative mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/inscription" className="px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90">Créer ma boutique</Link>
            <Link to="/login" className="px-6 py-3.5 rounded-xl border border-white/15 text-sm font-medium hover:bg-white/5">J’ai déjà un compte</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <SellioLogo />
          <p style={MONO} className="text-xs">© {new Date().getFullYear()} Sellio · Plateforme e-commerce</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-white">Connexion</Link>
            <Link to="/inscription" className="hover:text-white">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
