import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import { currentShopSlug, readUser } from '../lib/sellio'

const SERIES = '#2a78d6' // one series per chart → a single hue, no legend needed
const RANGES = [7, 30, 90]

const num = (v) => Number(v || 0).toLocaleString('fr-FR')
const pct = (a, b) => (b ? `${((100 * a) / b).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '—')

function Card({ title, subtitle, children, right }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Tooltip({ tip }) {
  if (!tip) return null
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs shadow-lg whitespace-nowrap" style={{ left: tip.x, top: tip.y - 8 }}>
      <span className="font-semibold">{tip.value}</span> <span className="text-white/60">{tip.label}</span>
    </div>
  )
}

/** Conversion funnel: one bar per step, share of sessions as the label. */
function Funnel({ funnel }) {
  const steps = [
    ['Visites', funnel.sessions],
    ['Produit consulté', funnel.viewed],
    ['Ajout au panier', funnel.carted],
    ['Commande commencée', funnel.checkout],
    ['Achat', funnel.bought],
  ]
  const max = Math.max(1, funnel.sessions)
  return (
    <div className="space-y-2.5">
      {steps.map(([label, value], i) => (
        <div key={label} className="grid grid-cols-[150px_1fr_110px] items-center gap-3 text-sm">
          <span className="text-slate-600">{label}</span>
          <div className="h-7 bg-slate-100 rounded-md overflow-hidden">
            <div className="h-full rounded-md transition-all" style={{ width: `${(100 * value) / max}%`, background: SERIES }} title={`${label} : ${num(value)}`} />
          </div>
          <span className="text-right tabular-nums">
            <span className="font-semibold text-slate-800">{num(value)}</span>
            {i > 0 && <span className="text-xs text-slate-500 ml-1.5">{pct(value, steps[i - 1][1])}</span>}
          </span>
        </div>
      ))}
      <p className="text-xs text-slate-500 pt-1">Le pourcentage indique le passage depuis l’étape précédente.</p>
    </div>
  )
}

/** Daily visitors: line with a crosshair that snaps to the nearest day. */
function DailyLine({ daily }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 640, H = 200, P = { l: 36, r: 12, t: 12, b: 24 }
  const values = daily.map((d) => Number(d.visitors))
  const max = Math.max(1, ...values)
  const niceMax = Math.ceil(max / 5) * 5 || 5
  const x = (i) => P.l + (daily.length < 2 ? 0 : (i * (W - P.l - P.r)) / (daily.length - 1))
  const y = (v) => H - P.b - (v / niceMax) * (H - P.t - P.b)
  const path = daily.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(values[i]).toFixed(1)}`).join('')
  if (!daily.length) return <p className="text-sm text-slate-500 py-10 text-center">Pas encore de visites sur la période.</p>

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.max(0, Math.min(daily.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (daily.length - 1))))
    setHover(i)
  }
  const d = hover != null ? daily[hover] : null
  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Visiteurs par jour">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(niceMax * f)} y2={y(niceMax * f)} stroke="#e7e5e4" strokeWidth="1" />
            <text x={P.l - 6} y={y(niceMax * f) + 4} textAnchor="end" fontSize="10" fill="#78716c">{num(niceMax * f)}</text>
          </g>
        ))}
        {[0, Math.floor((daily.length - 1) / 2), daily.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'} fontSize="10" fill="#78716c">
            {new Date(daily[i].day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </text>
        ))}
        <path d={path} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {d && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#a8a29e" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(values[hover])} r="4.5" fill={SERIES} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
      {d && (
        <div className="pointer-events-none absolute top-0 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg" style={{ left: `min(calc(${(x(hover) / W) * 100}% + 10px), calc(100% - 170px))` }}>
          <p className="text-white/60">{new Date(d.day).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
          <p><span className="font-semibold">{num(d.visitors)}</span> <span className="text-white/60">visiteurs</span></p>
          <p><span className="font-semibold">{num(d.views)}</span> <span className="text-white/60">vues produit</span></p>
          <p><span className="font-semibold">{num(d.carts)}</span> <span className="text-white/60">ajouts panier</span> · <span className="font-semibold">{num(d.purchases)}</span> <span className="text-white/60">achats</span></p>
        </div>
      )}
    </div>
  )
}

/** Activity by hour of day: 24 bars, the busiest hour labelled. */
function Hours({ hours }) {
  const [tip, setTip] = useState(null)
  const counts = Array.from({ length: 24 }, (_, h) => Number(hours.find((r) => r.hour === h)?.events || 0))
  const max = Math.max(1, ...counts)
  const peak = counts.indexOf(Math.max(...counts))
  return (
    <div className="relative">
      <div className="flex items-end gap-[2px] h-32" onPointerLeave={() => setTip(null)}>
        {counts.map((c, h) => (
          <div
            key={h}
            className="flex-1 h-full flex items-end cursor-default"
            onPointerMove={(e) => {
              const box = e.currentTarget.parentElement.getBoundingClientRect()
              const bar = e.currentTarget.getBoundingClientRect()
              setTip({ x: bar.left - box.left + bar.width / 2, y: 0, value: num(c), label: `événements · ${h} h` })
            }}
          >
            <div className="w-full rounded-t-[4px] transition-opacity hover:opacity-80" style={{ height: `${Math.max(2, (100 * c) / max)}%`, background: c ? SERIES : '#e7e5e4' }} />
          </div>
        ))}
      </div>
      <Tooltip tip={tip} />
      <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 tabular-nums">
        <span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span>
      </div>
      {counts[peak] > 0 && <p className="text-xs text-slate-500 mt-2">Pic d’activité vers <span className="font-semibold text-slate-800">{peak} h</span>.</p>}
    </div>
  )
}

function Table({ columns, rows, empty }) {
  if (!rows?.length) return <p className="text-sm text-slate-500 py-6 text-center">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-slate-400 uppercase tracking-wider">
          <tr>{columns.map((c) => <th key={c.key} className={`pb-2 font-medium ${c.right ? 'text-right' : ''}`}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {columns.map((c) => <td key={c.key} className={`py-2 ${c.right ? 'text-right tabular-nums' : ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Segments({ run }) {
  const profiles = run?.metrics?.profiles || []
  if (!profiles.length) {
    return <p className="text-sm text-slate-500 py-6 text-center">Pas encore assez de visiteurs pour segmenter (8 minimum). Lancez l’analyse quand le trafic augmente.</p>
  }
  const total = profiles.reduce((n, p) => n + p.size, 0)
  const max = Math.max(...profiles.map((p) => p.size))
  const metrics = run.metrics.metrics || {}
  return (
    <div className="space-y-4">
      {[...profiles].sort((a, b) => b.size - a.size).map((p) => (
        <div key={p.cluster} className="grid md:grid-cols-[220px_1fr] gap-3 items-start">
          <div>
            <p className="text-sm font-semibold text-slate-800">{p.label}</p>
            <p className="text-xs text-slate-500">{num(p.size)} visiteurs · {pct(p.size, total)}</p>
          </div>
          <div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(100 * p.size) / max}%`, background: SERIES }} />
            </div>
            <p className="text-xs text-slate-600 mt-1.5">{p.description}</p>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {p.centroid.sessions?.toFixed(1)} visites · {Math.round((p.centroid.cart_rate || 0) * 100)} % ajout panier/vue ·{' '}
              {Math.round((p.centroid.purchase_rate || 0) * 100)} % achat/panier · actif il y a {Math.round(p.centroid.recency_days || 0)} j
            </p>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
        K-Means · K = {metrics.k} choisi par score de silhouette ({metrics.silhouette}) · {num(metrics.subjects)} visiteurs · entraîné le{' '}
        {new Date(run.trainedAt).toLocaleString('fr-FR')}
      </p>
    </div>
  )
}

export default function Comportement() {
  const shop = currentShopSlug() || readUser().shopSlug
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    apiClient.get('/analytics/behavior/overview', { params: { shop, days } })
      .then((r) => setData(r.data))
      .catch(() => toast.error('Impossible de charger les données comportementales (analytics-service démarré ?)'))
      .finally(() => setLoading(false))
  }, [shop, days])
  useEffect(load, [load])

  const action = async (key, request, success) => {
    setBusy(key)
    try {
      await request()
      toast.success(success)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Action impossible.')
    } finally {
      setBusy('')
    }
  }

  const k = data?.kpis || {}
  const f = data?.funnel || {}
  const rec = data?.recommender
  const tiles = useMemo(() => [
    ['Visiteurs', num(k.visitors), `${num(k.sessions)} visites`],
    ['Vues produit', num(k.product_views), `${(k.sessions ? k.product_views / k.sessions : 0).toFixed(1)} par visite`],
    ['Taux d’ajout au panier', pct(f.carted, f.sessions), `${num(k.add_to_cart)} ajouts`],
    ['Taux de conversion', pct(f.bought, f.sessions), `${num(f.bought)} visites avec achat`],
    ['Abandon de panier', f.carted ? pct(f.carted - f.bought, f.carted) : '—', 'paniers non finalisés'],
    ['Clics sur recommandations', num(k.recommendation_clicks), 'moteur de recommandation'],
  ], [k, f])

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comportement & IA</h1>
          <p className="text-sm text-slate-500">Parcours des visiteurs, recherches, segments comportementaux et moteur de recommandation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1">
            {RANGES.map((r) => (
              <button key={r} onClick={() => setDays(r)} className={`px-3 py-1.5 rounded-md text-sm ${days === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{r} jours</button>
            ))}
          </div>
          <button disabled={!!busy} onClick={() => action('train', () => apiClient.post('/analytics/behavior/train', null, { params: { shop }, timeout: 300000 }), 'Modèles ré-entraînés')} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2">
            <span className={`material-symbols-outlined text-lg ${busy === 'train' ? 'animate-spin' : ''}`}>model_training</span>
            {busy === 'train' ? 'Entraînement…' : 'Ré-entraîner les modèles'}
          </button>
        </div>
      </div>

      <div className={`space-y-6 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {tiles.map(([label, value, hint]) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-semibold text-slate-800 mt-1 tabular-nums">{value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Entonnoir de conversion" subtitle="Part des visites qui atteignent chaque étape">
            <Funnel funnel={f} />
          </Card>
          <Card title="Visiteurs par jour" subtitle="Survolez la courbe pour le détail du jour">
            <DailyLine daily={data?.daily || []} />
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card title="Heures d’activité" subtitle="Événements par heure (heure de Tunis)">
            <Hours hours={data?.hours || []} />
          </Card>
          <Card title="Recherches les plus fréquentes">
            <Table
              empty="Aucune recherche sur la période."
              rows={data?.topSearches}
              columns={[
                { key: 'query', label: 'Recherche' },
                { key: 'searches', label: 'Fois', right: true, render: (r) => num(r.searches) },
                { key: 'clicks', label: 'Clic', right: true, render: (r) => pct(r.clicks, r.searches) },
              ]}
            />
          </Card>
          <Card title="Recherches sans résultat" subtitle="Ce que vos clients cherchent et ne trouvent pas">
            <Table
              empty="Toutes les recherches trouvent des produits."
              rows={data?.zeroResultSearches}
              columns={[
                { key: 'query', label: 'Recherche' },
                { key: 'searches', label: 'Fois', right: true, render: (r) => num(r.searches) },
              ]}
            />
          </Card>
        </div>

        <Card title="Produits les plus consultés" subtitle="Vues, ajouts au panier et achats sur la période">
          <Table
            empty="Aucune consultation sur la période."
            rows={data?.topProducts}
            columns={[
              { key: 'name', label: 'Produit' },
              { key: 'views', label: 'Vues', right: true, render: (r) => num(r.views) },
              { key: 'carts', label: 'Paniers', right: true, render: (r) => num(r.carts) },
              { key: 'purchases', label: 'Achats', right: true, render: (r) => num(r.purchases) },
              { key: 'rate', label: 'Vue → panier', right: true, render: (r) => pct(r.carts, r.views) },
            ]}
          />
        </Card>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <Card title="Segments comportementaux" subtitle="Visiteurs regroupés par apprentissage non supervisé (K-Means)">
            <Segments run={data?.segments} />
          </Card>
          <Card title="Moteur de recommandation" subtitle="Filtrage collaboratif (SVD) + similarité de contenu (TF-IDF)">
            {rec ? (
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <dt className="text-slate-500">Statut</dt><dd className="font-medium">{rec.status === 'OK' ? 'Entraîné' : rec.status}</dd>
                <dt className="text-slate-500">Dernier entraînement</dt><dd>{new Date(rec.trainedAt).toLocaleString('fr-FR')}</dd>
                <dt className="text-slate-500">Produits</dt><dd className="tabular-nums">{num(rec.metrics?.products)}</dd>
                <dt className="text-slate-500">Visiteurs / clients</dt><dd className="tabular-nums">{num(rec.metrics?.subjects)}</dd>
                <dt className="text-slate-500">Interactions</dt><dd className="tabular-nums">{num(rec.metrics?.interactions)}</dd>
                <dt className="text-slate-500">Densité de la matrice</dt><dd className="tabular-nums">{((rec.metrics?.density || 0) * 100).toFixed(2)} %</dd>
                <dt className="text-slate-500">Facteurs latents</dt><dd className="tabular-nums">{rec.metrics?.latent_factors}</dd>
                <dt className="text-slate-500">Paniers analysés</dt><dd className="tabular-nums">{num(rec.metrics?.baskets)}</dd>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Pas encore entraîné : cliquez sur « Ré-entraîner les modèles » (sinon l’entraînement automatique a lieu chaque nuit à 3 h 40).</p>
            )}
            <p className="text-xs text-slate-500 mt-4 border-t border-slate-100 pt-3">
              Utilisé sur la vitrine : « Vous aimerez aussi » (fiche produit), « Recommandé pour vous » (accueil, fiche produit) et « Souvent achetés ensemble » (panier).
            </p>
          </Card>
        </div>

        <details className="bg-white rounded-2xl border border-slate-200 p-5 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">Données de démonstration</summary>
          <p className="text-slate-500 mt-2">Pour présenter les fonctionnalités sur une boutique sans trafic : génère ~60 jours de visites fictives (identifiants « demo- »), supprimables à tout moment.</p>
          <div className="flex gap-2 mt-3">
            <button disabled={!!busy} onClick={() => action('demo', () => apiClient.post('/analytics/behavior/demo-data', null, { params: { shop, visitors: 200 } }), 'Données de démonstration générées — ré-entraînez les modèles')} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium disabled:opacity-50">
              Générer 200 visiteurs
            </button>
            <button disabled={!!busy} onClick={() => action('purge', () => apiClient.delete('/analytics/behavior/demo-data', { params: { shop } }), 'Données de démonstration supprimées')} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium disabled:opacity-50">
              Supprimer les données de démo
            </button>
          </div>
        </details>
      </div>
    </div>
  )
}
