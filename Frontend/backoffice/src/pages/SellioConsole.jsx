import { useEffect, useMemo, useState } from 'react'
import { readUser } from '../lib/sellio'
import { layoutOf } from '../data/storeTemplates'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
const STOREFRONT = 'http://localhost:3001'

const ROLE_LABELS = { SUPER_ADMIN: 'Plateforme', ADMIN: 'Marchand', CLIENT: 'Client' }
const STATUS_LABELS = {
  EN_ATTENTE: 'En attente', CONFIRMEE: 'Confirmée', EN_PREPARATION: 'En préparation', EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée', ANNULEE: 'Annulée', REMBOURSEE: 'Remboursée',
}
const TEMPLATE_LABELS = { minimal: 'Minimal', bold: 'Bold', luxury: 'Luxury' }

function authFetch(path) {
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` } })
    .then((r) => {
      if (r.status === 401 || r.status === 403) throw new Error('forbidden')
      return r.json()
    })
}

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
const date = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const dateTime = (v) => (v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

function Kpi({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between text-slate-400">
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-semibold mt-3 tabular-nums">{value}</p>
    </div>
  )
}

function ShopAvatar({ shop, size = 'w-10 h-10' }) {
  if (shop.logo) return <img src={shop.logo} alt="" className={`${size} rounded-lg object-contain bg-white border border-slate-200 p-1`} />
  return (
    <span className={`${size} rounded-lg flex items-center justify-center text-white font-semibold`} style={{ background: shop.primaryColor || '#0e1116' }}>
      {(shop.name || '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}

function ShopDrawer({ shopId, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    setError('')
    authFetch(`/admin/platform/shops/${shopId}`).then(setData).catch(() => setError('Impossible de charger la boutique.'))
  }, [shopId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const shop = data?.shop
  const owner = data?.owner

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative w-full max-w-2xl h-full bg-[#f6f4f0] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {shop && <ShopAvatar shop={shop} />}
            <div className="min-w-0">
              <p className="font-semibold truncate">{shop?.name || 'Chargement…'}</p>
              {shop && <p className="text-xs text-slate-500">/{shop.slug} · créée le {date(shop.createdAt)}</p>}
            </div>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-slate-900">close</button>
        </div>

        {error && <p className="p-6 text-red-600">{error}</p>}
        {shop && (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <a href={`${STOREFRONT}/${shop.slug}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium">Voir la vitrine ↗</a>
              <a href={`/${shop.slug}/dashboard`} className="px-4 py-2 rounded-full border border-slate-300 bg-white text-sm font-medium">Ouvrir le backoffice</a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Chiffre d’affaires', money(shop.revenue)],
                ['Commandes', shop.orderCount],
                ['Clients', shop.clientCount],
                ['Produits', `${data.activeProducts}/${shop.productCount}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-lg font-semibold mt-1 tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold mb-4">Configuration</h3>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-slate-500">Activité</dt><dd>{shop.businessType === 'CLOTHES' ? 'Vêtements' : 'Cosmétiques'}</dd>
                <dt className="text-slate-500">Modèle</dt><dd>{TEMPLATE_LABELS[layoutOf(shop.templateKey)]}</dd>
                <dt className="text-slate-500">Produits en rupture</dt><dd>{data.outOfStock}</dd>
                <dt className="text-slate-500">Dernière commande</dt><dd>{dateTime(shop.lastOrderAt)}</dd>
                <dt className="text-slate-500">Palette</dt>
                <dd className="flex gap-1.5">
                  {[shop.primaryColor, shop.accentColor, shop.backgroundColor].filter(Boolean).map((c) => (
                    <span key={c} title={c} className="w-6 h-6 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                  {!shop.primaryColor && !shop.accentColor && !shop.backgroundColor && <span className="text-slate-400">Couleurs du modèle</span>}
                </dd>
              </dl>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold mb-4">Propriétaire</h3>
              {owner ? (
                <dl className="grid grid-cols-2 gap-y-3 text-sm">
                  <dt className="text-slate-500">Nom</dt><dd>{owner.firstName} {owner.lastName}</dd>
                  <dt className="text-slate-500">E-mail</dt><dd className="break-all"><a className="underline" href={`mailto:${owner.email}`}>{owner.email}</a></dd>
                  <dt className="text-slate-500">Téléphone</dt><dd>{owner.phone || '—'}</dd>
                  <dt className="text-slate-500">Ville</dt><dd>{[owner.city, owner.gouvernorat].filter(Boolean).join(', ') || '—'}</dd>
                  <dt className="text-slate-500">Statut</dt><dd><Pill tone={owner.status === 'ACTIVE' ? 'green' : 'red'}>{owner.status}</Pill></dd>
                  <dt className="text-slate-500">Inscrit le</dt><dd>{date(owner.createdAt)}</dd>
                  <dt className="text-slate-500">Dernière connexion</dt><dd>{dateTime(owner.lastLogin)}</dd>
                </dl>
              ) : (
                <p className="text-sm text-slate-500">Boutique de démonstration sans propriétaire.</p>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold mb-4">Commandes</h3>
              {data.ordersByStatus.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.ordersByStatus.map((row) => (
                    <Pill key={row.status} tone={row.status === 'LIVREE' ? 'green' : row.status === 'ANNULEE' || row.status === 'REMBOURSEE' ? 'red' : 'amber'}>
                      {STATUS_LABELS[row.status] || row.status} · {row.count}
                    </Pill>
                  ))}
                </div>
              )}
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune commande pour le moment.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 text-xs">
                    <tr><th className="py-2">Référence</th><th>Client</th><th>Date</th><th className="text-right">Total</th></tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-100">
                        <td className="py-2 font-mono text-xs">{o.reference}</td>
                        <td>{o.firstName} {o.lastName}</td>
                        <td className="text-slate-500">{date(o.createdAt)}</td>
                        <td className="text-right tabular-nums">{money(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold mb-4">Clients ({data.clients.length})</h3>
              {data.clients.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun client inscrit.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.clients.map((c) => (
                    <li key={c.id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {c.segmentLabel && <Pill tone="violet">{c.segmentLabel}</Pill>}
                        <p className="text-[11px] text-slate-400 mt-0.5">depuis {date(c.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  )
}

export default function SellioConsole() {
  const user = readUser()
  const [stats, setStats] = useState(null)
  const [shops, setShops] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState('shops')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [openShop, setOpenShop] = useState(null)

  useEffect(() => {
    if (user.roleName !== 'SUPER_ADMIN') {
      window.location.replace('/login')
      return
    }
    Promise.all([authFetch('/admin/platform/stats'), authFetch('/admin/platform/shops'), authFetch('/admin/platform/users')])
      .then(([s, shopData, userData]) => {
        setStats(s)
        setShops(Array.isArray(shopData) ? shopData : [])
        setUsers(Array.isArray(userData) ? userData : [])
      })
      .catch(() => setError('Impossible de charger la plateforme. Vérifiez que auth-service est à jour et démarré.'))
  }, [user.roleName])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.replace('/login')
  }

  const q = query.trim().toLowerCase()
  const visibleShops = useMemo(() => shops.filter((s) =>
    (typeFilter === 'ALL' || s.businessType === typeFilter)
    && (!q || [s.name, s.slug, s.ownerEmail, s.ownerName].some((v) => String(v || '').toLowerCase().includes(q)))
  ), [shops, typeFilter, q])

  const visibleUsers = useMemo(() => users.filter((u) =>
    (roleFilter === 'ALL' || u.roleName === roleFilter)
    && (!q || [u.firstName, u.lastName, u.email, u.shopName, u.phone].some((v) => String(v || '').toLowerCase().includes(q)))
  ), [users, roleFilter, q])

  const select = 'px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm'

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-slate-900">
      <header className="bg-[#0e1116] text-white px-6 md:px-10 py-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Sellio</p>
          <h1 className="text-2xl font-semibold">Console plateforme</h1>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden sm:block text-sm text-white/60">{user.email}</span>
          <button onClick={logout} className="text-sm text-white/70 hover:text-white">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {error && <p className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">{error}</p>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Kpi label="Boutiques" value={stats.shops} icon="storefront" />
            <Kpi label="Ce mois-ci" value={`+${stats.shopsThisMonth}`} icon="trending_up" />
            <Kpi label="Marchands" value={stats.merchants} icon="badge" />
            <Kpi label="Clients" value={stats.clients} icon="group" />
            <Kpi label="Commandes" value={stats.orders} icon="receipt_long" />
            <Kpi label="Volume d’affaires" value={money(stats.revenue)} icon="payments" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex bg-white rounded-full border border-slate-200 p-1">
            {[['shops', `Boutiques (${shops.length})`], ['users', `Utilisateurs (${users.length})`]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-full text-sm font-medium ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3">
              <span className="material-symbols-outlined text-lg text-slate-400">search</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="py-2 text-sm outline-none bg-transparent w-56" />
            </div>
            {tab === 'shops' ? (
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={select}>
                <option value="ALL">Toutes activités</option>
                <option value="CLOTHES">Vêtements</option>
                <option value="COSMETICS">Cosmétiques</option>
              </select>
            ) : (
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={select}>
                <option value="ALL">Tous les rôles</option>
                <option value="ADMIN">Marchands</option>
                <option value="CLIENT">Clients</option>
                <option value="SUPER_ADMIN">Plateforme</option>
              </select>
            )}
          </div>
        </div>

        {tab === 'shops' ? (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Boutique</th>
                  <th className="px-5 py-3">Propriétaire</th>
                  <th className="px-5 py-3">Activité</th>
                  <th className="px-5 py-3 text-right">Produits</th>
                  <th className="px-5 py-3 text-right">Clients</th>
                  <th className="px-5 py-3 text-right">Commandes</th>
                  <th className="px-5 py-3 text-right">CA</th>
                  <th className="px-5 py-3">Créée</th>
                </tr>
              </thead>
              <tbody>
                {visibleShops.map((shop) => (
                  <tr key={shop.id} onClick={() => setOpenShop(shop.id)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ShopAvatar shop={shop} size="w-9 h-9" />
                        <div>
                          <p className="font-medium">{shop.name}</p>
                          <p className="text-xs text-slate-400">/{shop.slug} · {TEMPLATE_LABELS[layoutOf(shop.templateKey)]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p>{shop.ownerName || '—'}</p>
                      <p className="text-xs text-slate-400">{shop.ownerEmail || 'Démo'}</p>
                    </td>
                    <td className="px-5 py-3"><Pill tone={shop.businessType === 'CLOTHES' ? 'violet' : 'green'}>{shop.businessType === 'CLOTHES' ? 'Vêtements' : 'Cosmétiques'}</Pill></td>
                    <td className="px-5 py-3 text-right tabular-nums">{shop.productCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{shop.clientCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{shop.orderCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">{money(shop.revenue)}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{date(shop.createdAt)}</td>
                  </tr>
                ))}
                {visibleShops.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Aucune boutique.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Rôle</th>
                  <th className="px-5 py-3">Boutique</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Inscription</th>
                  <th className="px-5 py-3">Dernière connexion</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">{row.firstName} {row.lastName}</td>
                    <td className="px-5 py-3">
                      <p>{row.email}</p>
                      {row.phone && <p className="text-xs text-slate-400">{row.phone}</p>}
                    </td>
                    <td className="px-5 py-3"><Pill tone={row.roleName === 'ADMIN' ? 'violet' : row.roleName === 'SUPER_ADMIN' ? 'amber' : 'slate'}>{ROLE_LABELS[row.roleName] || row.roleName}</Pill></td>
                    <td className="px-5 py-3">
                      {row.shopId ? (
                        <button onClick={() => setOpenShop(row.shopId)} className="underline">{row.shopName}</button>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3"><Pill tone={row.status === 'ACTIVE' ? 'green' : 'red'}>{row.status}</Pill></td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{date(row.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{dateTime(row.lastLogin)}</td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Aucun utilisateur.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {openShop && <ShopDrawer shopId={openShop} onClose={() => setOpenShop(null)} />}
    </div>
  )
}
