import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import Spinner from '../components/ui/Spinner'

const paysOptions = ['France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Tunisie', 'Algérie', 'États-Unis', 'Allemagne', 'Autre']

const roleIconMap = {
  SUPER_ADMIN: { icon: 'admin_panel_settings', iconBg: 'bg-red-50 text-red-600' },
  ADMIN:       { icon: 'manage_accounts',      iconBg: 'bg-slate-100 text-slate-600' },
  CLIENT:      { icon: 'person',               iconBg: 'bg-badge/10 text-badge' },
}

const statusBadge = {
  ACTIVE:  { cls: 'bg-badge/10 text-badge', label: 'Actif' },
  BLOCKED: { cls: 'bg-red-100 text-red-600',         label: 'Bloqué' },
}

/* ── Toggle ─────────────────────────────────────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-brand' : 'bg-slate-300'}`}>
      <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

/* ── Main Component ──────────────────────────────────────────────────────────── */
export default function DetailClient() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [client, setClient]     = useState(null)
  const [roles, setRoles]       = useState([])
  const [segments, setSegments] = useState([])

  /* ── Form state ── */
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender,    setGender]    = useState('')
  const [address,   setAddress]   = useState('')
  const [city,      setCity]      = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country,   setCountry]   = useState('')
  const [segment,   setSegment]   = useState('')
  const [role,      setRole]      = useState('')
  const [note,      setNote]      = useState('')
  const [status,    setStatus]    = useState('')

  const [notifEmail,  setNotifEmail]  = useState(true)
  const [notifSMS,    setNotifSMS]    = useState(false)
  const [newsletter,  setNewsletter]  = useState(true)
  const [saveConfirm, setSaveConfirm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  /* ── Original values ref (to detect changes) ── */
  const originalRef = useRef({})

  /* ── Load data ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [userRes, rolesRes, segmentsRes] = await Promise.all([
        apiClient.get(`/admin/users/${id}`),
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/segments'),
      ])
      const u = userRes.data
      setClient(u)
      setFirstName(u.firstName || '')
      setLastName(u.lastName || '')
      setEmail(u.email || '')
      setPhone(u.phone || '')
      setDateOfBirth(u.dateOfBirth || '')
      setGender(u.gender || '')
      setAddress(u.address || '')
      setCity(u.city || '')
      setPostalCode(u.postalCode || '')
      setCountry(u.country || '')
      setSegment(u.segmentName || '')
      setRole(u.roleName || '')
      setNote(u.note || '')
      setStatus(u.status || '')
      originalRef.current = {
        firstName: u.firstName || '', lastName: u.lastName || '',
        email: u.email || '', phone: u.phone || '',
        dateOfBirth: u.dateOfBirth || '', gender: u.gender || '',
        address: u.address || '', city: u.city || '',
        postalCode: u.postalCode || '', country: u.country || '',
        segment: u.segmentName || '', role: u.roleName || '',
        note: u.note || '', status: u.status || '',
      }
      const rolesData = rolesRes.data.data || rolesRes.data
      setRoles(Array.isArray(rolesData) ? rolesData : [])
      const segmentsData = segmentsRes.data.data || segmentsRes.data
      setSegments(Array.isArray(segmentsData) ? segmentsData : [])
    } catch {
      toast.error('Impossible de charger les données du client')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Detect changes ── */
  const fieldLabels = {
    firstName: 'Prénom', lastName: 'Nom', email: 'Email', phone: 'Téléphone',
    dateOfBirth: 'Date de naissance', gender: 'Genre', address: 'Adresse',
    city: 'Ville', postalCode: 'Code postal', country: 'Pays',
    segment: 'Segment', role: 'Rôle', note: 'Notes', status: 'Statut',
  }

  const getChanges = () => {
    const current = { firstName, lastName, email, phone, dateOfBirth, gender, address, city, postalCode, country, segment, role, note, status }
    const orig = originalRef.current
    const changes = []
    for (const key of Object.keys(fieldLabels)) {
      if ((current[key] || '') !== (orig[key] || '')) {
        changes.push({ field: fieldLabels[key], oldVal: orig[key] || '—', newVal: current[key] || '—' })
      }
    }
    return changes
  }

  /* ── Show confirmation before saving ── */
  const handleSaveClick = () => {
    const changes = getChanges()
    if (changes.length === 0) {
      toast.info('Aucune modification détectée.')
      return
    }
    setSaveConfirm(changes)
  }

  /* ── Save ── */
  const handleSave = async () => {
    setSaveConfirm(null)
    setSaving(true)
    try {
      const payload = {
        firstName, lastName, email, phone,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        address, city, postalCode, country,
        segment: segment || null,
        role: role || null,
        note,
        status: status || null,
      }
      await apiClient.put(`/admin/users/${id}`, payload)
      toast.success('Profil mis à jour avec succès !')
      navigate('/clients')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ── */
  const handleDelete = async () => {
    setDeleteConfirm(false)
    try {
      await apiClient.delete(`/admin/users/${id}`)
      toast.success('Client supprimé avec succès')
      navigate('/clients')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  /* ── Toggle status ── */
  const handleToggleStatus = async () => {
    const newStatus = status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    try {
      await apiClient.put(`/admin/users/${id}`, { status: newStatus })
      setStatus(newStatus)
      toast.success(`Compte ${newStatus === 'ACTIVE' ? 'activé' : 'désactivé'}`)
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  /* ── Helpers ── */
  const fullName = `${firstName} ${lastName}`.trim() || '—'
  const initials = `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
  const memberSince = client?.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '—'
  const lastLogin = client?.lastLogin ? new Date(client.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'
  const segmentOptions = segments.map(s => ({ value: s.name, label: s.label }))
  const currentSegment = segments.find(s => s.name === segment)
  const currentRole = roles.find(r => r.name === role)
  const stBadge = statusBadge[status] || statusBadge.ACTIVE

  const FieldLabel = ({ children, required }) => (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all'

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>
  if (!client) return <div className="p-6 text-center text-slate-500">Client introuvable.</div>

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* ── Header ── */}
      <PageHeader title={fullName}>
        <PageHeader.DangerBtn icon="delete" onClick={() => setDeleteConfirm(true)}>Supprimer</PageHeader.DangerBtn>
        <PageHeader.SecondaryBtn icon="mail" onClick={() => toast.info('Email envoyé !')}>Contacter</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="save" onClick={handleSaveClick}>{saving ? 'Enregistrement...' : 'Sauvegarder'}</PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total dépensé"   value="—" sub="Module commandes à venir"  subColor="text-slate-400" icon="payments"      iconBg="bg-badge/10 text-badge" />
        <KpiCard label="Commandes"        value="—" sub="Module commandes à venir"  subColor="text-slate-400" icon="shopping_bag"   iconBg="bg-slate-50 text-slate-400" />
        <KpiCard label="Statut"           value={stBadge.label} sub={`Depuis ${memberSince}`} subColor="text-slate-400" icon="verified_user"  iconBg="bg-blue-50 text-blue-500" />
        <KpiCard label="Client depuis"    value={memberSince} sub={`Dernière connexion: ${lastLogin}`} subColor="text-brand" icon="calendar_today" iconBg="bg-slate-50 text-slate-400" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ══ LEFT 2/3 ══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations personnelles */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-badge/10 text-badge rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">person</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Informations personnelles</h3>
              <span className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold font-badge uppercase ${stBadge.cls}`}>{stBadge.label}</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel required>Prénom</FieldLabel>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel required>Nom</FieldLabel>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel required>Email</FieldLabel>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Téléphone</FieldLabel>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Date de naissance</FieldLabel>
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Genre</FieldLabel>
                <CustomSelect value={gender} onChange={setGender} options={[
                  { value: 'HOMME', label: 'Homme' },
                  { value: 'FEMME', label: 'Femme' },
                ]} />
              </div>
              <div>
                <FieldLabel>Adresse</FieldLabel>
                <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Ville</FieldLabel>
                <input value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Code postal</FieldLabel>
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Pays</FieldLabel>
                <CustomSelect value={country} onChange={setCountry} options={paysOptions} />
              </div>
            </div>
          </div>

          {/* Historique des commandes — placeholder */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Historique des commandes</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Module commandes pas encore disponible</p>
              </div>
            </div>
            <div className="py-12 text-center text-slate-400 text-sm">
              <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">shopping_bag</span>
              Le module de commandes sera disponible prochainement.
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
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
                placeholder="Remarques visibles uniquement par l'équipe Back Office..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all" />
            </div>
          </div>

        </div>

        {/* ══ RIGHT 1/3 ═════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Profil client */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-badge/10 text-badge flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{fullName}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">ID: {client.id}</p>
              </div>
            </div>
          </div>

          {/* Rôle du compte */}
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
            <div className="p-4 space-y-2">
              {roles.map(r => {
                const iconCfg = roleIconMap[r.name] || { icon: 'person', iconBg: 'bg-slate-100 text-slate-600' }
                return (
                  <button key={r.name} type="button" onClick={() => setRole(r.name)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${role === r.name ? 'border-brand ring-2 ring-brand/20 bg-brand/3' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCfg.iconBg}`}>
                      <span className="material-symbols-outlined text-[16px]">{iconCfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">{r.label || r.name}</p>
                        {role === r.name && (
                          <span className="w-4 h-4 rounded-full bg-brand flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-white text-[11px]">check</span>
                          </span>
                        )}
                      </div>
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
              <CustomSelect value={segment} onChange={setSegment} options={segmentOptions} />
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">notifications</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Notifications email', value: notifEmail, onChange: setNotifEmail },
                { label: 'Notifications SMS',   value: notifSMS,   onChange: setNotifSMS },
                { label: 'Newsletter',           value: newsletter, onChange: setNewsletter },
              ].map(({ label, value, onChange }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{label}</span>
                  <Toggle value={value} onChange={onChange} />
                </div>
              ))}
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-brand/5 border border-brand/10 rounded-xl p-5 space-y-3">
            <p className="text-xs font-bold text-brand uppercase tracking-wider">Récapitulatif</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nom</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{fullName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{email || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Rôle</span>
                <span className="font-semibold text-slate-800">{currentRole?.label || role || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Segment</span>
                <span className="font-semibold text-slate-800">{currentSegment?.label || segment || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Statut</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-badge uppercase ${stBadge.cls}`}>{stBadge.label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Membre depuis</span>
                <span className="font-semibold text-slate-800">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">bolt</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Actions rapides</h3>
            </div>
            <div className="p-4 space-y-2">
              <button type="button" onClick={() => toast.info('Email envoyé !')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                <span className="material-symbols-outlined text-lg text-blue-500">mail</span>Envoyer un email
              </button>
              <button type="button" onClick={handleToggleStatus} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-red-100 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all">
                <span className="material-symbols-outlined text-lg">{status === 'ACTIVE' ? 'block' : 'check_circle'}</span>
                {status === 'ACTIVE' ? 'Désactiver le compte' : 'Activer le compte'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center px-8 pt-8 pb-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Supprimer ce client ?</h3>
              <p className="text-sm text-slate-500 mt-2">
                Êtes-vous sûr de vouloir supprimer <strong className="text-slate-700">"{fullName}"</strong> ?
              </p>
              <p className="text-xs text-slate-400 mt-2">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3 px-8 py-6">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">delete</span>
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Save Confirmation Modal ── */}
      {saveConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSaveConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center px-8 pt-8 pb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-blue-600 text-2xl">edit_note</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Confirmer les modifications ?</h3>
              <p className="text-sm text-slate-500 mt-1">Vous avez modifié {saveConfirm.length} champ{saveConfirm.length > 1 ? 's' : ''} :</p>
            </div>
            <div className="px-8 pb-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {saveConfirm.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="material-symbols-outlined text-brand text-lg mt-0.5">swap_horiz</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.field}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-red-500 line-through truncate max-w-[40%]">{c.oldVal}</span>
                        <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
                        <span className="text-brand font-semibold truncate max-w-[40%]">{c.newVal}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-8 py-6 border-t border-slate-100">
              <button onClick={() => setSaveConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand/90 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">check</span>
                Confirmer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
