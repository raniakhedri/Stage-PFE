import { useCallback, useEffect, useMemo, useState } from 'react'
import { isPlatform, readUser } from '../lib/sellio'
import { TEMPLATE_LABELS, layoutOf } from '../data/storeTemplates'
import { SECTORS, sectorLabel } from '../data/sectors'
import { useSellioTheme, ThemeToggle } from '../lib/sellioTheme'
import { SellioLogo, DISPLAY, MONO } from '../components/sellio/brand'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
const STOREFRONT = 'http://localhost:3001'
const PAGE_SIZE = 10

const ROLE_LABELS = { SUPER_ADMIN: 'Super admin', SELLIO_ADMIN: 'Admin Sellio', ADMIN: 'Marchand' }
const ROLE_TONES = { SUPER_ADMIN: 'amber', SELLIO_ADMIN: 'green', ADMIN: 'violet' }
const ORDER_STATUS = {
  EN_ATTENTE: 'En attente', CONFIRMEE: 'Confirmée', EN_PREPARATION: 'En préparation', EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée', ANNULEE: 'Annulée', REMBOURSEE: 'Remboursée',
}
const SHOP_STATUS = {
  ACTIVE: ['Active', 'green'], PENDING: ['En vérification', 'amber'], REJECTED: ['Refusée', 'red'], SUSPENDED: ['Suspendue', 'red'],
}
const VERIF_STATUS = { PENDING: ['À examiner', 'amber'], APPROVED: ['Validé', 'green'], REJECTED: ['Refusé', 'red'] }

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`, ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => null)
  if (res.status === 401 || res.status === 403) throw new Error('forbidden')
  if (!res.ok) throw new Error(data?.error || data?.message || 'Action impossible.')
  return data
}

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
const date = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const dateTime = (v) => (v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

function Pill({ children, tone = 'slate', dark }) {
  const tones = dark
    ? { slate: 'bg-white/[0.07] text-white/70', green: 'bg-emerald-500/15 text-emerald-300', red: 'bg-red-500/15 text-red-300', violet: 'bg-violet-500/15 text-violet-300', amber: 'bg-amber-500/15 text-amber-300' }
    : { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700' }
  return <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>
}

function ShopAvatar({ shop, size = 'w-10 h-10' }) {
  if (shop.logo) return <img src={shop.logo} alt="" className={`${size} rounded-lg object-contain bg-white p-1`} />
  return (
    <span className={`${size} rounded-lg flex items-center justify-center text-white font-semibold shrink-0`} style={{ background: shop.primaryColor || '#4c1d95' }}>
      {(shop.name || '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

function usePaged(items, deps) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  // Back to page 1 whenever the search or filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), deps)
  const current = Math.min(page, pages)
  return { page: current, pages, setPage, slice: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), total: items.length }
}

function Pagination({ paged, theme }) {
  const { page, pages, setPage, total } = paged
  if (total === 0) return null
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
  const btn = `min-w-[34px] h-[34px] px-2 rounded-lg text-sm transition-colors disabled:opacity-30`
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t ${theme.t.divider}`}>
      <p className={`text-xs ${theme.t.muted}`}>
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}
      </p>
      <div className="flex items-center gap-1">
        <button className={`${btn} ${theme.t.hover}`} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Page précédente">‹</button>
        {numbers.map((n, i) => (
          <span key={n} className="flex items-center">
            {i > 0 && n - numbers[i - 1] > 1 && <span className={`px-1 ${theme.t.faint}`}>…</span>}
            <button className={`${btn} ${n === page ? 'bg-violet-500 text-white' : theme.t.hover}`} onClick={() => setPage(n)}>{n}</button>
          </span>
        ))}
        <button className={`${btn} ${theme.t.hover}`} disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Page suivante">›</button>
      </div>
    </div>
  )
}

function Drawer({ theme, onClose, title, subtitle, avatar, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className={`absolute inset-0 ${theme.t.overlay}`} onClick={onClose} />
      <aside className={`relative w-full max-w-2xl h-full overflow-y-auto shadow-2xl ${theme.t.drawer} ${theme.t.page}`}>
        <div className={`sticky top-0 z-10 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between ${theme.t.header}`}>
          <div className="flex items-center gap-3 min-w-0">
            {avatar}
            <div className="min-w-0">
              <p className="font-semibold truncate">{title}</p>
              {subtitle && <p className={`text-xs ${theme.t.muted}`}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className={`material-symbols-outlined ${theme.t.muted}`}>close</button>
        </div>
        <div className="p-6 space-y-6">{children}</div>
      </aside>
    </div>
  )
}

function Section({ theme, title, children, right }) {
  return (
    <section className={`rounded-2xl p-5 ${theme.t.card}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children, theme }) {
  return (
    <>
      <dt className={theme.t.muted}>{label}</dt>
      <dd className="break-words">{children}</dd>
    </>
  )
}

/**
 * Deleting a merchant removes their shop and everything in it, so the name has to be typed to confirm.
 * For a platform account the e-mail is typed instead.
 */
function DeleteAccountDialog({ account, shopName, theme, onClose, onDeleted, notify }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const merchant = account.roleName === 'ADMIN'
  const expected = merchant && shopName ? shopName : account.email
  const remove = async () => {
    setBusy(true)
    try {
      const res = await api(`/admin/platform/users/${account.id}`, { method: 'DELETE' })
      notify(res?.shop ? `Marchand supprimé avec « ${res.shop} » et ses ${res.clients ?? 0} client(s).` : 'Compte supprimé.')
      onDeleted()
    } catch (err) {
      notify(err.message === 'forbidden' ? 'Action réservée au super administrateur.' : err.message, true)
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${theme.t.overlay}`} onClick={busy ? undefined : onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${theme.t.page}`}>
       <div className={`rounded-2xl p-6 ${theme.t.card}`}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400">warning</span>
          <h3 className="font-semibold text-lg">{merchant ? 'Supprimer le marchand' : 'Supprimer le compte'}</h3>
        </div>
        <p className={`mt-3 text-sm ${theme.t.muted}`}>
          {merchant && shopName ? (
            <>Le compte de <b>{account.firstName} {account.lastName}</b> et la boutique <b>{shopName}</b> seront supprimés définitivement, avec ses clients, son équipe, ses produits, ses commandes et ses statistiques.</>
          ) : merchant ? (
            <>Le compte marchand <b>{account.email}</b> (sans boutique) sera supprimé définitivement.</>
          ) : (
            <>Le compte Sellio <b>{account.email}</b> sera supprimé définitivement.</>
          )}
        </p>
        <label className={`block mt-5 text-xs ${theme.t.muted}`}>
          Tapez <b className="select-all" style={MONO}>{expected}</b> pour confirmer
        </label>
        <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} className={`mt-2 w-full rounded-lg px-3 py-2.5 text-sm outline-none ${theme.t.input}`} />
        <div className="mt-5 flex justify-end gap-2">
          <button disabled={busy} onClick={onClose} className={`px-4 py-2 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Annuler</button>
          <button
            disabled={busy || typed.trim() !== expected}
            onClick={remove}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-400 disabled:opacity-40"
          >
            {busy ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
       </div>
      </div>
    </div>
  )
}

/** Super admin: adds a Sellio admin, who receives a one-time password by e-mail. */
function AddAdminDialog({ theme, onClose, onCreated, notify }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'SELLIO_ADMIN' })
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api('/admin/platform/users', { method: 'POST', body: JSON.stringify(form) })
      notify(`Compte créé : un mot de passe temporaire a été envoyé à ${form.email}.`)
      onCreated()
    } catch (err) {
      notify(err.message, true)
      setBusy(false)
    }
  }
  const input = `w-full rounded-lg px-3 py-2.5 text-sm outline-none ${theme.t.input}`
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${theme.t.overlay}`} onClick={onClose} />
      <form onSubmit={submit} className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${theme.t.page}`}>
       <div className={`rounded-2xl p-6 space-y-4 ${theme.t.card}`}>
        <h3 className="font-semibold text-lg">Ajouter un administrateur Sellio</h3>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Prénom" value={form.firstName} onChange={set('firstName')} className={input} />
          <input placeholder="Nom" value={form.lastName} onChange={set('lastName')} className={input} />
        </div>
        <input required type="email" placeholder="E-mail" value={form.email} onChange={set('email')} className={input} />
        <select value={form.role} onChange={set('role')} className={input}>
          <option value="SELLIO_ADMIN">Admin Sellio — boutiques, vérifications, marchands</option>
          <option value="SUPER_ADMIN">Super admin — gère aussi les admins et les rôles</option>
        </select>
        <p className={`text-xs ${theme.t.faint}`}>Les comptes Sellio n’ont jamais accès aux clients des boutiques.</p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Annuler</button>
          <button disabled={busy} className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${theme.t.primaryBtn}`}>{busy ? 'Création…' : 'Créer le compte'}</button>
        </div>
       </div>
      </form>
    </div>
  )
}

function ShopDrawer({ shopId, theme, onClose, onChanged, notify }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dark = theme.dark

  const load = useCallback(() => {
    api(`/admin/platform/shops/${shopId}`).then(setData).catch(() => setError('Impossible de charger la boutique.'))
  }, [shopId])
  useEffect(load, [load])

  const shop = data?.shop
  const owner = data?.owner
  const suspended = shop?.status === 'SUSPENDED'

  const toggleSuspend = async () => {
    const next = suspended ? 'ACTIVE' : 'SUSPENDED'
    if (next === 'SUSPENDED' && !window.confirm(`Suspendre « ${shop.name} » ? Le marchand sera bloqué et la vitrine fermée.`)) return
    setBusy(true)
    try {
      await api(`/admin/platform/shops/${shopId}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) })
      notify(next === 'SUSPENDED' ? 'Boutique suspendue, marchand bloqué.' : 'Boutique réactivée.')
      load()
      onChanged()
    } catch (err) {
      notify(err.message, true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      theme={theme}
      onClose={onClose}
      title={shop?.name || 'Chargement…'}
      subtitle={shop && `/${shop.slug} · créée le ${date(shop.createdAt)}`}
      avatar={shop && <ShopAvatar shop={shop} />}
    >
      {error && <p className="text-red-400">{error}</p>}
      {shop && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`${STOREFRONT}/${shop.slug}`} target="_blank" rel="noreferrer" className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.t.primaryBtn}`}>Voir la vitrine ↗</a>
            {shop.ownerId && ['ACTIVE', 'SUSPENDED'].includes(shop.status) && (
              <button
                disabled={busy}
                onClick={toggleSuspend}
                className={`ml-auto px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${suspended ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-red-500/90 text-white hover:bg-red-500'}`}
              >
                {suspended ? 'Réactiver la boutique' : 'Bloquer le marchand'}
              </button>
            )}
            {owner && (
              <button
                onClick={() => setDeleting(true)}
                className={`${shop.ownerId && ['ACTIVE', 'SUSPENDED'].includes(shop.status) ? '' : 'ml-auto '}px-4 py-2 rounded-lg text-sm font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10`}
              >
                Supprimer le marchand
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Chiffre d’affaires', money(shop.revenue)],
              ['Commandes', shop.orderCount],
              ['Clients', shop.clientCount],
              ['Produits', `${data.activeProducts}/${shop.productCount}`],
            ].map(([label, value]) => (
              <div key={label} className={`rounded-xl p-4 ${theme.t.card}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme.t.faint}`}>{label}</p>
                <p className="text-lg font-semibold mt-1 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <Section theme={theme} title="Configuration">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Row theme={theme} label="Statut"><Pill dark={dark} tone={SHOP_STATUS[shop.status]?.[1]}>{SHOP_STATUS[shop.status]?.[0] || shop.status}</Pill></Row>
              <Row theme={theme} label="Activité">{sectorLabel(shop.businessType)}</Row>
              <Row theme={theme} label="Modèle">{TEMPLATE_LABELS[layoutOf(shop.templateKey)]}</Row>
              <Row theme={theme} label="Produits en rupture">{data.outOfStock}</Row>
              <Row theme={theme} label="Dernière commande">{dateTime(shop.lastOrderAt)}</Row>
            </dl>
          </Section>

          <Section theme={theme} title="Propriétaire">
            {owner ? (
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <Row theme={theme} label="Nom">{owner.firstName} {owner.lastName}</Row>
                <Row theme={theme} label="E-mail"><a className="underline" href={`mailto:${owner.email}`}>{owner.email}</a></Row>
                <Row theme={theme} label="Téléphone">{owner.phone || '—'}</Row>
                <Row theme={theme} label="Compte"><Pill dark={dark} tone={owner.status === 'ACTIVE' ? 'green' : 'red'}>{owner.status === 'BLOCKED' ? 'Bloqué' : owner.status === 'ACTIVE' ? 'Actif' : owner.status}</Pill></Row>
                <Row theme={theme} label="Inscrit le">{date(owner.createdAt)}</Row>
                <Row theme={theme} label="Dernière connexion">{dateTime(owner.lastLogin)}</Row>
              </dl>
            ) : (
              <p className={`text-sm ${theme.t.muted}`}>Boutique de démonstration sans propriétaire.</p>
            )}
          </Section>

          <Section theme={theme} title="Commandes">
            {data.ordersByStatus.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {data.ordersByStatus.map((row) => (
                  <Pill dark={dark} key={row.status} tone={row.status === 'LIVREE' ? 'green' : ['ANNULEE', 'REMBOURSEE'].includes(row.status) ? 'red' : 'amber'}>
                    {ORDER_STATUS[row.status] || row.status} · {row.count}
                  </Pill>
                ))}
              </div>
            )}
            {data.recentOrders.length === 0 ? (
              <p className={`text-sm ${theme.t.muted}`}>Aucune commande pour le moment.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className={`text-left text-xs ${theme.t.tableHead}`}>
                  <tr><th className="py-2">Référence</th><th>Statut</th><th>Date</th><th className="text-right">Total</th></tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className={`border-t ${theme.t.divider}`}>
                      <td className="py-2 text-xs" style={MONO}>{o.reference}</td>
                      <td className={theme.t.muted}>{ORDER_STATUS[o.status] || o.status}</td>
                      <td className={theme.t.muted}>{date(o.createdAt)}</td>
                      <td className="text-right tabular-nums">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <p className={`text-xs ${theme.t.faint}`}>Les clients d’une boutique appartiennent au marchand : l’équipe Sellio ne voit que leur nombre.</p>
        </>
      )}
      {deleting && owner && (
        <DeleteAccountDialog
          account={owner}
          shopName={shop.name}
          theme={theme}
          notify={notify}
          onClose={() => setDeleting(false)}
          onDeleted={() => { onChanged(); onClose() }}
        />
      )}
    </Drawer>
  )
}

function VerificationDrawer({ id, theme, onClose, onChanged, notify }) {
  const [data, setData] = useState(null)
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(null)
  const dark = theme.dark

  useEffect(() => {
    api(`/admin/platform/verifications/${id}`).then(setData).catch(() => notify('Impossible de charger le dossier.', true))
  }, [id, notify])

  const decide = async (approve) => {
    setBusy(true)
    try {
      await api(`/admin/platform/verifications/${id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        body: JSON.stringify(approve ? {} : { reason }),
      })
      notify(approve ? 'Boutique validée : le marchand a accès à son backoffice.' : 'Dossier refusé : le marchand peut renvoyer ses documents.')
      onChanged()
      onClose()
    } catch (err) {
      notify(err.message, true)
    } finally {
      setBusy(false)
    }
  }

  const images = data ? [
    [data.documentType === 'CIN' ? 'CIN — recto' : 'Passeport', data.documentFront],
    ...(data.documentBack ? [['CIN — verso', data.documentBack]] : []),
    ['Selfie', data.selfie],
  ] : []

  return (
    <Drawer theme={theme} onClose={onClose} title={data ? `Dossier · ${data.shopName}` : 'Chargement…'} subtitle={data && `Envoyé le ${dateTime(data.submittedAt)}`}>
      {data && (
        <>
          <div className="flex items-center gap-3">
            <Pill dark={dark} tone={VERIF_STATUS[data.status]?.[1]}>{VERIF_STATUS[data.status]?.[0]}</Pill>
            {data.reviewedAt && <span className={`text-xs ${theme.t.muted}`}>Traité le {dateTime(data.reviewedAt)} par {data.reviewedBy}</span>}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {images.map(([label, src]) => (
              <button key={label} type="button" onClick={() => setZoom(src)} className={`group rounded-xl overflow-hidden text-left ${theme.t.card}`}>
                <div className="aspect-[4/3] bg-black/40 overflow-hidden">
                  <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="px-3 py-2 text-xs font-medium flex items-center justify-between">{label}<span className="material-symbols-outlined text-sm opacity-60">zoom_in</span></p>
              </button>
            ))}
          </div>

          <Section theme={theme} title="Identité">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Row theme={theme} label="Marchand">{data.ownerName}</Row>
              <Row theme={theme} label="E-mail">{data.ownerEmail}</Row>
              <Row theme={theme} label="Pièce">{data.documentType === 'CIN' ? 'CIN' : 'Passeport'}</Row>
              <Row theme={theme} label="Numéro"><span style={MONO}>{data.documentNumber}</span></Row>
            </dl>
          </Section>

          <Section theme={theme} title="Carte bancaire">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Row theme={theme} label="Titulaire">{data.cardholderName}</Row>
              <Row theme={theme} label="Carte"><span style={MONO}>{(data.cardBrand || '').toUpperCase()} •••• {data.cardLast4}</span></Row>
              <Row theme={theme} label="Expiration">{String(data.cardExpMonth).padStart(2, '0')}/{data.cardExpYear}</Row>
              <Row theme={theme} label="Référence Stripe"><span className="text-xs" style={MONO}>{data.stripePaymentMethodId}</span></Row>
            </dl>
            <p className={`text-xs mt-4 ${theme.t.faint}`}>Vérifiez que le nom du titulaire correspond à la pièce d’identité.</p>
          </Section>

          <Section theme={theme} title="Boutique">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <Row theme={theme} label="Nom">{data.shopName}</Row>
              <Row theme={theme} label="Lien">/{data.shopSlug}</Row>
              <Row theme={theme} label="Activité">{sectorLabel(data.businessType)}</Row>
            </dl>
          </Section>

          {data.rejectionReason && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">Motif du refus : {data.rejectionReason}</p>
          )}

          {data.status === 'PENDING' && (
            <div className={`sticky bottom-0 -mx-6 px-6 py-4 border-t backdrop-blur-xl ${theme.t.header}`}>
              {rejecting ? (
                <div className="space-y-3">
                  <textarea
                    autoFocus
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motif affiché au marchand (ex. : selfie flou, nom différent de la carte…)"
                    className={`w-full rounded-xl px-4 py-3 text-sm outline-none resize-none ${theme.t.input}`}
                  />
                  <div className="flex gap-2">
                    <button disabled={busy || !reason.trim()} onClick={() => decide(false)} className="px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-40">Confirmer le refus</button>
                    <button onClick={() => setRejecting(false)} className={`px-4 py-2.5 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => decide(true)} className="flex-1 px-5 py-3 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50">Valider la boutique</button>
                  <button disabled={busy} onClick={() => setRejecting(true)} className={`px-5 py-3 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Refuser…</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {zoom && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </Drawer>
  )
}

export default function SellioConsole() {
  const user = readUser()
  const theme = useSellioTheme()
  const { t, dark } = theme
  const [stats, setStats] = useState(null)
  const [shops, setShops] = useState([])
  const [users, setUsers] = useState([])
  const [verifications, setVerifications] = useState([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [tab, setTab] = useState('shops')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [verifFilter, setVerifFilter] = useState('PENDING')
  const [openShop, setOpenShop] = useState(null)
  const [openVerif, setOpenVerif] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(null)
  const [addingAdmin, setAddingAdmin] = useState(false)
  const superAdmin = user.roleName === 'SUPER_ADMIN'

  const notify = useCallback((message, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const load = useCallback(() => {
    Promise.all([
      api('/admin/platform/stats'),
      api('/admin/platform/shops'),
      api('/admin/platform/users'),
      api('/admin/platform/verifications'),
    ])
      .then(([s, shopData, userData, verifData]) => {
        setStats(s)
        setShops(Array.isArray(shopData) ? shopData : [])
        setUsers(Array.isArray(userData) ? userData : [])
        setVerifications(Array.isArray(verifData) ? verifData : [])
      })
      .catch(() => setError('Impossible de charger la plateforme. Vérifiez que auth-service est à jour et démarré.'))
  }, [])

  useEffect(() => {
    if (!isPlatform(user)) {
      window.location.replace('/login')
      return
    }
    load()
  }, [user.roleName, load])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.replace('/')
  }

  const toggleUser = async (row) => {
    const blocking = row.status !== 'BLOCKED'
    if (blocking && !window.confirm(`Bloquer ${row.firstName} ${row.lastName} ? Il ne pourra plus se connecter.`)) return
    try {
      await api(`/admin/platform/users/${row.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: blocking ? 'BLOCKED' : 'ACTIVE' }) })
      notify(blocking ? 'Compte bloqué.' : 'Compte débloqué.')
      load()
    } catch (err) {
      notify(err.message, true)
    }
  }

  const changeRole = async (row, role) => {
    if (role === row.roleName) return
    if (!window.confirm(`Donner le rôle « ${ROLE_LABELS[role]} » à ${row.firstName} ${row.lastName} ?`)) return
    try {
      await api(`/admin/platform/users/${row.id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
      notify('Rôle modifié. Il s’applique à la prochaine connexion.')
      load()
    } catch (err) {
      notify(err.message === 'forbidden' ? 'Action réservée au super administrateur.' : err.message, true)
    }
  }

  const q = query.trim().toLowerCase()
  const visibleShops = useMemo(() => shops.filter((s) =>
    (typeFilter === 'ALL' || s.businessType === typeFilter)
    && (statusFilter === 'ALL' || s.status === statusFilter)
    && (!q || [s.name, s.slug, s.ownerEmail, s.ownerName].some((v) => String(v || '').toLowerCase().includes(q)))
  ), [shops, typeFilter, statusFilter, q])

  const visibleUsers = useMemo(() => users.filter((u) =>
    (roleFilter === 'ALL' || u.roleName === roleFilter)
    && (!q || [u.firstName, u.lastName, u.email, u.shopName, u.phone].some((v) => String(v || '').toLowerCase().includes(q)))
  ), [users, roleFilter, q])

  const visibleVerifs = useMemo(() => verifications.filter((v) =>
    (verifFilter === 'ALL' || v.status === verifFilter)
    && (!q || [v.shopName, v.ownerName, v.ownerEmail, v.documentNumber].some((x) => String(x || '').toLowerCase().includes(q)))
  ), [verifications, verifFilter, q])

  const shopPage = usePaged(visibleShops, [q, typeFilter, statusFilter])
  const userPage = usePaged(visibleUsers, [q, roleFilter])
  const verifPage = usePaged(visibleVerifs, [q, verifFilter])
  const pending = verifications.filter((v) => v.status === 'PENDING').length

  const select = `px-3 py-2 rounded-lg text-sm outline-none ${t.input}`
  const th = 'px-5 py-3 font-medium'
  const table = `overflow-hidden rounded-2xl ${t.card}`

  return (
    <div className={`min-h-screen ${t.page}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${t.header}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SellioLogo to="/" light={!dark} />
            <span className={`hidden sm:inline text-xs px-2 py-1 rounded-md ${t.chip}`} style={MONO}>console</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden md:block text-sm ${t.muted}`}>{user.email}</span>
            <ThemeToggle theme={theme} />
            <button onClick={logout} className={`px-3 py-2 rounded-lg text-sm ${t.secondaryBtn}`}>Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-400" style={MONO}>// Plateforme</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight" style={DISPLAY}>Vue d’ensemble</h1>
        </div>

        {error && <p className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</p>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {[
              ['Boutiques', stats.shops, 'storefront'],
              ['À vérifier', stats.pendingVerifications ?? pending, 'pending_actions', (stats.pendingVerifications ?? pending) > 0],
              ['Suspendues', stats.suspendedShops ?? 0, 'block'],
              ['Marchands', stats.merchants, 'badge'],
              ['Clients', stats.clients, 'group'],
              ['Commandes', stats.orders, 'receipt_long'],
              ['Volume', money(stats.revenue), 'payments'],
            ].map(([label, value, icon, highlight]) => (
              <div key={label} className={`rounded-2xl p-4 ${highlight ? 'border border-amber-500/40 bg-amber-500/10' : t.card}`}>
                <div className={`flex items-center justify-between ${t.faint}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
                <p className="text-xl font-semibold mt-2 tabular-nums" style={DISPLAY}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className={`inline-flex rounded-xl p-1 ${t.card}`}>
            {[
              ['shops', `Boutiques (${shops.length})`],
              ['verifications', 'Vérifications', pending],
              ['users', `Comptes (${users.length})`],
            ].map(([id, label, badge]) => (
              <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${tab === id ? (dark ? 'bg-white text-black' : 'bg-slate-900 text-white') : t.muted}`}>
                {label}
                {badge > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[11px] font-bold flex items-center justify-center">{badge}</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`flex items-center gap-2 rounded-lg px-3 ${t.input}`}>
              <span className={`material-symbols-outlined text-lg ${t.faint}`}>search</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="py-2 text-sm outline-none bg-transparent w-52" />
            </div>
            {tab === 'shops' && (
              <>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={select}>
                  <option value="ALL">Tous statuts</option>
                  {Object.entries(SHOP_STATUS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={select}>
                  <option value="ALL">Toutes activités</option>
                  {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.short}</option>)}
                </select>
              </>
            )}
            {tab === 'users' && (
              <>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={select}>
                  <option value="ALL">Tous les rôles</option>
                  <option value="ADMIN">Marchands</option>
                  <option value="SELLIO_ADMIN">Admins Sellio</option>
                  <option value="SUPER_ADMIN">Super admins</option>
                </select>
                {superAdmin && (
                  <button onClick={() => setAddingAdmin(true)} className={`px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${t.primaryBtn}`}>
                    <span className="material-symbols-outlined text-lg">person_add</span> Ajouter un admin
                  </button>
                )}
              </>
            )}
            {tab === 'verifications' && (
              <select value={verifFilter} onChange={(e) => setVerifFilter(e.target.value)} className={select}>
                <option value="PENDING">À examiner</option>
                <option value="APPROVED">Validés</option>
                <option value="REJECTED">Refusés</option>
                <option value="ALL">Tous</option>
              </select>
            )}
          </div>
        </div>

        {tab === 'shops' && (
          <div className={table}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`text-left text-xs uppercase tracking-wider ${t.tableHead}`}>
                  <tr>
                    <th className={th}>Boutique</th>
                    <th className={th}>Propriétaire</th>
                    <th className={th}>Statut</th>
                    <th className={`${th} text-right`}>Produits</th>
                    <th className={`${th} text-right`}>Clients</th>
                    <th className={`${th} text-right`}>Commandes</th>
                    <th className={`${th} text-right`}>CA</th>
                    <th className={th}>Créée</th>
                  </tr>
                </thead>
                <tbody>
                  {shopPage.slice.map((shop) => (
                    <tr key={shop.id} onClick={() => setOpenShop(shop.id)} className={`border-t cursor-pointer ${t.row}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ShopAvatar shop={shop} size="w-9 h-9" />
                          <div>
                            <p className="font-medium">{shop.name}</p>
                            <p className={`text-xs ${t.faint}`}>/{shop.slug} · {sectorLabel(shop.businessType)} · {TEMPLATE_LABELS[layoutOf(shop.templateKey)]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p>{shop.ownerName || '—'}</p>
                        <p className={`text-xs ${t.faint}`}>{shop.ownerEmail || 'Démo'}</p>
                      </td>
                      <td className="px-5 py-3"><Pill dark={dark} tone={SHOP_STATUS[shop.status]?.[1]}>{SHOP_STATUS[shop.status]?.[0] || shop.status}</Pill></td>
                      <td className="px-5 py-3 text-right tabular-nums">{shop.productCount}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{shop.clientCount}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{shop.orderCount}</td>
                      <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">{money(shop.revenue)}</td>
                      <td className={`px-5 py-3 whitespace-nowrap ${t.muted}`}>{date(shop.createdAt)}</td>
                    </tr>
                  ))}
                  {visibleShops.length === 0 && <tr><td colSpan={8} className={`px-5 py-12 text-center ${t.faint}`}>Aucune boutique.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination paged={shopPage} theme={theme} />
          </div>
        )}

        {tab === 'verifications' && (
          <div className={table}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`text-left text-xs uppercase tracking-wider ${t.tableHead}`}>
                  <tr>
                    <th className={th}>Boutique</th>
                    <th className={th}>Marchand</th>
                    <th className={th}>Pièce</th>
                    <th className={th}>Carte</th>
                    <th className={th}>Statut</th>
                    <th className={th}>Envoyé</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {verifPage.slice.map((v) => (
                    <tr key={v.id} onClick={() => setOpenVerif(v.id)} className={`border-t cursor-pointer ${t.row}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{v.shopName}</p>
                        <p className={`text-xs ${t.faint}`}>/{v.shopSlug}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p>{v.ownerName}</p>
                        <p className={`text-xs ${t.faint}`}>{v.ownerEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-xs" style={MONO}>{v.documentType === 'CIN' ? 'CIN' : 'Passeport'} · {v.documentNumber}</td>
                      <td className="px-5 py-3 text-xs" style={MONO}>{(v.cardBrand || '').toUpperCase()} •••• {v.cardLast4}</td>
                      <td className="px-5 py-3"><Pill dark={dark} tone={VERIF_STATUS[v.status]?.[1]}>{VERIF_STATUS[v.status]?.[0]}</Pill></td>
                      <td className={`px-5 py-3 whitespace-nowrap ${t.muted}`}>{dateTime(v.submittedAt)}</td>
                      <td className="px-5 py-3 text-right"><span className="text-violet-400 text-sm font-medium">Examiner →</span></td>
                    </tr>
                  ))}
                  {visibleVerifs.length === 0 && (
                    <tr><td colSpan={7} className={`px-5 py-12 text-center ${t.faint}`}>{verifFilter === 'PENDING' ? 'Aucun dossier en attente. 🎉' : 'Aucun dossier.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination paged={verifPage} theme={theme} />
          </div>
        )}

        {tab === 'users' && (
          <div className={table}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`text-left text-xs uppercase tracking-wider ${t.tableHead}`}>
                  <tr>
                    <th className={th}>Nom</th>
                    <th className={th}>Contact</th>
                    <th className={th}>Rôle</th>
                    <th className={th}>Boutique</th>
                    <th className={th}>Statut</th>
                    <th className={th}>Dernière connexion</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {userPage.slice.map((row) => (
                    <tr key={row.id} className={`border-t ${t.row}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{row.firstName} {row.lastName}</p>
                        <p className={`text-xs ${t.faint}`}>inscrit le {date(row.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p>{row.email}</p>
                        {row.phone && <p className={`text-xs ${t.faint}`}>{row.phone}</p>}
                      </td>
                      <td className="px-5 py-3">
                        {superAdmin && row.id !== user.id ? (
                          <select value={row.roleName} onChange={(e) => changeRole(row, e.target.value)} className={`px-2 py-1 rounded-md text-xs outline-none ${t.input}`}>
                            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        ) : (
                          <Pill dark={dark} tone={ROLE_TONES[row.roleName] || 'slate'}>{ROLE_LABELS[row.roleName] || row.roleName}</Pill>
                        )}
                      </td>
                      <td className="px-5 py-3">{row.shopId ? <button onClick={() => setOpenShop(row.shopId)} className="underline">{row.shopName}</button> : '—'}</td>
                      <td className="px-5 py-3"><Pill dark={dark} tone={row.status === 'ACTIVE' ? 'green' : 'red'}>{row.status === 'BLOCKED' ? 'Bloqué' : row.status === 'ACTIVE' ? 'Actif' : row.status}</Pill></td>
                      <td className={`px-5 py-3 whitespace-nowrap ${t.muted}`}>{dateTime(row.lastLogin)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {row.roleName === 'ADMIN' && (
                            <button
                              onClick={() => toggleUser(row)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${row.status === 'BLOCKED' ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                            >
                              {row.status === 'BLOCKED' ? 'Débloquer' : 'Bloquer'}
                            </button>
                          )}
                          {row.id !== user.id && (row.roleName === 'ADMIN' || superAdmin) && (
                            <button onClick={() => setDeletingAccount(row)} title="Supprimer" className={`material-symbols-outlined text-lg px-1.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10`}>delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleUsers.length === 0 && <tr><td colSpan={7} className={`px-5 py-12 text-center ${t.faint}`}>Aucun utilisateur.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination paged={userPage} theme={theme} />
          </div>
        )}
      </main>

      {openShop && <ShopDrawer shopId={openShop} theme={theme} onClose={() => setOpenShop(null)} onChanged={load} notify={notify} />}
      {openVerif && <VerificationDrawer id={openVerif} theme={theme} onClose={() => setOpenVerif(null)} onChanged={load} notify={notify} />}
      {deletingAccount && (
        <DeleteAccountDialog
          account={deletingAccount}
          shopName={deletingAccount.shopName}
          theme={theme}
          notify={notify}
          onClose={() => setDeletingAccount(null)}
          onDeleted={() => { setDeletingAccount(null); load() }}
        />
      )}
      {addingAdmin && <AddAdminDialog theme={theme} notify={notify} onClose={() => setAddingAdmin(false)} onCreated={() => { setAddingAdmin(false); load() }} />}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium ${toast.isError ? 'bg-red-500 text-white' : dark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
