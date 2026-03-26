import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomSelect from '../components/ui/CustomSelect'

// ── Helpers ────────────────────────────────────────────────────────────────────
const Label = ({ children }) => <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>
const Input = ({ className = '', ...props }) => (
  <input {...props} className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none ${className}`} />
)
const Toggle = ({ checked, onChange, label, desc }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-bold text-slate-700">{label}</p>
      {desc && <p className="text-[11px] text-slate-400">{desc}</p>}
    </div>
    <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
)

const positionOptions = [
  { value: 'homepage-hero', label: 'Homepage Hero' },
  { value: 'section-promo', label: 'Section Promo' },
  { value: 'page-categorie', label: 'Page Catégorie' },
  { value: 'popup', label: 'Popup' },
  { value: 'footer', label: 'Footer' },
]

const prioriteOptions = [
  { value: '1', label: '1 — Haute' },
  { value: '2', label: '2 — Moyenne' },
  { value: '3', label: '3 — Faible' },
]

const ctaTypeOptions = [
  { value: 'produit', label: 'Produit' },
  { value: 'categorie', label: 'Catégorie' },
  { value: 'lien-externe', label: 'Lien externe' },
]

const audienceOptions = [
  { value: 'tous', label: 'Tous les utilisateurs' },
  { value: 'vip', label: 'Clients VIP' },
  { value: 'nouveaux', label: 'Nouveaux clients' },
  { value: 'b2b', label: 'B2B Clients' },
]

const animOptions = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
]

const alignOptions = [
  { value: 'left', label: 'Gauche', icon: 'format_align_left' },
  { value: 'center', label: 'Centre', icon: 'format_align_center' },
  { value: 'right', label: 'Droite', icon: 'format_align_right' },
]

// ── Component ──────────────────────────────────────────────────────────────────
export default function AjouterBanniere() {
  const navigate = useNavigate()

  // ─ Content
  const [desktopImage, setDesktopImage] = useState('')
  const [mobileImage, setMobileImage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  // ─ Texte
  const [titre, setTitre] = useState('')
  const [sousTitre, setSousTitre] = useState('')
  const [alignement, setAlignement] = useState('center')

  // ─ CTA
  const [ctaTexte, setCtaTexte] = useState('')
  const [ctaType, setCtaType] = useState('produit')
  const [ctaLien, setCtaLien] = useState('')

  // ─ Position
  const [position, setPosition] = useState('homepage-hero')
  const [priorite, setPriorite] = useState('1')

  // ─ Planning
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')

  // ─ Ciblage
  const [audience, setAudience] = useState('tous')
  const [pays, setPays] = useState('')

  // ─ Animation
  const [animation, setAnimation] = useState('fade')

  // ─ SEO
  const [altImage, setAltImage] = useState('')
  const [titreSeo, setTitreSeo] = useState('')

  // ─ Switches
  const [visibleHomepage, setVisibleHomepage] = useState(true)
  const [visibleMobile, setVisibleMobile] = useState(true)
  const [visibleDesktop, setVisibleDesktop] = useState(true)
  const [statutActif, setStatutActif] = useState(true)

  // ─ A/B Test
  const [abTestEnabled, setAbTestEnabled] = useState(false)
  const [abTitreB, setAbTitreB] = useState('')
  const [abSousTitreB, setAbSousTitreB] = useState('')
  const [abCtaTexteB, setAbCtaTexteB] = useState('')
  const [abImageB, setAbImageB] = useState('')

  // ─ Live preview tab
  const [previewDevice, setPreviewDevice] = useState('desktop')

  // ─ Submit
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titre.trim()) { toast.error('Le titre est obligatoire'); return }
    toast.success('Bannière créée avec succès !')
    navigate('/bannieres')
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/bannieres')}
            className="text-slate-400 hover:text-brand transition-colors p-1 rounded-lg hover:bg-brand/5">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ajouter une bannière</h2>
            <p className="text-sm text-slate-500 mt-1">Créez et planifiez une nouvelle campagne visuelle pour votre boutique.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/bannieres')} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">
            Annuler
          </button>
          <button type="submit" className="px-6 py-2.5 bg-btn text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-btn/20 hover:bg-btn-dark transition-all">
            <span className="material-symbols-outlined text-lg">save</span>
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ───── LEFT COLUMN (2/3) ───── */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. CONTENU — Images */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">image</span>
              <h3 className="text-sm font-bold text-slate-700">Contenu</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Desktop upload */}
                <div>
                  <Label>Image Desktop</Label>
                  {desktopImage ? (
                    <div className="relative bg-slate-50 rounded-lg border border-slate-200 p-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-brand">image</span>
                      <span className="text-sm text-slate-700 truncate flex-1">{desktopImage}</span>
                      <button type="button" onClick={() => setDesktopImage('')} className="text-red-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-colors">
                      <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">cloud_upload</span>
                      <p className="text-xs font-bold text-slate-500">Glissez ou cliquez</p>
                      <p className="text-[10px] text-slate-400 mt-1">Recommandé: 1920×600px</p>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setDesktopImage(e.target.files[0].name) }} />
                    </label>
                  )}
                </div>
                {/* Mobile upload */}
                <div>
                  <Label>Image Mobile</Label>
                  {mobileImage ? (
                    <div className="relative bg-slate-50 rounded-lg border border-slate-200 p-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-brand">smartphone</span>
                      <span className="text-sm text-slate-700 truncate flex-1">{mobileImage}</span>
                      <button type="button" onClick={() => setMobileImage('')} className="text-red-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-colors">
                      <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">smartphone</span>
                      <p className="text-xs font-bold text-slate-500">Glissez ou cliquez</p>
                      <p className="text-[10px] text-slate-400 mt-1">Recommandé: 800×800px</p>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setMobileImage(e.target.files[0].name) }} />
                    </label>
                  )}
                </div>
              </div>
              {/* Video optionnel */}
              <div>
                <Label>Vidéo (optionnel)</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/embed/... ou URL vidéo" />
              </div>
            </div>
          </div>

          {/* 2. TEXTE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">edit_note</span>
              <h3 className="text-sm font-bold text-slate-700">Texte</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label>Titre</Label>
                <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Nouvelle Collection Été" />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <textarea
                  value={sousTitre}
                  onChange={(e) => setSousTitre(e.target.value)}
                  rows={2}
                  placeholder="Ex: Découvrez nos équipements haute performance..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none resize-none"
                />
              </div>
              <div>
                <Label>Alignement du texte</Label>
                <div className="flex gap-2">
                  {alignOptions.map((a) => (
                    <button key={a.value} type="button" onClick={() => setAlignement(a.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${alignement === a.value ? 'border-badge bg-badge/10 text-badge' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. CTA + Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CTA */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">ads_click</span>
                <h3 className="text-sm font-bold text-slate-700">CTA (Call to Action)</h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <Label>Texte du bouton</Label>
                  <Input value={ctaTexte} onChange={(e) => setCtaTexte(e.target.value)} placeholder="Ex: Acheter maintenant" />
                </div>
                <div>
                  <Label>Type</Label>
                  <CustomSelect value={ctaType} onChange={setCtaType} options={ctaTypeOptions} />
                </div>
                <div>
                  <Label>Lien de redirection</Label>
                  <Input value={ctaLien} onChange={(e) => setCtaLien(e.target.value)} placeholder="/categorie/vestes ou https://..." />
                </div>
              </div>
            </div>

            {/* Position */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">location_on</span>
                <h3 className="text-sm font-bold text-slate-700">Position</h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <Label>Emplacement</Label>
                  <CustomSelect value={position} onChange={setPosition} options={positionOptions} />
                </div>
                <div>
                  <Label>Priorité d'affichage</Label>
                  <CustomSelect value={priorite} onChange={setPriorite} options={prioriteOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Planification + Ciblage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planification */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">calendar_today</span>
                <h3 className="text-sm font-bold text-slate-700">Planification</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date début</Label>
                    <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none" />
                  </div>
                  <div>
                    <Label>Date fin</Label>
                    <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Heure début</Label>
                    <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none" />
                  </div>
                  <div>
                    <Label>Heure fin</Label>
                    <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ciblage */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">group</span>
                <h3 className="text-sm font-bold text-slate-700">Ciblage</h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <Label>Audience</Label>
                  <CustomSelect value={audience} onChange={setAudience} options={audienceOptions} />
                </div>
                <div>
                  <Label>Pays (optionnel)</Label>
                  <Input value={pays} onChange={(e) => setPays(e.target.value)} placeholder="Ex: Tunisie, France..." />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Animation + SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Animation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">animation</span>
                <h3 className="text-sm font-bold text-slate-700">Animation</h3>
              </div>
              <div className="p-6">
                <Label>Type d'animation</Label>
                <CustomSelect value={animation} onChange={setAnimation} options={animOptions} />
                {/* Preview animation */}
                <div className="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                  <span className="material-symbols-outlined text-brand/40 text-3xl">{animation === 'fade' ? 'blur_on' : animation === 'slide' ? 'swipe_right' : 'zoom_in'}</span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{animation}</p>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">travel_explore</span>
                <h3 className="text-sm font-bold text-slate-700">SEO</h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <Label>Alt Image</Label>
                  <Input value={altImage} onChange={(e) => setAltImage(e.target.value)} placeholder="Ex: Veste hiver noire homme workwear" />
                  <p className="text-[10px] text-slate-400 mt-1">Décrivez l'image pour Google & accessibilité</p>
                </div>
                <div>
                  <Label>Titre SEO</Label>
                  <Input value={titreSeo} onChange={(e) => setTitreSeo(e.target.value)} placeholder="Ex: Promotion hiver 2026 | WorkwearPro" />
                  <p className="text-[10px] text-slate-400 mt-1">{titreSeo.length}/60 caractères recommandés</p>
                </div>
              </div>
            </div>
          </div>

          {/* 6. A/B Test */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600">science</span>
                <h3 className="text-sm font-bold text-slate-700">Test A/B</h3>
                <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded-full border border-violet-100 uppercase">Pro</span>
              </div>
              <button type="button" onClick={() => setAbTestEnabled(!abTestEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${abTestEnabled ? 'bg-violet-600' : 'bg-slate-200'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${abTestEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {abTestEnabled && (
              <div className="p-6 space-y-5">
                <div className="bg-violet-50/50 rounded-lg border border-violet-100 p-4">
                  <p className="text-xs text-violet-700">Le système affichera aléatoirement la <span className="font-bold">Bannière A</span> (principale) ou la <span className="font-bold">Bannière B</span> ci-dessous, et choisira automatiquement la meilleure.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Variant A */}
                  <div className="bg-brand/5 rounded-lg border border-brand/10 p-4">
                    <p className="text-[10px] font-bold text-brand uppercase tracking-wider mb-3 flex items-center gap-1">
                      <span className="w-5 h-5 bg-brand text-white rounded flex items-center justify-center text-[10px] font-bold">A</span>
                      Bannière A (Principale)
                    </p>
                    <p className="text-sm text-slate-600">Utilise le titre, sous-titre et CTA principaux configurés ci-dessus.</p>
                  </div>
                  {/* Variant B */}
                  <div className="bg-violet-50/50 rounded-lg border border-violet-100 p-4 space-y-3">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-5 h-5 bg-violet-600 text-white rounded flex items-center justify-center text-[10px] font-bold">B</span>
                      Bannière B (Variante)
                    </p>
                    <div>
                      <Label>Titre B</Label>
                      <Input value={abTitreB} onChange={(e) => setAbTitreB(e.target.value)} placeholder="Titre alternatif" />
                    </div>
                    <div>
                      <Label>Sous-titre B</Label>
                      <Input value={abSousTitreB} onChange={(e) => setAbSousTitreB(e.target.value)} placeholder="Sous-titre alternatif" />
                    </div>
                    <div>
                      <Label>CTA B</Label>
                      <Input value={abCtaTexteB} onChange={(e) => setAbCtaTexteB(e.target.value)} placeholder="Ex: Voir maintenant" />
                    </div>
                    <div>
                      <Label>Image B (optionnel)</Label>
                      {abImageB ? (
                        <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                          <span className="material-symbols-outlined text-violet-500">image</span>
                          <span className="text-sm text-slate-700 truncate flex-1">{abImageB}</span>
                          <button type="button" onClick={() => setAbImageB('')} className="text-red-400 hover:text-red-500">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ) : (
                        <label className="block border-2 border-dashed border-violet-200 rounded-lg p-4 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
                          <span className="material-symbols-outlined text-xl text-violet-300 mb-1 block">cloud_upload</span>
                          <p className="text-[10px] font-bold text-violet-500">Image variante B</p>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setAbImageB(e.target.files[0].name) }} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ───── RIGHT COLUMN (1/3) ───── */}
        <div className="space-y-6">

          {/* Live Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">preview</span>
                <h3 className="text-sm font-bold text-slate-700">Prévisualisation</h3>
              </div>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setPreviewDevice('desktop')} className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewDevice === 'desktop' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <span className="material-symbols-outlined text-[14px] mr-1 align-middle">desktop_windows</span>Desktop
                </button>
                <button type="button" onClick={() => setPreviewDevice('mobile')} className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${previewDevice === 'mobile' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <span className="material-symbols-outlined text-[14px] mr-1 align-middle">smartphone</span>Mobile
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className={`mx-auto border-2 border-slate-100 rounded-lg overflow-hidden transition-all ${previewDevice === 'desktop' ? 'w-full aspect-[16/5]' : 'w-44 aspect-[9/16] mx-auto'}`}>
                <div className="w-full h-full bg-gradient-to-br from-brand/10 to-brand/5 flex flex-col items-center justify-center p-4 text-center relative">
                  {(desktopImage || mobileImage) && (
                    <div className="absolute top-2 right-2">
                      <span className="material-symbols-outlined text-brand/30 text-sm">image</span>
                    </div>
                  )}
                  <span className="material-symbols-outlined text-brand/20 text-4xl mb-2">view_carousel</span>
                  <p className={`font-bold text-slate-700 ${previewDevice === 'mobile' ? 'text-xs' : 'text-sm'} ${alignement === 'left' ? 'self-start text-left' : alignement === 'right' ? 'self-end text-right' : ''}`}>
                    {titre || 'Titre de la bannière'}
                  </p>
                  <p className={`text-slate-500 mt-0.5 ${previewDevice === 'mobile' ? 'text-[9px]' : 'text-[11px]'} ${alignement === 'left' ? 'self-start text-left' : alignement === 'right' ? 'self-end text-right' : ''}`}>
                    {sousTitre || 'Sous-titre de la bannière'}
                  </p>
                  {(ctaTexte || true) && (
                    <button type="button" className={`mt-2 bg-brand text-white font-bold rounded shadow-sm ${previewDevice === 'mobile' ? 'text-[8px] px-2 py-1' : 'text-[10px] px-3 py-1.5'}`}>
                      {ctaTexte || 'Bouton CTA'}
                    </button>
                  )}
                </div>
              </div>
              {/* Preview info */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>{previewDevice === 'desktop' ? '1920×600px' : '800×800px'}</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">animation</span>
                  {animation}
                </span>
              </div>
            </div>
          </div>

          {/* Paramètres / Switches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">toggle_on</span>
              <h3 className="text-sm font-bold text-slate-700">Paramètres</h3>
            </div>
            <div className="px-6 py-2 divide-y divide-slate-100">
              <Toggle checked={statutActif} onChange={setStatutActif} label="Statut actif" desc="Activer immédiatement après enregistrement" />
              <Toggle checked={visibleHomepage} onChange={setVisibleHomepage} label="Visible sur Homepage" desc="Afficher sur la page d'accueil" />
              <Toggle checked={visibleDesktop} onChange={setVisibleDesktop} label="Visible Desktop" desc="Afficher sur écrans larges" />
              <Toggle checked={visibleMobile} onChange={setVisibleMobile} label="Visible Mobile" desc="Afficher sur appareils mobiles" />
            </div>
          </div>

          {/* Summary quick */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Résumé</p>
            <div className="space-y-2">
              {[
                { label: 'Position', val: positionOptions.find((o) => o.value === position)?.label },
                { label: 'Priorité', val: prioriteOptions.find((o) => o.value === priorite)?.label },
                { label: 'Audience', val: audienceOptions.find((o) => o.value === audience)?.label },
                { label: 'Animation', val: animation },
                { label: 'A/B Test', val: abTestEnabled ? 'Activé' : 'Désactivé' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{r.label}</span>
                  <span className="text-xs font-bold text-slate-700">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
