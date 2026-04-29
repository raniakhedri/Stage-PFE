import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'

// ── API helpers ──────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
const adminGet  = (p)    => apiClient.get (p,    { headers: authHeaders() }).then(r => r.data)
const adminPost = (p, b) => apiClient.post(p, b, { headers: authHeaders() }).then(r => r.data)

// ── Colour for segment tags ──────────────────────────────────────────────────
const PALETTE = {
  NOUVEAU: { hex: '#3b82f6', light: '#eff6ff' },
  FIDELE:  { hex: '#10b981', light: '#ecfdf5' },
  VIP:     { hex: '#f59e0b', light: '#fffbeb' },
  INACTIF: { hex: '#6b7280', light: '#f9fafb' },
  ALL:     { hex: '#6366f1', light: '#eef2ff' },
}
const col = (name) => PALETTE[name] || PALETTE.ALL

// ── Small primitives ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color = 'bg-indigo-50 text-indigo-600' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-icons text-xl">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Composer ─────────────────────────────────────────────────────────────────
const SEGMENT_OPTIONS = [
  { value: 'ALL',     label: 'Tous les clients actifs' },
  { value: 'NOUVEAU', label: 'Nouveaux clients'        },
  { value: 'FIDELE',  label: 'Clients fidèles'         },
  { value: 'VIP',     label: 'Clients VIP'             },
  { value: 'INACTIF', label: 'Clients inactifs'        },
]

function Composer({ stats }) {
  const [subject, setSubject]   = useState('')
  const [html, setHtml]         = useState('')
  const [segment, setSegment]   = useState('ALL')
  const [sending, setSending]   = useState(false)
  const [preview, setPreview]   = useState(false)

  const recipientCount = (() => {
    if (!stats) return '—'
    if (segment === 'ALL') return stats.activeClients.toLocaleString()
    const seg = stats.segmentBreakdown?.find(s => s.segmentName === segment)
    return seg ? seg.count.toLocaleString() : '—'
  })()

  const c = col(segment)

  const send = async () => {
    if (!subject.trim()) { toast.warn('Veuillez saisir un sujet.'); return }
    if (!html.trim())    { toast.warn('Veuillez saisir le contenu HTML.'); return }
    setSending(true)
    try {
      const res = await adminPost('/admin/email/newsletter', {
        subject: subject.trim(),
        htmlContent: html.trim(),
        segment: segment === 'ALL' ? '' : segment,
      })
      toast.success(res.message || 'Newsletter envoyée !')
      setSubject(''); setHtml('')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <span className="material-icons text-indigo-600 text-lg">edit</span>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Nouvelle newsletter</p>
          <p className="text-xs text-gray-400">Rédigez et envoyez un email à vos clients</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Segment selector */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Destinataires</label>
          <div className="flex flex-wrap gap-2">
            {SEGMENT_OPTIONS.map(opt => {
              const active = segment === opt.value
              const c2 = col(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => setSegment(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                  style={active
                    ? { backgroundColor: c2.hex, color: '#fff', borderColor: c2.hex }
                    : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Environ <span className="font-bold" style={{ color: c.hex }}>{recipientCount}</span> destinataire(s)
          </p>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sujet</label>
          <input
            type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="ex: Notre nouvelle collection printemps 🌸"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>

        {/* HTML content + preview toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contenu HTML</label>
            <button
              onClick={() => setPreview(p => !p)}
              className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
            >
              <span className="material-icons text-sm">{preview ? 'code' : 'preview'}</span>
              {preview ? 'Éditeur' : 'Aperçu'}
            </button>
          </div>
          {preview ? (
            <div
              className="w-full min-h-[200px] border border-gray-200 rounded-xl p-4 bg-gray-50 overflow-auto text-sm"
              dangerouslySetInnerHTML={{ __html: html || '<em style="color:#aaa">Aucun contenu</em>' }}
            />
          ) : (
            <textarea
              rows={8} value={html} onChange={e => setHtml(e.target.value)}
              placeholder="<h2>Bonjour {{firstName}},</h2><p>Découvrez nos nouveautés...</p>"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-indigo-300 outline-none resize-y"
            />
          )}
          <p className="text-[11px] text-gray-400 mt-1">Vous pouvez utiliser du HTML complet. Le contenu est envoyé tel quel via Brevo.</p>
        </div>

        {/* Send button */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">L'envoi s'effectue en arrière-plan. Vous recevrez une confirmation dans quelques instants.</p>
          <button
            onClick={send} disabled={sending || !subject.trim() || !html.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 flex-shrink-0 ml-4"
          >
            {sending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...</>
              : <><span className="material-icons text-lg">send</span> Envoyer</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EmailMarketing() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(() => {
    setLoading(true)
    adminGet('/admin/email/stats')
      .then(setStats)
      .catch(() => toast.error('Impossible de charger les statistiques email'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
            <span className="material-icons text-white text-2xl">mail</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Marketing</h1>
            <p className="text-xs text-gray-400">Newsletters et communication client</p>
          </div>
        </div>
        <button onClick={loadStats} className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <span className="material-icons text-gray-400 text-lg">refresh</span>
        </button>
      </div>

      {/* Stats */}
      {loading ? <Spinner /> : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="group"         label="Total clients"        value={stats.totalClients.toLocaleString()}  color="bg-indigo-50 text-indigo-600" />
            <KpiCard icon="check_circle"  label="Clients actifs"       value={stats.activeClients.toLocaleString()} color="bg-emerald-50 text-emerald-600" />
            <KpiCard icon="person_add"    label="Nouveaux ce mois"     value={stats.newThisMonth.toLocaleString()}  color="bg-amber-50 text-amber-600" />
            <KpiCard icon="mail_outline"  label="Via Brevo" value="Actif" sub="SMTP transactionnel" color="bg-purple-50 text-purple-600" />
          </div>

          {/* Segment breakdown */}
          {stats.segmentBreakdown?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Répartition par niveau</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.segmentBreakdown.map(s => {
                  const c = col(s.segmentName)
                  const pct = stats.totalClients > 0 ? Math.round((s.count / stats.totalClients) * 100) : 0
                  return (
                    <div key={s.segmentName} className="rounded-xl p-3 text-center" style={{ backgroundColor: c.light }}>
                      <p className="text-xl font-bold" style={{ color: c.hex }}>{s.count.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.segmentLabel}</p>
                      <p className="text-[10px] text-gray-400">{pct}% du total</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Composer */}
          <Composer stats={stats} />

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="material-icons text-amber-500 text-lg mt-0.5">tips_and_updates</span>
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Conseils pour une meilleure délivrabilité</p>
              <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                <li>Personnalisez le contenu avec le prénom du client</li>
                <li>Limitez l'envoi à une newsletter par semaine maximum</li>
                <li>Ajoutez toujours un lien de désinscription dans votre HTML</li>
                <li>Testez votre template sur un petit groupe avant l'envoi massif</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <span className="material-icons text-5xl text-gray-200 block">mail_outline</span>
          <p className="text-gray-400 mt-3">Impossible de charger les statistiques.</p>
          <button onClick={loadStats} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline">Réessayer</button>
        </div>
      )}
    </div>
  )
}
