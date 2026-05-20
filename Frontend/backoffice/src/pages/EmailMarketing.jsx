import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import Spinner from '../components/ui/Spinner'

// ── API helpers ──────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
const adminGet  = (p)    => apiClient.get (p,    { headers: authHeaders() }).then(r => r.data)
const adminPost = (p, b) => apiClient.post(p, b, { headers: authHeaders() }).then(r => r.data)

// ── Segment colour map ───────────────────────────────────────────────────────
const PALETTE = {
  NOUVEAU: { hex: '#0891b2', light: '#ecfeff' },
  FIDELE:  { hex: '#16a34a', light: '#f0fdf4' },
  VIP:     { hex: '#d97706', light: '#fffbeb' },
  INACTIF: { hex: '#64748b', light: '#f8fafc' },
  ALL:     { hex: '#004D40', light: '#f0fdf4' },
}
const col = (name) => PALETTE[name] || PALETTE.ALL

// ── Composer ─────────────────────────────────────────────────────────────────
const SEGMENT_OPTIONS = [
  { value: 'ALL',     label: 'Tous les clients actifs' },
  { value: 'NOUVEAU', label: 'Nouveaux clients'        },
  { value: 'FIDELE',  label: 'Clients fideles'         },
  { value: 'VIP',     label: 'Clients VIP'             },
  { value: 'INACTIF', label: 'Clients inactifs'        },
]

function Composer({ stats }) {
  const [subject, setSubject] = useState('')
  const [html, setHtml]       = useState('')
  const [segment, setSegment] = useState('ALL')
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

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
      toast.success(res.message || 'Newsletter envoyee !')
      setSubject(''); setHtml('')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erreur lors de l envoi')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-brand text-lg">edit</span>
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm font-heading">Nouvelle newsletter</p>
          <p className="text-xs text-slate-400">Redigez et envoyez un email a vos clients</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Segment selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Destinataires</label>
          <div className="flex flex-wrap gap-2">
            {SEGMENT_OPTIONS.map(opt => {
              const active = segment === opt.value
              const c2 = col(opt.value)
              return (
                <button key={opt.value} onClick={() => setSegment(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all font-button"
                  style={active
                    ? { backgroundColor: c2.hex, color: '#fff', borderColor: c2.hex }
                    : { backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Environ <span className="font-bold" style={{ color: c.hex }}>{recipientCount}</span> destinataire(s) recevront cette newsletter.
          </p>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sujet</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="ex : Notre nouvelle collection printemps"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
          />
        </div>

        {/* HTML content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contenu HTML</label>
            <button onClick={() => setPreview(p => !p)}
              className="text-[11px] font-bold text-brand hover:text-brand-dark flex items-center gap-1 font-button">
              <span className="material-symbols-outlined text-sm">{preview ? 'code' : 'preview'}</span>
              {preview ? 'Editeur' : 'Apercu'}
            </button>
          </div>
          {preview ? (
            <div className="w-full min-h-[200px] border border-slate-200 rounded-xl p-4 bg-slate-50 overflow-auto text-sm"
              dangerouslySetInnerHTML={{ __html: html || '<em style="color:#94a3b8">Aucun contenu HTML saisi</em>' }}
            />
          ) : (
            <textarea rows={8} value={html} onChange={e => setHtml(e.target.value)}
              placeholder="<h2>Bonjour,</h2><p>Decouvrez nos nouveautes...</p>"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
            />
          )}
          <p className="text-[11px] text-slate-400 mt-1.5">Vous pouvez utiliser du HTML complet. Le contenu est envoye tel quel via Brevo.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 max-w-sm">L envoi s effectue en arriere-plan de maniere asynchrone.</p>
          <PageHeader>
            <PageHeader.PrimaryBtn icon="send" onClick={send} disabled={sending || !subject.trim() || !html.trim()}>
              {sending ? 'Envoi en cours...' : 'Envoyer la newsletter'}
            </PageHeader.PrimaryBtn>
          </PageHeader>
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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-btn flex items-center justify-center shadow-lg shadow-btn/20 flex-shrink-0">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-heading">Email Marketing</h1>
            <p className="text-xs text-slate-400">Newsletters et communication client</p>
          </div>
        </div>
        <PageHeader>
          <PageHeader.SecondaryBtn icon="refresh" onClick={loadStats}>Actualiser</PageHeader.SecondaryBtn>
        </PageHeader>
      </div>

      {loading ? (
        <div className="py-16"><Spinner /></div>
      ) : stats ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="group"        label="Total clients"    value={stats.totalClients.toLocaleString()}  sub="Comptes enregistres" subColor="text-slate-400"  iconBg="bg-brand/10 text-brand" />
            <KpiCard icon="check_circle" label="Clients actifs"   value={stats.activeClients.toLocaleString()} sub="Comptes actifs"      subColor="text-brand"      iconBg="bg-brand/10 text-brand" />
            <KpiCard icon="person_add"   label="Nouveaux ce mois" value={stats.newThisMonth.toLocaleString()}  sub="Ce mois-ci"         subColor="text-badge"      iconBg="bg-badge/10 text-badge" />
            <KpiCard icon="mail_outline" label="Plateforme email"  value="Brevo SMTP"                          sub="Actif"              subColor="text-brand"      iconBg="bg-brand/10 text-brand" />
          </div>

          {/* Segment breakdown */}
          {stats.segmentBreakdown?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Repartition par niveau client</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.segmentBreakdown.map(s => {
                  const c = col(s.segmentName)
                  const pct = stats.totalClients > 0 ? Math.round((s.count / stats.totalClients) * 100) : 0
                  return (
                    <div key={s.segmentName} className="rounded-xl p-4 text-center border" style={{ backgroundColor: c.light, borderColor: c.hex + '30' }}>
                      <p className="text-2xl font-bold font-heading" style={{ color: c.hex }}>{s.count.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-slate-600 mt-1 font-button">{s.segmentLabel}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pct}% du total</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Composer */}
          <Composer stats={stats} />

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
            <div>
              <p className="text-sm font-bold text-amber-900 font-heading mb-1">Conseils pour une meilleure delivrabilite</p>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                <li>Personnalisez le contenu — les emails generiques ont un taux d ouverture plus faible</li>
                <li>Limitez l envoi a une newsletter par semaine pour eviter le marquage comme spam</li>
                <li>Ajoutez toujours un lien de desinscription conforme au RGPD dans votre HTML</li>
                <li>Testez votre template sur un petit groupe avant l envoi massif</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-200 block">mail_outline</span>
          <p className="text-slate-400 mt-3">Impossible de charger les statistiques.</p>
          <button onClick={loadStats} className="mt-4 text-brand text-sm font-bold font-button hover:underline">Reessayer</button>
        </div>
      )}
    </div>
  )
}
