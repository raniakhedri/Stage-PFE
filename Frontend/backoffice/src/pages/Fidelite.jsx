import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'

// ─── API helpers ─────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
const adminGet  = (p)    => apiClient.get (p,       { headers: authHeaders() }).then(r => r.data)
const adminPut  = (p, b) => apiClient.put (p, b,    { headers: authHeaders() }).then(r => r.data)
const adminPost = (p, b) => apiClient.post(p, b,    { headers: authHeaders() }).then(r => r.data)

// ─── Colour helper (DB stores Tailwind class strings, not hex) ───────────────
const TIER_PALETTE = {
  NOUVEAU:  { hex: '#3b82f6', light: '#eff6ff', name: 'Nouveau'  },
  FIDELE:   { hex: '#10b981', light: '#ecfdf5', name: 'Fidele'   },
  VIP:      { hex: '#f59e0b', light: '#fffbeb', name: 'VIP'      },
  INACTIF:  { hex: '#6b7280', light: '#f9fafb', name: 'Inactif'  },
  DEFAULT:  { hex: '#6366f1', light: '#eef2ff', name: ''         },
}
function tierColor(seg) {
  if (!seg) return TIER_PALETTE.DEFAULT
  const c = seg.color || ''
  if (c.startsWith('#')) return { hex: c, light: c + '18', name: seg.label || seg.name || '' }
  return TIER_PALETTE[seg.name] || TIER_PALETTE.DEFAULT
}

// ─── Shared primitives ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Tab 1: Configuration ─────────────────────────────────────────────────────
function TabConfig() {
  const [cfg, setCfg]       = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminGet('/admin/loyalty/config').then(setCfg).catch(() => toast.error('Impossible de charger la configuration'))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminPut('/admin/loyalty/config', cfg); toast.success('Enregistre') }
    catch { toast.error('Erreur') }
    finally { setSaving(false) }
  }

  if (!cfg) return <Spinner />

  const Row = ({ label, desc, field, step = '1' }) => (
    <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number" step={step} min={0}
          value={cfg[field] ?? ''}
          onChange={e => setCfg(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
          className="w-20 text-right border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-300 outline-none"
        />
        <span className="text-xs text-gray-400 w-5">pts</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <span className="material-icons text-amber-600 text-lg">toll</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Attribution des points</p>
            <p className="text-xs text-gray-400">Combien de points vos clients gagnent</p>
          </div>
        </div>
        <div className="px-6">
          <Row label="Points par TND depense"    desc="Ex: 1 = 1 point par TND"               field="pointsParTnd"       step="0.1" />
          <Row label="Bonus inscription"         desc="Points offerts a la creation du compte" field="pointsBienvenue"              />
          <Row label="Bonus par avis publie"     desc="Points apres chaque avis"               field="pointsAvis"                   />
          <Row label="Bonus anniversaire"        desc="Points le jour de l anniversaire"       field="pointsAnniversaire"           />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="material-icons text-purple-600 text-lg">auto_awesome</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Montee de niveau automatique</p>
              <p className="text-xs text-gray-400">Promouvoir les clients quand ils atteignent le seuil</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${cfg.autoSegmentPromotion ? 'text-indigo-600' : 'text-gray-400'}`}>
              {cfg.autoSegmentPromotion ? 'Active' : 'Desactive'}
            </span>
            <Toggle checked={!!cfg.autoSegmentPromotion} onChange={v => setCfg(p => ({ ...p, autoSegmentPromotion: v }))} />
          </div>
        </div>
      </div>

      <button
        onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
      >
        {saving
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
          : <><span className="material-icons text-lg">save</span> Enregistrer</>}
      </button>
    </div>
  )
}

// ─── Tab 2: Avantages par segment ─────────────────────────────────────────────

const BENEFIT_GROUPS = [
  { title: 'Livraison',          icon: 'local_shipping',  fields: [
    { key: 'livraisonGratuiteStandard', label: 'Livraison standard offerte'    },
    { key: 'livraisonGratuiteExpress',  label: 'Livraison express offerte'     },
    { key: 'livraisonPrioritaire',      label: 'Livraison prioritaire'         },
  ]},
  { title: 'Cadeaux',            icon: 'card_giftcard',   fields: [
    { key: 'cadeauAnniversaire',        label: 'Cadeau d anniversaire'         },
    { key: 'emballageOffert',           label: 'Emballage cadeau offert'       },
    { key: 'echantillonsGratuits',      label: 'Echantillons gratuits'         },
  ]},
  { title: 'Acces exclusif',     icon: 'vpn_key',         fields: [
    { key: 'accesAnticipe',             label: 'Acces anticipe nouveautes'     },
    { key: 'produitExclusif',           label: 'Produits exclusifs membres'    },
    { key: 'invitationsEvenements',     label: 'Invitations evenements'        },
    { key: 'accesVentesPrivees',        label: 'Ventes privees'                },
  ]},
  { title: 'Service',            icon: 'support_agent',   fields: [
    { key: 'prioriteSupport',           label: 'Priorite support'              },
    { key: 'retourEtendu',              label: 'Retour etendu'                 },
    { key: 'conseillerPersonnel',       label: 'Conseiller personnel'          },
  ]},
  { title: 'Reconnaissance',     icon: 'stars',           fields: [
    { key: 'badgeVisible',              label: 'Badge niveau visible'          },
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
    try { await adminPut(`/admin/segments/${seg.id}`, data); toast.success(`Segment mis a jour`) }
    catch { toast.error('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  const activeCount = ALL_BENEFIT_KEYS.filter(k => !!data[k]).length

  if (loading) return <Spinner />
  if (!segments.length) return (
    <div className="text-center py-20">
      <span className="material-icons text-5xl text-gray-200 block">loyalty</span>
      <p className="text-gray-400 mt-3 text-sm">Aucun segment cree.</p>
    </div>
  )

  return (
    <div className="flex gap-6" style={{ minHeight: '600px' }}>

      {/* Left: tier selector */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">Niveaux</p>
        {segments.map((s, i) => {
          const c   = tierColor(s)
          const act = i === selected
          return (
            <button
              key={s.id}
              onClick={() => selectTier(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
                act ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
              style={act ? { backgroundColor: c.light, border: `1.5px solid ${c.hex}40` } : { border: '1.5px solid transparent' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.hex }}>
                <span className="material-icons text-white text-base">military_tech</span>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${act ? 'text-gray-900' : 'text-gray-600'}`}>{s.label || s.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{s.description || ''}</p>
              </div>
              {act && <span className="material-icons text-sm ml-auto flex-shrink-0" style={{ color: c.hex }}>chevron_right</span>}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-100 flex-shrink-0" />

      {/* Right: editor */}
      {seg && (
        <div className="flex-1 min-w-0 space-y-5">

          {/* Segment title bar */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: tc.hex }}>
                <span className="material-icons text-white text-xl">military_tech</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{seg.label || seg.name}</h3>
                <p className="text-xs text-gray-400">{seg.description}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: tc.hex }}>
              {activeCount} avantage{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Seuil & multiplicateur */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <span className="material-icons text-[14px] text-indigo-400">tune</span> Seuil et points
              </p>
              {[
                { label: 'Seuil requis', key: 'seuilPoints', step: '50', suf: 'pts' },
                { label: 'Multiplicateur', key: 'multiplicateurPoints', step: '0.1', suf: 'x' },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{f.label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" step={f.step} min={0}
                      value={data[f.key] ?? 0}
                      onChange={e => set(f.key, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                    />
                    <span className="text-[10px] text-gray-400 w-5">{f.suf}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Remises */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <span className="material-icons text-[14px] text-indigo-400">percent</span> Remises
              </p>
              {[
                { label: 'Remise auto', key: 'remiseAutomatique', suf: '%' },
                { label: 'Remise anniv.', key: 'remiseAnniversaire', suf: '%' },
                { label: 'Cashback', key: 'cashbackPourcentage', suf: '%' },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{f.label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" step="1" min={0}
                      value={data[f.key] ?? 0}
                      onChange={e => set(f.key, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                    />
                    <span className="text-[10px] text-gray-400 w-5">{f.suf}</span>
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
                  <span className="material-icons text-[16px] text-indigo-400">{group.icon}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.title}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.fields.map(f => {
                    const on = !!data[f.key]
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => set(f.key, !on)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm font-medium border transition-all duration-150 ${
                          on
                            ? 'border-transparent text-white shadow-sm'
                            : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                        }`}
                        style={on ? { backgroundColor: tc.hex } : {}}
                      >
                        <span>{f.label}</span>
                        <span className={`material-icons text-[18px] ${on ? 'text-white' : 'text-gray-300'}`}>
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
          <div className="pt-2">
            <button
              onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: tc.hex }}
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
                : <><span className="material-icons text-lg">save</span> Sauvegarder {seg.label || seg.name}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Classement ────────────────────────────────────────────────────────

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
  const rest  = rows.slice(3)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">{rows.length} client{rows.length !== 1 ? 's' : ''} classe{rows.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Top</span>
          <select
            value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {[10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}
          </select>
          <button onClick={load} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="material-icons text-gray-400 text-lg">refresh</span>
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[top3[1], top3[0], top3[2]].map((r, i) => {
                if (!r) return <div key={i} />
                const isFirst = i === 1
                const medals  = ['🥈', '🥇', '🥉']
                return (
                  <div key={r.userId}
                    className={`rounded-2xl p-4 flex flex-col items-center gap-2 text-center border ${
                      isFirst ? 'bg-amber-50 border-amber-200 shadow-md' : 'bg-gray-50 border-gray-200'
                    }`}
                    style={{ minHeight: isFirst ? '140px' : '120px', justifyContent: 'center' }}
                  >
                    <span className="text-3xl">{medals[i]}</span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: r.segmentColor || '#6366f1' }}>
                      {(r.fullName?.[0] || '?').toUpperCase()}
                    </div>
                    <p className="font-bold text-gray-800 text-sm leading-tight truncate w-full">{r.fullName || r.email}</p>
                    <p className="text-indigo-600 font-bold text-sm">{(r.loyaltyPoints || 0).toLocaleString()} pts</p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-14">#</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Niveau</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-base">{MEDAL[r.rank] || <span className="text-gray-400 text-sm font-bold">#{r.rank}</span>}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: r.segmentColor || '#6366f1' }}>
                          {(r.fullName?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{r.fullName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">{r.email}</td>
                    <td className="px-5 py-3.5">
                      {r.segmentLabel
                        ? <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: r.segmentColor || '#6366f1' }}>{r.segmentLabel}</span>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-indigo-600">{(r.loyaltyPoints || 0).toLocaleString()} <span className="text-gray-400 font-normal text-xs">pts</span></td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-gray-400">
                      <span className="material-icons text-4xl block mb-2 text-gray-200">leaderboard</span>
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

// ─── Tab 4: Ajustement manuel ─────────────────────────────────────────────────

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
      const res  = await adminGet(`/admin/clients?email=${encodeURIComponent(email.trim())}`)
      const list = Array.isArray(res) ? res : (res.content || [])
      if (list.length) setClient(list[0])
      else toast.info('Aucun client trouve')
    } catch { toast.error('Erreur recherche') }
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
    } catch { toast.error("Erreur ajustement") }
    finally { setSaving(false) }
  }

  const d    = parseInt(delta)
  const isAdd = d > 0
  const isSub = d < 0
  const newTotal = client ? (client.loyaltyPoints || 0) + (parseInt(delta) || 0) : 0

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="material-icons text-blue-500 text-lg mt-0.5">info</span>
        <p className="text-sm text-blue-700">Corrigez manuellement le solde d un client (compensation, erreur, geste commercial).</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="font-bold text-gray-900 text-sm mb-3">Rechercher un client</p>
        <div className="flex gap-2">
          <input type="email" placeholder="email@exemple.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
          />
          <button onClick={search} disabled={searching || !email.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            {searching
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-icons text-lg">search</span>}
            Chercher
          </button>
        </div>
      </div>

      {client && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Client header */}
          <div className="flex items-center gap-4 px-5 py-4 bg-gray-50 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {(client.firstName?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{client.firstName} {client.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{client.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{(client.loyaltyPoints ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">points actuels</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Quick amounts */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Montant rapide</p>
              <div className="flex flex-wrap gap-2">
                {[-100, -50, -10, +10, +50, +100].map(v => (
                  <button key={v} onClick={() => setDelta(String(v))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                      parseInt(delta) === v
                        ? v > 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {v > 0 ? `+${v}` : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Montant personnalise</p>
              <div className="flex items-center gap-3">
                <div className={`flex flex-1 items-center border rounded-xl overflow-hidden ${isAdd ? 'border-emerald-400' : isSub ? 'border-red-400' : 'border-gray-200'}`}>
                  <span className={`px-3 py-2.5 text-sm font-bold border-r ${isAdd ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : isSub ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    {isAdd ? '+' : isSub ? '-' : '+-'}
                  </span>
                  <input type="number" placeholder="Entrez un montant..." value={delta}
                    onChange={e => setDelta(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm font-bold outline-none"
                  />
                  <span className="px-3 text-xs text-gray-400">pts</span>
                </div>
                {delta && !isNaN(parseInt(delta)) && (
                  <div className={`text-xs font-bold px-3 py-2.5 rounded-xl whitespace-nowrap ${isAdd ? 'bg-emerald-50 text-emerald-700' : isSub ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    {newTotal.toLocaleString()} pts
                  </div>
                )}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Raison</p>
              <input type="text" placeholder="ex: Compensation commande endommagee"
                value={reason} onChange={e => setReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>

            <button onClick={apply} disabled={saving || !delta || !reason.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 ${
                isSub ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Application...</>
                : <><span className="material-icons text-lg">{isSub ? 'remove_circle' : 'add_circle'}</span>
                  {isSub ? 'Retirer les points' : 'Ajouter les points'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [tab, setTab] = useState('config')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
          <span className="material-icons text-white text-2xl">stars</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programme de Fidelite</h1>
          <p className="text-xs text-gray-400">Points, niveaux et avantages clients</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span className="material-icons text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-100" />

      {tab === 'config'   && <TabConfig />}
      {tab === 'segments' && <TabSegments />}
      {tab === 'ranking'  && <TabLeaderboard />}
      {tab === 'adjust'   && <TabAdjust />}
    </div>
  )
}
