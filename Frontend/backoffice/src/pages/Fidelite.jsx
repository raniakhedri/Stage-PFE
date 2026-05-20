import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'

// ─── API helpers ─────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
const adminGet  = (p)    => apiClient.get (p,       { headers: authHeaders() }).then(r => r.data)
const adminPut  = (p, b) => apiClient.put (p, b,    { headers: authHeaders() }).then(r => r.data)
const adminPost = (p, b) => apiClient.post(p, b,    { headers: authHeaders() }).then(r => r.data)

// ─── Tier colours (DB stores Tailwind strings, not hex) ──────────────────────
const TIER_PALETTE = {
  NOUVEAU: { hex: '#0891b2', light: '#ecfeff' },
  FIDELE:  { hex: '#16a34a', light: '#f0fdf4' },
  VIP:     { hex: '#d97706', light: '#fffbeb' },
  INACTIF: { hex: '#64748b', light: '#f8fafc' },
  DEFAULT: { hex: '#004D40', light: '#f0fdf4' },
}
function tierColor(seg) {
  if (!seg) return TIER_PALETTE.DEFAULT
  const c = seg.color || ''
  if (c.startsWith('#')) return { hex: c, light: c + '18' }
  return TIER_PALETTE[seg.name] || TIER_PALETTE.DEFAULT
}

// ─── Toggle (iOS-style, using brand color) ───────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/30 ${checked ? 'bg-btn' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Tab 1 — Configuration ────────────────────────────────────────────────────
function TabConfig() {
  const [cfg, setCfg]       = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminGet('/admin/loyalty/config').then(setCfg).catch(() => toast.error('Impossible de charger la configuration'))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminPut('/admin/loyalty/config', cfg); toast.success('Configuration enregistree') }
    catch { toast.error('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  if (!cfg) return <div className="py-16"><Spinner /></div>

  const Row = ({ label, desc, field, step = '1', suffix = 'pts' }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number" step={step} min={0}
          value={cfg[field] ?? ''}
          onChange={e => setCfg(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
          className="w-20 text-right border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-slate-50"
        />
        <span className="text-xs text-slate-400 w-5 flex-shrink-0">{suffix}</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="w-9 h-9 rounded-lg bg-badge/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-badge text-lg">toll</span>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm font-heading">Attribution des points</p>
            <p className="text-xs text-slate-400">Regles de gain de points pour vos clients</p>
          </div>
        </div>
        <div className="px-6">
          <Row label="Points par TND depense"   desc="Ex : 1 = 1 point par TND depense"        field="pointsParTnd"      step="0.1" />
          <Row label="Bonus inscription"         desc="Points offerts a la creation du compte"  field="pointsBienvenue"             />
          <Row label="Bonus par avis publie"     desc="Points apres chaque avis soumis"         field="pointsAvis"                  />
          <Row label="Bonus anniversaire"        desc="Points le jour de l anniversaire"        field="pointsAnniversaire"          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-brand text-lg">auto_awesome</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm font-heading">Montee de niveau automatique</p>
              <p className="text-xs text-slate-400">Promouvoir les clients quand ils atteignent le seuil</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold font-button ${cfg.autoSegmentPromotion ? 'text-brand' : 'text-slate-400'}`}>
              {cfg.autoSegmentPromotion ? 'Active' : 'Desactive'}
            </span>
            <Toggle checked={!!cfg.autoSegmentPromotion} onChange={v => setCfg(p => ({ ...p, autoSegmentPromotion: v }))} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <PageHeader>
          <PageHeader.PrimaryBtn icon="save" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </PageHeader.PrimaryBtn>
        </PageHeader>
      </div>
    </div>
  )
}

// ─── Tab 2 — Avantages par segment ───────────────────────────────────────────

const BENEFIT_GROUPS = [
  { title: 'Livraison', icon: 'local_shipping', fields: [
    { key: 'livraisonGratuiteStandard', label: 'Livraison standard offerte' },
    { key: 'livraisonGratuiteExpress',  label: 'Livraison express offerte'  },
    { key: 'livraisonPrioritaire',      label: 'Livraison prioritaire'      },
  ]},
  { title: 'Cadeaux', icon: 'card_giftcard', fields: [
    { key: 'cadeauAnniversaire',   label: 'Cadeau d anniversaire'    },
    { key: 'emballageOffert',      label: 'Emballage cadeau offert'  },
    { key: 'echantillonsGratuits', label: 'Echantillons gratuits'    },
  ]},
  { title: 'Acces exclusif', icon: 'vpn_key', fields: [
    { key: 'accesAnticipe',        label: 'Acces anticipe nouveautes' },
    { key: 'produitExclusif',      label: 'Produits exclusifs membres'},
    { key: 'invitationsEvenements',label: 'Invitations evenements'   },
    { key: 'accesVentesPrivees',   label: 'Ventes privees'           },
  ]},
  { title: 'Service', icon: 'support_agent', fields: [
    { key: 'prioriteSupport',      label: 'Priorite support'         },
    { key: 'retourEtendu',         label: 'Retour etendu'            },
    { key: 'conseillerPersonnel',  label: 'Conseiller personnel'     },
  ]},
  { title: 'Reconnaissance', icon: 'stars', fields: [
    { key: 'badgeVisible', label: 'Badge niveau visible' },
  ]},
]

const ALL_BENEFIT_KEYS = BENEFIT_GROUPS.flatMap(g => g.fields.map(f => f.key))

function TabSegments() {
  const [segments, setSegments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(0)
  const [data, setData]         = useState({})
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    adminGet('/admin/segments')
      .then(segs => { setSegments(segs); if (segs.length) setData({ ...segs[0] }) })
      .catch(() => toast.error('Impossible de charger les segments'))
      .finally(() => setLoading(false))
  }, [])

  const seg = segments[selected]
  const tc  = seg ? tierColor(seg) : TIER_PALETTE.DEFAULT

  const selectTier = (i) => { setSelected(i); setData({ ...segments[i] }) }
  const set = (k, v) => setData(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!seg) return
    setSaving(true)
    // Build a SegmentRequest-shaped payload — matches what the backend @Valid SegmentRequest expects
    const payload = {
      name:                      data.name,
      label:                     data.label,
      color:                     data.color,
      description:               data.description,
      icon:                      data.icon,
      seuilPoints:               data.seuilPoints,
      multiplicateurPoints:      data.multiplicateurPoints,
      remiseAutomatique:         data.remiseAutomatique,
      remiseAnniversaire:        data.remiseAnniversaire,
      cashbackPourcentage:       data.cashbackPourcentage,
      livraisonGratuiteStandard: data.livraisonGratuiteStandard,
      livraisonGratuiteExpress:  data.livraisonGratuiteExpress,
      livraisonPrioritaire:      data.livraisonPrioritaire,
      cadeauAnniversaire:        data.cadeauAnniversaire,
      emballageOffert:           data.emballageOffert,
      echantillonsGratuits:      data.echantillonsGratuits,
      accesAnticipe:             data.accesAnticipe,
      produitExclusif:           data.produitExclusif,
      invitationsEvenements:     data.invitationsEvenements,
      accesVentesPrivees:        data.accesVentesPrivees,
      prioriteSupport:           data.prioriteSupport,
      retourEtendu:              data.retourEtendu,
      conseillerPersonnel:       data.conseillerPersonnel,
      badgeVisible:              data.badgeVisible,
    }
    try {
      const updated = await adminPut(`/admin/segments/${seg.id}`, payload)
      // Refresh segments list so userCount and values stay in sync
      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, ...updated } : s))
      setData(updated)
      toast.success('Segment mis a jour')
    }
    catch { toast.error('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  const activeCount = ALL_BENEFIT_KEYS.filter(k => !!data[k]).length

  if (loading) return <div className="py-16"><Spinner /></div>
  if (!segments.length) return (
    <div className="text-center py-20">
      <span className="material-symbols-outlined text-5xl text-slate-200 block">loyalty</span>
      <p className="text-slate-400 mt-3 text-sm">Aucun segment cree.</p>
    </div>
  )

  return (
    <div className="flex gap-6" style={{ minHeight: '600px' }}>
      {/* Left — tier selector */}
      <div className="w-56 flex-shrink-0 space-y-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">Niveaux</p>
        {segments.map((s, i) => {
          const c   = tierColor(s)
          const act = i === selected
          return (
            <button key={s.id} onClick={() => selectTier(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${act ? 'bg-brand/5 shadow-sm border border-brand/20' : 'hover:bg-slate-100 border border-transparent'}`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.hex }}>
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold truncate ${act ? 'text-brand' : 'text-slate-600'}`}>{s.label || s.name}</p>
                <p className="text-[10px] text-slate-400">
                  {s.userCount != null ? `${s.userCount} client${s.userCount !== 1 ? 's' : ''}` : s.description || ''}
                </p>
              </div>
              {act && <span className="material-symbols-outlined text-brand" style={{ fontSize: '16px' }}>chevron_right</span>}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px bg-slate-200 flex-shrink-0" />

      {/* Right — editor */}
      {seg && (
        <div className="flex-1 min-w-0 space-y-5">
          {/* Segment title */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tc.hex }}>
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-heading">{seg.label || seg.name}</h3>
                <p className="text-xs text-slate-400">{seg.description}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white font-badge bg-brand">
              {activeCount} avantage{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Number grids */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand">tune</span> Seuil et points
              </p>
              {[
                { label: 'Seuil requis',     key: 'seuilPoints',         step: '50',  suf: 'pts' },
                { label: 'Multiplicateur',   key: 'multiplicateurPoints', step: '0.1', suf: 'x'   },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{f.label}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" step={f.step} min={0}
                      value={data[f.key] ?? 0}
                      onChange={e => set(f.key, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                    />
                    <span className="text-[10px] text-slate-400 w-5">{f.suf}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand">percent</span> Remises
              </p>
              {[
                { label: 'Remise auto',     key: 'remiseAutomatique',  suf: '%' },
                { label: 'Remise anniv.',   key: 'remiseAnniversaire', suf: '%' },
                { label: 'Cashback',        key: 'cashbackPourcentage',suf: '%' },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{f.label}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" step="1" min={0}
                      value={data[f.key] ?? 0}
                      onChange={e => set(f.key, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                    />
                    <span className="text-[10px] text-slate-400 w-5">{f.suf}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefit toggles */}
          <div className="space-y-4">
            {BENEFIT_GROUPS.map(group => (
              <div key={group.title}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[16px] text-brand">{group.icon}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.title}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.fields.map(f => {
                    const on = !!data[f.key]
                    return (
                      <button key={f.key} type="button" onClick={() => set(f.key, !on)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm font-medium border transition-all duration-150 ${
                          on
                            ? 'bg-btn border-transparent text-white hover:bg-btn-dark'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-button">{f.label}</span>
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: on ? "'FILL' 1" : "'FILL' 0" }}>
                          {on ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Save */}
          <div className="pt-2 flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white font-button transition-colors disabled:opacity-50 shadow-sm shadow-btn/20 bg-btn hover:bg-btn-dark"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
                : <><span className="material-symbols-outlined text-lg">save</span> Sauvegarder {seg.label || seg.name}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3 — Classement ──────────────────────────────────────────────────────

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

function TabLeaderboard() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit]     = useState(20)

  const load = useCallback(() => {
    setLoading(true)
    adminGet(`/admin/loyalty/leaderboard?limit=${limit}`)
      .then(setRows).catch(() => toast.error('Impossible de charger le classement'))
      .finally(() => setLoading(false))
  }, [limit])

  useEffect(() => { load() }, [load])

  const top3 = rows.slice(0, 3)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{rows.length} client{rows.length !== 1 ? 's' : ''} classe{rows.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Top</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white text-slate-700">
            {[10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}
          </select>
          <button onClick={load} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors bg-white">
            <span className="material-symbols-outlined text-slate-400 text-lg">refresh</span>
          </button>
        </div>
      </div>

      {loading ? <div className="py-16"><Spinner /></div> : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[top3[1], top3[0], top3[2]].map((r, i) => {
                if (!r) return <div key={i} />
                const isFirst = i === 1
                const medals  = ['🥈', '🥇', '🥉']
                return (
                  <div key={r.userId}
                    className={`rounded-xl p-4 flex flex-col items-center gap-2 text-center border ${isFirst ? 'bg-badge/5 border-badge/20' : 'bg-slate-50 border-slate-200'}`}
                    style={{ minHeight: isFirst ? '140px' : '120px', justifyContent: 'center' }}
                  >
                    <span className="text-3xl">{medals[i]}</span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg bg-brand">
                      {(r.fullName?.[0] || '?').toUpperCase()}
                    </div>
                    <p className="font-bold text-slate-800 text-sm leading-tight truncate w-full">{r.fullName || r.email}</p>
                    <p className="text-brand font-bold text-sm">{(r.loyaltyPoints || 0).toLocaleString()} pts</p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14">#</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Niveau</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(r => (
                  <tr key={r.userId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-base">{MEDAL[r.rank] || <span className="text-slate-400 text-sm font-bold">#{r.rank}</span>}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-brand">
                          {(r.fullName?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{r.fullName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">{r.email}</td>
                    <td className="px-5 py-3.5">
                      {r.segmentLabel
                        ? <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white font-badge bg-badge">{r.segmentLabel}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-brand">{(r.loyaltyPoints || 0).toLocaleString()} <span className="text-slate-400 font-normal text-xs">pts</span></td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">leaderboard</span>
                      Aucun client avec des points
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab 4 — Ajustement manuel ───────────────────────────────────────────────
function TabAdjust() {
  const [email,     setEmail]     = useState('')
  const [client,    setClient]    = useState(null)
  const [searching, setSearching] = useState(false)
  const [delta,     setDelta]     = useState('')
  const [reason,    setReason]    = useState('')
  const [saving,    setSaving]    = useState(false)

  const search = async () => {
    if (!email.trim()) return
    setSearching(true); setClient(null)
    try {
      // Backend: GET /admin/users/search?q=&page=0&size=5  → Page<UserResponse>
      const res  = await adminGet(`/admin/users/search?q=${encodeURIComponent(email.trim())}&page=0&size=5`)
      const list = Array.isArray(res) ? res : (res.content || [])
      // Prefer exact email match
      const exact = list.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
      const picked = exact || list[0]
      if (picked) setClient(picked)
      else toast.info('Aucun client trouve avec cet email')
    } catch { toast.error('Erreur lors de la recherche') }
    finally { setSearching(false) }
  }

  const apply = async () => {
    const d = parseInt(delta)
    if (!client || isNaN(d) || d === 0 || !reason.trim()) {
      toast.warn('Remplissez tous les champs'); return
    }
    setSaving(true)
    try {
      await adminPost(`/admin/loyalty/users/${client.id}/adjust-points`, { delta: d, reason: reason.trim() })
      toast.success(`${d > 0 ? '+' : ''}${d} pts appliques`)
      setClient(p => ({ ...p, loyaltyPoints: (p.loyaltyPoints || 0) + d }))
      setDelta(''); setReason('')
    } catch { toast.error('Erreur lors de l ajustement') }
    finally { setSaving(false) }
  }

  const d      = parseInt(delta)
  const isAdd  = d > 0
  const isSub  = d < 0
  const newTotal = client ? (client.loyaltyPoints || 0) + (parseInt(delta) || 0) : 0

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
        <p className="text-sm text-blue-700">Corrigez manuellement le solde d un client (compensation, erreur, geste commercial).</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="font-bold text-slate-800 text-sm font-heading mb-3">Rechercher un client</p>
        <div className="flex gap-2">
          <input type="email" placeholder="email@exemple.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
          />
          <button onClick={search} disabled={searching || !email.trim()}
            className="flex items-center gap-1.5 bg-btn hover:bg-btn-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold font-button transition-colors disabled:opacity-50 shadow-sm shadow-btn/20">
            {searching
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-lg">search</span>}
            Chercher
          </button>
        </div>
      </div>

      {client && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4 bg-slate-50 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-btn flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {(client.firstName?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">{client.firstName} {client.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{client.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand">{(client.loyaltyPoints ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">points actuels</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Montant rapide</p>
              <div className="flex flex-wrap gap-2">
                {[-100, -50, -10, +10, +50, +100].map(v => (
                  <button key={v} onClick={() => setDelta(String(v))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors font-button ${
                      parseInt(delta) === v
                        ? v > 0 ? 'bg-badge text-white border-badge' : 'bg-red-500 text-white border-red-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                    }`}>
                    {v > 0 ? `+${v}` : v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Montant personnalise</p>
              <div className="flex items-center gap-3">
                <div className={`flex flex-1 items-center border rounded-xl overflow-hidden ${isAdd ? 'border-badge/40' : isSub ? 'border-red-300' : 'border-slate-200'}`}>
                  <span className={`px-3 py-2.5 text-sm font-bold border-r font-button ${isAdd ? 'bg-badge/5 text-badge border-badge/20' : isSub ? 'bg-red-50 text-red-500 border-red-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {isAdd ? '+' : isSub ? '-' : '+-'}
                  </span>
                  <input type="number" placeholder="Entrez un montant..." value={delta}
                    onChange={e => setDelta(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm font-bold outline-none"
                  />
                  <span className="px-3 text-xs text-slate-400">pts</span>
                </div>
                {delta && !isNaN(parseInt(delta)) && (
                  <div className={`text-xs font-bold px-3 py-2.5 rounded-xl whitespace-nowrap font-button ${isAdd ? 'bg-badge/10 text-badge' : isSub ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                    {newTotal.toLocaleString()} pts
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Raison</p>
              <input type="text" placeholder="ex : Compensation commande endommagee"
                value={reason} onChange={e => setReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
            </div>

            <button onClick={apply} disabled={saving || !delta || !reason.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white font-button transition-colors disabled:opacity-40 ${isSub ? 'bg-red-500 hover:bg-red-600' : 'bg-badge hover:bg-badge-dark'}`}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Application...</>
                : <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{isSub ? 'remove_circle' : 'add_circle'}</span>
                  {isSub ? 'Retirer les points' : 'Ajouter les points'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Help content (one entry per tab) ────────────────────────────────────────
const HELP = [
  {
    key: 'config',
    icon: 'settings',
    title: 'Configuration globale',
    subtitle: 'Règles d\'attribution des points pour tous vos clients',
    what: 'Ces paramètres définissent comment les points sont gagnés dans toute la boutique. Ils s\'appliquent à tous les clients, quel que soit leur niveau.',
    fields: [
      { name: 'Points par TND dépensé', desc: 'Nombre de points accordés pour chaque dinar dépensé sur une commande livrée. Ex : 1 = 1 point/TND, 1.5 = 1,5 point/TND.' },
      { name: 'Bonus inscription', desc: 'Points offerts automatiquement lors de la création d\'un nouveau compte client.' },
      { name: 'Bonus par avis', desc: 'Points crédités chaque fois qu\'un client soumet un avis sur un produit.' },
      { name: 'Bonus anniversaire', desc: 'Points offerts automatiquement pendant le mois d\'anniversaire du client.' },
      { name: 'Montée de niveau auto', desc: 'Si activé, le système vérifie après chaque gain de points si le client mérite d\'être promu au niveau supérieur. Désactivez pour gérer les promotions manuellement.' },
    ],
    steps: [
      'Modifiez les valeurs numériques selon votre politique commerciale.',
      'Utilisez le bouton basculant pour activer/désactiver la montée automatique.',
      'Cliquez « Enregistrer » — les changements s\'appliquent aux prochains événements uniquement.',
    ],
    tip: 'Les points déjà attribués ne sont pas recalculés. Un changement de taux s\'applique uniquement aux commandes futures.',
  },
  {
    key: 'segments',
    icon: 'loyalty',
    title: 'Avantages par niveau',
    subtitle: 'Seuils, multiplicateurs et avantages de chaque palier de fidélité',
    what: 'Chaque client appartient à un segment (Nouveau, Fidèle, VIP ou Inactif). Configurez ici les conditions d\'accès et les avantages exclusifs de chaque niveau.',
    fields: [
      { name: 'Seuil requis (pts)', desc: 'Nombre minimum de points cumulés pour atteindre ce niveau. Le système promeut automatiquement le client lorsque ce seuil est dépassé (si l\'option est activée).' },
      { name: 'Multiplicateur (x)', desc: 'Multiplie les points gagnés par commande pour ce niveau. Ex : 2x = un client VIP gagne deux fois plus de points qu\'un client Nouveau.' },
      { name: 'Remise auto (%)', desc: 'Réduction permanente appliquée automatiquement au panier pour tous les clients de ce niveau.' },
      { name: 'Remise anniversaire (%)', desc: 'Réduction supplémentaire accordée pendant le mois d\'anniversaire du client.' },
      { name: 'Cashback (%)', desc: 'Pourcentage du montant d\'une commande crédité en points après livraison.' },
      { name: 'Avantages (tuiles)', desc: 'Cliquez sur chaque tuile pour activer (coloré) ou désactiver (gris) l\'avantage. Groupes : Livraison, Cadeaux, Accès exclusif, Service, Reconnaissance.' },
    ],
    steps: [
      'Sélectionnez un niveau dans la colonne gauche.',
      'Ajustez le seuil de points et le multiplicateur dans « Seuil et points ».',
      'Définissez les remises dans la section « Remises ».',
      'Activez/désactivez les avantages en cliquant sur les tuiles.',
      'Cliquez « Sauvegarder [Niveau] » — chaque niveau se sauvegarde indépendamment.',
    ],
    tip: 'Le niveau INACTIF n\'est jamais attribué automatiquement — uniquement manuellement via l\'onglet Ajustement.',
  },
  {
    key: 'ranking',
    icon: 'leaderboard',
    title: 'Classement',
    subtitle: 'Top clients classés par points de fidélité cumulés',
    what: 'Visualisez vos clients les plus fidèles. Le podium met en avant les 3 premiers. Le tableau liste tous les clients avec leur niveau et leur score.',
    fields: [
      { name: 'Sélecteur Top N', desc: 'Choisissez combien de clients afficher : 10, 20, 50 ou 100.' },
      { name: 'Bouton rafraîchir', desc: 'Recharge les données depuis le serveur.' },
    ],
    steps: [
      'Choisissez le nombre de clients à afficher via le sélecteur (Top 10/20/50/100).',
      'Le podium affiche automatiquement les 3 premiers avec leur médaille.',
      'Consultez le tableau pour voir rang, nom, email, niveau et points.',
      'Cliquez l\'icône ↺ pour actualiser le classement.',
    ],
    tip: 'Vue en lecture seule. Pour modifier les points d\'un client, utilisez l\'onglet « Ajustement manuel ».',
  },
  {
    key: 'adjust',
    icon: 'tune',
    title: 'Ajustement manuel',
    subtitle: 'Corriger manuellement le solde de points d\'un client',
    what: 'Réservé aux cas particuliers : compensation suite à une commande endommagée, geste commercial, correction d\'erreur. Chaque ajustement est traçable via l\'historique du client.',
    fields: [
      { name: 'Recherche par email', desc: 'Saisissez l\'adresse email complète du client et appuyez Entrée ou cliquez Chercher.' },
      { name: 'Montants rapides', desc: 'Boutons prédéfinis ±10, ±50, ±100 pour sélectionner rapidement un montant courant.' },
      { name: 'Montant personnalisé', desc: 'Entrez un nombre positif pour ajouter des points, négatif pour en retirer. La prévisualisation affiche le nouveau solde.' },
      { name: 'Raison (obligatoire)', desc: 'Description enregistrée dans l\'historique du client. Soyez explicite : ex. « Compensation commande #1234 endommagée ».' },
    ],
    steps: [
      'Saisissez l\'email du client et cliquez « Chercher ».',
      'Vérifiez que le nom, l\'email et le solde affiché correspondent au bon client.',
      'Sélectionnez un montant rapide ou saisissez une valeur personnalisée.',
      'Vérifiez la prévisualisation du nouveau solde.',
      'Rédigez une raison claire et précise.',
      'Cliquez « Ajouter les points » (vert) ou « Retirer les points » (rouge) pour confirmer.',
    ],
    tip: 'Le solde ne peut jamais descendre sous 0. Chaque ajustement est enregistré sous le type AJUSTEMENT dans l\'historique du client.',
  },
]

function HelpModal({ activeTab, onClose }) {
  const [section, setSection] = useState(activeTab)
  const h = HELP.find(x => x.key === section) || HELP[0]

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-white rounded-t-2xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-brand" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>help</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight font-heading">Guide d'utilisation</h3>
              <p className="text-[11px] text-slate-400">Programme de Fidélité · Back Office</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left — section nav */}
          <div className="w-48 flex-shrink-0 border-r border-slate-100 py-3 px-2 space-y-0.5 overflow-y-auto bg-slate-50/60">
            {HELP.map(item => (
              <button key={item.key} onClick={() => setSection(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                  section === item.key
                    ? 'bg-brand/10 text-brand font-bold'
                    : 'text-slate-500 hover:bg-slate-100 font-medium'
                }`}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: section === item.key ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="text-[13px] font-button leading-snug">{item.title}</span>
              </button>
            ))}
          </div>

          {/* Right — content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5 min-h-0">

            {/* Section heading */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-brand" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>{h.icon}</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 font-heading">{h.title}</h2>
                <p className="text-[11px] text-slate-400">{h.subtitle}</p>
              </div>
            </div>

            {/* What it does */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '16px' }}>info</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">À quoi ça sert ?</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{h.what}</p>
            </div>

            {/* Fields */}
            {h.fields.length > 0 && (
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '16px' }}>tune</span>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Champs & paramètres</p>
                </div>
                {h.fields.map(f => (
                  <div key={f.name} className="flex gap-3">
                    <span className="material-symbols-outlined text-brand/50" style={{ fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>chevron_right</span>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide font-button">{f.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Steps */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '16px' }}>format_list_numbered</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comment l'utiliser</p>
              </div>
              {h.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 font-button">{i + 1}</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 flex-shrink-0" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
              <p className="text-xs text-amber-800 leading-relaxed">{h.tip}</p>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'config',   label: 'Configuration',      icon: 'settings'    },
  { key: 'segments', label: 'Avantages / niveaux', icon: 'loyalty'     },
  { key: 'ranking',  label: 'Classement',          icon: 'leaderboard' },
  { key: 'adjust',   label: 'Ajustement manuel',   icon: 'tune'        },
]

export default function Fidelite() {
  const [tab, setTab]         = useState('config')
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {helpOpen && <HelpModal activeTab={tab} onClose={() => setHelpOpen(false)} />}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-btn flex items-center justify-center shadow-lg shadow-btn/20 flex-shrink-0">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-heading">Programme de Fidelite</h1>
            <p className="text-xs text-slate-400">Points, niveaux et avantages clients</p>
          </div>
        </div>
        <button onClick={() => setHelpOpen(true)}
          title="Guide d'utilisation"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all text-sm font-medium font-button shadow-sm">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
          <span className="hidden sm:inline">Guide</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold font-button transition-all ${tab === t.key ? 'bg-white text-brand shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: tab === t.key ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-slate-200" />

      {tab === 'config'   && <TabConfig />}
      {tab === 'segments' && <TabSegments />}
      {tab === 'ranking'  && <TabLeaderboard />}
      {tab === 'adjust'   && <TabAdjust />}
    </div>
  )
}
