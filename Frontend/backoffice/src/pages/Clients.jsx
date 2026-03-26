import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from '../api/apiClient'
import KpiCard from '../components/ui/KpiCard'
import PageHeader from '../components/ui/PageHeader'
import CustomSelect from '../components/ui/CustomSelect'
import Spinner from '../components/ui/Spinner'

const statusConfig = {
  ACTIVE:   { label: 'Actif',   cls: 'bg-brand text-white' },
  INACTIVE: { label: 'Inactif', cls: 'bg-amber-500 text-white' },
  BLOCKED:  { label: 'Bloqué',  cls: 'bg-red-500 text-white' },
}

const defaultSegmentColors = {
  NOUVEAU: 'bg-blue-50 text-blue-600 border border-blue-100',
  FIDELE:  'bg-badge/10 text-badge border border-badge/10',
  VIP:     'bg-amber-100 text-amber-700 border border-amber-200',
  INACTIF: 'bg-slate-100 text-slate-500 border border-slate-200',
}

// ── Commandes Modal (placeholder – no orders backend yet) ─────────────────────
function CommandesModal({ client, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl flex flex-col animate-[slideInRight_0.25s_ease-out]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-badge/10 text-badge rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Commandes de {client.firstName} {client.lastName}</h2>
              <p className="text-[11px] text-slate-400">ID: {client.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <span className="material-symbols-outlined text-5xl text-slate-200">shopping_bag</span>
          <p className="text-sm">Module commandes pas encore disponible.</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Fermer
          </button>
          <button
            onClick={() => { onClose(); window.location.href = `/clients/${client.id}` }}
            className="px-4 py-2 text-sm font-bold text-white bg-btn rounded-xl hover:bg-btn-dark transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            Voir le profil
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Action Menu ────────────────────────────────────────────────────────────────
function ActionMenu({ onView, onCommandes, onContact, onToggleStatus, statusLabel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const action = (fn) => () => { setOpen(false); fn() }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
      >
        <span className="material-symbols-outlined">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[190px]">
          <button onClick={action(onView)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[16px] text-brand">visibility</span>
            Détails
          </button>
          <button onClick={action(onCommandes)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[16px] text-blue-500">receipt_long</span>
            Voir commandes
          </button>
          <button onClick={action(onContact)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
            Contacter
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button onClick={action(onToggleStatus)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
            <span className="material-symbols-outlined text-[16px]">block</span>
            {statusLabel === 'Actif' ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Clients() {
  const navigate = useNavigate()

  // ── State ─────────────────────────────────────────
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [segments, setSegments] = useState([])

  const [search, setSearch] = useState('')
  const [filterSegment, setFilterSegment] = useState('Tous les segments')
  const [filterStatut, setFilterStatut] = useState('Tous les statuts')
  const [perPage, setPerPage] = useState('10')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [commandesClient, setCommandesClient] = useState(null)

  // ── Segment map for display ───────────────────────
  const segmentMap = {}
  segments.forEach(s => { segmentMap[s.name] = s })

  const getSegmentCls = (name) => {
    const seg = segmentMap[name]
    if (seg?.color) return seg.color
    return defaultSegmentColors[name] || 'bg-slate-100 text-slate-500 border border-slate-200'
  }

  // ── Fetch clients ─────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      let res
      const params = { page: currentPage, size: parseInt(perPage) }

      if (search.trim()) {
        res = await apiClient.get('/admin/users/search', { params: { ...params, q: search.trim() } })
      } else if (filterSegment !== 'Tous les segments') {
        const seg = segments.find(s => s.label === filterSegment)
        if (seg) {
          res = await apiClient.get(`/admin/users/by-segment/${seg.name}`, { params })
        } else {
          res = await apiClient.get('/admin/users', { params })
        }
      } else if (filterStatut !== 'Tous les statuts') {
        const statusMap = { 'Actif': 'ACTIVE', 'Inactif': 'INACTIVE', 'Bloqué': 'BLOCKED' }
        const status = statusMap[filterStatut]
        res = await apiClient.get(`/admin/users/by-status/${status}`, { params })
      } else {
        res = await apiClient.get('/admin/users', { params })
      }

      setClients(res.data.content)
      setTotalElements(res.data.totalElements)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, search, filterSegment, filterStatut, segments])

  // ── Fetch stats & segments on mount ───────────────
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [statsRes, segmentsRes] = await Promise.all([
          apiClient.get('/admin/users/stats'),
          apiClient.get('/admin/segments'),
        ])
        setStats(statsRes.data)
        setSegments(segmentsRes.data)
      } catch {
        toast.error('Erreur lors du chargement des données')
      }
    }
    fetchInitial()
  }, [])

  // ── Fetch clients on filter/page change ───────────
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // ── Reset page when filters change ────────────────
  useEffect(() => {
    setCurrentPage(0)
  }, [search, filterSegment, filterStatut, perPage])

  // ── Toggle status ─────────────────────────────────
  const toggleStatus = async (client) => {
    const newStatus = client.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    try {
      await apiClient.put(`/admin/users/${client.id}`, { status: newStatus })
      toast.success(`Compte "${client.firstName} ${client.lastName}" ${newStatus === 'ACTIVE' ? 'activé' : 'désactivé'}.`)
      fetchClients()
      // Refresh stats too
      const statsRes = await apiClient.get('/admin/users/stats')
      setStats(statsRes.data)
    } catch {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  // ── Helpers ───────────────────────────────────────
  const getInitials = (firstName, lastName) => {
    return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
  }

  const segmentOptions = ['Tous les segments', ...segments.map(s => s.label)]
  const statusOptions = ['Tous les statuts', 'Actif', 'Inactif', 'Bloqué']

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

      {commandesClient && (
        <CommandesModal client={commandesClient} onClose={() => setCommandesClient(null)} />
      )}

      {/* ── Page Header ── */}
      <PageHeader title="Clients">
        <PageHeader.SecondaryBtn icon="admin_panel_settings" onClick={() => navigate('/roles')}>
          Rôles &amp; Permissions
        </PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.SecondaryBtn icon="upload">Importer</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="person_add" onClick={() => navigate('/clients/nouveau')}>
          Ajouter un compte
        </PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Total clients"
          value={stats ? stats.totalClients.toLocaleString('fr-FR') : '—'}
          sub={stats ? `${stats.activeClients} actifs` : ''}
          subColor="text-brand"
          icon="group"
          iconBg="bg-slate-50 text-slate-400"
        />
        <KpiCard
          label="Nouveaux clients (30j)"
          value={stats ? stats.newClientsLast30Days.toLocaleString('fr-FR') : '—'}
          sub="Derniers 30 jours"
          subColor="text-slate-400"
          icon="person_add"
          iconBg="bg-blue-50 text-blue-500"
        />
        <KpiCard
          label="Clients fidèles"
          value={stats ? stats.fideleClients.toLocaleString('fr-FR') : '—'}
          sub={stats && stats.totalClients > 0 ? `${Math.round((stats.fideleClients / stats.totalClients) * 100)}% base` : ''}
          subColor="text-brand"
          icon="star"
          iconBg="bg-amber-50 text-amber-500"
        />
        <KpiCard
          label="Chiffre généré (Total)"
          value="—"
          sub="Bientôt disponible"
          subColor="text-slate-400"
          icon="payments"
          iconBg="bg-badge/10 text-badge"
        />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client par nom ou email..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <CustomSelect value={filterSegment} onChange={setFilterSegment} options={segmentOptions} />
            <CustomSelect value={filterStatut} onChange={setFilterStatut} options={statusOptions} />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Segmentation</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Fréquence</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dépensé</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                      Aucun client trouvé.
                    </td>
                  </tr>
                )}
                {clients.map((client) => {
                  const sta = statusConfig[client.status] || statusConfig.ACTIVE
                  const segCls = getSegmentCls(client.segmentName)
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                            {getInitials(client.firstName, client.lastName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{client.firstName} {client.lastName}</p>
                            <p className="text-slate-400 text-[11px]">ID: {client.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-700">{client.email}</p>
                        <p className="text-xs text-slate-400">{client.phone || '—'}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {client.segmentLabel ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-badge uppercase ${segCls}`}>
                            {client.segmentName === 'VIP' && (
                              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            )}
                            {client.segmentLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-slate-400 text-xs">—</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-slate-400 text-xs">—</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-badge uppercase tracking-wider ${sta.cls}`}>
                          {sta.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          onView={() => navigate(`/clients/${client.id}`)}
                          onCommandes={() => setCommandesClient(client)}
                          onContact={() => toast.info(`Email envoyé à ${client.email}`)}
                          onToggleStatus={() => toggleStatus(client)}
                          statusLabel={sta.label}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Affichage de <span className="font-semibold text-slate-700">{clients.length}</span> sur{' '}
            <span className="font-semibold text-slate-700">{totalElements}</span> clients
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Lignes par page</span>
              <CustomSelect value={perPage} onChange={setPerPage} options={['10', '25', '50']} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800">
                Page {currentPage + 1} de {Math.max(totalPages, 1)}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">keyboard_arrow_left</span>
                </button>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">keyboard_arrow_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
