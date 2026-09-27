export default function ClothingFields({ value, onChange }) {
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.value })
  const field = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand'
  const label = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className={label}>Tissu</label>
        <input className={field} value={value.tissu} onChange={set('tissu')} placeholder="Cachemire et laine" />
      </div>
      <div>
        <label className={label}>Couleur</label>
        <div className="flex gap-2">
          <input className={field} value={value.couleur} onChange={set('couleur')} placeholder="Aubergine" />
          <input type="color" value={value.couleurHex || '#5B2C6F'} onChange={set('couleurHex')} className="h-11 w-12 rounded-lg border border-slate-200 bg-white" />
        </div>
      </div>
      <div>
        <label className={label}>Coupe</label>
        <input className={field} value={value.coupe} onChange={set('coupe')} placeholder="Regular, slim, oversize" />
      </div>
      <div>
        <label className={label}>Col</label>
        <input className={field} value={value.col} onChange={set('col')} placeholder="Col rond" />
      </div>
      <div>
        <label className={label}>Manches</label>
        <input className={field} value={value.manches} onChange={set('manches')} placeholder="Manches longues" />
      </div>
      <div>
        <label className={label}>Genre</label>
        <input className={field} value={value.genre} onChange={set('genre')} placeholder="Femme, homme, unisexe" />
      </div>
      <div>
        <label className={label}>Saison</label>
        <input className={field} value={value.saison} onChange={set('saison')} placeholder="Automne-hiver" />
      </div>
      <div>
        <label className={label}>Tailles</label>
        <input className={field} value={value.tailles} onChange={set('tailles')} placeholder="XS,S,M,L,XL" />
        <p className="text-[10px] text-slate-400 mt-1">Séparez les tailles par des virgules.</p>
      </div>
      <div className="md:col-span-2">
        <label className={label}>Entretien</label>
        <textarea rows={3} className={`${field} resize-none`} value={value.entretien} onChange={set('entretien')} placeholder="Lavage à la main. Séchage à plat. Ne pas repasser le cachemire." />
      </div>
    </div>
  )
}

export const emptyClothing = {
  tissu: '',
  couleur: '',
  couleurHex: '#5B2C6F',
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
    couleurHex: clothing.couleurHex || null,
    coupe: trim(clothing.coupe),
    col: trim(clothing.col),
    manches: trim(clothing.manches),
    entretien: trim(clothing.entretien),
    tailles: trim(clothing.tailles),
    saison: trim(clothing.saison),
    genre: trim(clothing.genre),
  }
}
