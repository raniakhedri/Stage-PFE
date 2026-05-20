import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import PageHeader from '../components/ui/PageHeader'
import apiClient from '../api/apiClient'

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

// The status progression flow for cash-on-delivery orders
const STATUS_FLOW = ['EN_ATTENTE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE']

const TIMELINE_STEPS = [
  { status: 'EN_ATTENTE', label: 'Commande créée', icon: 'shopping_cart', color: 'bg-slate-400' },
  { status: 'EN_PREPARATION', label: 'En préparation', icon: 'inventory_2', color: 'bg-blue-500' },
  { status: 'EXPEDIEE', label: 'Expédiée', icon: 'local_shipping', color: 'bg-indigo-500' },
  { status: 'LIVREE', label: 'Livrée', icon: 'done_all', color: 'bg-brand' },
]

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '??'
}

export default function DetailCommande() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get(`/admin/orders/${id}`)
      setOrder(data)
    } catch (err) {
      toast.error('Commande introuvable')
      navigate('/commandes')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeStatut = async (newStatus) => {
    setShowStatusMenu(false)
    try {
      setUpdating(true)
      const { data } = await apiClient.patch(`/admin/orders/${id}/status`, { status: newStatus })
      setOrder(data)
      toast.success(`Statut mis à jour : ${STATUS_LABELS[newStatus]}`)
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdating(false)
    }
  }

  // Build timeline based on current status
  const currentStepIndex = STATUS_FLOW.indexOf(order?.status)
  const timeline = TIMELINE_STEPS.map((step, i) => ({
    ...step,
    reached: i <= currentStepIndex,
    date: i === 0 && order?.createdAt ? formatDateTime(order.createdAt) : (i <= currentStepIndex ? '✓' : '—'),
  }))
  // For the first step, always show createdAt date
  if (order?.createdAt && timeline.length > 0) {
    timeline[0].date = formatDateTime(order.createdAt)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2 block animate-spin">progress_activity</span>
          <p className="font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const statusLabel = STATUS_LABELS[order.status] || order.status
  const statusBg = STATUS_BG[order.status] || 'bg-slate-100 text-slate-600'

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* ── Page Header ── */}
      <PageHeader title="Détails de la Commande" subtitle={`${order.reference} • ${formatDateTime(order.createdAt)}`}>
        <PageHeader.SecondaryBtn icon="arrow_back" onClick={() => navigate('/commandes')}>Retour</PageHeader.SecondaryBtn>
        <div className="relative">
          <PageHeader.SecondaryBtn icon="sync" onClick={() => setShowStatusMenu(!showStatusMenu)}>
            {updating ? 'Mise à jour...' : 'Changer statut'}
          </PageHeader.SecondaryBtn>
          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-20 py-2">
              {STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  onClick={() => handleChangeStatut(s)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                    order.status === s ? 'font-bold text-brand' : 'text-slate-600'
                  }`}
                >
                  {order.status === s && <span className="material-symbols-outlined text-sm mr-2 align-middle">check</span>}
                  {STATUS_LABELS[s]}
                </button>
              ))}
              {order.status !== 'ANNULEE' && order.status !== 'LIVREE' && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => handleChangeStatut('ANNULEE')}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm mr-2 align-middle">cancel</span>
                    Annuler la commande
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </PageHeader>

      {/* ── Status Progress Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          {TIMELINE_STEPS.map((step, i) => {
            const reached = i <= currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <div key={step.status} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    i <= currentStepIndex ? 'bg-brand' : 'bg-slate-200'
                  }`} style={{ left: '-50%' }} />
                )}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  reached ? step.color : 'bg-slate-200'
                } ${isCurrent ? 'ring-4 ring-brand/20' : ''}`}>
                  <span className="material-symbols-outlined text-white text-lg">{step.icon}</span>
                </div>
                <p className={`mt-2 text-xs font-bold ${reached ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ══ Left Column (8/12) ═══════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-8">

          {/* Produits commandés */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-brand">inventory_2</span>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Produits commandés</h3>
              <span className="ml-auto text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {order.items?.length || 0} article(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Produit</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Qté</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Prix Unit.</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300">image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{p.productName}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {[p.color && `Couleur: ${p.color}`, p.size && `Taille: ${p.size}`].filter(Boolean).join(' • ') || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {p.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                        {(p.unitPrice || 0).toFixed(2)} DT
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-brand">
                        {(p.lineTotal || 0).toFixed(2)} DT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé de facturation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-brand">receipt_long</span>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Résumé de facturation</h3>
            </div>
            <div className="p-6 space-y-3">
              {order.tvaRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Prix HT</span>
                  <span className="font-medium text-slate-700">{((order.subtotal || 0) - (order.tvaAmount || 0)).toFixed(2)} DT</span>
                </div>
              )}
              {order.tvaRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">TVA ({order.tvaRate || 0}%)</span>
                  <span className="font-medium text-slate-700">{(order.tvaAmount || 0).toFixed(2)} DT</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sous-total TTC</span>
                <span className="font-medium text-slate-700">{(order.subtotal || 0).toFixed(2)} DT</span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    Coupon : <span className="font-bold">{order.couponCode}</span>
                  </span>
                  <span className="font-medium text-green-600">-{(order.couponDiscount || 0).toFixed(2)} DT</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frais de livraison</span>
                <span className="font-medium text-slate-700">{(order.shippingCost || 0).toFixed(2)} DT</span>
              </div>
              <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="font-black text-xs text-slate-500 uppercase tracking-widest">Total final</span>
                <span className="text-2xl font-black text-brand">{(order.total || 0).toFixed(2)} DT</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Right Column (4/12) ══════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">

          {/* Client */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Client</h4>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                {getInitials(order.firstName, order.lastName)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{order.firstName} {order.lastName}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
                <span className="text-slate-600">{order.email}</span>
              </div>
              {order.phone && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-sm">call</span>
                  <span className="text-slate-600">{order.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">location_on</span>
                <span className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {order.address}{'\n'}
                  {order.city}{order.postalCode ? ` ${order.postalCode}` : ''}{'\n'}
                  {order.gouvernorat || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Paiement</h4>
            <div className="flex items-center gap-3">
              {order.paymentMethod === 'CARTE' ? (
                <>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">credit_card</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Carte bancaire</p>
                    <p className="text-[10px] text-slate-400">Paiement en ligne sécurisé</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600">payments</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Espèces à la livraison</p>
                    <p className="text-[10px] text-slate-400">Paiement à la réception</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Livraison */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Livraison</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Zone : {order.shippingZoneName || '—'}</p>
                <span className={`px-2.5 py-1 text-[10px] font-bold font-badge rounded-full ${statusBg}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Adresse de livraison</p>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {order.firstName} {order.lastName}{'\n'}
                  {order.address}{'\n'}
                  {order.city}{order.postalCode ? ` ${order.postalCode}` : ''}{'\n'}
                  {order.gouvernorat || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline / Historique */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Historique</h4>
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${event.reached ? event.color : 'bg-slate-200'} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined text-sm ${event.reached ? 'text-white' : 'text-slate-400'}`}>{event.icon}</span>
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={`w-0.5 h-8 my-1 ${i < currentStepIndex ? 'bg-brand' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-bold ${event.reached ? 'text-slate-800' : 'text-slate-400'}`}>{event.label}</p>
                    <p className="text-[10px] text-slate-400">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statut actuel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Statut actuel</h4>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusBg}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
