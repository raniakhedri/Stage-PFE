import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import Spinner from '../components/ui/Spinner'

// ── Permission module labels (French) — matches sidebar pages ──────────────
const MODULE_LABELS = {
  TABLEAU_DE_BORD:    'Tableau de bord',
  PRODUITS:           'Produits',
  COMMANDES:          'Commandes',
  RETOURS:            'Retours',
  CLIENTS:            'Clients',
  ANALYSES:           'Analyses',
  COLLECTIONS:        'Collections',
  CATEGORIES:         'Catégories',
  BANNIERES:          'Bannières',
  TVA_LIVRAISON:      'TVA & Livraison',
  PROMOTIONS:         'Promotions',
  EMAIL_MARKETING:    'Email Marketing',
  AVIS:               'Avis',
  APPARENCE:          'Apparence',
  ROLES_PERMISSIONS:  'Rôles & Permissions',
  COMPTE_HEBERGEMENT: 'Compte & Hébergement',
}

// ── Section grouping for the matrix ────────────────────────────────────────────
const MODULE_SECTIONS = [
  { title: 'Navigation principale', icon: 'menu', keys: ['TABLEAU_DE_BORD', 'PRODUITS', 'COMMANDES', 'RETOURS', 'CLIENTS', 'ANALYSES', 'COLLECTIONS', 'CATEGORIES', 'BANNIERES', 'TVA_LIVRAISON'] },
  { title: 'Marketing',             icon: 'campaign', keys: ['PROMOTIONS', 'EMAIL_MARKETING', 'AVIS'] },
  { title: 'Paramètres',            icon: 'settings', keys: ['APPARENCE', 'ROLES_PERMISSIONS', 'COMPTE_HEBERGEMENT'] },
]

// ── Role card styling ──────────────────────────────────────────────────────────
const ROLE_ICONS = {
  SUPER_ADMIN: { icon: 'admin_panel_settings', iconBg: 'bg-badge/10 text-badge', border: 'border-2 border-badge/20 hover:border-badge' },
  ADMIN:       { icon: 'manage_accounts',      iconBg: 'bg-slate-100 text-slate-500', border: 'border border-slate-200 hover:shadow-md' },
  CLIENT:      { icon: 'shopping_cart',         iconBg: 'bg-blue-50 text-blue-500',   border: 'border border-slate-200 hover:shadow-md' },
}
const DEFAULT_ICON = { icon: 'shield_person', iconBg: 'bg-slate-100 text-slate-500', border: 'border border-slate-200 hover:shadow-md' }

const roleBadgeClass = (name) => {
  if (name === 'SUPER_ADMIN') return 'bg-badge/10 text-badge'
  if (name === 'ADMIN') return 'bg-slate-100 text-slate-600'
  return 'bg-blue-50 text-blue-600'
}

const statusCfg = {
  ACTIVE:    { cls: 'bg-badge/10 text-badge', dot: 'bg-badge', label: 'Actif'     },
  SUSPENDED: { cls: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-500',   label: 'Suspendu'  },
  BANNED:    { cls: 'bg-red-50 text-red-600',          dot: 'bg-red-500',     label: 'Banni'     },
}
const defaultStatus = { cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', label: 'Inconnu' }

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RolesPermissions() {
  // Data state
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Permissions matrix state
  const [matrix, setMatrix] = useState({})   // { roleId: { MODULE_KEY: bool } }
  const [savingMatrix, setSavingMatrix] = useState(false)

  // Users search
  const [search, setSearch] = useState('')

  // Create / Edit role modal
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null) // null = create, object = edit
  const [roleForm, setRoleForm] = useState({ name: '', label: '', description: '', permissions: {} })
  const [savingRole, setSavingRole] = useState(false)

  // Delete confirmation
  const [deletingRole, setDeletingRole] = useState(null)

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, usersRes, statsRes] = await Promise.all([
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/users', { params: { size: 100 } }),
        apiClient.get('/admin/users/stats'),
      ])

      const rolesData = rolesRes.data.data || rolesRes.data
      setRoles(rolesData)

      // Build matrix from roles
      const m = {}
      rolesData.forEach((r) => { m[r.id] = { ...r.permissions } })
      setMatrix(m)

      const usersData = usersRes.data.content || usersRes.data
      setUsers(Array.isArray(usersData) ? usersData : [])

      setStats(statsRes.data)
    } catch (err) {
      toast.error('Erreur lors du chargement des données')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Matrix toggle + save ───────────────────────────────────────────────────
  const togglePerm = (roleId, moduleKey) => {
    const role = roles.find((r) => r.id === roleId)
    if (role?.name === 'SUPER_ADMIN') return // Super Admin always full
    setMatrix((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [moduleKey]: !prev[roleId]?.[moduleKey] },
    }))
  }

  const handleSaveMatrix = async () => {
    setSavingMatrix(true)
    try {
      const promises = roles
        .filter((r) => r.name !== 'SUPER_ADMIN')
        .map((r) =>
          apiClient.put(`/admin/roles/${r.id}/permissions`, {
            permissions: matrix[r.id],
          })
        )
      await Promise.all(promises)
      toast.success('Permissions sauvegardées !')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingMatrix(false)
    }
  }

  // ── Create / Edit role ─────────────────────────────────────────────────────
  const openCreateModal = () => {
    const perms = {}
    Object.keys(MODULE_LABELS).forEach((k) => { perms[k] = false })
    setEditingRole(null)
    setRoleForm({ name: '', label: '', description: '', permissions: perms })
    setShowModal(true)
  }

  const openEditModal = (role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      label: role.label || '',
      description: role.description || '',
      permissions: { ...role.permissions },
    })
    setShowModal(true)
  }

  const handleSaveRole = async (e) => {
    e.preventDefault()
    setSavingRole(true)
    try {
      if (editingRole) {
        await apiClient.put(`/admin/roles/${editingRole.id}`, roleForm)
        toast.success('Rôle modifié avec succès')
      } else {
        await apiClient.post('/admin/roles', roleForm)
        toast.success('Rôle créé avec succès')
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde du rôle')
    } finally {
      setSavingRole(false)
    }
  }

  // ── Delete role ────────────────────────────────────────────────────────────
  const handleDeleteRole = async () => {
    if (!deletingRole) return
    try {
      await apiClient.delete(`/admin/roles/${deletingRole.id}`)
      toast.success(`Rôle "${deletingRole.label}" supprimé`)
      setDeletingRole(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  // ── Filtered users ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  // ── Helpers for role card permission preview ───────────────────────────────
  const topPerms = (role) => {
    const entries = Object.entries(role.permissions || {})
    const granted = entries.filter(([, v]) => v).slice(0, 3)
    const denied  = entries.filter(([, v]) => !v).slice(0, 1)
    return [...granted, ...denied].map(([key, val]) => ({
      label: MODULE_LABELS[key] || key,
      granted: val,
    }))
  }

  const moduleKeys = Object.keys(MODULE_LABELS)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {/* ── Page Header ── */}
      <PageHeader title="Rôles & Permissions">
        <PageHeader.PrimaryBtn icon="add_moderator" onClick={openCreateModal}>
          Créer un Rôle
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          label="Utilisateurs Actifs"
          value={stats?.activeClients ?? '–'}
          icon="group"
          iconBg="bg-slate-50 text-slate-400"
        />
        <KpiCard
          label="Rôles Configurés"
          value={roles.length}
          icon="shield_person"
          iconBg="bg-slate-50 text-slate-400"
        />
        <KpiCard
          label="Total Administrateurs"
          value={stats?.totalAdmins ?? '–'}
          icon="admin_panel_settings"
          iconBg="bg-slate-50 text-slate-400"
        />
      </div>

      {/* ── Roles Section ── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-base font-bold text-slate-800">Rôles configurés</h3>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const style = ROLE_ICONS[role.name] || DEFAULT_ICON
            return (
              <div
                key={role.id}
                className={`bg-white rounded-custom ${style.border} p-6 shadow-sm flex flex-col transition-all`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-2xl">{style.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {role.userCount} Utilisateur{role.userCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-800">{role.label || role.name}</h4>
                <p className="text-slate-500 text-xs mt-2 mb-4 leading-relaxed flex-1">
                  {role.description || 'Aucune description.'}
                </p>
                <div className="space-y-2 mb-5">
                  {topPerms(role).map((p) => (
                    <div key={p.label} className="flex items-center gap-2 text-[11px] font-medium">
                      <span className={`material-symbols-outlined text-[16px] ${p.granted ? 'text-brand' : 'text-slate-300'}`}>
                        {p.granted ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={p.granted ? 'text-slate-600' : 'text-slate-400'}>{p.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Modifier
                  </button>
                  {role.name !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() => setDeletingRole(role)}
                      className="py-2 px-3 rounded-lg border border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Permissions Matrix ── */}
      <section className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-base">Matrice des Permissions</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3 text-left" style={{ width: '40%' }}>Page</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-3 py-3 text-center" style={{ width: `${60 / Math.max(roles.length, 1)}%` }}>
                    {r.label || r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_SECTIONS.map((section) => (
                <>
                  <tr key={section.title} className="bg-slate-50/50">
                    <td colSpan={roles.length + 1} className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>{section.icon}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</span>
                      </div>
                    </td>
                  </tr>
                  {section.keys.map((moduleKey) => (
                    <tr key={moduleKey} className="border-t border-slate-100/80 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-2 text-[13px] font-medium text-slate-700">{MODULE_LABELS[moduleKey]}</td>
                      {roles.map((r) => (
                        <td key={r.id} className="px-3 py-2">
                          <div className="flex items-center justify-center">
                            {r.name === 'SUPER_ADMIN' ? (
                              <span className="material-symbols-outlined text-brand" style={{ fontSize: '18px' }}>check_circle</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => togglePerm(r.id, moduleKey)}
                                className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${matrix[r.id]?.[moduleKey] ? 'bg-brand border-brand' : 'border-slate-300 hover:border-slate-400'}`}
                              >
                                {matrix[r.id]?.[moduleKey] && (
                                  <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>check</span>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{moduleKeys.length} pages · {roles.length} rôles</span>
          <button
            onClick={handleSaveMatrix}
            disabled={savingMatrix}
            className="bg-brand text-white px-5 py-2 rounded-custom font-bold text-xs hover:bg-brand-dark transition-all shadow-sm disabled:opacity-50"
          >
            {savingMatrix ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </section>

      {/* ── Users Table ── */}
      <section className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h4 className="font-bold text-slate-800 text-base">Liste des Utilisateurs</h4>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <span className="material-symbols-outlined text-xl">search</span>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 bg-slate-50/50 rounded-custom text-sm focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-4">Utilisateur</th>
                <th className="px-8 py-4">Rôle</th>
                <th className="px-8 py-4">Dernière connexion</th>
                <th className="px-8 py-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">Aucun utilisateur trouvé.</td>
                </tr>
              )}
              {filteredUsers.map((user) => {
                const sta = statusCfg[user.status] || defaultStatus
                const initials = `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()
                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          user.roleName === 'SUPER_ADMIN' ? 'bg-badge/10 text-badge' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${roleBadgeClass(user.roleName)}`}>
                        {user.roleLabel || user.roleName}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs text-slate-500 font-medium">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Jamais'}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-badge ${sta.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
                        {sta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-[11px] font-medium text-slate-500">
          Affichage de {filteredUsers.length} sur {users.length} utilisateurs
        </div>
      </section>

      {/* ── Create / Edit Role Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveRole}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base">
                  {editingRole ? `Modifier le rôle : ${editingRole.label || editingRole.name}` : 'Créer un nouveau rôle'}
                </h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nom (clé système)</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="EX: MANAGER"
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
                {/* Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Libellé</label>
                  <input
                    type="text"
                    value={roleForm.label}
                    onChange={(e) => setRoleForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Ex: Gestionnaire"
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                  />
                </div>
                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Description du rôle..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand focus:border-brand outline-none resize-none"
                  />
                </div>
                {/* Permissions */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Permissions par page</label>
                  <div className="space-y-4">
                    {MODULE_SECTIONS.map((section) => (
                      <div key={section.title}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '14px' }}>{section.icon}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</span>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {section.keys.map((key) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group py-1">
                              <input
                                type="checkbox"
                                checked={!!roleForm.permissions[key]}
                                onChange={() =>
                                  setRoleForm((f) => ({
                                    ...f,
                                    permissions: { ...f.permissions, [key]: !f.permissions[key] },
                                  }))
                                }
                                className="rounded border-slate-300 text-brand focus:ring-brand/30 size-4 cursor-pointer"
                              />
                              <span className="text-sm text-slate-700 group-hover:text-slate-900">{MODULE_LABELS[key]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-6 py-2 bg-brand text-white rounded-xl font-bold text-xs hover:bg-brand-dark shadow-sm disabled:opacity-50"
                >
                  {savingRole ? 'Enregistrement…' : editingRole ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-2">Supprimer le rôle</h3>
            <p className="text-sm text-slate-500 mb-6">
              Voulez-vous vraiment supprimer le rôle <strong>{deletingRole.label || deletingRole.name}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeletingRole(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteRole}
                className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
