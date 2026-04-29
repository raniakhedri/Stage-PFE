import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'

// ─── helpers ────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function adminGet(path) {
  const res = await apiClient.get(path, { headers: authHeaders() })
  return res.data
}

async function adminPut(path, body) {
  const res = await apiClient.put(path, body, { headers: authHeaders() })
  return res.data
}

async function adminPost(path, body) {
  const res = await apiClient.post(path, body, { headers: authHeaders() })
  return res.data
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/* ---- Tab: Configuration globale ---- */
function TabConfig() {
  const [cfg, setCfg] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminGet('/admin/loyalty/config').then(setCfg).catch(() => toast.error('Impossible de charger la config'))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminPut('/admin/loyalty/config', cfg)
      toast.success('Configuration sauvegardée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!cfg) return <p className="text-sm text-gray-400 py-8 text-center">Chargement…</p>

  const field = (label, key, type = 'number', step = '1') => (
    <div key={key} className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {type === 'toggle' ? (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!cfg[key]}
            onChange={e => setCfg(p => ({ ...p, [key]: e.target.checked }))}
            className="w-5 h-5 accent-indigo-600"
          />
          <span className="text-sm text-gray-600">{cfg[key] ? 'Activé' : 'Désactivé'}</span>
        </label>
      ) : (
        <input
          type="number"
          step={step}
          value={cfg[key] ?? ''}
          onChange={e => setCfg(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
          className="border rounded-lg px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-indigo-300 outline-none"
        />
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg space-y-5">
      <h3 className="font-semibold text-gray-800 text-base">Paramètres du programme de fidélité</h3>
      {field('Points gagnés par TND dépensé', 'pointsParTnd', 'number', '0.1')}
      {field('Points de bienvenue (inscription)', 'pointsBienvenue')}
      {field('Points par avis publié', 'pointsAvis')}
      {field('Points offerts pour l\'anniversaire', 'pointsAnniversaire')}
      {field('Promotion de segment automatique', 'autoSegmentPromotion', 'toggle')}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}

/* ---- Segment benefit card ---- */
const CHECKBOX_GROUPS = [
  {
    title: 'Livraison',
    icon: 'local_shipping',
    fields: [
      { key: 'livraisonGratuiteStandard', label: 'Livraison standard gratuite' },
      { key: 'livraisonGratuiteExpress',  label: 'Livraison express gratuite'  },
      { key: 'livraisonPrioritaire',      label: 'Livraison prioritaire'       },
    ],
  },
  {
    title: 'Cadeaux & Échantillons',
    icon: 'card_giftcard',
    fields: [
      { key: 'cadeauAnniversaire',  label: 'Cadeau d\'anniversaire'    },
      { key: 'emballageOffert',     label: 'Emballage cadeau offert'   },
      { key: 'echantillonsGratuits',label: 'Échantillons gratuits'     },
    ],
  },
  {
    title: 'Accès exclusif',
    icon: 'vpn_key',
    fields: [
      { key: 'accesAnticipe',       label: 'Accès anticipé aux nouveautés' },
      { key: 'produitExclusif',     label: 'Produits exclusifs membres'    },
      { key: 'invitationsEvenements',label: 'Invitations événements'       },
      { key: 'accesVentesPrivees',  label: 'Ventes privées'               },
    ],
  },
  {
    title: 'Service client',
    icon: 'support_agent',
    fields: [
      { key: 'prioriteSupport',     label: 'Priorité support'            },
      { key: 'retourEtendu',        label: 'Politique retour étendue'    },
      { key: 'conseillerPersonnel', label: 'Conseiller beauté personnel' },
    ],
  },
  {
    title: 'Reconnaissance',
    icon: 'stars',
    fields: [
      { key: 'badgeVisible', label: 'Badge niveau visible sur le profil' },
    ],
  },
]

function SegmentCard({ seg }) {
  const [data, setData] = useState({ ...seg })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminPut(`/admin/segments/${seg.id}`, data)
      toast.success(`Segment "${seg.label}" mis à jour`)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const numInput = (label, key, step = '1', suffix = '') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step={step}
          value={data[key] ?? 0}
          onChange={e => setData(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
          className="border rounded px-2 py-1 text-sm w-28 focus:ring-2 focus:ring-indigo-200 outline-none"
        />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 text-white"
        style={{ backgroundColor: seg.color || '#6366f1' }}
      >
        <span className="material-icons text-2xl">military_tech</span>
        <div>
          <p className="font-bold text-lg">{seg.label}</p>
          {seg.description && <p className="text-xs opacity-80">{seg.description}</p>}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Seuil & multiplicateur */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Seuil & Multiplicateur</p>
          <div className="flex flex-wrap gap-4">
            {numInput('Seuil (points requis)', 'seuilPoints', '50', 'pts')}
            {numInput('Multiplicateur de points', 'multiplicateurPoints', '0.1', '×')}
          </div>
        </div>

        {/* Remises */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Remises</p>
          <div className="flex flex-wrap gap-4">
            {numInput('Remise automatique', 'remiseAutomatique', '1', '%')}
            {numInput('Remise anniversaire', 'remiseAnniversaire', '1', '%')}
            {numInput('Cashback', 'cashbackPourcentage', '0.5', '%')}
          </div>
        </div>

        {/* Checkbox groups */}
        {CHECKBOX_GROUPS.map(group => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <span className="material-icons text-base text-indigo-500">{group.icon}</span>
              {group.title}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.fields.map(f => (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-indigo-700">
                  <input
                    type="checkbox"
                    checked={!!data[f.key]}
                    onChange={e => setData(p => ({ ...p, [f.key]: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Sauvegarder ce segment'}
        </button>
      </div>
    </div>
  )
}

/* ---- Tab: Avantages par segment ---- */
function TabSegments() {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGet('/admin/segments')
      .then(setSegments)
      .catch(() => toast.error('Impossible de charger les segments'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Chargement…</p>
  if (!segments.length) return <p className="text-sm text-gray-500 py-8 text-center">Aucun segment créé.</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {segments.map(s => <SegmentCard key={s.id} seg={s} />)}
    </div>
  )
}

/* ---- Tab: Classement ---- */
function TabLeaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)

  const load = useCallback(() => {
    setLoading(true)
    adminGet(`/admin/loyalty/leaderboard?limit=${limit}`)
      .then(setRows)
      .catch(() => toast.error('Impossible de charger le classement'))
      .finally(() => setLoading(false))
  }, [limit])

  useEffect(() => { load() }, [load])

  const rankColor = r => r === 1 ? '#FFD700' : r === 2 ? '#C0C0C0' : r === 3 ? '#CD7F32' : '#6366f1'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Afficher le top</label>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          {[10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Chargement…</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Rang</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Segment</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold" style={{ color: rankColor(r.rank) }}>#{r.rank}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.fullName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.email}</td>
                  <td className="px-4 py-3">
                    {r.segmentLabel ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: r.segmentColor || '#6366f1' }}
                      >
                        {r.segmentLabel}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600">{r.loyaltyPoints} pts</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun résultat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---- Tab: Ajustement manuel ---- */
function TabAdjust() {
  const [email, setEmail] = useState('')
  const [client, setClient] = useState(null)
  const [searching, setSearching] = useState(false)
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const search = async () => {
    if (!email.trim()) return
    setSearching(true)
    setClient(null)
    try {
      const res = await adminGet(`/admin/clients?email=${encodeURIComponent(email.trim())}`)
      const list = Array.isArray(res) ? res : (res.content || [])
      if (list.length > 0) setClient(list[0])
      else toast.info('Aucun client trouvé avec cet email')
    } catch {
      toast.error('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  const handleAdjust = async () => {
    if (!client) return
    const d = parseInt(delta)
    if (isNaN(d) || d === 0) { toast.warn('Entrez un delta non nul'); return }
    if (!reason.trim()) { toast.warn('Veuillez indiquer une raison'); return }
    setSaving(true)
    try {
      await adminPost(`/admin/loyalty/users/${client.id}/adjust-points`, { delta: d, reason: reason.trim() })
      toast.success(`${d > 0 ? '+' : ''}${d} pts appliqués à ${client.firstName} ${client.lastName}`)
      setClient(prev => ({ ...prev, loyaltyPoints: (prev.loyaltyPoints || 0) + d }))
      setDelta('')
      setReason('')
    } catch {
      toast.error('Erreur lors de l\'ajustement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">Rechercher un client</h3>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email du client"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
          />
          <button
            onClick={search}
            disabled={searching}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? '…' : 'Chercher'}
          </button>
        </div>
      </div>

      {/* Client found */}
      {client && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              {(client.firstName?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{client.firstName} {client.lastName}</p>
              <p className="text-xs text-gray-500">{client.email}</p>
            </div>
            <span className="ml-auto text-indigo-600 font-bold text-lg">{client.loyaltyPoints ?? 0} pts</span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Delta (positif = ajouter, négatif = retirer)</label>
              <input
                type="number"
                placeholder="ex: 100 ou -50"
                value={delta}
                onChange={e => setDelta(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none w-48"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Raison</label>
              <input
                type="text"
                placeholder="ex: Compensation commande #123"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
            <button
              onClick={handleAdjust}
              disabled={saving}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Application…' : 'Appliquer l\'ajustement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'config',    label: 'Configuration',       icon: 'settings'      },
  { key: 'segments',  label: 'Avantages / segments', icon: 'loyalty'       },
  { key: 'ranking',   label: 'Classement',           icon: 'leaderboard'   },
  { key: 'adjust',    label: 'Ajustement manuel',    icon: 'tune'          },
]

export default function Fidelite() {
  const [activeTab, setActiveTab] = useState('config')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="material-icons text-3xl text-indigo-500">stars</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Programme de Fidélité</h1>
          <p className="text-sm text-gray-500">Gérer les points, les niveaux et les avantages clients</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white text-indigo-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-icons text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'config'   && <TabConfig />}
        {activeTab === 'segments' && <TabSegments />}
        {activeTab === 'ranking'  && <TabLeaderboard />}
        {activeTab === 'adjust'   && <TabAdjust />}
      </div>
    </div>
  )
}
