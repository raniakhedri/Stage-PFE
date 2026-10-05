import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { productApi, parseProductImages, resolveImgUrl } from '../api/productApi'
import { layoutOf, TEMPLATE_LABELS } from '../data/storeTemplates'
import { copyFor } from '../data/storefrontCopy'
import { SECTION_INFO, sectionList } from '../data/homeSections'
import { StorefrontPreview, useShopSettings } from '../hooks/useShopSettings'

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-slate-400'
const MAX_PRODUCTS = 12

/** Default text of a field, shown as placeholder (the merchant only writes what they change). */
function defaultText(copy, layout, key) {
  const hero = copy.hero[layout] || copy.hero.minimal
  const map = {
    heroEyebrow: hero.eyebrow, heroTitle: hero.title, heroText: hero.text, cta: copy.cta,
    categoriesTitle: copy.categoriesTitle, newTitle: copy.newTitle, bestTitle: copy.bestTitle,
    recoTitle: 'Recommandé pour vous', recoEyebrow: 'Selon vos goûts',
    editorialEyebrow: copy.editorial.eyebrow, editorialTitle: copy.editorial.title, editorialText: copy.editorial.text,
    editorialCta: copy.editorial.cta, quote: copy.quote, statement: (copy.statement || []).join('\n'),
    marquee: (copy.marquee || []).join('\n'), newsletterTitle: copy.newsletter.title, newsletterText: copy.newsletter.text,
    stats: (copy.stats || []).map(([v, l]) => `${v} | ${l}`).join('\n'),
  }
  return map[key] || ''
}

function productImage(p) {
  return resolveImgUrl(parseProductImages(p)[0] || p.imageUrl || '')
}

/** Ordered product picker: search, add, move, remove. */
function ProductPicker({ products, value, onChange }) {
  const [query, setQuery] = useState('')
  const ids = (value || []).map(String)
  const byId = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products])
  const q = query.trim().toLowerCase()
  const results = q ? products.filter((p) => !ids.includes(String(p.id)) && (p.nom || '').toLowerCase().includes(q)).slice(0, 8) : []
  const move = (i, d) => {
    const next = [...ids]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <div className="relative">
        <input className={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ids.length >= MAX_PRODUCTS ? `${MAX_PRODUCTS} produits maximum` : 'Rechercher un produit à ajouter…'} disabled={ids.length >= MAX_PRODUCTS} />
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            {results.map((p) => (
              <button key={p.id} type="button" onClick={() => { onChange([...ids, String(p.id)]); setQuery('') }} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50">
                <img src={productImage(p)} alt="" className="w-8 h-8 rounded object-cover bg-slate-100" />
                <span className="flex-1 truncate">{p.nom}</span>
                <span className="material-symbols-outlined text-lg text-slate-400">add</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {ids.length === 0 ? (
        <p className="text-xs text-slate-400">Aucun produit choisi.</p>
      ) : (
        <ol className="space-y-1.5">
          {ids.map((id, i) => {
            const p = byId.get(id)
            return (
              <li key={id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="w-5 text-xs text-slate-400 tabular-nums">{i + 1}</span>
                {p && <img src={productImage(p)} alt="" className="w-8 h-8 rounded object-cover bg-slate-100" />}
                <span className="flex-1 truncate">{p ? p.nom : <em className="text-slate-400">Produit supprimé</em>}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="material-symbols-outlined text-lg text-slate-400 hover:text-slate-800 disabled:opacity-30">arrow_upward</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === ids.length - 1} className="material-symbols-outlined text-lg text-slate-400 hover:text-slate-800 disabled:opacity-30">arrow_downward</button>
                <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="material-symbols-outlined text-lg text-slate-400 hover:text-red-600">close</button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function TextField({ label, value, placeholder, kind, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      {kind === 'area' ? (
        <textarea rows={3} className={`${input} mt-1.5 resize-y`} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`${input} mt-1.5`} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

/** Home page editor: sections (visibility, order), their texts, featured products and the custom selection. */
export default function PageAccueil() {
  const { shop, settings, error, saveSettings } = useShopSettings()
  const [draft, setDraft] = useState(null)
  const [products, setProducts] = useState([])
  const [open, setOpen] = useState('hero')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (settings) setDraft(settings) }, [settings])
  useEffect(() => { productApi.getAll().then((list) => setProducts(Array.isArray(list) ? list : [])).catch(() => {}) }, [])

  const patch = useMemo(() => (draft ? { settings: JSON.stringify(draft) } : null), [draft])

  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (!shop || !draft) return <p className="p-6 text-slate-500">Chargement…</p>

  const layout = layoutOf(shop.templateKey)
  const copy = copyFor(shop.businessType)
  const home = draft.home || {}
  const texts = home.texts || {}
  const sections = sectionList(layout, home.sections)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const setHome = (key, value) => setDraft((prev) => ({ ...prev, home: { ...(prev.home || {}), [key]: value } }))
  const setText = (key, value) => setHome('texts', { ...texts, [key]: value })
  const setSections = (list) => setHome('sections', list)
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= sections.length) return
    const next = [...sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSections(next)
  }
  const toggle = (id) => setSections(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  const featured = home.featured || { mode: 'latest', productIds: [] }
  const selection = home.selection || {}

  const save = async () => {
    setSaving(true)
    try {
      await saveSettings({ ...draft, home: { ...home, sections } })
      toast.success('Page d’accueil enregistrée : elle est en ligne sur votre vitrine.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    if (!window.confirm('Revenir à la page d’accueil d’origine (ordre, sections et textes) ?')) return
    setDraft((prev) => ({ ...prev, home: {} }))
  }

  return (
    <div className="max-w-[1500px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Page d’accueil</h1>
          <p className="text-slate-500">
            Modèle <b>{TEMPLATE_LABELS[layout]}</b> : affichez, masquez et réordonnez les sections, et écrivez vos propres textes.
            Un champ vide garde le texte proposé.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} className="px-4 py-2.5 rounded-full text-sm text-slate-600 hover:bg-slate-100">Réinitialiser</button>
          {dirty && <button type="button" onClick={() => setDraft(settings)} className="px-4 py-2.5 rounded-full text-sm text-slate-600 hover:bg-slate-100">Annuler</button>}
          <button type="button" disabled={!dirty || saving} onClick={save} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">
            {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
        <ol className="space-y-2 min-w-0">
          {sections.map((s, i) => {
            const info = SECTION_INFO[s.id] || { label: s.id, icon: 'crop_square', texts: [] }
            const expanded = open === s.id
            const sectionTexts = [...(info.texts || []), ...(s.id === 'hero' && ['sport', 'tech'].includes(layout) ? [['stats', 'Chiffres clés (une ligne : valeur | texte)', 'area']] : [])]
            return (
              <li key={s.id} className={`rounded-2xl border bg-white ${s.enabled ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}>
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className={`material-symbols-outlined text-xl ${s.enabled ? 'text-slate-700' : 'text-slate-300'}`}>{info.icon}</span>
                  <button type="button" onClick={() => setOpen(expanded ? null : s.id)} className="flex-1 text-left">
                    <span className={`text-sm font-semibold ${s.enabled ? '' : 'text-slate-400 line-through'}`}>{info.label}</span>
                    {!s.enabled && <span className="ml-2 text-[11px] text-slate-400">masquée</span>}
                  </button>
                  <button type="button" title="Monter" onClick={() => move(i, -1)} disabled={i === 0} className="material-symbols-outlined text-lg text-slate-400 hover:text-slate-800 disabled:opacity-30">arrow_upward</button>
                  <button type="button" title="Descendre" onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="material-symbols-outlined text-lg text-slate-400 hover:text-slate-800 disabled:opacity-30">arrow_downward</button>
                  <button type="button" onClick={() => toggle(s.id)} title={s.enabled ? 'Masquer' : 'Afficher'}
                    className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${s.enabled ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-4' : ''}`} />
                  </button>
                  <button type="button" onClick={() => setOpen(expanded ? null : s.id)} className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>expand_more</button>
                </div>
                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                    {info.help && <p className="text-xs text-slate-500">{info.help}</p>}
                    {sectionTexts.map(([key, label, kind]) => (
                      <TextField key={key} label={label} kind={kind === 'long' ? undefined : kind} value={texts[key]} placeholder={defaultText(copy, layout, key)} onChange={(v) => setText(key, v)} />
                    ))}
                    {info.promises && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {copy.promises.map((p, k) => (
                          <div key={k} className="rounded-xl border border-slate-200 p-3 space-y-2">
                            <TextField label={`Engagement ${k + 1} — titre`} value={texts.promises?.[k]?.title} placeholder={p.title}
                              onChange={(v) => setText('promises', copy.promises.map((_, n) => (n === k ? { ...(texts.promises?.[n] || {}), title: v } : texts.promises?.[n] || {})))} />
                            <TextField label="Texte" value={texts.promises?.[k]?.text} placeholder={p.text}
                              onChange={(v) => setText('promises', copy.promises.map((_, n) => (n === k ? { ...(texts.promises?.[n] || {}), text: v } : texts.promises?.[n] || {})))} />
                          </div>
                        ))}
                      </div>
                    )}
                    {s.id === 'products' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[['latest', 'Les nouveautés (automatique)'], ['manual', 'Mon choix de produits']].map(([mode, label]) => (
                            <button key={mode} type="button" onClick={() => setHome('featured', { ...featured, mode })}
                              className={`px-3.5 py-2 rounded-full text-sm border ${featured.mode === mode || (!featured.mode && mode === 'latest') ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                        {featured.mode === 'manual' && (
                          <ProductPicker products={products} value={featured.productIds} onChange={(ids) => setHome('featured', { ...featured, productIds: ids })} />
                        )}
                      </div>
                    )}
                    {s.id === 'selection' && (
                      <div className="space-y-4">
                        <TextField label="Sur-titre" value={selection.eyebrow} placeholder="Ex : Coup de cœur" onChange={(v) => setHome('selection', { ...selection, eyebrow: v })} />
                        <TextField label="Titre" value={selection.title} placeholder="Notre sélection" onChange={(v) => setHome('selection', { ...selection, title: v })} />
                        <TextField label="Texte" kind="area" value={selection.text} placeholder="Facultatif" onChange={(v) => setHome('selection', { ...selection, text: v })} />
                        <ProductPicker products={products} value={selection.productIds} onChange={(ids) => setHome('selection', { ...selection, productIds: ids })} />
                        {!s.enabled && <p className="text-xs text-amber-700">Activez la section pour l’afficher sur la vitrine.</p>}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <div className="xl:sticky xl:top-6 min-w-0">
          <StorefrontPreview slug={shop.slug} layout={layout} patch={patch} height={820} />
        </div>
      </div>
    </div>
  )
}
