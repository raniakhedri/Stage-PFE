import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'

// ── Static Data ────────────────────────────────────────────────────────────────
const kpiData = [
  {
    label: 'Demandes en attente',
    value: '24',
    sub: '+12%',
    subColor: 'text-brand',
    icon: 'pending_actions',
    iconBg: 'bg-amber-50 text-amber-500',
  },
  {
    label: 'Retours Approuvés',
    value: '156',
    sub: '-5%',
    subColor: 'text-red-500',
    icon: 'check_circle',
    iconBg: 'bg-blue-50 text-blue-500',
  },
  {
    label: 'Remboursements Complétés',
    value: '1 240 €',
    sub: 'Total 30j',
    subColor: 'text-slate-400',
    icon: 'payments',
    iconBg: 'bg-badge/10 text-badge',
  },
  {
    label: 'Taux de Retour',
    value: '4.2%',
    sub: '+0.5%',
    subColor: 'text-brand',
    icon: 'analytics',
    iconBg: 'bg-badge/10 text-badge',
  },
]

const mockRetours = [
  {
    id: '#RET-4829',
    commande: '#ORD-9021',
    client: 'Jean Dupont',
    email: 'j.dupont@email.com',
    initials: 'JD',
    produit: 'Veste Granite L',
    produitFull: 'Veste Granite Protection L',
    ref: 'WG-2023-991',
    statut: 'EN ATTENTE',
    statutBg: 'bg-amber-100 text-amber-700',
    panelStatutBg: 'bg-amber-100 text-amber-700',
    panelStatut: 'Attente',
    montant: '89.90 €',
    raison: 'Taille trop grande',
    commentaire: '"La veste est superbe mais la taille L taille vraiment grand, je flotte dedans. Je souhaiterais un échange contre une taille M ou un remboursement."',
  },
  {
    id: '#RET-4830',
    commande: '#ORD-8842',
    client: 'Marie Curie',
    email: 'm.curie@email.com',
    initials: 'MC',
    produit: 'Pantalon Cargo M',
    produitFull: 'Pantalon Cargo Résistant M',
    ref: 'PC-2023-441',
    statut: 'INSPECTÉ',
    statutBg: 'bg-blue-100 text-blue-700',
    panelStatutBg: 'bg-blue-100 text-blue-700',
    panelStatut: 'Inspecté',
    montant: '54.00 €',
    raison: 'Défaut de fabrication',
    commentaire: '"La couture du genou droit s\'est décousue après deux jours d\'utilisation. Le produit est défectueux."',
  },
  {
    id: '#RET-4831',
    commande: '#ORD-9055',
    client: 'Luc Bernard',
    email: 'l.bernard@email.com',
    initials: 'LB',
    produit: 'Gants Sécurité',
    produitFull: 'Gants de Sécurité Renforcés',
    ref: 'GS-2023-112',
    statut: 'REMBOURSÉ',
    statutBg: 'bg-badge/10 text-badge',
    panelStatutBg: 'bg-badge/10 text-badge',
    panelStatut: 'Remboursé',
    montant: '15.50 €',
    raison: 'Taille incorrecte',
    commentaire: '"J\'ai commandé la taille M mais j\'ai reçu du S. J\'aimerais un échange ou un remboursement."',
  },
  {
    id: '#RET-4832',
    commande: '#ORD-9102',
    client: 'Alice V.',
    email: 'alice.v@email.com',
    initials: 'AV',
    produit: 'Chaussures S3',
    produitFull: 'Chaussures de Sécurité S3',
    ref: 'CS-2023-887',
    statut: 'FERMÉ',
    statutBg: 'bg-slate-100 text-slate-600',
    panelStatutBg: 'bg-slate-100 text-slate-600',
    panelStatut: 'Fermé',
    montant: '129.00 €',
    raison: 'Non conforme à la description',
    commentaire: '"L\'embout de protection n\'est pas visible comme sur les photos du site. Le produit livré ne correspond pas à ce qui est annoncé."',
  },
]

const statusOptions = ['Tous les Statuts', 'EN ATTENTE', 'INSPECTÉ', 'REMBOURSÉ', 'FERMÉ']
const raisonOptions = ['Toutes les raisons', 'Taille incorrecte', 'Défaut', 'Non conforme']

const modeOptions = ['Mode original', 'Virement bancaire', 'Avoir boutique', 'Carte cadeau']
const eligibiliteOptions = ['Neufs avec étiquettes', 'Neufs sans étiquettes', 'Occasion acceptable', 'Tout état']
const fraisOptions = ['Gratuit (France métro)', 'À la charge du client', 'Forfait 5 €', 'Selon transporteur']

export default function Retours() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(mockRetours[0])
  const [filterStatut, setFilterStatut] = useState('Tous les Statuts')
  const [filterRaison, setFilterRaison] = useState('Toutes les raisons')
  const [editingPolitique, setEditingPolitique] = useState(false)
  const [politique, setPolitique] = useState({
    periode: '30',
    eligibilite: 'Neufs avec étiquettes',
    remboursement: 'Mode original',
    frais: 'Gratuit (France métro)',
    conditionsSpeciales: '',
  })
  const [politiqueDraft, setPolitiqueDraft] = useState(politique)

  const handleSavePolitique = () => {
    setPolitique(politiqueDraft)
    setEditingPolitique(false)
    toast.success('Politique de retour mise à jour avec succès.')
  }
  const handleCancelPolitique = () => {
    setPolitiqueDraft(politique)
    setEditingPolitique(false)
  }

  const filtered = mockRetours.filter((r) => {
    const matchStatut = filterStatut === 'Tous les Statuts' || r.statut === filterStatut
    const matchRaison =
      filterRaison === 'Toutes les raisons' ||
      r.raison.toLowerCase().includes(filterRaison.toLowerCase().replace('taille incorrecte', 'taille').replace('défaut', 'défaut').replace('non conforme', 'non conforme'))
    return matchStatut && matchRaison
  })

  const handleApprouver = () => {
    toast.success(`Retour ${selected.id} approuvé et remboursement initié.`)
  }
  const handleInspecter = () => {
    toast.info(`Retour ${selected.id} marqué pour inspection.`)
  }
  const handleRejeter = () => {
    toast.error(`Retour ${selected.id} rejeté.`)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <PageHeader title="Suivi des demandes">
        <PageHeader.SecondaryBtn icon="settings">Politique</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="history" onClick={() => navigate('/retours/historique')}>Historique Remboursements</PageHeader.PrimaryBtn>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Table + Policy */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Table Card */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm">
            {/* Table Filters */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-white">
              <div className="flex gap-2">
                <CustomSelect value={filterStatut} onChange={setFilterStatut} options={statusOptions} size="sm" />
                <CustomSelect value={filterRaison} onChange={setFilterRaison} options={raisonOptions} size="sm" />
              </div>
              <div className="text-slate-400 text-xs font-medium">
                {filtered.length} demande{filtered.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">ID Retour</th>
                  <th className="px-4 py-3 whitespace-nowrap">Commande</th>
                  <th className="px-4 py-3 whitespace-nowrap">Client</th>
                  <th className="px-4 py-3 whitespace-nowrap">Produit</th>
                  <th className="px-4 py-3 whitespace-nowrap">Statut</th>
                  <th className="px-4 py-3 whitespace-nowrap">Montant</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={`transition-colors cursor-pointer ${
                        selected?.id === r.id
                          ? 'bg-brand/5 border-l-2 border-brand'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-brand text-sm whitespace-nowrap">{r.id}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/commandes/${r.commande.replace('#ORD-', '')}`) }}
                          className="text-slate-500 hover:text-brand hover:underline font-medium transition-colors"
                        >
                          {r.commande}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-sm whitespace-nowrap">{r.client}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{r.produit}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${r.statutBg}`}>
                          {r.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-sm whitespace-nowrap">{r.montant}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(r) }}
                          className={`transition-colors ${selected?.id === r.id ? 'text-brand' : 'text-slate-400 hover:text-brand'}`}
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="px-4 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>AFFICHAGE {filtered.length} RÉSULTATS</span>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:text-brand transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="bg-brand text-white w-5 h-5 flex items-center justify-center rounded text-[10px]">1</span>
                <button className="p-1 hover:text-brand transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Policy Card */}
          <div className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-brand text-2xl">policy</span>
                <h3 className="text-lg font-bold text-slate-800">Politique de retour actuelle</h3>
              </div>
              {!editingPolitique && (
                <button
                  onClick={() => { setPolitiqueDraft(politique); setEditingPolitique(true) }}
                  className="text-brand text-xs font-bold flex items-center gap-1.5 hover:underline"
                >
                  Modifier la configuration
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              )}
            </div>

            {/* View Mode */}
            {!editingPolitique && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-8 pb-8">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Période autorisée</p>
                  <p className="text-sm font-semibold text-slate-800">{politique.periode} jours après réception</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Éligibilité</p>
                  <p className="text-sm font-semibold text-slate-800">{politique.eligibilite}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Remboursement</p>
                  <p className="text-sm font-semibold text-slate-800">{politique.remboursement}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Frais de retour</p>
                  <p className="text-sm font-bold text-brand">{politique.frais}</p>
                </div>
                {politique.conditionsSpeciales && (
                  <div className="col-span-full space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Conditions spéciales</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{politique.conditionsSpeciales}</p>
                  </div>
                )}
              </div>
            )}

            {/* Edit Mode */}
            {editingPolitique && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-6 space-y-6">
                <p className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Modifier la politique
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Période */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Période autorisée (jours)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={politiqueDraft.periode}
                        onChange={(e) => setPolitiqueDraft({ ...politiqueDraft, periode: e.target.value })}
                        className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white"
                      />
                      <span className="text-sm text-slate-500">jours après réception</span>
                    </div>
                  </div>
                  {/* Éligibilité */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Éligibilité</label>
                    <CustomSelect value={politiqueDraft.eligibilite} onChange={(v) => setPolitiqueDraft({ ...politiqueDraft, eligibilite: v })} options={eligibiliteOptions} />
                  </div>
                  {/* Mode remboursement */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mode de remboursement</label>
                    <CustomSelect value={politiqueDraft.remboursement} onChange={(v) => setPolitiqueDraft({ ...politiqueDraft, remboursement: v })} options={modeOptions} />
                  </div>
                  {/* Frais */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Frais de retour</label>
                    <CustomSelect value={politiqueDraft.frais} onChange={(v) => setPolitiqueDraft({ ...politiqueDraft, frais: v })} options={fraisOptions} />
                  </div>
                  {/* Conditions spéciales */}
                  <div className="col-span-full space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conditions spéciales (optionnel)</label>
                    <textarea
                      rows={3}
                      value={politiqueDraft.conditionsSpeciales}
                      onChange={(e) => setPolitiqueDraft({ ...politiqueDraft, conditionsSpeciales: e.target.value })}
                      placeholder="Ex: Hors promotion, articles défectueux prioritaires..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white resize-none"
                    />
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSavePolitique}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-dark transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Enregistrer
                  </button>
                  <button
                    onClick={handleCancelPolitique}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-custom border border-slate-200 p-6 shadow-md sticky top-24">
            {selected ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Détails de la demande</h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${selected.panelStatutBg}`}>
                    {selected.panelStatut}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Product */}
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="w-14 h-14 bg-slate-200 rounded-lg shrink-0 border border-slate-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400 text-2xl">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <button onClick={() => navigate(`/commandes/${selected.commande.replace('#ORD-', '')}`)} className="hover:text-brand hover:underline transition-colors">Commande {selected.commande}</button>
                      </p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{selected.produitFull}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">Ref: {selected.ref}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Informations Client</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-badge/10 text-badge flex items-center justify-center font-bold text-xs">
                        {selected.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selected.client}</p>
                        <p className="text-xs text-slate-500">{selected.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* ID & Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ID Retour</p>
                      <p className="text-sm font-bold text-brand">{selected.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Montant</p>
                      <p className="text-sm font-bold text-slate-800">{selected.montant}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Raison du retour</h4>
                    <div className="p-4 bg-slate-50 rounded-lg border-l-2 border-brand">
                      <p className="text-xs font-bold text-slate-800">{selected.raison}</p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">{selected.commentaire}</p>
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Photos (Preuves)</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        <span className="material-symbols-outlined text-slate-300 text-2xl">image</span>
                      </div>
                      <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        <span className="material-symbols-outlined text-slate-300 text-2xl">image</span>
                      </div>
                      <div className="aspect-square bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
                        <span className="material-symbols-outlined text-slate-300">add</span>
                      </div>
                    </div>
                  </div>

                  {/* Decision Buttons */}
                  <div className="pt-6 flex flex-col gap-3 border-t border-slate-100">
                    <div className="flex gap-2">
                      <button
                        onClick={handleRejeter}
                        className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={handleInspecter}
                        className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                      >
                        Inspecter
                      </button>
                    </div>
                    <button
                      onClick={handleApprouver}
                      className="w-full py-3 rounded-lg bg-brand text-white text-xs font-bold shadow-sm hover:bg-brand-dark transition-all"
                    >
                      Approuver &amp; Rembourser
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-3">assignment_return</span>
                <p className="text-sm font-medium">Sélectionnez une demande</p>
                <p className="text-xs mt-1">Cliquez sur une ligne du tableau</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
