import { useState } from 'react'
import { toast } from 'react-toastify'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import CustomSelect from '../components/ui/CustomSelect'

/* ──────────── Données initiales ──────────── */
const initialTaux = [
  { id: 1, nom: 'TVA Standard France', valeur: 20.0, statut: 'Actif' },
  { id: 2, nom: 'TVA Réduite', valeur: 5.5, statut: 'Actif' },
  { id: 3, nom: 'TVA Intermédiaire', valeur: 10.0, statut: 'Actif' },
  { id: 4, nom: 'Exonéré (Export)', valeur: 0, statut: 'Désactivé' },
]

const initialZones = [
  { id: 1, nom: 'France Métropolitaine', regions: 'Toute la France (95 dép.)', methode: 'Colissimo / GLS', estimation: '2-3 jours', cout: '5,90 €', statut: 'Ouverte' },
  { id: 2, nom: 'Union Européenne', regions: 'Belgique, Allemagne, Italie...', methode: 'DHL Global', estimation: '4-6 jours', cout: '12,50 €', statut: 'Ouverte' },
  { id: 3, nom: 'DOM-TOM', regions: 'Guadeloupe, Martinique, Réunion', methode: 'Colissimo Outre-mer', estimation: '7-10 jours', cout: '19,90 €', statut: 'Maintenance' },
  { id: 4, nom: 'International', regions: 'USA, Canada, Japon, Australie', methode: 'FedEx International', estimation: '8-14 jours', cout: '29,90 €', statut: 'Ouverte' },
]

const devises = ['Euro (€)', 'Dollar ($)', 'Livre Sterling (£)']

export default function TvaLivraison() {
  /* ── TVA state ── */
  const [tvaActive, setTvaActive] = useState(true)
  const [tauxDefaut, setTauxDefaut] = useState('20')
  const [devise, setDevise] = useState('Euro (€)')
  const [taux, setTaux] = useState(initialTaux)

  /* ── Modal ajout taux ── */
  const [showAddTaux, setShowAddTaux] = useState(false)
  const [newTauxNom, setNewTauxNom] = useState('')
  const [newTauxValeur, setNewTauxValeur] = useState('')

  /* ── Modal édition taux ── */
  const [editTaux, setEditTaux] = useState(null)
  const [editTauxNom, setEditTauxNom] = useState('')
  const [editTauxValeur, setEditTauxValeur] = useState('')

  /* ── Zones state ── */
  const [zones, setZones] = useState(initialZones)

  /* ── Modal ajout zone ── */
  const [showAddZone, setShowAddZone] = useState(false)
  const [newZone, setNewZone] = useState({ nom: '', regions: '', methode: '', estimation: '', cout: '' })

  /* ── Modes d'expédition ── */
  const [standardEnabled, setStandardEnabled] = useState(true)
  const [standardSeuil, setStandardSeuil] = useState('75')
  const [standardDelai, setStandardDelai] = useState('3 à 5 jours ouvrés')

  const [expressEnabled, setExpressEnabled] = useState(true)
  const [expressSeuil, setExpressSeuil] = useState('')
  const [expressDelai, setExpressDelai] = useState('24h à 48h chrono')

  /* ── Handlers TVA ── */
  const handleAddTaux = () => {
    if (!newTauxNom.trim() || !newTauxValeur) return toast.error('Veuillez remplir tous les champs.')
    setTaux(prev => [...prev, { id: Date.now(), nom: newTauxNom.trim(), valeur: parseFloat(newTauxValeur), statut: 'Actif' }])
    setNewTauxNom('')
    setNewTauxValeur('')
    setShowAddTaux(false)
    toast.success('Taux TVA ajouté avec succès.')
  }

  const handleEditTaux = () => {
    if (!editTauxNom.trim() || !editTauxValeur) return toast.error('Veuillez remplir tous les champs.')
    setTaux(prev => prev.map(t => t.id === editTaux.id ? { ...t, nom: editTauxNom.trim(), valeur: parseFloat(editTauxValeur) } : t))
    setEditTaux(null)
    toast.success('Taux TVA modifié avec succès.')
  }

  const openEditTaux = (t) => {
    setEditTaux(t)
    setEditTauxNom(t.nom)
    setEditTauxValeur(String(t.valeur))
  }

  const toggleTauxStatut = (id) => {
    setTaux(prev => prev.map(t => t.id === id ? { ...t, statut: t.statut === 'Actif' ? 'Désactivé' : 'Actif' } : t))
  }

  const deleteTaux = (id) => {
    setTaux(prev => prev.filter(t => t.id !== id))
    toast.success('Taux TVA supprimé.')
  }

  /* ── Handlers Zones ── */
  const handleAddZone = () => {
    if (!newZone.nom.trim() || !newZone.regions.trim()) return toast.error('Veuillez remplir les champs requis.')
    setZones(prev => [...prev, { ...newZone, id: Date.now(), statut: 'Ouverte' }])
    setNewZone({ nom: '', regions: '', methode: '', estimation: '', cout: '' })
    setShowAddZone(false)
    toast.success('Zone de livraison ajoutée.')
  }

  const deleteZone = (id) => {
    setZones(prev => prev.filter(z => z.id !== id))
    toast.success('Zone supprimée.')
  }

  const handleSave = () => {
    toast.success('Modifications enregistrées avec succès.')
  }

  const tauxActifs = taux.filter(t => t.statut === 'Actif').length

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ─── Header ─── */}
      <PageHeader title="Gestion TVA & Livraison">
        <PageHeader.PrimaryBtn icon="save" onClick={handleSave}>
          Enregistrer
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Taux TVA Actifs" value={tauxActifs} sub="Système opérationnel" subColor="text-brand" icon="percent" iconBg="bg-badge/10 text-badge" />
        <KpiCard label="Taux par Défaut" value={`${tauxDefaut}%`} sub="Basé sur la zone France" subColor="text-slate-400" icon="settings_backup_restore" iconBg="bg-blue-50 text-blue-600" />
        <KpiCard label="Zones de Livraison" value={zones.length} sub={`${zones.filter(z => z.statut === 'Ouverte').length} zones ouvertes`} subColor="text-brand" icon="public" iconBg="bg-amber-50 text-amber-600" />
        <KpiCard label="Délai Moyen Exp." value="24h" sub="Objectif : < 18h" subColor="text-slate-400" icon="schedule" iconBg="bg-purple-50 text-purple-600" />
      </div>

      {/* ══════════ Section 1 — Configuration de la TVA ══════════ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* En-tête section */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Configuration de la TVA</h3>
            <p className="text-sm text-slate-500">Gérez les taxes applicables selon les régions de vente.</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Toggle TVA global */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Activation Globale</span>
              <button
                onClick={() => setTvaActive(!tvaActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${tvaActive ? 'bg-brand' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${tvaActive ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <button
              onClick={() => setShowAddTaux(true)}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-brand-dark transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span> Ajouter un taux
            </button>
          </div>
        </div>

        {/* Paramètres par défaut */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end border-b border-slate-100">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Taux par défaut (%)</label>
            <input
              type="number"
              value={tauxDefaut}
              onChange={e => setTauxDefaut(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Devise de référence</label>
            <CustomSelect value={devise} onChange={setDevise} options={devises} />
          </div>
          <div className="flex items-center">
            <button
              onClick={() => toast.info('Taux par défaut appliqué à tous les produits.')}
              className="text-brand font-semibold text-sm hover:underline"
            >
              Appliquer à tous les produits
            </button>
          </div>
        </div>

        {/* Tableau des taux */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Nom du taux</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Valeur</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taux.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-sm text-slate-800">{t.nom}</td>
                  <td className="px-6 py-3.5 text-sm">{t.valeur}%</td>
                  <td className="px-6 py-3.5">
                    <button onClick={() => toggleTauxStatut(t.id)}>
                      <span className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${
                        t.statut === 'Actif'
                          ? 'bg-badge/10 text-badge'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {t.statut}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-1">
                    <button onClick={() => openEditTaux(t)} className="text-slate-400 hover:text-brand transition-colors">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => deleteTaux(t.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {taux.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">Aucun taux configuré.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════ Section 2 — Zones de Livraison ══════════ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Zones de Livraison</h3>
            <p className="text-sm text-slate-500">Configurez vos périmètres d'expédition et leurs tarifs spécifiques.</p>
          </div>
          <button
            onClick={() => setShowAddZone(true)}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-brand-dark transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_location</span> Ajouter une zone
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Zone</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Régions</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Méthode</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Estimation</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Coût</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map(z => (
                <tr key={z.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-sm text-slate-800">{z.nom}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-500">{z.regions}</td>
                  <td className="px-6 py-3.5 text-sm">{z.methode}</td>
                  <td className="px-6 py-3.5 text-sm">{z.estimation}</td>
                  <td className="px-6 py-3.5 text-sm font-bold">{z.cout}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      z.statut === 'Ouverte' ? 'bg-badge/10 text-badge'
                        : z.statut === 'Maintenance' ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {z.statut}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-1">
                    <button className="text-slate-400 hover:text-brand transition-colors">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => deleteZone(z.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                    </button>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm">Aucune zone configurée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════ Section 3 — Modes d'Expédition ══════════ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Modes d'Expédition</h3>
          <p className="text-sm text-slate-500">Définissez les options de livraison proposées à vos clients lors du checkout.</p>
        </div>

        <div className="p-6 space-y-8">
          {/* ── Standard ── */}
          <div className="flex flex-col lg:flex-row gap-8 items-start pb-8 border-b border-slate-100">
            <div className="w-full lg:w-1/3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-brand">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <h4 className="font-bold text-slate-800">Livraison Standard</h4>
              </div>
              <p className="text-sm text-slate-500">L'option économique privilégiée par 80% des clients.</p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Seuil livraison gratuite (€)</label>
                <input
                  type="number"
                  value={standardSeuil}
                  onChange={e => setStandardSeuil(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Délai affiché</label>
                <input
                  type="text"
                  value={standardDelai}
                  onChange={e => setStandardDelai(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
            </div>
            <div className="pt-6 lg:pt-0">
              <button
                onClick={() => setStandardEnabled(!standardEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${standardEnabled ? 'bg-brand' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow transition-transform ${standardEnabled ? 'translate-x-7' : ''}`} />
              </button>
            </div>
          </div>

          {/* ── Express ── */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-brand">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <h4 className="font-bold text-slate-800">Livraison Express</h4>
              </div>
              <p className="text-sm text-slate-500">Expédition le jour même pour toute commande avant 14h.</p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Seuil livraison gratuite (€)</label>
                <input
                  type="number"
                  value={expressSeuil}
                  onChange={e => setExpressSeuil(e.target.value)}
                  placeholder="Aucun seuil"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Délai affiché</label>
                <input
                  type="text"
                  value={expressDelai}
                  onChange={e => setExpressDelai(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
            </div>
            <div className="pt-6 lg:pt-0">
              <button
                onClick={() => setExpressEnabled(!expressEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${expressEnabled ? 'bg-brand' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow transition-transform ${expressEnabled ? 'translate-x-7' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer save */}
        <div className="p-6 bg-slate-50 rounded-b-xl flex justify-end border-t border-slate-100">
          <button
            onClick={handleSave}
            className="bg-brand text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-md"
          >
            Enregistrer les modifications
          </button>
        </div>
      </section>

      {/* ══════════ MODALS ══════════ */}

      {/* Modal — Ajouter un taux TVA */}
      {showAddTaux && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddTaux(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Ajouter un taux TVA</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Nom du taux</label>
                <input
                  type="text"
                  value={newTauxNom}
                  onChange={e => setNewTauxNom(e.target.value)}
                  placeholder="Ex : TVA Super Réduite"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Valeur (%)</label>
                <input
                  type="number"
                  value={newTauxValeur}
                  onChange={e => setNewTauxValeur(e.target.value)}
                  placeholder="Ex : 2.1"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddTaux(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={handleAddTaux} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Modifier un taux TVA */}
      {editTaux && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditTaux(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Modifier le taux TVA</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Nom du taux</label>
                <input
                  type="text"
                  value={editTauxNom}
                  onChange={e => setEditTauxNom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Valeur (%)</label>
                <input
                  type="number"
                  value={editTauxValeur}
                  onChange={e => setEditTauxValeur(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditTaux(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={handleEditTaux} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Ajouter une zone */}
      {showAddZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddZone(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Ajouter une zone de livraison</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Nom de la zone *</label>
                <input
                  type="text"
                  value={newZone.nom}
                  onChange={e => setNewZone({ ...newZone, nom: e.target.value })}
                  placeholder="Ex : Afrique du Nord"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Régions couvertes *</label>
                <input
                  type="text"
                  value={newZone.regions}
                  onChange={e => setNewZone({ ...newZone, regions: e.target.value })}
                  placeholder="Ex : Maroc, Tunisie, Algérie"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Méthode</label>
                  <input
                    type="text"
                    value={newZone.methode}
                    onChange={e => setNewZone({ ...newZone, methode: e.target.value })}
                    placeholder="Ex : DHL"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Estimation</label>
                  <input
                    type="text"
                    value={newZone.estimation}
                    onChange={e => setNewZone({ ...newZone, estimation: e.target.value })}
                    placeholder="Ex : 5-7 jours"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Coût</label>
                <input
                  type="text"
                  value={newZone.cout}
                  onChange={e => setNewZone({ ...newZone, cout: e.target.value })}
                  placeholder="Ex : 15,00 €"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddZone(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={handleAddZone} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
