import { useRef, useState, useEffect } from 'react'

const products = [
  { name: 'BLAZER STRUCTURÉ', price: '129,00 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO1WaJWUWGKeVkVIHdSfE6aFy8co2whumXdnYE4ZXrrYX2W7-1bJZvsE5v-tdS84cObJhShv_k-MxlGx1RpNhv2_mdDV0p7NXMiUJ4drgEl1bWyDEGRyYum9mDC77ux0M_IbtIl6UYn_fRoiQASjnHxOvsjreFJwNoLn3vtNrXjwnlvbyxz7_IgVjsdxwsBuZw-9NldoyqVkEeKzc6RO7MHBKOrI2Q0-cs7DEj-J1wrFlh5_yPw5ife_ufFWYFoKw-2t7y4CxGWAip' },
  { name: 'MANTEAU OVERSIZE LAINE', price: '189,00 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHG6ccHmyAE_E7Zlz4okwFL-eeSp-mN0ZTO_8WfUsk6POCZJLxAjfMU9lleiJ618w9cNHpK2QYvJBFUz7P2z-jE4dsa7itvABJT-v4EO0EkBF1_GlHHVaqovdAY9Z_jAPp6-m4PdubcMT4fZ2674_kMxHZcckl1KOH1R_o_6VX68tX4zVvL_0nVc-sjgfJDY4ET_9BbNkG-B3RljGvw49Y2eQ2bP2amjowb0vdXh9WQ1I8SQH5MWAl9_l7PUeEZ1wYFaAFIhk7vsTM' },
  { name: 'T-SHIRT COTON PREMIUM', price: '45,00 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChMv7OtAm-bmYErEDesxIbgLL4gIr3-Wl8stQZtNRXQBLC7p-ReuHgfwMNuAXiR76tHN8yEoOKtt1SIpfDnJVsshhDKFXRZ0hugidflRlULhQ-Da4TcqbOONWra7T9usIdXQiysoJwLoVrmrFAOdqdLBOtUTmKakDSPGMe4nrvrjW56L2QErGWt1LlTcfz96ptBFIISUvm668PQCXUVbsA6SzEnRM7d73qQuIu70LkZpfSWjHEK3RWeL9-qq7parikxiDccEAOloc0' },
  { name: 'PANTALON TAILLE HAUTE', price: '89,00 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPse9yr-R0pimcoUCMSXsYuF3PwJuKpiP8_Tyj19xrgoYfGy9AF49fPGiROWXeMNCmhu2ffIbB_gp6_5mgjGppwWm8rYHP1CWmzSUnTaYe8QLbJhM9c9JoumqihcueI8st90N3Fp0J23lsregHv4yrTFoqTw_6Y9hhOZUbvy5drW244ZzoTLHTzEjnR9rxzKyutHSJKoYE2BB1P5mPT2kHq51QQUiOG6E7wBRg8MSNlyBROQLJwilXuRKSG5Wsigg4jPH3XQsF4E6T' },
]

const sliderItems = [
  { name: 'ACCESSOIRES CUIR', sub: 'DÉCOUVRIR LA SÉLECTION', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmDodCk4Oz1WTRJ8Xi0wZWlE8ugNGNEGGxDJfmsH3m8z_AxqkCVi0MB3JXXcnoM3jutzG30tcvp86mOJUXSbwAKd7MMlyIspVuoFx3_ytj_3knucKRuKlgCJFrJshSGDGAJev-Zn6ftl2j_tz9mwKlQ0vc_Aygysq_HGTDNqgxSix5F3lj9whpLVh1NOAsTVX5GYujNNXFx1FpE4cWUvSNwhVM0pXtnI-2AzVPTnQx0_pvFQZLcmYINFfdf3vzUnJpM5pmi_NBftHQ' },
  { name: 'LOOKS MONOCHROMES', sub: 'DÉCOUVRIR LA SÉLECTION', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqBtLnigrzAXJVWGlEwTXeFGu1QZ972-2CRYlJYPn7oxBOIezjYQ_LD7QiuL2aoG6-FxpkXJaTj-8e8CZIUy5AFXTZthLdUHMepnhZZQ59yC4psU2SACnq42-JWsNesZOaL1RtCddw6bWBVRIrBbbl4EH_np5pWP47fPSMxYbcaS7tuMid59Q4MnEGW_Ij00MmJRTKvm8qamcBoOaJQgON2dtzI46FaF_bt9EqSLVdElZNIpVvJnro6urAnMRqCwLEFpdF8Y6RC5w5' },
  { name: 'COSTUMES MODERNES', sub: 'DÉCOUVRIR LA SÉLECTION', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtDcNJkns9Ow4AbECI3iyyZ-2UHwLPzuK-4Gw6jgqz0HkuS4wHDy-sxL_NrTZnmTlrNxXnWRGR3mpLQijfD7jXxB3Qjgvvdc5GUGFmxJIBOj2Hucdj-Eyp_7nSf-hXecnqkwgjhX9lgPzWqkYzLDxnZl9jaZ67A2fWHrWqLJRD_tQ0Uj1OAtzVZKbD8lJMUVWik8jhxpezSuk_0RTUR4TCUoIlxh7ll_O8G9juDpk2c0siGjyoKBJoe5npStZ41QoG9-B6gXa3RpBs' },
  { name: 'TEXTURES & MATIÈRES', sub: 'DÉCOUVRIR LA SÉLECTION', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWpamewuT00DRTMBQkLvravLk3R5LoNStRe5le2_a_3qc2vaewWOeZf5_Nj9zxrhRdzGRjJRlVNRxtiLcVAnI96XLUuoq75ODsbGsO9FTK_0Wj1T1Aw2jv3fmOO4TzoLq3pMzJlRVuKOc88RgAkJOgg2oI74JLmE-lSGSZejQz0cIOd8L2Givt-wY58Un0mshuIxK9o0dXKy9pRUpmGGsxqTu7QBiuRpa2rrpdwbVFLQAOhya-z2Y06bftuON1mMed9QbuGoE9VVi7' },
]

export default function Home() {
  const sliderRef = useRef(null)
  const [heroBanners, setHeroBanners] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [direction, setDirection] = useState('next')
  const [homepageCols, setHomepageCols] = useState({})

  const heroBanner = heroBanners[heroIdx] || null

  const goPrev = () => {
    setDirection('prev')
    setHeroIdx(i => (i - 1 + heroBanners.length) % heroBanners.length)
  }
  const goNext = () => {
    setDirection('next')
    setHeroIdx(i => (i + 1) % heroBanners.length)
  }

  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    try {
      const userStr = localStorage.getItem('user')
      const segment = userStr ? JSON.parse(userStr)?.segmentName || '' : ''
      const url = `${baseURL}/public/banners?position=HOMEPAGE_HERO${segment ? `&segment=${segment}` : ''}`
      fetch(url)
        .then((r) => r.ok ? r.json() : { data: [] })
        .then((json) => {
          const list = json?.data
          if (Array.isArray(list) && list.length > 0) {
            const sorted = [...list].sort((a, b) => (a.priorite ?? 99) - (b.priorite ?? 99))
            setHeroBanners(sorted)
            setHeroIdx(0)
          }
        })
        .catch(() => {})
    } catch {
      // fail silently
    }
  }, [])

  // Fetch homepage bento collections
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    fetch(`${baseURL}/public/collections/homepage`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        const map = {}
        list.forEach(c => { if (c.homepagePosition) map[c.homepagePosition] = c })
        if (Object.keys(map).length > 0) setHomepageCols(map)
      })
      .catch(() => {})
  }, [])

  // Auto-advance slideshow
  useEffect(() => {
    if (heroBanners.length <= 1) return
    const delay = (heroBanners[heroIdx]?.dureeSecondes || 5) * 1000
    const timer = setTimeout(() => {
      setDirection('next')
      setHeroIdx((i) => (i + 1) % heroBanners.length)
    }, delay)
    return () => clearTimeout(timer)
  }, [heroIdx, heroBanners])

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative h-screen w-full overflow-hidden flex items-end justify-center pb-24 px-12">

        {/* Background — key forces remount on each slide to restart animation */}
        <div
          key={`bg-${heroIdx}`}
          className={`absolute inset-0 bg-neutral-900 ${
            heroBanner?.animation === 'slide'
              ? `hero-slide-${direction}`
              : `hero-${heroBanner?.animation || 'fade'}`
          }`}
        >
          {heroBanner?.imageUrl && (
            <img
              src={heroBanner.imageUrl}
              alt={heroBanner.titre || 'Hero banner'}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Dark gradient at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-[1]" />

        {/* Text content — key remounts so text also animates */}
        <div key={`content-${heroIdx}`} className="relative z-10 flex flex-col items-center gap-8 hero-content-reveal">
          <h1 className="text-white text-5xl md:text-8xl font-black tracking-[-0.04em] uppercase text-center leading-none drop-shadow-lg">
            {heroBanner?.titre || 'NOUVELLE COLLECTION'}
          </h1>
          {heroBanner?.sousTitre && (
            <p className="text-white/80 text-lg md:text-xl font-medium text-center tracking-wide drop-shadow">
              {heroBanner.sousTitre}
            </p>
          )}
          <a
            href={heroBanner?.ctaLien || '#'}
            className="bg-white text-black px-10 py-4 font-bold tracking-[0.1em] text-[12px] uppercase hover:bg-black hover:text-white transition-colors"
          >
            {heroBanner?.ctaTexte || 'Explorer'}
          </a>
        </div>

        {/* Left arrow */}
        {heroBanners.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-5 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-black transition-all duration-300"
            aria-label="Précédent"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
        )}

        {/* Right arrow */}
        {heroBanners.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-5 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-black transition-all duration-300"
            aria-label="Suivant"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_right</span>
          </button>
        )}

        {/* Slide indicator dots */}
        {heroBanners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > heroIdx ? 'next' : 'prev'); setHeroIdx(i) }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === heroIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Visual Collection Grid (Bento/Editorial) ─── */}
      <section className="w-full bg-surface overflow-hidden" style={{ height: '100vh', boxSizing: 'border-box', padding: '72px 16px 16px 16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4" style={{ height: '100%' }}>
          {/* Large left panel — principale */}
          {(() => {
            const col = homepageCols['principale']
            return (
              <div className="md:col-span-7 relative overflow-hidden bg-surface-container" style={{ minHeight: 0 }}>
                {(col?.bannerUrl || col?.imageUrl) && (
                  <img src={col.bannerUrl || col.imageUrl} alt={col.nom || 'Collection'} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <h2 className="text-white text-4xl font-bold uppercase mb-4">{col?.nom || 'NEW IN'}</h2>
                  <a className="text-white border-b border-white pb-1 text-[11px] font-bold uppercase tracking-widest" href={col ? `/collections/${col.id}` : '#'}>
                    Voir plus
                  </a>
                </div>
              </div>
            )
          })()}

          {/* Right two stacked panels */}
          <div className="md:col-span-5 grid grid-rows-2 gap-4" style={{ minHeight: 0 }}>
            {/* Right top — secondaire-haut */}
            {(() => {
              const col = homepageCols['secondaire-haut']
              return (
                <div className="relative overflow-hidden bg-surface-container" style={{ minHeight: 0 }}>
                  {(col?.bannerUrl || col?.imageUrl)
                    ? <img src={col.bannerUrl || col.imageUrl} alt={col.nom || 'Collection'} className="w-full h-full object-cover" />
                    : <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmDAzRwjilcshlB77XIYgdAOFq1WOC2bW9CIrWQGKDSO_sZcLEvgI-mlshRoMW72TNTHDgpClu4zsYL58P2R41BLvf5egf6FWamCRsfjWXkqtJKRV2Q4FJWy4k4EDGZWVzJ72Te7yGS9HHIr7e_7V5cvfLaiku53xpo1dxPZ7zeNak20sk7UmqBUWTLh5wEDBhZoEIZhhx-YY_HPN0Xjv9byT6q17J85fsPtKQNdqT3QvufEzEJzXdNu5MTkuk6r1NQNZcZb1gaDVg" alt="Summer collection" className="w-full h-full object-cover" />
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-10 left-10">
                    <h2 className="text-white text-3xl font-bold uppercase mb-4">{col?.nom || 'SUMMER'}</h2>
                    <a className="text-white border-b border-white pb-1 text-[11px] font-bold uppercase tracking-widest" href={col ? `/collections/${col.id}` : '#'}>
                      Voir plus
                    </a>
                  </div>
                </div>
              )
            })()}
            {/* Right bottom — secondaire-bas */}
            {(() => {
              const col = homepageCols['secondaire-bas']
              return (
                <div className="relative overflow-hidden bg-surface-container" style={{ minHeight: 0 }}>
                  {(col?.bannerUrl || col?.imageUrl)
                    ? <img src={col.bannerUrl || col.imageUrl} alt={col.nom || 'Collection'} className="w-full h-full object-cover" />
                    : <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJclfC_uMNJ0cVszfLpEsjgjU2NGaafPl7VIwRK0N_fiPFaWmRZkBZkORc32HiCcZmTVcUsc6bSBDxAJjQq915pLH5HY07rGAIcZVTFGU5tDeXMCi0M0qYcq6RsybMP8eYSC3ddQGJ24c0afE4qPz0CtXzWni1EwJmxnHBm40shFKEHvwv--pAoAyrOXvZHzWoZ0jqM9jWanrnOdS7HENVesV3NaMDTb-su0AR87CK-ug11Jh7caMxyPe_hJ5BpPwtSO7mqUyI-qQ2" alt="Essentials" className="w-full h-full object-cover" />
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-10 left-10">
                    <h2 className="text-white text-3xl font-bold uppercase mb-4">{col?.nom || 'ESSENTIALS'}</h2>
                    <a className="text-white border-b border-white pb-1 text-[11px] font-bold uppercase tracking-widest" href={col ? `/collections/${col.id}` : '#'}>
                      Voir plus
                    </a>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ─── New Products Grid ─── */}
      <section className="w-full bg-surface overflow-hidden flex flex-col px-6 md:px-12 pb-10" style={{ height: '100vh', paddingTop: '72px' }}>
        <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">
              Saison 2026
            </h2>
            <p className="text-3xl font-black tracking-tight uppercase">LES NOUVEAUTÉS</p>
          </div>
          <a className="text-[11px] font-bold uppercase underline underline-offset-8" href="#">
            Tout voir
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 flex-1 min-h-0">
          {products.map((p) => (
            <div key={p.name} className="group cursor-pointer flex flex-col min-h-0">
              <div className="bg-white relative overflow-hidden flex-1 min-h-0">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover grayscale"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                <button className="absolute bottom-0 left-0 w-full bg-black text-white py-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-bold text-[11px] uppercase tracking-widest">
                  AJOUTER AU PANIER
                </button>
              </div>
              <div className="flex flex-col gap-1 pt-3 shrink-0">
                <span className="text-[13px] font-bold uppercase tracking-tight">{p.name}</span>
                <span className="text-[12px] text-neutral-500 font-medium">{p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── You May Also Like Slider ─── */}
      <section className="py-24 bg-surface-container-low overflow-hidden">
        <div className="px-6 md:px-12 mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            VOUS POURRIEZ AUSSI AIMER
          </h2>
        </div>
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto no-scrollbar px-6 md:px-12 snap-x"
        >
          {sliderItems.map((item) => (
            <div key={item.name} className="min-w-[300px] md:min-w-[400px] snap-start cursor-pointer">
              <div className="aspect-[3/4] bg-neutral-200 mb-4 overflow-hidden">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <span className="block font-bold text-[12px] uppercase mb-1">{item.name}</span>
              <span className="text-neutral-500 text-[11px]">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Newsletter Section ─── */}
      <section className="py-32 px-6 md:px-12 bg-surface text-center flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6 max-w-2xl leading-none">
          REJOIGNEZ LE MONOLITHE
        </h2>
        <p className="text-neutral-500 max-w-lg mb-12 text-[13px] leading-relaxed uppercase tracking-wider">
          Abonnez-vous à notre newsletter pour recevoir des mises à jour exclusives sur nos nouvelles collections et événements.
        </p>
        <div className="w-full max-w-md">
          <div className="flex border-b border-black pb-2 items-center">
            <input
              type="email"
              placeholder="VOTRE ADRESSE E-MAIL"
              className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-widest placeholder:text-neutral-300 focus:ring-0"
            />
            <button className="text-[11px] font-black uppercase tracking-widest ml-4 hover:opacity-60">
              S'INSCRIRE
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
