import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import apiClient from '../api/apiClient'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v) => v != null ? Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
const fmtInt = (v) => v != null ? Number(v).toLocaleString('fr-FR') : '—'

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
  REMBOURSEE: 'Remboursée',
}
const STATUS_BG = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  CONFIRMEE: 'bg-blue-100 text-blue-700',
  EN_PREPARATION: 'bg-indigo-100 text-indigo-700',
  EXPEDIEE: 'bg-indigo-100 text-indigo-700',
  LIVREE: 'bg-badge/10 text-badge',
  ANNULEE: 'bg-red-100 text-red-700',
  REMBOURSEE: 'bg-purple-100 text-purple-700',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Canvas Chart ───────────────────────────────────────────────────────────────
function TrendChart({ data, dataKey }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.length === 0) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height
      const pad = { top: 20, bottom: 30, left: 60, right: 20 }
      const chartW = W - pad.left - pad.right
      const chartH = H - pad.top - pad.bottom

      ctx.clearRect(0, 0, W, H)

      const values = data.map(d => d[dataKey] || 0)
      const maxVal = Math.max(...values, 1)

      // Grid
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 1
      ctx.font = '10px system-ui'
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + (chartH / 4) * i
        ctx.beginPath()
        ctx.moveTo(pad.left, y)
        ctx.lineTo(W - pad.right, y)
        ctx.stroke()
        const label = dataKey === 'commandes' || dataKey === 'clients'
          ? Math.round(maxVal - (maxVal / 4) * i)
          : fmt(maxVal - (maxVal / 4) * i)
        ctx.fillText(label, pad.left - 8, y + 4)
      }

      // X labels
      ctx.textAlign = 'center'
      ctx.fillStyle = '#94a3b8'
      data.forEach((d, i) => {
        const x = pad.left + (chartW / (data.length - 1)) * i
        ctx.fillText(d.mois?.slice(0, 3) || '', x, H - 8)
      })

      // Gradient fill
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH)
      grad.addColorStop(0, 'rgba(0, 91, 61, 0.15)')
      grad.addColorStop(1, 'rgba(0, 91, 61, 0)')
      ctx.beginPath()
      ctx.moveTo(pad.left, pad.top + chartH)
      values.forEach((v, i) => {
        const x = pad.left + (chartW / (data.length - 1)) * i
        const y = pad.top + chartH - (v / maxVal) * chartH
        ctx.lineTo(x, y)
      })
      ctx.lineTo(pad.left + chartW, pad.top + chartH)
      ctx.fillStyle = grad
      ctx.fill()

      // Line
      ctx.beginPath()
      values.forEach((v, i) => {
        const x = pad.left + (chartW / (data.length - 1)) * i
        const y = pad.top + chartH - (v / maxVal) * chartH
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = '#005b3d'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Dots
      values.forEach((v, i) => {
        const x = pad.left + (chartW / (data.length - 1)) * i
        const y = pad.top + chartH - (v / maxVal) * chartH
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#005b3d'
        ctx.fill()
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [data, dataKey])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartTab, setChartTab] = useState('ca')
  const [inventoryTab, setInventoryTab] = useState('rupture')

  useEffect(() => {
    ;(async () => {
      try {
        const shop = window.location.pathname.split('/').filter(Boolean)[0]
        const reserved = ['login', 'inscription', 'auth-callback', 'nouvelle-boutique', 'sellio']
        const query = shop && !reserved.includes(shop) ? `?shop=${encodeURIComponent(shop)}` : ''
        const { data } = await apiClient.get(`/admin/dashboard${query}`)
        setD(data)
      } catch {
        toast.error('Erreur lors du chargement du tableau de bord')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>
  if (!d) return <div className="p-6 text-center text-slate-400">Erreur de chargement</div>

  const quickActions = [
    { label: 'Ajouter produit', icon: 'add', primary: true, path: '/produits/nouveau' },
    { label: 'Nouvelle commande', icon: 'receipt_long', path: '/commandes' },
    { label: 'Créer promotion', icon: 'campaign', path: '/promotions' },
    { label: 'Ajouter bannière', icon: 'photo_camera', path: '/bannieres/nouvelle' },
    { label: 'Gérer clients', icon: 'groups', path: '/clients' },
    { label: 'Gérer stock', icon: 'inventory', path: '/produits' },
  ]

  const kpiData = [
    { label: "CA HTVA", value: `${fmt(d.caHT)} DT`, icon: 'payments', iconBg: 'bg-badge/10 text-badge', sub: `TTC: ${fmt(d.caTTC)} DT`, subColor: 'text-slate-400' },
    { label: 'TVA Collectée', value: `${fmt(d.tvaTotal)} DT`, icon: 'account_balance', iconBg: 'bg-blue-50 text-blue-500' },
    { label: 'Panier moyen', value: `${fmt(d.panierMoyen)} DT`, icon: 'shopping_cart', iconBg: 'bg-indigo-50 text-indigo-500' },
    { label: 'Clients actifs', value: fmtInt(d.clientsActifs), icon: 'groups', iconBg: 'bg-badge/10 text-badge', sub: `+${fmtInt(d.nouveauxClients30j)} ce mois`, subColor: 'text-badge' },
    { label: 'Note moyenne', value: `${d.noteMoyenne}/5`, icon: 'star', iconBg: 'bg-amber-50 text-amber-500', sub: d.noteMoyenne >= 4 ? 'Excellent' : d.noteMoyenne >= 3 ? 'Bon' : 'À améliorer', subColor: d.noteMoyenne >= 4 ? 'text-badge' : d.noteMoyenne >= 3 ? 'text-amber-500' : 'text-red-500' },
  ]

  const orderStatuses = [
    { label: 'Attente', value: d.cmdEnAttente, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Confirmée', value: d.cmdConfirmee, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Préparation', value: d.cmdEnPreparation, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Expédiée', value: d.cmdExpediee, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Livrée', value: d.cmdLivree, color: 'text-badge', bg: 'bg-badge/5' },
    { label: 'Annulée', value: d.cmdAnnulee, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  const stockList = inventoryTab === 'rupture' ? (d.produitsRuptureList || []) : (d.produitsFaibleList || [])

  // CA category bar max
  const maxCatRevenu = Math.max(...(d.caParCategorie || []).map(c => c.revenu), 1)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiData.map(k => (
          <div key={k.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{k.label}</span>
              <div className={`p-1.5 rounded-lg ${k.iconBg}`}>
                <span className="material-symbols-outlined text-lg">{k.icon}</span>
              </div>
            </div>
            <p className="text-xl font-bold text-slate-800">{k.value}</p>
            {k.sub && <p className={`text-[10px] font-bold mt-1 ${k.subColor}`}>{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Taux de retour card (special) + Commandes en attente CTA ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-brand/5 p-5 rounded-xl border border-brand/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-brand text-[10px] font-bold uppercase">Taux de retour</span>
            <span className="material-symbols-outlined text-brand/40 text-lg">keyboard_return</span>
          </div>
          <p className="text-xl font-black text-brand">{d.tauxRetour}%</p>
          <p className="text-[10px] text-brand/60 font-bold mt-1">{fmtInt(d.retourEnAttente)} en attente</p>
        </div>

        <button onClick={() => navigate('/commandes')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all text-left group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Commandes en attente</span>
            <span className="material-symbols-outlined text-amber-500 text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{fmtInt(d.commandesEnAttente)}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Cliquez pour gérer →</p>
        </button>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Avis en attente</span>
            <span className="material-symbols-outlined text-blue-400 text-lg">rate_review</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{fmtInt(d.avisEnAttente)}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">À modérer</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase">Commandes annulées</span>
            <span className="material-symbols-outlined text-red-400 text-lg">cancel</span>
          </div>
          <p className="text-xl font-bold text-red-600">{fmtInt(d.commandesAnnulees)}</p>
        </div>
      </div>

      {/* ── Actions Rapides ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Actions Rapides :</span>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                a.primary ? 'bg-btn hover:bg-btn-dark text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
              <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Analyses Avancées + Inventaire ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 text-lg">Analyses Avancées</h4>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[
                { key: 'ca', label: 'CA' },
                { key: 'commandes', label: 'Commandes' },
              ].map(t => (
                <button key={t.key} onClick={() => setChartTab(t.key)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    chartTab === t.key ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-brand'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            {d.tendancesMensuelles && d.tendancesMensuelles.length > 0 ? (
              <TrendChart data={d.tendancesMensuelles} dataKey={chartTab} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Aucune donnée</div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-brand rounded inline-block" /> 12 derniers mois
            </div>
          </div>
        </div>

        {/* Inventaire */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-slate-800 text-lg">Inventaire</h4>
            <button onClick={() => navigate('/produits')} className="text-[10px] font-bold text-brand hover:underline">Voir tout</button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total actifs</p>
              <p className="text-lg font-black text-slate-800">{fmtInt(d.produitsTotalActifs)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
              <p className="text-[10px] font-bold text-red-500 uppercase">Rupture</p>
              <p className="text-lg font-black text-red-600">{fmtInt(d.produitsRupture)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <p className="text-[10px] font-bold text-amber-500 uppercase">Faible (≤10)</p>
              <p className="text-lg font-black text-amber-600">{fmtInt(d.produitsFaible)}</p>
            </div>
          </div>

          {/* Valeur stock */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Valeur du stock</p>
            <p className="text-lg font-black text-slate-800">{fmt(d.valeurStock)} DT</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            <button onClick={() => setInventoryTab('rupture')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${inventoryTab === 'rupture' ? 'bg-red-100 text-red-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              Rupture ({d.produitsRupture})
            </button>
            <button onClick={() => setInventoryTab('faible')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${inventoryTab === 'faible' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              Faible ({d.produitsFaible})
            </button>
          </div>

          {/* Product list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stockList.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Aucun produit</p>
            ) : stockList.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-300 text-sm">image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{p.nom}</p>
                  <p className="text-[10px] text-slate-400">{p.sku || '—'}</p>
                </div>
                <span className={`text-xs font-black ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance Produit + CA par Catégorie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produits */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800">Top Produits</h4>
            <button onClick={() => navigate('/produits')} className="text-[10px] font-bold text-brand hover:underline">Voir tout</button>
          </div>
          <div className="p-5">
            {(d.topProduits || []).length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-2">
                {d.topProduits.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-slate-300">image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.nom}</p>
                      <p className="text-[10px] text-slate-400">{p.categoryNom} · {p.totalVendu} vendus</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-brand">{fmt(p.totalRevenu)} DT</p>
                      <p className={`text-[9px] font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                        Stock: {p.stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CA par Catégorie */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h4 className="font-bold text-slate-800 mb-6">Ventes par Catégorie</h4>
          {(d.caParCategorie || []).length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {d.caParCategorie.map((c, i) => {
                const pct = Math.round((c.revenu / maxCatRevenu) * 100)
                const colors = ['bg-brand', 'bg-blue-500', 'bg-indigo-400', 'bg-amber-400', 'bg-cyan-400', 'bg-purple-400']
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700">{c.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">{c.totalVendu} vendus</span>
                        <span className="font-black text-slate-800">{fmt(c.revenu)} DT</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Clients + État des Commandes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800">Vue d&apos;ensemble Clients</h4>
            <button onClick={() => navigate('/clients')} className="text-[10px] font-bold text-brand hover:underline">Détails</button>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Nouveaux (30j)', value: `+${fmtInt(d.nouveauxClients30j)}`, icon: 'person_add', iconBg: 'bg-blue-100 text-blue-600' },
              { label: 'Clients fidèles', value: fmtInt(d.clientsFideles), icon: 'loyalty', iconBg: 'bg-badge/10 text-badge', border: 'border-l-4 border-badge' },
              { label: 'VIP', value: fmtInt(d.clientsVIP), icon: 'star', iconBg: 'bg-amber-100 text-amber-600' },
              { label: 'Inactifs', value: fmtInt(d.clientsInactifs), icon: 'person_off', iconBg: 'bg-red-100 text-red-600' },
            ].map(c => (
              <div key={c.label} className={`flex justify-between items-center p-3 bg-slate-50 rounded-lg ${c.border || ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${c.iconBg}`}>
                    <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{c.label}</span>
                </div>
                <span className="text-sm font-black text-slate-800">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commandes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800">État des Commandes</h4>
            <button onClick={() => navigate('/commandes')} className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              Voir tout <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
              {orderStatuses.map(s => (
                <div key={s.label} className={`p-3 ${s.bg} rounded-xl text-center border border-slate-100`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Recent orders table */}
            <p className="text-[11px] font-bold text-slate-400 uppercase mb-3">Commandes récentes</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Référence</th>
                    <th className="px-4 py-2.5">Client</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(d.commandesRecentes || []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Aucune commande</td></tr>
                  ) : d.commandesRecentes.map(o => (
                    <tr key={o.id} onClick={() => navigate(`/commandes/${o.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-badge">#{o.reference?.slice(-8)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{o.clientName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_BG[o.status] || 'bg-slate-100'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3 text-xs font-black text-right text-slate-800">{fmt(o.total)} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="pt-4 border-t border-slate-200 text-slate-400 text-xs flex justify-between">
        <p>© 2026 Back Office. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
