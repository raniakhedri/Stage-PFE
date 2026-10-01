import { Fragment, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import Spinner from '../components/ui/Spinner'
import { readUser } from '../lib/sellio'

// ── Pages a role can open (same keys as the server) ────────────────────────────
const MODULE_LABELS = {
  TABLEAU_DE_BORD:    'Tableau de bord',
  PRODUITS:           'Produits',
  COMMANDES:          'Commandes',
  RETOURS:            'Retours',
  CLIENTS:            'Clients',
  COLLECTIONS:        'Collections',
  CATEGORIES:         'Catégories',
  BANNIERES:          'Bannières',
  TVA_LIVRAISON:      'TVA & Livraison',
  PROMOTIONS:         'Promotions & Fidélité',
  EMAIL_MARKETING:    'Email Marketing',
  AVIS:               'Avis',
  ANALYSES:           'Comportement & IA',
  APPARENCE:          'Apparence & boutique',
  ROLES_PERMISSIONS:  'Rôles & équipe',
  COMPTE_HEBERGEMENT: 'Compte & Hébergement',
}

const MODULE_SECTIONS = [
  { title: 'Navigation principale', icon: 'menu', keys: ['TABLEAU_DE_BORD', 'PRODUITS', 'COMMANDES', 'RETOURS', 'CLIENTS', 'COLLECTIONS', 'CATEGORIES', 'BANNIERES', 'TVA_LIVRAISON'] },
  { title: 'Marketing', icon: 'campaign', keys: ['PROMOTIONS', 'EMAIL_MARKETING', 'AVIS', 'ANALYSES'] },
  { title: 'Paramètres', icon: 'settings', keys: ['APPARENCE', 'ROLES_PERMISSIONS', 'COMPTE_HEBERGEMENT'] },
]
const MODULE_KEYS = Object.keys(MODULE_LABELS)

const STATUS = {
  ACTIVE:   { cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Actif' },
  INACTIVE: { cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', label: 'Désactivé' },
  BLOCKED:  { cls: 'bg-red-50 text-red-600', dot: 'bg-red-500', label: 'Bloqué' },
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand focus:border-brand outline-none'
const emptyPerms = () => Object.fromEntries(MODULE_KEYS.map((k) => [k, false]))
const errorOf = (err, fallback) => err.response?.data?.message || err.response?.data?.error || fallback

function Modal({ title, onClose, children, footer, onSubmit, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <form onSubmit={onSubmit} className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">{footer}</div>
      </form>
    </div>
  )
}

export default function RolesPermissions() {
  const me = readUser()
  const platform = me.roleName === 'SUPER_ADMIN'

  const [roles, setRoles] = useState([])
  const [team, setTeam] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const [matrix, setMatrix] = useState({})
  const [savingMatrix, setSavingMatrix] = useState(false)

  const [roleModal, setRoleModal] = useState(null) // null | { id?, label, description, name?, permissions }
  const [savingRole, setSavingRole] = useState(false)
  const [deletingRole, setDeletingRole] = useState(null)

  const [inviteModal, setInviteModal] = useState(null) // null | { firstName, lastName, email, phone, roleId }
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, statsRes, teamRes] = await Promise.all([
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/users/stats'),
        platform ? Promise.resolve({ data: [] }) : apiClient.get('/admin/users/team'),
      ])
      const rolesData = (rolesRes.data.data || rolesRes.data || []).filter((r) => r.name !== 'CLIENT')
      setRoles(rolesData)
      setMatrix(Object.fromEntries(rolesData.map((r) => [r.id, { ...r.permissions }])))
      setStats(statsRes.data)
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : [])
    } catch (err) {
      toast.error(errorOf(err, 'Erreur lors du chargement des données'))
    } finally {
      setLoading(false)
    }
  }, [platform])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Matrix ────────────────────────────────────────────────────────────────
  const editable = (role) => role.name !== 'SUPER_ADMIN'
  const togglePerm = (role, key) => {
    if (!editable(role)) return
    setMatrix((prev) => ({ ...prev, [role.id]: { ...prev[role.id], [key]: !prev[role.id]?.[key] } }))
  }
  const saveMatrix = async () => {
    setSavingMatrix(true)
    try {
      await Promise.all(roles.filter(editable).map((r) =>
        apiClient.put(`/admin/roles/${r.id}/permissions`, { permissions: matrix[r.id] })))
      toast.success('Permissions enregistrées. Elles s’appliquent à la prochaine connexion des membres.')
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Erreur lors de la sauvegarde'))
    } finally {
      setSavingMatrix(false)
    }
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  const saveRole = async (e) => {
    e.preventDefault()
    setSavingRole(true)
    const payload = {
      name: platform ? roleModal.name : undefined,
      label: roleModal.label,
      description: roleModal.description,
      permissions: roleModal.permissions,
    }
    try {
      if (roleModal.id) await apiClient.put(`/admin/roles/${roleModal.id}`, payload)
      else await apiClient.post('/admin/roles', payload)
      toast.success(roleModal.id ? 'Rôle modifié' : 'Rôle créé')
      setRoleModal(null)
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Erreur lors de la sauvegarde du rôle'))
    } finally {
      setSavingRole(false)
    }
  }

  const deleteRole = async () => {
    try {
      await apiClient.delete(`/admin/roles/${deletingRole.id}`)
      toast.success(`Rôle « ${deletingRole.label} » supprimé`)
      setDeletingRole(null)
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Erreur lors de la suppression'))
    }
  }

  // ── Team ──────────────────────────────────────────────────────────────────
  const openInvite = () => {
    if (roles.length === 0) {
      toast.info('Créez d’abord un rôle : il définit les pages que le membre pourra ouvrir.')
      setRoleModal({ label: '', description: '', permissions: emptyPerms() })
      return
    }
    setInviteModal({ firstName: '', lastName: '', email: '', phone: '', roleId: roles[0].id })
  }

  const invite = async (e) => {
    e.preventDefault()
    setInviting(true)
    try {
      await apiClient.post('/admin/users/team', inviteModal)
      toast.success(`${inviteModal.email} a reçu son mot de passe temporaire par e-mail.`)
      setInviteModal(null)
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Invitation impossible'))
    } finally {
      setInviting(false)
    }
  }

  const changeRole = async (member, roleId) => {
    try {
      await apiClient.patch(`/admin/users/team/${member.id}/role`, { roleId: Number(roleId) })
      toast.success(`Rôle de ${member.firstName} mis à jour`)
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Modification impossible'))
    }
  }

  const toggleStatus = async (member) => {
    const status = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await apiClient.patch(`/admin/users/${member.id}/status`, { status })
      toast.success(status === 'ACTIVE' ? 'Accès réactivé' : 'Accès désactivé')
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Modification impossible'))
    }
  }

  const resendInvite = async (member) => {
    try {
      await apiClient.post(`/admin/users/team/${member.id}/resend-invite`)
      toast.success(`Nouveau mot de passe temporaire envoyé à ${member.email}`)
    } catch (err) {
      toast.error(errorOf(err, 'Envoi impossible'))
    }
  }

  const removeMember = async () => {
    try {
      await apiClient.delete(`/admin/users/team/${removing.id}`)
      toast.success(`${removing.firstName} ne fait plus partie de l’équipe`)
      setRemoving(null)
      fetchData()
    } catch (err) {
      toast.error(errorOf(err, 'Suppression impossible'))
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>
  }

  const shown = team.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
  const granted = (role) => MODULE_KEYS.filter((k) => role.permissions?.[k])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      <PageHeader title={platform ? 'Rôles de la plateforme' : 'Rôles & équipe'}>
        <PageHeader.SecondaryBtn icon="add_moderator" onClick={() => setRoleModal({ label: '', name: '', description: '', permissions: emptyPerms() })}>
          Créer un rôle
        </PageHeader.SecondaryBtn>
        {!platform && (
          <PageHeader.PrimaryBtn icon="person_add" onClick={openInvite}>
            Ajouter un membre
          </PageHeader.PrimaryBtn>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label={platform ? 'Administrateurs' : 'Membres de l’équipe'} value={stats?.totalAdmins ?? '–'} icon="groups" iconBg="bg-slate-50 text-slate-400" />
        <KpiCard label="Membres actifs" value={platform ? '–' : (stats?.activeTeamMembers ?? '–')} icon="verified_user" iconBg="bg-slate-50 text-slate-400" />
        <KpiCard label="Rôles configurés" value={roles.length} icon="shield_person" iconBg="bg-slate-50 text-slate-400" />
      </div>

      {/* ── Roles ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-800">Rôles</h3>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {!platform && (
            <div className="bg-white rounded-custom border-2 border-brand/20 p-6 shadow-sm flex flex-col">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">Propriétaire</h4>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Le compte qui a créé la boutique. Accès complet à toutes les pages ; ce rôle ne se modifie pas.
              </p>
            </div>
          )}
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-custom border border-slate-200 hover:shadow-md p-6 shadow-sm flex flex-col transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">shield_person</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {role.userCount} membre{role.userCount !== 1 ? 's' : ''}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-800">{role.label}</h4>
              <p className="text-slate-500 text-xs mt-2 mb-4 leading-relaxed flex-1">{role.description || 'Aucune description.'}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {granted(role).length === 0
                  ? <span className="text-[11px] text-slate-400">Aucune page autorisée</span>
                  : granted(role).map((k) => (
                    <span key={k} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">{MODULE_LABELS[k]}</span>
                  ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoleModal({ id: role.id, name: role.name, label: role.label || '', description: role.description || '', permissions: { ...emptyPerms(), ...role.permissions } })}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Modifier
                </button>
                {editable(role) && (
                  <button onClick={() => setDeletingRole(role)} className="py-2 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {!platform && roles.length === 0 && (
            <button
              onClick={() => setRoleModal({ label: '', description: '', permissions: emptyPerms() })}
              className="rounded-custom border-2 border-dashed border-slate-200 p-6 text-left text-slate-500 hover:border-brand hover:text-brand transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">add_moderator</span>
              <p className="font-bold mt-2">Créer votre premier rôle</p>
              <p className="text-xs mt-1">Par exemple « Préparateur de commandes » avec accès aux commandes et aux retours.</p>
            </button>
          )}
        </div>
      </section>

      {/* ── Matrix ── */}
      {roles.length > 0 && (
        <section className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-base">Matrice des permissions</h4>
            <p className="text-xs text-slate-400 mt-0.5">Cochez les pages que chaque rôle peut ouvrir. Les changements s’appliquent à la prochaine connexion du membre.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3">Page</th>
                  {roles.map((r) => <th key={r.id} className="px-3 py-3 text-center">{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {MODULE_SECTIONS.map((section) => (
                  <Fragment key={section.title}>
                    <tr className="bg-slate-50/50">
                      <td colSpan={roles.length + 1} className="px-5 py-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</span>
                      </td>
                    </tr>
                    {section.keys.map((key) => (
                      <tr key={key} className="border-t border-slate-100/80 hover:bg-slate-50/60">
                        <td className="px-5 py-2 text-[13px] font-medium text-slate-700">{MODULE_LABELS[key]}</td>
                        {roles.map((r) => (
                          <td key={r.id} className="px-3 py-2">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => togglePerm(r, key)}
                                disabled={!editable(r)}
                                className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${matrix[r.id]?.[key] ? 'bg-brand border-brand' : 'border-slate-300 hover:border-slate-400'}`}
                              >
                                {matrix[r.id]?.[key] && <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>check</span>}
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button onClick={saveMatrix} disabled={savingMatrix} className="bg-brand text-white px-5 py-2 rounded-custom font-bold text-xs hover:bg-brand-dark disabled:opacity-50">
              {savingMatrix ? 'Sauvegarde…' : 'Enregistrer les permissions'}
            </button>
          </div>
        </section>
      )}

      {/* ── Team ── */}
      {!platform && (
        <section className="bg-white rounded-custom border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Équipe de la boutique</h4>
              <p className="text-xs text-slate-400 mt-0.5">Seuls les comptes de votre boutique apparaissent ici. Vos clients sont dans « Clients ».</p>
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className={`${inputCls} md:w-64`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3">Membre</th>
                  <th className="px-6 py-3">Rôle</th>
                  <th className="px-6 py-3">Dernière connexion</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Aucun membre.</td></tr>
                )}
                {shown.map((u) => {
                  const st = STATUS[u.status] || STATUS.INACTIVE
                  const isMe = u.id === me.id
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                            {`${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{u.firstName} {u.lastName}{isMe && <span className="text-slate-400 font-normal"> (vous)</span>}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {u.staff ? (
                          <select value={u.roleId || ''} onChange={(e) => changeRole(u, e.target.value)} className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white">
                            {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand/10 text-brand">Propriétaire</span>
                        )}
                        {u.mustChangePassword && <p className="text-[10px] text-amber-600 mt-1">Invitation pas encore acceptée</p>}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Jamais'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${st.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {u.staff && !isMe && (
                          <div className="flex justify-end gap-1">
                            <button title="Renvoyer un mot de passe temporaire" onClick={() => resendInvite(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                              <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                            </button>
                            <button title={u.status === 'ACTIVE' ? 'Désactiver l’accès' : 'Réactiver l’accès'} onClick={() => toggleStatus(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                              <span className="material-symbols-outlined text-[18px]">{u.status === 'ACTIVE' ? 'block' : 'check_circle'}</span>
                            </button>
                            <button title="Retirer de l’équipe" onClick={() => setRemoving(u)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                              <span className="material-symbols-outlined text-[18px]">person_remove</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Role modal ── */}
      {roleModal && (
        <Modal
          wide
          title={roleModal.id ? `Modifier « ${roleModal.label} »` : 'Créer un rôle'}
          onClose={() => setRoleModal(null)}
          onSubmit={saveRole}
          footer={<>
            <button type="button" onClick={() => setRoleModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Annuler</button>
            <button type="submit" disabled={savingRole} className="px-6 py-2 bg-brand text-white rounded-xl font-bold text-xs disabled:opacity-50">{savingRole ? 'Enregistrement…' : 'Enregistrer'}</button>
          </>}
        >
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nom du rôle</label>
            <input required value={roleModal.label} onChange={(e) => setRoleModal((m) => ({ ...m, label: e.target.value }))} placeholder="Ex : Préparateur de commandes" className={inputCls} />
          </div>
          {platform && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Clé système</label>
              <input value={roleModal.name || ''} onChange={(e) => setRoleModal((m) => ({ ...m, name: e.target.value }))} placeholder="EX : MANAGER" className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Description</label>
            <textarea rows={2} value={roleModal.description} onChange={(e) => setRoleModal((m) => ({ ...m, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pages autorisées</label>
            {MODULE_SECTIONS.map((section) => (
              <div key={section.title} className="mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{section.title}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {section.keys.map((key) => (
                    <label key={key} className="flex items-center gap-2 py-1 cursor-pointer text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!roleModal.permissions[key]}
                        onChange={() => setRoleModal((m) => ({ ...m, permissions: { ...m.permissions, [key]: !m.permissions[key] } }))}
                        className="rounded border-slate-300 text-brand size-4"
                      />
                      {MODULE_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── Invite modal ── */}
      {inviteModal && (
        <Modal
          title="Ajouter un membre à l’équipe"
          onClose={() => setInviteModal(null)}
          onSubmit={invite}
          footer={<>
            <button type="button" onClick={() => setInviteModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Annuler</button>
            <button type="submit" disabled={inviting} className="px-6 py-2 bg-brand text-white rounded-xl font-bold text-xs disabled:opacity-50">{inviting ? 'Envoi…' : 'Envoyer l’invitation'}</button>
          </>}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Prénom</label>
              <input required value={inviteModal.firstName} onChange={(e) => setInviteModal((m) => ({ ...m, firstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nom</label>
              <input value={inviteModal.lastName} onChange={(e) => setInviteModal((m) => ({ ...m, lastName: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">E-mail</label>
            <input type="email" required value={inviteModal.email} onChange={(e) => setInviteModal((m) => ({ ...m, email: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Téléphone</label>
            <input value={inviteModal.phone} onChange={(e) => setInviteModal((m) => ({ ...m, phone: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Rôle</label>
            <select value={inviteModal.roleId} onChange={(e) => setInviteModal((m) => ({ ...m, roleId: Number(e.target.value) }))} className={inputCls}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Pages : {granted(roles.find((r) => r.id === Number(inviteModal.roleId)) || {}).map((k) => MODULE_LABELS[k]).join(', ') || 'aucune'}
            </p>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            Le membre reçoit par e-mail un mot de passe temporaire. Il ne sert qu’une fois : à la première connexion, il choisit le sien.
          </p>
        </Modal>
      )}

      {/* ── Confirmations ── */}
      {(deletingRole || removing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-2">{deletingRole ? 'Supprimer le rôle' : 'Retirer de l’équipe'}</h3>
            <p className="text-sm text-slate-500 mb-6">
              {deletingRole
                ? <>Supprimer le rôle <strong>{deletingRole.label}</strong> ? Les membres doivent d’abord changer de rôle.</>
                : <><strong>{removing.firstName} {removing.lastName}</strong> perdra l’accès au backoffice et son compte sera supprimé.</>}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setDeletingRole(null); setRemoving(null) }} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Annuler</button>
              <button onClick={deletingRole ? deleteRole : removeMember} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600">
                {deletingRole ? 'Supprimer' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
