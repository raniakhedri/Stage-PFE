import { OptionSelect, MultiOptionSelect, ColorSelect } from './ui/OptionPickers'
import { attributesPayload, fieldsOf, parseAttributes, sizesOf, typeOf } from '../data/sectors'
import { PRESETS, SIZE_GROUPS, splitList } from '../data/catalogOptions'

const label = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'
const input = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all placeholder:text-slate-400'

/**
 * Product sheet of the sectors without dedicated columns (sport, high-tech, maison, épicerie, bijoux, enfants).
 * The merchant first picks the product type (bague, montre, machine…); the sizes and the fields follow it.
 * Sizes and colour use the shared columns, everything else goes into the `attributes` JSON.
 */
export default function SectorFields({ sector, value, onChange }) {
  const typeId = value.attributes?.type
  const type = typeOf(sector, typeId)
  const sizes = sizesOf(sector, typeId)
  const fields = fieldsOf(sector, typeId)
  const setAttr = (key) => (v) => onChange({ ...value, attributes: { ...value.attributes, [key]: v } })

  const chooseType = (next) => {
    if (next.id === type?.id) return
    // Sizes of another grid (pointures vs tailles…) make no sense for the new type.
    const sameGrid = next.sizes?.optionKey === type?.sizes?.optionKey && next.sizes?.label === type?.sizes?.label
    onChange({ ...value, tailles: sameGrid ? value.tailles : '', attributes: { ...value.attributes, type: next.id } })
  }

  return (
    <div className="space-y-7">
      {sector.types?.length > 0 && (
        <div>
          <label className={label}>Type de produit</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sector.types.map((t) => {
              const active = t.id === type?.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseType(t)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                    active ? 'border-brand bg-brand/5 text-brand font-semibold ring-1 ring-brand' : 'border-slate-200 text-slate-600 hover:border-brand/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{t.icon}</span>
                  <span className="leading-tight">{t.label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Les tailles et les caractéristiques ci-dessous s’adaptent au type choisi.</p>
        </div>
      )}

      {sizes ? (
        <div>
          <label className={label}>{sizes.label} — choix proposés au client</label>
          <MultiOptionSelect
            key={`${type?.id}-${sizes.optionKey}`}
            optionKey={sizes.optionKey}
            value={value.tailles}
            onChange={(v) => onChange({ ...value, tailles: v })}
            grouped={Boolean(sizes.groups)}
            groups={sizes.groups}
            placeholder={`Ajouter : ${sizes.label.toLowerCase()}…`}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Laissez vide si le produit n’existe qu’en un seul modèle. Avec plusieurs valeurs, le client choisit avant d’ajouter au panier.
          </p>
        </div>
      ) : (
        type && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-3">Type « {type.label} » : vendu en un seul modèle, le client n’a pas de taille à choisir.</p>
      )}

      {sector.color && (
        <div>
          <label className={label}>Couleur</label>
          <ColorSelect name={value.couleur} hex={value.couleurHex} onChange={(c) => onChange({ ...value, ...c })} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const current = value.attributes?.[field.key] || ''
          const wide = field.type === 'textarea' || field.type === 'specs' || field.type === 'multi'
          return (
            <div key={`${type?.id}-${field.key}`} className={wide ? 'md:col-span-2' : ''}>
              <label className={label}>{field.label}</label>
              {field.type === 'select' && (
                <OptionSelect optionKey={field.optionKey} value={current} onChange={setAttr(field.key)} placeholder={`Choisir : ${field.label.toLowerCase()}`} />
              )}
              {field.type === 'multi' && (
                <MultiOptionSelect optionKey={field.optionKey} value={current} onChange={setAttr(field.key)} placeholder="Ajouter…" />
              )}
              {field.type === 'text' && (
                <input className={input} value={current} onChange={(e) => setAttr(field.key)(e.target.value)} placeholder={field.placeholder} />
              )}
              {(field.type === 'textarea' || field.type === 'specs') && (
                <>
                  <textarea
                    rows={field.type === 'specs' ? 5 : 3}
                    className={`${input} resize-none ${field.type === 'specs' ? 'font-mono text-[13px]' : ''}`}
                    value={current}
                    onChange={(e) => setAttr(field.key)(e.target.value)}
                    placeholder={field.placeholder}
                  />
                  {field.type === 'specs' && (
                    <p className="text-[10px] text-slate-400 mt-1">Format « Nom : valeur », une ligne par caractéristique — affiché en tableau sur la fiche produit.</p>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** New product: the sector's first product type is preselected. */
export function emptySector(sector) {
  return { tailles: '', couleur: '', couleurHex: '', attributes: sector?.types?.length ? { type: sector.types[0].id } : {} }
}

/**
 * Existing product. Products saved before types existed get the type whose size grid contains their sizes
 * (a shoe size → chaussures), otherwise the first type.
 */
export function sectorFromProduct(p, sector) {
  const attributes = parseAttributes(p?.attributes)
  if (sector?.types?.length && !sector.types.some((t) => t.id === attributes.type)) {
    const sizes = splitList(p?.tailles)
    const fits = (t) => {
      if (!t.sizes || !sizes.length) return false
      const grid = t.sizes.groups ? t.sizes.groups.flatMap((g) => g.values) : PRESETS[t.sizes.optionKey] || SIZE_GROUPS.flatMap((g) => g.values)
      return sizes.every((s) => grid.includes(s))
    }
    attributes.type = (sector.types.find(fits) || sector.types[0]).id
  }
  return {
    tailles: p?.tailles || '',
    couleur: p?.couleur || '',
    couleurHex: p?.couleurHex || '',
    attributes,
  }
}

export function sectorPayload(value, sector) {
  const trim = (v) => (v || '').trim() || null
  const sizes = sizesOf(sector, value.attributes?.type)
  return {
    tailles: sizes ? trim(value.tailles) : null,
    couleur: sector?.color ? trim(value.couleur) : null,
    couleurHex: sector?.color && /^#[0-9A-Fa-f]{6}$/.test(value.couleurHex || '') ? value.couleurHex : null,
    attributes: attributesPayload(value.attributes, sector),
  }
}
