import { OptionSelect, MultiOptionSelect, ColorSelect, AddCustomOption } from './ui/OptionPickers'
import { useShopOptions } from '../hooks/useShopOptions'

const label = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

function CareInstructions({ value, onChange }) {
  const { options } = useShopOptions()
  const lines = String(value || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const toggle = (item) => onChange((lines.includes(item) ? lines.filter((l) => l !== item) : [...lines, item]).join('\n'))
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {options('entretien').map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => toggle(item)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${lines.includes(item) ? 'bg-brand text-white border-brand font-semibold' : 'bg-white text-slate-600 border-slate-200 hover:border-brand/50'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <AddCustomOption optionKey="entretien" label="Ajouter une consigne à ma liste" onAdded={(v) => !lines.includes(v) && onChange([...lines, v].join('\n'))} />
      <textarea
        rows={3}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Une consigne par ligne"
      />
    </div>
  )
}

export default function ClothingFields({ value, onChange }) {
  const set = (key) => (v) => onChange({ ...value, [key]: v })

  return (
    <div className="space-y-7">
      <div>
        <label className={label}>Tailles disponibles</label>
        <MultiOptionSelect optionKey="tailles" value={value.tailles} onChange={set('tailles')} grouped />
      </div>

      <div>
        <label className={label}>Couleur</label>
        <ColorSelect name={value.couleur} hex={value.couleurHex} onChange={(c) => onChange({ ...value, ...c })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={label}>Tissu</label>
          <OptionSelect optionKey="tissu" value={value.tissu} onChange={set('tissu')} placeholder="Choisir un tissu" />
          <p className="text-[10px] text-slate-400 mt-1">Tapez un nom absent de la liste pour l’ajouter à vos tissus.</p>
        </div>
        <div>
          <label className={label}>Coupe</label>
          <OptionSelect optionKey="coupe" value={value.coupe} onChange={set('coupe')} placeholder="Choisir une coupe" />
        </div>
        <div>
          <label className={label}>Col</label>
          <OptionSelect optionKey="col" value={value.col} onChange={set('col')} placeholder="Choisir un col" />
        </div>
        <div>
          <label className={label}>Manches</label>
          <OptionSelect optionKey="manches" value={value.manches} onChange={set('manches')} placeholder="Choisir des manches" />
        </div>
        <div>
          <label className={label}>Genre</label>
          <OptionSelect optionKey="genre" value={value.genre} onChange={set('genre')} placeholder="Choisir un genre" />
        </div>
        <div>
          <label className={label}>Saison</label>
          <OptionSelect optionKey="saison" value={value.saison} onChange={set('saison')} placeholder="Choisir une saison" />
        </div>
      </div>

      <div>
        <label className={label}>Entretien</label>
        <CareInstructions value={value.entretien} onChange={set('entretien')} />
      </div>
    </div>
  )
}

export const emptyClothing = {
  tissu: '',
  couleur: '',
  couleurHex: '',
  coupe: '',
  col: '',
  manches: '',
  entretien: '',
  tailles: '',
  saison: '',
  genre: '',
}

export function clothingPayload(clothing) {
  const trim = (value) => (value || '').trim() || null
  return {
    tissu: trim(clothing.tissu),
    couleur: trim(clothing.couleur),
    couleurHex: /^#[0-9A-Fa-f]{6}$/.test(clothing.couleurHex || '') ? clothing.couleurHex : null,
    coupe: trim(clothing.coupe),
    col: trim(clothing.col),
    manches: trim(clothing.manches),
    entretien: trim(clothing.entretien),
    tailles: trim(clothing.tailles),
    saison: trim(clothing.saison),
    genre: trim(clothing.genre),
  }
}
