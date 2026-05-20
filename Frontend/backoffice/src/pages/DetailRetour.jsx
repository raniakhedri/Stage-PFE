import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import PageHeader from '../components/ui/PageHeader'
import apiClient from '../api/apiClient'

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  INSPECTE: 'Inspecté',
  REMBOURSE: 'Remboursé',
  FERME: 'Fermé',
}

const STATUS_BG = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  INSPECTE:   'bg-badge/10 text-badge',
  REMBOURSE:  'bg-brand/10 text-brand',
  FERME:      'bg-slate-100 text-slate-500',
}

const STATUS_ICON = {
  EN_ATTENTE: 'pending_actions',
  INSPECTE:   'manage_search',
  REMBOURSE:  'check_circle',
  FERME:      'block',
}

const TIMELINE = [
  { status: 'EN_ATTENTE', label: 'Demande reçue',   icon: 'assignment_return' },
  { status: 'INSPECTE',   label: 'En inspection',   icon: 'manage_search'     },
  { status: 'REMBOURSE',  label: 'Remboursé',       icon: 'payments'          },
]

function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function DetailRetour() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [retour, setRetour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [motifRefus, setMotifRefus] = useState('')

  useEffect(() => { fetchRetour() }, [id])

  const fetchRetour = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get(`/admin/returns/${id}`)
      setRetour(data)
    } catch {
      toast.error('Impossible de charger cette demande de retour.')
      navigate('/retours')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (newStatus, motif) => {
    setUpdating(true)
    try {
      const body = { status: newStatus }
      if (motif) body.motifRefus = motif
      await apiClient.patch(`/admin/returns/${id}/status`, body)
      toast.success(`Statut mis à jour : ${STATUS_LABELS[newStatus]}`)
      setRetour(prev => ({ ...prev, status: newStatus, motifRefus: motif || prev.motifRefus }))
    } catch {
      toast.error('Erreur lors de la mise à jour du statut.')
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = () => setRejectOpen(true)

  const confirmReject = () => {
    changeStatus('FERME', motifRefus)
    setRejectOpen(false)
    setMotifRefus('')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-4xl text-brand">progress_activity</span>
    </div>
  )

  if (!retour) return null

  const timelineIdx = TIMELINE.findIndex(t => t.status === retour.status)
  const isClosed = retour.status === 'FERME'

  const photos = [retour.photo1, retour.photo2].filter(Boolean)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span>Demande de retour</span>
            <span className="font-mono text-base font-normal text-slate-400">#{retour.reference?.slice(-8)}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BG[retour.status] || 'bg-slate-100 text-slate-500'}`}>
              {STATUS_LABELS[retour.status] || retour.status}
            </span>
          </span>
        }
      >
        <PageHeader.SecondaryBtn icon="arrow_back" onClick={() => navigate('/retours')}>
          Retour à la liste
        </PageHeader.SecondaryBtn>
      </PageHeader>

      {/* Timeline — hidden when closed */}
      {!isClosed ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Progression</h2>
          <div className="flex items-center gap-0">
            {TIMELINE.map((step, idx) => {
              const done = idx <= timelineIdx
              const active = idx === timelineIdx
              const isLast = idx === TIMELINE.length - 1
              return (
                <div key={step.status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm
                      ${done ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'}
                      ${active ? 'ring-4 ring-brand/20' : ''}`}>
                      <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                    </div>
                    <span className={`text-xs font-semibold text-center leading-tight ${done ? 'text-brand' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${idx < timelineIdx ? 'bg-brand' : 'bg-slate-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 px-6 py-4 flex items-center gap-3 text-slate-500">
          <span className="material-symbols-outlined text-xl">block</span>
          <span className="font-medium text-sm">Cette demande a été <strong>fermée / rejetée</strong>.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Product card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Produit concerné</h2>
            <div className="flex items-center gap-4">
              {retour.productImage ? (
                <img src={retour.productImage} alt={retour.productName}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-base">{retour.productName || '—'}</p>
                <p className="text-sm text-slate-400 mt-0.5">Référence retour : <span className="font-mono">{retour.reference}</span></p>
                <p className="text-sm text-slate-400">Commande liée : <span className="font-mono font-semibold text-slate-600">{retour.orderReference || '—'}</span></p>
                <p className="text-sm text-slate-400 mt-1">
                  Demande soumise le <span className="text-slate-600 font-medium">{formatDate(retour.createdAt)}</span>
                </p>
                {retour.ibanClient && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    <span className="material-symbols-outlined text-blue-500 text-[16px]">account_balance</span>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">IBAN client (virement bancaire)</p>
                      <p className="font-mono text-sm font-semibold text-blue-800">{retour.ibanClient}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-xs text-slate-400 mb-1">Montant</p>
                <p className="text-2xl font-bold text-slate-800">{retour.amount?.toFixed(2)} <span className="text-sm font-normal">DT</span></p>
              </div>
            </div>
          </div>

          {/* Raison */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Raison du retour</h2>
            <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
              <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
              <div>
                <p className="font-bold text-slate-800">{retour.raison || 'Non précisée'}</p>
                {retour.commentaire && (
                  <p className="text-sm text-slate-500 mt-1 italic leading-relaxed">« {retour.commentaire} »</p>
                )}
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              Photos / Preuves {photos.length > 0 && <span className="text-slate-400 font-normal">({photos.length})</span>}
            </h2>
            {photos.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {photos.map((url, i) => (
                  <button key={i} onClick={() => setLightbox(url)}
                    className="relative group w-28 h-28 rounded-xl overflow-hidden border border-slate-200 hover:border-brand transition-all shadow-sm focus:outline-none">
                    <img src={url} alt={`Preuve ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">zoom_in</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-6 text-slate-400">
                <span className="material-symbols-outlined">photo_camera</span>
                <span className="text-sm">Aucune photo jointe</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="space-y-6">

          {/* Client info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Client</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold flex-shrink-0">
                {getInitials(retour.customerName)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{retour.customerName || '—'}</p>
                <p className="text-xs text-slate-400">{retour.customerEmail || '—'}</p>
              </div>
            </div>
            {retour.customerId && (
              <button
                onClick={() => navigate(`/clients/${retour.customerId}`)}
                className="w-full py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">person</span>
                Voir le profil client
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Actions</h2>

            {retour.status === 'EN_ATTENTE' && (
              <div className="space-y-2">
                <button
                  onClick={() => changeStatus('INSPECTE')}
                  disabled={updating}
                  className="w-full py-3 rounded-xl bg-badge text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">manage_search</span>
                  Marquer comme inspecté
                </button>
                <button
                  onClick={() => changeStatus('REMBOURSE')}
                  disabled={updating}
                  className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  Approuver &amp; Rembourser
                </button>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">block</span>
                  Rejeter la demande
                </button>
              </div>
            )}

            {retour.status === 'INSPECTE' && (
              <div className="space-y-2">
                <button
                  onClick={() => changeStatus('REMBOURSE')}
                  disabled={updating}
                  className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  Valider le remboursement
                </button>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">block</span>
                  Rejeter après inspection
                </button>
              </div>
            )}

            {retour.status === 'REMBOURSE' && (
              <div className="flex items-center gap-3 py-4 px-4 bg-brand/10 rounded-xl text-brand">
                <span className="material-symbols-outlined">check_circle</span>
                <div>
                  <p className="font-semibold text-sm">Remboursement effectué</p>
                  <p className="text-xs text-brand mt-0.5">Montant : {retour.amount?.toFixed(2)} DT</p>
                </div>
              </div>
            )}

            {retour.status === 'FERME' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-4 px-4 bg-slate-100 rounded-xl text-slate-500">
                  <span className="material-symbols-outlined">block</span>
                  <div>
                    <p className="font-semibold text-sm">Demande fermée</p>
                    <p className="text-xs text-slate-400 mt-0.5">Cette demande a été rejetée.</p>
                  </div>
                </div>
                {retour.motifRefus && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">Motif de refus</p>
                    <p className="text-sm text-red-700">{retour.motifRefus}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick summary */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Résumé</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Référence</dt>
                <dd className="font-mono font-semibold text-slate-700">{retour.reference?.slice(-8)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Commande</dt>
                <dd className="font-mono font-semibold text-slate-700">{retour.orderReference?.slice(-8) || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Soumis le</dt>
                <dd className="text-slate-700">{formatDate(retour.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Statut</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_BG[retour.status] || ''}`}>
                    {STATUS_LABELS[retour.status] || retour.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <dt className="text-slate-500 font-semibold">Montant</dt>
                <dd className="font-bold text-slate-800">{retour.amount?.toFixed(2)} DT</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-500 text-[20px]">block</span>
              </span>
              <div>
                <h3 className="font-bold text-slate-800">Rejeter la demande</h3>
                <p className="text-xs text-slate-400">Précisez la raison du refus (visible par le client)</p>
              </div>
            </div>
            <textarea
              value={motifRefus}
              onChange={e => setMotifRefus(e.target.value)}
              rows={3}
              placeholder="Ex : Produit ouvert et utilisé, délai de retour dépassé..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectOpen(false); setMotifRefus('') }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Annuler
              </button>
              <button onClick={confirmReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Preuve" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            onClick={() => setLightbox(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  )
}
