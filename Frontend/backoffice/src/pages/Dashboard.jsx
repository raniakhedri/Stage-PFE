import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── KPI Data ──────────────────────────────────────────────────────────────────
const kpiCards = [
  {
    label: "Chiffre d'affaires",
    value: '124.592 €',
    trend: '+12.5%',
    trendUp: true,
    icon: 'payments',
  },
  {
    label: 'Commandes',
    value: '1.842',
    trend: '+8.2%',
    trendUp: true,
    icon: 'shopping_bag',
  },
  {
    label: 'Panier moyen',
    value: '67.63 €',
    trend: '-2.3%',
    trendUp: false,
    icon: 'shopping_cart',
  },
  {
    label: 'Clients Actifs',
    value: '8.312',
    trend: '+5.1%',
    trendUp: true,
    icon: 'groups',
    trendColor: 'text-blue-600',
  },
  {
    label: 'Conversion',
    value: '3.85%',
    trend: '+1.2%',
    trendUp: true,
    icon: 'ads_click',
  },
]

const quickActions = [
  { label: 'Ajouter produit',   icon: 'add',          primary: true, path: '/produits/nouveau' },
  { label: 'Créer promotion',   icon: 'campaign',     path: '/promotions' },
  { label: 'Créer collection',  icon: 'star',         path: null },
  { label: 'Ajouter bannière',  icon: 'photo_camera', path: null },
  { label: 'Ajouter client',    icon: 'person_add',   path: '/clients' },
  { label: 'Gérer stock',       icon: 'inventory',    path: '/produits' },
]

const inventoryStats = [
  { label: 'Valeur stock', value: '482.4K€', bg: 'bg-slate-50',  border: 'border-slate-100',  text: 'text-slate-800',  labelColor: 'text-slate-500' },
  { label: 'Rupture',      value: '8 refs',  bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600',    labelColor: 'text-red-500' },
  { label: 'Faible',       value: '14 refs', bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-600',  labelColor: 'text-amber-500' },
  { label: 'Surstock',     value: '3 refs',  bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   labelColor: 'text-blue-500' },
]

const inventoryBars = [
  { label: 'Vestes & Manteaux', pct: 88, color: 'bg-brand',     note: '' },
  { label: 'Sneakers Pro',      pct: 42, color: 'bg-amber-500', note: '(Faible)',    noteColor: 'text-orange-500' },
  { label: 'Jeans Renforcés',   pct: 12, color: 'bg-red-500',   note: '(Critique)', noteColor: 'text-red-500' },
  { label: 'Accessoires',       pct: 65, color: 'bg-blue-400',  note: '' },
]

const alerts = [
  { label: 'En rupture', value: 8,  badge: 'CRITIQUE', badgeBg: 'bg-red-100 text-red-700',    iconBg: 'bg-red-50 text-red-600',    icon: 'inventory_2' },
  { label: 'Bloquées',   value: 5,  badge: 'ACTION',   badgeBg: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-50 text-amber-600', icon: 'gavel' },
  { label: 'Échoués',    value: 12, badge: 'REPRISE',  badgeBg: 'bg-slate-200 text-slate-700', iconBg: 'bg-slate-100 text-slate-600', icon: 'credit_card_off' },
  { label: 'En attente', value: 21, badge: 'RETOUR',   badgeBg: 'bg-blue-100 text-blue-700',   iconBg: 'bg-blue-50 text-blue-600',   icon: 'keyboard_return' },
]

const topProducts = [
  { name: 'Combinaison FR Pro Arctic', badge: 'BEST SELLER', badgeBg: 'bg-badge/10 text-badge',       sales: '240 ventes · +12% cette semaine', price: '14.400 €', stock: '42',  stockRed: false, color: 'bg-slate-300' },
  { name: 'Sneakers Ultra-Grip v3',    badge: 'TRENDING',    badgeBg: 'bg-amber-100 text-amber-700',  sales: '185 ventes · +24% en 24h',        price: '11.100 €', stock: '8',   stockRed: true,  color: 'bg-blue-200' },
  { name: 'Jeans Cargo Renforcé Blue', badge: 'LOW STOCK',   badgeBg: 'bg-red-100 text-red-700',      sales: '92 ventes · Demande stable',       price: '5.520 €',  stock: '2',   stockRed: true,  color: 'bg-indigo-200' },
]

const categoryBars = [
  { label: 'Vestes',      value: '93K€',  pct: 180, color: 'bg-brand',       textColor: 'text-brand',       trend: '+12%', trendColor: 'text-brand' },
  { label: 'Sneakers',    value: '56K€',  pct: 120, color: 'bg-blue-500',    textColor: 'text-slate-800',   trend: '+8%',  trendColor: 'text-brand' },
  { label: 'Jeans',       value: '31K€',  pct: 80,  color: 'bg-indigo-400',  textColor: 'text-indigo-700',  trend: '-3%',  trendColor: 'text-red-500' },
  { label: 'Accessoires', value: '18K€',  pct: 50,  color: 'bg-amber-400',   textColor: 'text-amber-700',   trend: '+15%', trendColor: 'text-brand' },
]

const clientStats = [
  { label: 'Nouveaux clients', value: '+124', icon: 'person_add', iconBg: 'bg-blue-100 text-blue-600',    border: '' },
  { label: 'Clients fidèles',  value: '842',  icon: 'loyalty',    iconBg: 'bg-badge/10 text-badge',       border: 'border-l-4 border-badge' },
  { label: 'Top clients (VIP)',value: '18',   icon: 'star',       iconBg: 'bg-badge/10 text-badge', border: '' },
  { label: 'Clients inactifs', value: '42',   icon: 'person_off', iconBg: 'bg-red-100 text-red-600',      border: '' },
]

const orderStatuses = [
  { label: 'Attente',   value: 24, color: 'text-amber-600' },
  { label: 'Prép.',     value: 12, color: 'text-blue-600' },
  { label: 'Expédiées', value: 86, color: 'text-brand' },
  { label: 'Annulées',  value: 3,  color: 'text-red-600' },
  { label: 'Retours',   value: 18, color: 'text-slate-700' },
  { label: 'Rembour.',  value: 4,  color: 'text-slate-500' },
]

const recentOrders = [
  { id: '#ORD-9421', client: 'Ironclad Construction', status: 'En attente', statusBg: 'bg-amber-100 text-amber-700',   total: '1.420 €' },
  { id: '#ORD-9420', client: 'Sarah Jenkins',         status: 'Expédiée',   statusBg: 'bg-badge/10 text-badge', total: '125,50 €' },
  { id: '#ORD-9418', client: 'Tech Logistics S.A.',   status: 'Retour',     statusBg: 'bg-slate-100 text-slate-700',    total: '842,00 €' },
]

// ── Canvas Revenue Chart ───────────────────────────────────────────────────────
function RevenueChart() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height

      // Grid lines
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = (H / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      // Previous period (dashed gray)
      const prev = [
        [0, 0.85], [0.15, 0.80], [0.30, 0.82], [0.45, 0.60],
        [0.60, 0.70], [0.75, 0.50], [0.90, 0.55], [1.00, 0.40],
      ]
      ctx.beginPath()
      ctx.moveTo(prev[0][0] * W, prev[0][1] * H)
      prev.forEach(([x, y]) => ctx.lineTo(x * W, y * H))
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])

      // Current period (green solid + gradient fill)
      const curr = [
        [0, 0.80], [0.15, 0.65], [0.30, 0.72], [0.45, 0.40],
        [0.60, 0.55], [0.75, 0.25], [0.90, 0.35], [1.00, 0.15],
      ]
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, 'rgba(0, 91, 61, 0.12)')
      grad.addColorStop(1, 'rgba(0, 91, 61, 0)')
      ctx.beginPath()
      ctx.moveTo(0, H)
      curr.forEach(([x, y]) => ctx.lineTo(x * W, y * H))
      ctx.lineTo(W, H)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(curr[0][0] * W, curr[0][1] * H)
      curr.forEach(([x, y]) => ctx.lineTo(x * W, y * H))
      ctx.strokeStyle = '#005b3d'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('Jour')
  const [chartTab, setChartTab] = useState('CA')

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">

      {/* ── Section A: KPI ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Aperçu de la Performance
          </h2>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            {['Jour', 'Semaine', 'Mois'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  period === p
                    ? 'text-brand bg-slate-50'
                    : 'text-slate-500 hover:text-brand'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiCards.map((k) => (
            <div
              key={k.label}
              className="bg-white p-5 rounded-custom border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-500 text-[10px] font-bold uppercase">{k.label}</p>
                <span className="material-symbols-outlined text-slate-300 text-lg">{k.icon}</span>
              </div>
              <div className="flex items-end justify-between mt-1">
                <h3 className="text-xl font-bold text-slate-800">{k.value}</h3>
                <span
                  className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    k.trendColor || (k.trendUp ? 'text-brand' : 'text-red-500')
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {k.trendUp ? 'trending_up' : 'trending_down'}
                  </span>
                  {k.trend}
                </span>
              </div>
            </div>
          ))}

          {/* Taux de retour — special brand card */}
          <div className="bg-gradient-to-br from-white to-brand/5 p-5 rounded-custom border border-brand/20 shadow-sm ring-1 ring-brand/5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-brand text-[10px] font-bold uppercase">Taux de retour</p>
              <span className="material-symbols-outlined text-brand/40 text-lg">keyboard_return</span>
            </div>
            <div className="flex items-end justify-between mt-1">
              <h3 className="text-xl font-black text-brand">2.1%</h3>
              <span className="text-brand text-[10px] font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">trending_down</span>
                -0.4%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: Actions Rapides ── */}
      <div className="bg-white p-6 rounded-custom border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Actions Rapides :</span>
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => a.path && navigate(a.path)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                a.primary
                  ? 'bg-btn hover:bg-btn-dark text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section C: Analyses + Inventaire ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-custom border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Analyses Avancées</h4>
              <p className="text-xs text-slate-500">+14% par rapport à la période précédente</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {['CA', 'Commandes', 'Clients'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTab(t)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                      chartTab === t
                        ? 'bg-white text-brand shadow-sm'
                        : 'text-slate-500 hover:text-brand'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-500 hover:text-brand transition-colors">
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </button>
                <button className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-500 hover:text-brand transition-colors">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
              </div>
            </div>
          </div>
          <div className="h-72 relative">
            <RevenueChart />
            <div className="absolute top-0 right-0 flex items-center gap-4 text-[10px] font-bold uppercase pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block"></span> Période actuelle
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-dashed border-slate-400 inline-block"></span> Période précédente
              </div>
            </div>
          </div>
        </div>

        {/* Inventaire */}
        <div className="bg-white p-8 rounded-custom border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 text-lg mb-6">Inventaire</h4>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {inventoryStats.map((s) => (
              <div key={s.label} className={`p-4 ${s.bg} rounded-xl border ${s.border}`}>
                <p className={`text-[10px] font-bold uppercase ${s.labelColor}`}>{s.label}</p>
                <p className={`text-lg font-black ${s.text}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {inventoryBars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">{b.label}</span>
                  <span className="text-slate-900">
                    {b.pct}%{' '}
                    {b.note && <span className={b.noteColor}>{b.note}</span>}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${b.color} h-2 rounded-full`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-xs font-bold text-brand border-2 border-brand/10 rounded-lg hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2">
            Optimiser l&apos;approvisionnement
            <span className="material-symbols-outlined text-[16px]">bolt</span>
          </button>
        </div>
      </div>

      {/* ── Section D: Alertes prioritaires ── */}
      <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Alertes prioritaires</h4>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Dernière mise à jour: 14:32</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-x divide-slate-100">
          {alerts.map((a) => (
            <div key={a.label} className="p-6 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.iconBg}`}>
                <span className="material-symbols-outlined">{a.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{a.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-800">{a.value}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.badgeBg}`}>{a.badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section E: Performance Produit + CA Catégorie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800">Performance par Produit</h4>
            <span className="text-[10px] font-bold text-brand bg-brand/5 px-2 py-1 rounded">
              Mise à jour à l&apos;instant
            </span>
          </div>
          <div className="p-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase mb-4">Meilleures ventes</p>
            <div className="space-y-2">
              {topProducts.map((p) => (
                <div key={p.name} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                  <div className={`w-12 h-12 rounded ${p.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${p.badgeBg}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{p.sales}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-black text-brand">{p.price}</div>
                    <p className={`text-[9px] font-bold ${p.stockRed ? 'text-red-500' : 'text-slate-400'}`}>
                      Stock: {p.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CA par catégorie */}
        <div className="bg-white rounded-custom border border-slate-200 shadow-sm p-6">
          <h4 className="font-bold text-slate-800 mb-6">CA par catégorie</h4>
          <div className="grid grid-cols-4 gap-4 h-64 items-end">
            {categoryBars.map((c) => (
              <div key={c.label} className="text-center group">
                <div className="flex flex-col items-center gap-1 mb-2">
                  <span className={`text-[10px] font-bold ${c.trendColor}`}>{c.trend}</span>
                  <div
                    className={`${c.color} w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80`}
                    style={{ height: `${c.pct}px` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-600">{c.label}</p>
                <p className={`text-xs font-black ${c.textColor}`}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section F: Clients + État des Commandes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clients */}
        <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h4 className="font-bold text-slate-800">Vue d&apos;ensemble Clients</h4>
          </div>
          <div className="p-6 space-y-4">
            {clientStats.map((c) => (
              <div
                key={c.label}
                className={`flex justify-between items-center p-3 bg-slate-50 rounded-lg ${c.border}`}
              >
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
        <div className="lg:col-span-2 bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800">État des Commandes</h4>
            <a href="/commandes" className="text-xs font-bold text-brand hover:underline">Voir tout</a>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {orderStatuses.map((s) => (
                <div key={s.label} className="p-3 border border-slate-100 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-slate-400">{o.id}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{o.client}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-badge ${o.statusBg}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-right text-slate-800">{o.total}</td>
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
        <p>© 2026 WorkwearPro Back Office. Tous droits réservés.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-brand transition-colors">Centre d&apos;aide</a>
          <a href="#" className="hover:text-brand transition-colors">API Documentation</a>
          <a href="#" className="hover:text-brand transition-colors">Support</a>
        </div>
      </footer>

    </div>
  )
}

export default Dashboard
