import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import apiClient from '../api/apiClient'

const STATUS_LABELS = {
  EN_ATTENTE: 'En attente',
  INSPECTE: 'Inspecté',
  REMBOURSE: 'Remboursé',
  FERME: 'Fermé',
}

const STATUS_BG = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  INSPECTE: 'bg-badge/10 text-badge',
  REMBOURSE: 'bg-brand/10 text-brand',
  FERME: 'bg-slate-100 text-slate-500',
}

const statusOptions = ['Tous les Statuts', 'EN_ATTENTE', 'INSPECTE', 'REMBOURSE', 'FERME']
const raisonOptions = [
  'Toutes les raisons',
  'Produit défectueux',
  'Non conforme à la description',
  'Produit endommagé à la réception',
  'Réaction allergique',
  'Produit expiré',
  'Erreur de commande',
  'Autre',
]

const modeOptions = ['Mode original', 'Virement bancaire', 'Avoir boutique', 'Carte cadeau']
const eligibiliteOptions = ['Non ouvert / Scelle', 'Ouvert non utilise', 'Partiellement utilise', 'Tout etat']
const fraisOptions = ['Gratuit (Tunisie)', 'A la charge du client', 'Forfait 5 DT', 'Selon transporteur']

function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Retours() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('Tous les Statuts')
  const [filterRaison, setFilterRaison] = useState('Toutes les raisons')

  const [editingPolitique, setEditingPolitique] = useState(false)
  const [politique, setPolitique] = useState({
    periode: '30',
    eligibilite: 'Non ouvert / Scelle',
    remboursement: 'Mode original',
    frais: 'Gratuit (Tunisie)',
    conditionsSpeciales: '',
  })
  const [politiqueDraft, setPolitiqueDraft] = useState(politique)

  useEffect(() => { fetchReturns(); fetchPolicy() }, [])

  const fetchPolicy = async () => {
    try {
      const { data } = await apiClient.get('/admin/returns/policy')
      const loaded = {
        periode: String(data.dureeJours ?? 30),
        eligibilite: data.eligibilite ?? 'Non ouvert / Scelle',
        remboursement: data.modeRemboursement ?? 'Mode original',
        frais: data.fraisRetour ?? 'Gratuit (Tunisie)',
        conditionsSpeciales: data.conditionsSpeciales ?? '',
      }
      setPolitique(loaded)
      setPolitiqueDraft(loaded)
    } catch { /* silent — defaults stay */ }
  }

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/admin/returns')
      setReturns(data)
    } catch {
      toast.error('Erreur lors du chargement des retours')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePolitique = async () => {
    try {
      const { data } = await apiClient.put('/admin/returns/policy', {
        dureeJours: parseInt(politiqueDraft.periode) || 30,
        eligibilite: politiqueDraft.eligibilite,
        modeRemboursement: politiqueDraft.remboursement,
        fraisRetour: politiqueDraft.frais,
        conditionsSpeciales: politiqueDraft.conditionsSpeciales,
      })
      const saved = {
        periode: String(data.dureeJours),
        eligibilite: data.eligibilite,
        remboursement: data.modeRemboursement,
        frais: data.fraisRetour,
        conditionsSpeciales: data.conditionsSpeciales ?? '',
      }
      setPolitique(saved)
      setPolitiqueDraft(saved)
      setEditingPolitique(false)
      toast.success('Politique de retour mise à jour avec succès.')
    } catch {
      toast.error('Erreur lors de la sauvegarde de la politique.')
    }
  }
  const handleCancelPolitique = () => {
    setPolitiqueDraft(politique)
    setEditingPolitique(false)
  }

  const enAttente = returns.filter(r => r.status === 'EN_ATTENTE').length
  const rembourses = returns.filter(r => r.status === 'REMBOURSE').length
  const totalRembourse = returns.filter(r => r.status === 'REMBOURSE').reduce((s, r) => s + (r.amount || 0), 0)

  const kpiData = [
    { label: 'Demandes en attente', value: String(enAttente), icon: 'pending_actions', iconBg: 'bg-amber-50 text-amber-500', sub: enAttente > 0 ? 'À traiter' : 'Aucune', subColor: enAttente > 0 ? 'text-amber-500' : 'text-slate-400' },
    { label: 'Retours approuvés', value: String(rembourses), icon: 'check_circle', iconBg: 'bg-badge/10 text-badge', sub: returns.length > 0 ? `~${Math.round(rembourses / returns.length * 100)}%` : '—', subColor: 'text-badge' },
    { label: 'Remboursements complétés', value: `${totalRembourse.toFixed(2)} DT`, icon: 'payments', iconBg: 'bg-badge/10 text-badge' },
    { label: 'Total demandes', value: String(returns.length), icon: 'analytics', iconBg: 'bg-blue-50 text-blue-500' },
  ]

  const filtered = returns.filter((r) => {
    const matchStatut = filterStatut === 'Tous les Statuts' || r.status === filterStatut
    const matchRaison = filterRaison === 'Toutes les raisons' || r.raison === filterRaison
    return matchStatut && matchRaison
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-4xl text-badge">progress_activity</span>
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <PageHeader title="Retours">
        <PageHeader.SecondaryBtn
          icon="refresh"
          onClick={fetchReturns}
        >
          Actualiser
        </PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn
          icon="policy"
          onClick={() => document.getElementById('politiqueSection')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Politique de retour
        </PageHeader.SecondaryBtn>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <CustomSelect options={statusOptions} value={filterStatut} onChange={setFilterStatut} />
        <CustomSelect options={raisonOptions} value={filterRaison} onChange={setFilterRaison} />
        <span className="ml-auto text-xs text-slate-400">{filtered.length} sur {returns.length} demandes</span>
      </div>

      {/* Full-width table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5 text-left font-semibold">ID Retour</th>
                <th className="py-3 px-5 text-left font-semibold">Commande</th>
                <th className="py-3 px-5 text-left font-semibold">Client</th>
                <th className="py-3 px-5 text-left font-semibold">Produit</th>
                <th className="py-3 px-5 text-left font-semibold">Raison</th>
                <th className="py-3 px-5 text-left font-semibold">Date</th>
                <th className="py-3 px-5 text-left font-semibold">Statut</th>
                <th className="py-3 px-5 text-right font-semibold">Montant</th>
                <th className="py-3 px-5 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl block mb-3 text-slate-200">assignment_return</span>
                    <p className="font-medium">Aucune demande de retour</p>
                    <p className="text-xs mt-1 text-slate-300">Modifiez les filtres pour voir plus de résultats</p>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/retours/${r.id}`)}
                  className="border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 group"
                >
                  <td className="py-4 px-5">
                    <span className="font-mono text-xs font-bold text-brand">#{r.reference?.slice(-8)}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-mono text-xs text-slate-500">#{r.orderReference?.slice(-8) || '—'}</span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {getInitials(r.customerName)}
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[120px]">{r.customerName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-slate-600 truncate max-w-[140px] block">{r.productName || '—'}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-slate-500 text-xs">{r.raison || '—'}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BG[r.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-bold text-slate-800">
                    {r.amount?.toFixed(2)} <span className="text-xs font-normal text-slate-400">DT</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand group-hover:underline">
                      Voir
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Affichage de {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Politique de retour */}
      <div id="politiqueSection" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Politique de retour</h3>
            <p className="text-sm text-slate-400 mt-0.5">Conditions appliquées à toutes les demandes de retour</p>
          </div>
          {!editingPolitique ? (
            <button
              onClick={() => { setPolitiqueDraft(politique); setEditingPolitique(true) }}
              className="flex items-center gap-1.5 text-brand text-sm font-semibold hover:underline"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancelPolitique} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                Annuler
              </button>
              <button onClick={handleSavePolitique} className="px-4 py-2 text-sm rounded-xl bg-brand text-white hover:opacity-90 transition font-semibold">
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {editingPolitique ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wider">Période autorisée (jours)</label>
              <input
                type="number"
                value={politiqueDraft.periode}
                onChange={e => setPolitiqueDraft({ ...politiqueDraft, periode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wider">Éligibilité produit</label>
              <CustomSelect options={eligibiliteOptions} value={politiqueDraft.eligibilite}
                onChange={v => setPolitiqueDraft({ ...politiqueDraft, eligibilite: v })} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wider">Mode de remboursement</label>
              <CustomSelect options={modeOptions} value={politiqueDraft.remboursement}
                onChange={v => setPolitiqueDraft({ ...politiqueDraft, remboursement: v })} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wider">Frais de retour</label>
              <CustomSelect options={fraisOptions} value={politiqueDraft.frais}
                onChange={v => setPolitiqueDraft({ ...politiqueDraft, frais: v })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wider">Conditions spéciales</label>
              <textarea
                value={politiqueDraft.conditionsSpeciales}
                onChange={e => setPolitiqueDraft({ ...politiqueDraft, conditionsSpeciales: e.target.value })}
                rows={2}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none"
                placeholder="Conditions supplémentaires..."
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Période autorisée',   value: `${politique.periode} jours après réception` },
              { label: 'Éligibilité',         value: politique.eligibilite },
              { label: 'Mode de remboursement', value: politique.remboursement },
              { label: 'Frais de retour',     value: politique.frais },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
                <p className="font-bold text-slate-800 text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
