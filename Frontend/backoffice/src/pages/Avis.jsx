import { useState } from 'react'
import { toast } from 'react-toastify'
import PageHeader from '../components/ui/PageHeader'
import KpiCard from '../components/ui/KpiCard'
import CustomSelect from '../components/ui/CustomSelect'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const initialAvis = [
  {
    id: 1, client: 'Jean Dupont', initials: 'JD', produit: 'Veste Haute Visibilité',
    note: 5, commentaire: 'Excellent produit, très résistant pour le chantier.', date: '12/10/2023',
    statut: 'Approuvé', reponse: '',
  },
  {
    id: 2, client: 'Marie Claire', initials: 'MC', produit: 'Chaussures de sécurité S3',
    note: 4, commentaire: 'Confortables mais un peu lourdes.', date: '11/10/2023',
    statut: 'Approuvé', reponse: '',
  },
  {
    id: 3, client: 'Lucas Martin', initials: 'LM', produit: 'Pantalon de travail Cargo',
    note: 3, commentaire: 'La taille est un peu petite, je recommande de prendre une taille au-dessus.', date: '10/10/2023',
    statut: 'En attente', reponse: '',
  },
  {
    id: 4, client: 'Sophie Bernard', initials: 'SB', produit: 'Gants anti-coupure',
    note: 1, commentaire: 'Publicité non sollicitée dans le colis.', date: '09/10/2023',
    statut: 'Spam', reponse: '',
  },
  {
    id: 5, client: 'Pierre Moreau', initials: 'PM', produit: 'Casque de chantier Pro',
    note: 5, commentaire: 'Parfait ! Léger et conforme aux normes EN 397.', date: '08/10/2023',
    statut: 'Approuvé', reponse: 'Merci pour votre retour Pierre !',
  },
  {
    id: 6, client: 'Camille Roux', initials: 'CR', produit: 'Bottes de sécurité imperméables',
    note: 4, commentaire: 'Très bonnes bottes, pieds au sec même sous la pluie.', date: '07/10/2023',
    statut: 'Approuvé', reponse: '',
  },
  {
    id: 7, client: 'Thomas Leroy', initials: 'TL', produit: 'Gilet de signalisation',
    note: 2, commentaire: 'La couture s\'est défaite après 2 semaines d\'utilisation.', date: '06/10/2023',
    statut: 'En attente', reponse: '',
  },
  {
    id: 8, client: 'Emma Garnier', initials: 'EG', produit: 'Combinaison jetable',
    note: 5, commentaire: 'Idéal pour la peinture, bon rapport qualité-prix.', date: '05/10/2023',
    statut: 'Approuvé', reponse: '',
  },
]

const statutOptions = ['Tous les statuts', 'Approuvé', 'En attente', 'Spam']
const noteOptions = ['Toutes les notes', '5 étoiles', '4 étoiles', '3 étoiles', '2 étoiles', '1 étoile']
const periodeOptions = ['Toutes les périodes', '7 derniers jours', '30 derniers jours', '3 derniers mois']

const statutBadge = {
  'Approuvé':   'bg-badge/10 text-badge',
  'En attente': 'bg-amber-100 text-amber-700',
  'Spam':       'bg-red-100 text-red-700',
}

// ── Stars component ────────────────────────────────────────────────────────────
function Stars({ note }) {
  return (
    <div className="flex justify-center text-amber-400">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: i <= note ? "'FILL' 1" : "'FILL' 0" }}>star</span>
      ))}
    </div>
  )
}

export default function Avis() {
  const [avis, setAvis] = useState(initialAvis)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('Tous les statuts')
  const [filterNote, setFilterNote] = useState('Toutes les notes')
  const [filterPeriode, setFilterPeriode] = useState('Toutes les périodes')
  const [page, setPage] = useState(1)
  const perPage = 10

  // ── Modal réponse ──
  const [replyAvis, setReplyAvis] = useState(null)
  const [replyText, setReplyText] = useState('')

  // ── Modal détail ──
  const [detailAvis, setDetailAvis] = useState(null)

  // ── Filtering ──
  const filtered = avis.filter(a => {
    if (filterStatut !== 'Tous les statuts' && a.statut !== filterStatut) return false
    if (filterNote !== 'Toutes les notes') {
      const n = parseInt(filterNote)
      if (a.note !== n) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!a.client.toLowerCase().includes(q) && !a.produit.toLowerCase().includes(q) && !a.commentaire.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  // ── KPIs ──
  const total = avis.length
  const approuves = avis.filter(a => a.statut === 'Approuvé').length
  const enAttente = avis.filter(a => a.statut === 'En attente').length
  const noteMoyenne = total > 0 ? (avis.reduce((s, a) => s + a.note, 0) / total).toFixed(1) : '0.0'

  // ── Actions ──
  const approuver = (id) => {
    setAvis(prev => prev.map(a => a.id === id ? { ...a, statut: 'Approuvé' } : a))
    toast.success('Avis approuvé.')
  }

  const marquerSpam = (id) => {
    setAvis(prev => prev.map(a => a.id === id ? { ...a, statut: 'Spam' } : a))
    toast.success('Avis marqué comme spam.')
  }

  const supprimer = (id) => {
    setAvis(prev => prev.filter(a => a.id !== id))
    toast.success('Avis supprimé.')
  }

  const openReply = (a) => {
    setReplyAvis(a)
    setReplyText(a.reponse || '')
  }

  const submitReply = () => {
    if (!replyText.trim()) return toast.error('Veuillez écrire une réponse.')
    setAvis(prev => prev.map(a => a.id === replyAvis.id ? { ...a, reponse: replyText.trim() } : a))
    setReplyAvis(null)
    toast.success('Réponse enregistrée.')
  }

  const resetFilters = () => {
    setSearch('')
    setFilterStatut('Tous les statuts')
    setFilterNote('Toutes les notes')
    setFilterPeriode('Toutes les périodes')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ── Header ── */}
      <PageHeader title="Gestion des avis">
        <PageHeader.SecondaryBtn icon="download">Exporter</PageHeader.SecondaryBtn>
        <PageHeader.PrimaryBtn icon="filter_list" onClick={resetFilters}>Réinitialiser filtres</PageHeader.PrimaryBtn>
      </PageHeader>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Note moyenne" value={`${noteMoyenne}/5`} sub="+0.2 ce mois" subColor="text-brand" icon="star" iconBg="bg-amber-50 text-amber-500" />
        <KpiCard label="Total des avis" value={total.toLocaleString()} sub="+12%" subColor="text-brand" icon="reviews" iconBg="bg-badge/10 text-badge" />
        <KpiCard label="Avis approuvés" value={approuves} sub={`${total > 0 ? Math.round(approuves / total * 100) : 0}% du total`} subColor="text-slate-400" icon="check_circle" iconBg="bg-blue-50 text-blue-600" />
        <KpiCard label="En attente de modération" value={enAttente} sub={enAttente > 0 ? 'Action requise' : 'Tout est à jour'} subColor={enAttente > 0 ? 'text-amber-600' : 'text-brand'} icon="pending_actions" iconBg="bg-amber-50 text-amber-600" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher par client, produit ou commentaire..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all outline-none"
            />
          </div>
          <CustomSelect value={filterStatut} onChange={(v) => { setFilterStatut(v); setPage(1) }} options={statutOptions} size="sm" className="min-w-[160px]" />
          <CustomSelect value={filterNote} onChange={(v) => { setFilterNote(v); setPage(1) }} options={noteOptions} size="sm" className="min-w-[150px]" />
          <CustomSelect value={filterPeriode} onChange={(v) => { setFilterPeriode(v); setPage(1) }} options={periodeOptions} size="sm" className="min-w-[170px]" />
          <button onClick={resetFilters} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Réinitialiser">
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Client</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Produit</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Note</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Commentaire</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Statut</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Client */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {a.initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{a.client}</span>
                    </div>
                  </td>

                  {/* Produit */}
                  <td className="px-6 py-3.5 text-sm text-slate-600">{a.produit}</td>

                  {/* Note */}
                  <td className="px-6 py-3.5 text-center">
                    <Stars note={a.note} />
                  </td>

                  {/* Commentaire */}
                  <td className="px-6 py-3.5 text-sm text-slate-600 max-w-xs">
                    <p className="truncate">{a.commentaire}</p>
                    {a.reponse && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-brand text-[12px]">reply</span>
                        <span className="text-[10px] text-brand font-semibold">Répondu</span>
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-3.5 text-sm text-slate-400">{a.date}</td>

                  {/* Statut */}
                  <td className="px-6 py-3.5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-badge ${statutBadge[a.statut] || 'bg-slate-100 text-slate-500'}`}>
                      {a.statut}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {a.statut === 'En attente' && (
                        <button onClick={() => approuver(a.id)} className="p-1.5 text-brand hover:bg-brand/5 rounded-md transition-all" title="Approuver">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                      )}
                      <button onClick={() => setDetailAvis(a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="Voir détail">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button onClick={() => openReply(a)} className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-md transition-all" title="Répondre">
                        <span className="material-symbols-outlined text-[18px]">reply</span>
                      </button>
                      {a.statut !== 'Spam' && (
                        <button onClick={() => marquerSpam(a.id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all" title="Marquer spam">
                          <span className="material-symbols-outlined text-[18px]">report</span>
                        </button>
                      )}
                      <button onClick={() => supprimer(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" title="Supprimer">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 block">reviews</span>
                    Aucun avis ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Affichage de <span className="font-bold text-slate-700">{filtered.length === 0 ? 0 : ((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)}</span> sur <span className="font-bold text-slate-700">{filtered.length}</span> avis
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Modal — Détail avis */}
      {detailAvis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailAvis(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{detailAvis.initials}</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{detailAvis.client}</p>
                  <p className="text-xs text-slate-400">{detailAvis.date}</p>
                </div>
              </div>
              <button onClick={() => setDetailAvis(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Produit</p>
                <p className="text-sm font-semibold text-slate-800">{detailAvis.produit}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Note</p>
                <Stars note={detailAvis.note} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commentaire</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">{detailAvis.commentaire}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Statut</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-badge ${statutBadge[detailAvis.statut]}`}>{detailAvis.statut}</span>
              </div>
              {detailAvis.reponse && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Votre réponse</p>
                  <p className="text-sm text-brand bg-brand/5 rounded-lg p-3 border border-brand/10">{detailAvis.reponse}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {detailAvis.statut === 'En attente' && (
                <button onClick={() => { approuver(detailAvis.id); setDetailAvis(null) }} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Approuver</button>
              )}
              <button onClick={() => { openReply(detailAvis); setDetailAvis(null) }} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Répondre</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Répondre */}
      {replyAvis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setReplyAvis(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Répondre à l'avis</h3>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">{replyAvis.initials}</div>
                <span className="text-sm font-semibold text-slate-700">{replyAvis.client}</span>
                <Stars note={replyAvis.note} />
              </div>
              <p className="text-sm text-slate-500">{replyAvis.commentaire}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Votre réponse</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Écrivez votre réponse au client..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setReplyAvis(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={submitReply} className="px-4 py-2 text-sm font-semibold text-white bg-btn rounded-lg hover:bg-btn-dark transition-colors">Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
