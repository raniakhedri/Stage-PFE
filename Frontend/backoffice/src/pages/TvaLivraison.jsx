import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import { shopQuery } from '../lib/sellio'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import CustomSelect from '../components/ui/CustomSelect'
import Spinner from '../components/ui/Spinner'

const devises = ['Dinar Tunisien (DT)']

const GOUVERNORATS = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
  'Nabeul', 'Zaghouan', 'Bizerte',
  'Béja', 'Jendouba', 'Le Kef', 'Siliana',
  'Sousse', 'Monastir', 'Mahdia',
  'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Tataouine',
  'Gafsa', 'Tozeur', 'Kébili',
]

const GRAND_TUNIS = ['Tunis', 'Ariana', 'Ben Arous', 'Manouba']

/* Converts comma string to Set of trimmed values */
function parseRegions(str) {
  return new Set((str || '').split(',').map(s => s.trim()).filter(Boolean))
}

/* Multi-select checkbox dropdown for governorates */
function RegionsPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = parseRegions(value)

  const toggle = (gov) => {
    const next = new Set(selected)
    if (next.has(gov)) next.delete(gov)
    else next.add(gov)
    onChange([...next].join(', '))
  }

  const applyPreset = (list) => {
    const next = new Set(selected)
    list.forEach(g => next.add(g))
    onChange([...next].join(', '))
  }

  const selectAll = () => onChange(GOUVERNORATS.join(', '))
  const clearAll = () => onChange('')

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none text-left"
      >
        <span className={selected.size === 0 ? 'text-slate-400' : 'text-slate-700'}>
          {selected.size === 0
            ? 'Sélectionner les régions'
            : selected.size === GOUVERNORATS.length
              ? 'Tous les gouvernorats'
              : [...selected].join(', ')}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
          {/* Preset + controls */}
          <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-2">
            <button type="button" onClick={() => applyPreset(GRAND_TUNIS)}
              className="text-[11px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">
              + Grand Tunis
            </button>
            <button type="button" onClick={selectAll}
              className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">
              Tout sélectionner
            </button>
            <button type="button" onClick={clearAll}
              className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
              Effacer
            </button>
          </div>
          {/* Governorate checkboxes */}
          <div className="max-h-52 overflow-y-auto px-2 py-2 grid grid-cols-2 gap-0.5">
            {GOUVERNORATS.map(gov => (
              <label key={gov} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(gov)}
                  onChange={() => toggle(gov)}
                  className="w-3.5 h-3.5 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700">{gov}</span>
              </label>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-slate-100 flex justify-end">
            <button type="button" onClick={() => setOpen(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-btn text-white hover:bg-btn-dark">
              Confirmer ({selected.size})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TvaLivraison() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  /* ── Config state ── */
  const [tvaActive, setTvaActive] = useState(true)
  const [tauxDefaut, setTauxDefaut] = useState('19')
  const [devise, setDevise] = useState('Dinar Tunisien (DT)')

  /* ── TVA rates ── */
  const [taux, setTaux] = useState([])

  /* ── Modal ajout taux ── */
  const [showAddTaux, setShowAddTaux] = useState(false)
  const [newTauxNom, setNewTauxNom] = useState('')
  const [newTauxValeur, setNewTauxValeur] = useState('')

  /* ── Modal édition taux ── */
  const [editTaux, setEditTaux] = useState(null)
  const [editTauxNom, setEditTauxNom] = useState('')
  const [editTauxValeur, setEditTauxValeur] = useState('')

  /* ── Zones state ── */
  const [zones, setZones] = useState([])

  /* ── Modal ajout zone ── */
  const [showAddZone, setShowAddZone] = useState(false)
  const [newZone, setNewZone] = useState({ nom: '', regions: '', methode: '', estimation: '', cout: '' })

  /* ── Modal édition zone ── */
  const [editZone, setEditZone] = useState(null)
  const [editZoneData, setEditZoneData] = useState({ nom: '', regions: '', methode: '', estimation: '', cout: '', statut: '' })

  /* ── Modes d'expédition ── */
  const [standardEnabled, setStandardEnabled] = useState(true)
  const [standardSeuil, setStandardSeuil] = useState('200')
  const [standardDelai, setStandardDelai] = useState('3 à 5 jours ouvrés')
  const [expressEnabled, setExpressEnabled] = useState(true)
  const [expressSeuil, setExpressSeuil] = useState('')
  const [expressDelai, setExpressDelai] = useState('24h à 48h')

  // ── Currency symbol helper ──
  const currencySymbol = 'DT'

  // ── Load all data ──
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [configRes, ratesRes, zonesRes] = await Promise.all([
        apiClient.get(`/admin/tva-shipping/config${shopQuery()}`),
        apiClient.get(`/admin/tva-shipping/rates${shopQuery()}`),
        apiClient.get(`/admin/tva-shipping/zones${shopQuery()}`),
      ])
      const c = configRes.data
      setTvaActive(c.tvaActive)
      setTauxDefaut(String(c.tauxDefaut))
      setDevise(c.devise || 'Dinar Tunisien (TND)')
      setStandardEnabled(c.standardEnabled)
      setStandardSeuil(c.standardSeuil != null ? String(c.standardSeuil) : '')
      setStandardDelai(c.standardDelai || '')
      setExpressEnabled(c.expressEnabled)
      setExpressSeuil(c.expressSeuil != null ? String(c.expressSeuil) : '')
      setExpressDelai(c.expressDelai || '')
      setTaux(ratesRes.data)
      setZones(zonesRes.data)
    } catch {
      toast.error('Erreur lors du chargement des données TVA & Livraison.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ═══════════ Config save ═══════════ */
  const handleSave = async () => {
    setSaving(true)
    try {
      await apiClient.put(`/admin/tva-shipping/config${shopQuery()}`, {
        tvaActive,
        tauxDefaut: parseFloat(tauxDefaut) || 0,
        devise,
        standardEnabled,
        standardSeuil: standardSeuil ? parseFloat(standardSeuil) : null,
        standardDelai,
        expressEnabled,
        expressSeuil: expressSeuil ? parseFloat(expressSeuil) : null,
        expressDelai,
      })
      toast.success('Configuration enregistrée avec succès.')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  /* ═══════════ TVA Rates handlers ═══════════ */
  const handleAddTaux = async () => {
    if (!newTauxNom.trim() || !newTauxValeur) return toast.error('Veuillez remplir tous les champs.')
    try {
      const res = await apiClient.post(`/admin/tva-shipping/rates${shopQuery()}`, {
        nom: newTauxNom.trim(),
        valeur: parseFloat(newTauxValeur),
      })
      setTaux(prev => [...prev, res.data])
      setNewTauxNom('')
      setNewTauxValeur('')
      setShowAddTaux(false)
      toast.success('Taux TVA ajouté avec succès.')
    } catch {
      toast.error("Erreur lors de l'ajout du taux.")
    }
  }

  const handleEditTaux = async () => {
    if (!editTauxNom.trim() || !editTauxValeur) return toast.error('Veuillez remplir tous les champs.')
    try {
      const res = await apiClient.put(`/admin/tva-shipping/rates/${editTaux.id}${shopQuery()}`, {
        nom: editTauxNom.trim(),
        valeur: parseFloat(editTauxValeur),
      })
      setTaux(prev => prev.map(t => t.id === editTaux.id ? res.data : t))
      setEditTaux(null)
      toast.success('Taux TVA modifié avec succès.')
    } catch {
      toast.error('Erreur lors de la modification.')
    }
  }

  const openEditTaux = (t) => {
    setEditTaux(t)
    setEditTauxNom(t.nom)
    setEditTauxValeur(String(t.valeur))
  }

  const toggleTauxStatut = async (id) => {
    try {
      const res = await apiClient.patch(`/admin/tva-shipping/rates/${id}/toggle${shopQuery()}`)
      setTaux(prev => prev.map(t => t.id === id ? res.data : t))
    } catch {
      toast.error('Erreur lors du changement de statut.')
    }
  }

  const deleteTaux = async (id) => {
    try {
      await apiClient.delete(`/admin/tva-shipping/rates/${id}${shopQuery()}`)
      setTaux(prev => prev.filter(t => t.id !== id))
      toast.success('Taux TVA supprimé.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  /* ═══════════ Zones handlers ═══════════ */
  const handleAddZone = async () => {
    if (!newZone.regions.trim()) return toast.error('Veuillez sélectionner au moins une région.')
    const autoNom = newZone.regions.split(',').map(s => s.trim()).filter(Boolean).join(' / ')
    try {
      const res = await apiClient.post(`/admin/tva-shipping/zones${shopQuery()}`, {
        ...newZone,
        nom: autoNom,
        cout: parseFloat(newZone.cout) || 0,
      })
      setZones(prev => [...prev, res.data])
      setNewZone({ nom: '', regions: '', methode: '', estimation: '', cout: '' })
      setShowAddZone(false)
      toast.success('Zone de livraison ajoutée.')
    } catch {
      toast.error("Erreur lors de l'ajout de la zone.")
    }
  }

  const openEditZone = (z) => {
    setEditZone(z)
    setEditZoneData({ nom: z.nom, regions: z.regions, methode: z.methode || '', estimation: z.estimation || '', cout: String(z.cout), statut: z.statut })
  }

  const handleEditZone = async () => {
    if (!editZoneData.regions.trim()) return toast.error('Veuillez sélectionner au moins une région.')
    const autoNom = editZoneData.regions.split(',').map(s => s.trim()).filter(Boolean).join(' / ')
    try {
      const res = await apiClient.put(`/admin/tva-shipping/zones/${editZone.id}${shopQuery()}`, {
        ...editZoneData,
        nom: autoNom,
        cout: parseFloat(editZoneData.cout) || 0,
      })
      setZones(prev => prev.map(z => z.id === editZone.id ? res.data : z))
      setEditZone(null)
      toast.success('Zone modifiée avec succès.')
    } catch {
      toast.error('Erreur lors de la modification.')
    }
  }

  const deleteZone = async (id) => {
    try {
      await apiClient.delete(`/admin/tva-shipping/zones/${id}${shopQuery()}`)
      setZones(prev => prev.filter(z => z.id !== id))
      toast.success('Zone supprimée.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  /* ═══════════ Derived values ═══════════ */
  const tauxActifs = taux.filter(t => t.actif).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    )
  }

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ─── Header ─── */}
      <PageHeader title="Gestion TVA & Livraison">
        <PageHeader.PrimaryBtn icon="save" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Taux TVA Actifs" value={tauxActifs} sub="Système opérationnel" subColor="text-brand" icon="percent" iconBg="bg-badge/10 text-badge" />
        <KpiCard label="Taux par Défaut" value={`${tauxDefaut}%`} sub="Taux applicable par défaut" subColor="text-slate-400" icon="settings_backup_restore" iconBg="bg-blue-50 text-blue-600" />
        <KpiCard label="Zones de Livraison" value={zones.length} sub={`${zones.filter(z => z.statut === 'Ouverte').length} zones ouvertes`} subColor="text-brand" icon="public" iconBg="bg-amber-50 text-amber-600" />
        <KpiCard label="Délai Moyen Exp." value="24h" sub="Objectif : < 18h" subColor="text-slate-400" icon="schedule" iconBg="bg-purple-50 text-purple-600" />
      </div>

      {/* ══════════ Section 1 — Configuration de la TVA ══════════ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Configuration de la TVA</h3>
            <p className="text-sm text-slate-500">Gérez les taxes applicables selon les régions de vente.</p>
          </div>
          <div className="flex items-center gap-6">
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
              className="bg-btn text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-btn-dark transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span> Ajouter un taux
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end border-b border-slate-100">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Taux par défaut (%)</label>
            <input type="number" value={tauxDefaut} onChange={e => setTauxDefaut(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Devise de référence</label>
            <CustomSelect value={devise} onChange={setDevise} options={devises} />
          </div>
          <div className="flex items-center">
            <button onClick={() => toast.info('Taux par défaut appliqué à tous les produits.')} className="text-brand font-semibold text-sm hover:underline">
              Appliquer à tous les produits
            </button>
          </div>
        </div>

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
                      <span className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${t.actif ? 'bg-badge/10 text-badge' : 'bg-slate-100 text-slate-500'}`}>
                        {t.actif ? 'Actif' : 'Désactivé'}
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
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">Aucun taux configuré.</td></tr>
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
          <button onClick={() => setShowAddZone(true)} className="bg-btn text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-btn-dark transition-all">
            <span className="material-symbols-outlined text-sm">add_location</span> Ajouter une zone
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
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
                  <td className="px-6 py-3.5 font-semibold text-sm text-slate-800">{z.regions}</td>
                  <td className="px-6 py-3.5 text-sm">{z.methode}</td>
                  <td className="px-6 py-3.5 text-sm">{z.estimation}</td>
                  <td className="px-6 py-3.5 text-sm font-bold">{z.cout?.toFixed(2)} {currencySymbol}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${z.statut === 'Ouverte' ? 'bg-badge/10 text-badge' : z.statut === 'Maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {z.statut}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-1">
                    <button onClick={() => openEditZone(z)} className="text-slate-400 hover:text-brand transition-colors">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => deleteZone(z.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                    </button>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm">Aucune zone configurée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════ Section 3 — Modes d'Expédition ══════════ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Modes d&apos;Expédition</h3>
          <p className="text-sm text-slate-500">Définissez les options de livraison proposées à vos clients lors du checkout.</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Standard */}
          <div className="flex flex-col lg:flex-row gap-8 items-start pb-8 border-b border-slate-100">
            <div className="w-full lg:w-1/3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-brand">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <h4 className="font-bold text-slate-800">Livraison Standard</h4>
              </div>
              <p className="text-sm text-slate-500">L&apos;option économique privilégiée par 80% des clients.</p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Seuil livraison gratuite ({currencySymbol})</label>
                <input type="number" value={standardSeuil} onChange={e => setStandardSeuil(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Délai affiché</label>
                <input type="text" value={standardDelai} onChange={e => setStandardDelai(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
            </div>
            <div className="pt-6 lg:pt-0">
              <button onClick={() => setStandardEnabled(!standardEnabled)} className={`relative w-14 h-7 rounded-full transition-colors ${standardEnabled ? 'bg-brand' : 'bg-slate-300'}`}>
                <span className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow transition-transform ${standardEnabled ? 'translate-x-7' : ''}`} />
              </button>
            </div>
          </div>

          {/* Express */}
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
                <label className="text-sm font-medium text-slate-600">Seuil livraison gratuite ({currencySymbol})</label>
                <input type="number" value={expressSeuil} onChange={e => setExpressSeuil(e.target.value)} placeholder="Aucun seuil" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Délai affiché</label>
                <input type="text" value={expressDelai} onChange={e => setExpressDelai(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
            </div>
            <div className="pt-6 lg:pt-0">
              <button onClick={() => setExpressEnabled(!expressEnabled)} className={`relative w-14 h-7 rounded-full transition-colors ${expressEnabled ? 'bg-brand' : 'bg-slate-300'}`}>
                <span className={`absolute top-[4px] left-[4px] w-5 h-5 bg-white rounded-full shadow transition-transform ${expressEnabled ? 'translate-x-7' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-b-xl flex justify-end border-t border-slate-100">
          <button onClick={handleSave} disabled={saving} className="bg-btn text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-btn-dark transition-all shadow-md disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
                <input type="text" value={newTauxNom} onChange={e => setNewTauxNom(e.target.value)} placeholder="Ex : TVA Super Réduite" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Valeur (%)</label>
                <input type="number" value={newTauxValeur} onChange={e => setNewTauxValeur(e.target.value)} placeholder="Ex : 2.1" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
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
                <input type="text" value={editTauxNom} onChange={e => setEditTauxNom(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Valeur (%)</label>
                <input type="number" value={editTauxValeur} onChange={e => setEditTauxValeur(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
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
                <label className="text-sm font-medium text-slate-600">Régions couvertes *</label>
                <RegionsPicker value={newZone.regions} onChange={v => setNewZone({ ...newZone, regions: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Méthode</label>
                  <input type="text" value={newZone.methode} onChange={e => setNewZone({ ...newZone, methode: e.target.value })} placeholder="Ex : Aramex" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Estimation</label>
                  <select value={newZone.estimation} onChange={e => setNewZone({ ...newZone, estimation: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none">
                    <option value="">— Sélectionner —</option>
                    <option value="Livraison le jour même">Livraison le jour même</option>
                    <option value="24h">24h</option>
                    <option value="1-2 jours">1-2 jours</option>
                    <option value="2-3 jours">2-3 jours</option>
                    <option value="3-5 jours">3-5 jours</option>
                    <option value="5-7 jours">5-7 jours</option>
                    <option value="7 jours">7 jours (max)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Coût ({currencySymbol})</label>
                <input type="number" value={newZone.cout} onChange={e => setNewZone({ ...newZone, cout: e.target.value })} placeholder="Ex : 7.00" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddZone(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={handleAddZone} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Modifier une zone */}
      {editZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditZone(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Modifier la zone de livraison</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Régions couvertes *</label>
                <RegionsPicker value={editZoneData.regions} onChange={v => setEditZoneData({ ...editZoneData, regions: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Méthode</label>
                  <input type="text" value={editZoneData.methode} onChange={e => setEditZoneData({ ...editZoneData, methode: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Estimation</label>
                  <select value={editZoneData.estimation} onChange={e => setEditZoneData({ ...editZoneData, estimation: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none">
                    <option value="">— Sélectionner —</option>
                    <option value="Livraison le jour même">Livraison le jour même</option>
                    <option value="24h">24h</option>
                    <option value="1-2 jours">1-2 jours</option>
                    <option value="2-3 jours">2-3 jours</option>
                    <option value="3-5 jours">3-5 jours</option>
                    <option value="5-7 jours">5-7 jours</option>
                    <option value="7 jours">7 jours (max)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Coût ({currencySymbol})</label>
                  <input type="number" value={editZoneData.cout} onChange={e => setEditZoneData({ ...editZoneData, cout: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Statut</label>
                  <select value={editZoneData.statut} onChange={e => setEditZoneData({ ...editZoneData, statut: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-brand focus:border-brand outline-none">
                    <option value="Ouverte">Ouverte</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Fermée">Fermée</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditZone(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={handleEditZone} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
