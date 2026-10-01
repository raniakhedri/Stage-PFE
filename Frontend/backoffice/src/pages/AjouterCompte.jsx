import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import { TUNISIA_CITIES } from '../data/tunisiaCities'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import Spinner from '../components/ui/Spinner'

const roleIconMap = {
  SUPER_ADMIN: { icon: 'shield_person', iconBg: 'bg-red-50 text-red-600' },
  ADMIN: { icon: 'manage_accounts', iconBg: 'bg-slate-100 text-slate-600' },
  CLIENT: { icon: 'person', iconBg: 'bg-badge/10 text-badge' },
}
const defaultRoleIcon = { icon: 'person', iconBg: 'bg-blue-50 text-blue-600' }

const paysOptions = ['France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Tunisie', 'Algérie', 'Autre']

function Field({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  )
}

function FormInput({ value, onChange, placeholder, type = 'text', hasError, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all ${hasError ? 'border-red-400' : 'border-slate-200'}`}
      {...rest}
    />
  )
}

export default function AjouterCompte() {
  const navigate = useNavigate()

  const [roles, setRoles] = useState([])
  const [segments, setSegments] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [selectedRole, setSelectedRole] = useState('')
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    dateNaissance: '', genre: '',
    adresse: '', ville: '', codePostal: '', pays: 'France',
    segment: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // ── Load roles & segments ─────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [rolesRes, segmentsRes] = await Promise.all([
          apiClient.get('/admin/roles'),
          apiClient.get('/admin/segments'),
        ])
        const rolesData = rolesRes.data.data || rolesRes.data
        const segmentsData = segmentsRes.data.data || segmentsRes.data
        // Merchants see their shop's roles only: add the customer role in front.
        const list = Array.isArray(rolesData) ? rolesData : []
        const withClient = list.some(r => r.name === 'CLIENT')
          ? list
          : [{ name: 'CLIENT', label: 'Client', description: 'Achète sur votre boutique (espace client).' }, ...list]
        setRoles(withClient)
        setSegments(Array.isArray(segmentsData) ? segmentsData : [])
        // Default selections
        const rolesArr = withClient
        const segArr = Array.isArray(segmentsData) ? segmentsData : []
        const clientRole = rolesArr.find(r => r.name === 'CLIENT')
        if (clientRole) setSelectedRole(clientRole.name)
        else if (rolesArr.length > 0) setSelectedRole(rolesArr[0].name)

        const nouveauSeg = segArr.find(s => s.name === 'NOUVEAU')
        if (nouveauSeg) setForm(prev => ({ ...prev, segment: nouveauSeg.name }))
        else if (segArr.length > 0) setForm(prev => ({ ...prev, segment: segArr[0].name }))
      } catch {
        toast.error('Erreur lors du chargement des données')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  const set = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }))
  const setE = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  // ── Validation ────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.prenom.trim()) e.prenom = 'Obligatoire'
    if (!form.nom.trim()) e.nom = 'Obligatoire'
    if (!form.email.trim()) e.email = 'Obligatoire'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return toast.error('Veuillez corriger les erreurs.')
    setSubmitting(true)
    try {
      const payload = {
        firstName: form.prenom.trim(),
        lastName: form.nom.trim(),
        email: form.email.trim(),
        phone: form.telephone.trim() || null,
        dateOfBirth: form.dateNaissance || null,
        gender: form.genre || null,
        address: form.adresse.trim() || null,
        city: form.ville.trim() || null,
        postalCode: form.codePostal.trim() || null,
        country: form.pays,
        role: selectedRole,
        segment: form.segment || null,
        note: form.notes.trim() || null,
      }
      await apiClient.post('/admin/users', payload)
      toast.success(`Compte créé : ${form.email.trim()} a reçu son mot de passe temporaire par e-mail.`)
      navigate('/clients')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la création du compte'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  const selectedRoleObj = roles.find(r => r.name === selectedRole)
  const selectedSegObj = segments.find(s => s.name === form.segment)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      <PageHeader title="Ajouter un compte">
        <PageHeader.SecondaryBtn icon="arrow_back" onClick={() => navigate('/clients')}>
          Retour
        </PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="person_add" onClick={handleSubmit}>
          {submitting ? 'Création…' : 'Créer le compte'}
        </PageHeader.PrimaryBtn>
      </PageHeader>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6" noValidate>

        {/* ══ LEFT COLUMN ══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations personnelles */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-badge/10 text-badge rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">person</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Informations personnelles</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Prénom" required error={errors.prenom}>
                <FormInput value={form.prenom} onChange={setE('prenom')} placeholder="Jean" hasError={!!errors.prenom} />
              </Field>
              <Field label="Nom" required error={errors.nom}>
                <FormInput value={form.nom} onChange={setE('nom')} placeholder="Dupont" hasError={!!errors.nom} />
              </Field>
              <Field label="Email" required error={errors.email}>
                <FormInput value={form.email} onChange={setE('email')} placeholder="jean.dupont@email.com" type="email" hasError={!!errors.email} />
              </Field>
              <Field label="Téléphone">
                <FormInput value={form.telephone} onChange={setE('telephone')} placeholder="+33 6 12 34 56 78" type="tel" />
              </Field>
              <Field label="Date de naissance">
                <FormInput value={form.dateNaissance} onChange={setE('dateNaissance')} placeholder="" type="date" />
              </Field>
              <Field label="Genre">
                <CustomSelect
                  value={form.genre ? (form.genre === 'HOMME' ? 'Homme' : 'Femme') : 'Non spécifié'}
                  onChange={(val) => {
                    if (val === 'Non spécifié') setForm(p => ({ ...p, genre: '' }))
                    else setForm(p => ({ ...p, genre: val === 'Homme' ? 'HOMME' : 'FEMME' }))
                  }}
                  options={['Non spécifié', 'Homme', 'Femme']}
                />
              </Field>
            </div>
          </div>

          {/* Adresse */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">location_on</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Adresse <span className="text-slate-400 font-normal">(optionnel)</span></h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Adresse">
                  <FormInput value={form.adresse} onChange={setE('adresse')} placeholder="12 rue de la Paix" />
                </Field>
              </div>
              <Field label="Ville">
                <select
                  value={form.ville}
                  onChange={setE('ville')}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all border-slate-200"
                >
                  <option value="">— Sélectionner —</option>
                  {TUNISIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Code postal">
                <FormInput value={form.codePostal} onChange={setE('codePostal')} placeholder="75001" />
              </Field>
              <Field label="Pays">
                <CustomSelect value={form.pays} onChange={set('pays')} options={paysOptions} />
              </Field>
            </div>
          </div>

          {/* Accès & mot de passe */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">lock</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Accès au compte</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <span className="material-symbols-outlined text-brand">mark_email_read</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Mot de passe temporaire envoyé par e-mail</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    La personne reçoit ses identifiants à l'adresse ci-dessus. Ce mot de passe ne fonctionne qu'une fois :
                    à la première connexion, elle doit en choisir un nouveau.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="space-y-6">

          {/* Sélection du rôle */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">shield_person</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Rôle du compte</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Définit les droits d'accès</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {roles.map(r => {
                const cfg = roleIconMap[r.name] || defaultRoleIcon
                return (
                  <button key={r.name} type="button" onClick={() => setSelectedRole(r.name)}
                    className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${selectedRole === r.name ? 'border-brand ring-2 ring-brand/20 bg-brand/3' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                      <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">{r.label}</p>
                        {selectedRole === r.name && (
                          <span className="w-4 h-4 rounded-full bg-brand flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-white text-[11px]">check</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{r.description || ''}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Segmentation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-badge/10 text-badge rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">tune</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Segmentation</h3>
            </div>
            <div className="p-5">
              <Field label="Segment client">
                <CustomSelect
                  value={segments.find(s => s.name === form.segment)?.label || 'Sélectionner'}
                  onChange={(label) => {
                    const seg = segments.find(s => s.label === label)
                    if (seg) setForm(p => ({ ...p, segment: seg.name }))
                  }}
                  options={segments.map(s => s.label)}
                />
              </Field>
            </div>
          </div>

          {/* Notes internes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">sticky_note_2</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Notes internes</h3>
            </div>
            <div className="p-5">
              <textarea value={form.notes} onChange={setE('notes')} rows={4} placeholder="Remarques visibles uniquement par les admins..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm resize-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white outline-none transition-all" />
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-brand/5 border border-brand/10 rounded-xl p-5 space-y-3">
            <p className="text-xs font-bold text-brand uppercase tracking-wider">Récapitulatif</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nom complet</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{form.prenom || '—'} {form.nom}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{form.email || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Rôle</span>
                <span className="font-semibold text-slate-800">{selectedRoleObj?.label || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Segment</span>
                <span className="font-semibold text-slate-800">{selectedSegObj?.label || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Identifiants</span>
                <span className="font-semibold text-brand">Envoyés par e-mail</span>
              </div>
            </div>
          </div>

          {/* Boutons bas */}
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={submitting} className="w-full py-3 bg-btn text-white font-bold text-sm rounded-xl hover:bg-btn-dark transition-all shadow-lg shadow-btn/20 flex items-center justify-center gap-2 disabled:opacity-60">
              <span className="material-symbols-outlined text-lg">person_add</span>
              {submitting ? 'Création en cours…' : 'Créer le compte'}
            </button>
            <button type="button" onClick={() => navigate('/clients')} className="w-full py-2.5 bg-slate-100 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-all">
              Annuler
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}
