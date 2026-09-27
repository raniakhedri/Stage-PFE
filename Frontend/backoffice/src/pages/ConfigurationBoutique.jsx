import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { BUSINESSES, defaultTemplate, templatesFor } from '../data/storeTemplates'
import { storeApi } from '../api/storeApi'
import { STOREFRONT_URL } from '../lib/storefront'

export default function ConfigurationBoutique() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [business, setBusiness] = useState('CLOTHES')
  const [template, setTemplate] = useState('atelier')
  const [storeName, setStoreName] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const pickBusiness = (id) => {
    setBusiness(id)
    setTemplate(defaultTemplate(id))
  }

  const finish = async () => {
    setSaving(true)
    try {
      await storeApi.save({
        businessType: business,
        templateKey: template,
        storeName: storeName.trim(),
        onboarded: true,
      })
      setDone(true)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Impossible d’enregistrer la boutique.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Boutique prête</p>
          <h1 className="text-4xl font-semibold">{storeName.trim() || 'Votre boutique'}</h1>
          <p className="text-white/70">
            {business === 'CLOTHES'
              ? 'Les produits vêtements ont tissu, couleur, coupe et essayage en direct.'
              : 'Les produits restent des fiches cosmétiques : composition, origine, conseils.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-5 py-3 rounded-full bg-white text-slate-900 font-semibold">
              Ouvrir le backoffice
            </button>
            <a href={STOREFRONT_URL} className="px-5 py-3 rounded-full border border-white/30 font-semibold">
              Voir la boutique
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Étape {step} sur 2</p>
        <h1 className="text-3xl md:text-4xl font-semibold mt-3">
          {step === 1 ? 'Quel type de boutique ouvrez-vous ?' : 'Choisissez un modèle'}
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl">
          {step === 1
            ? 'Ce choix change les fiches produit, la vitrine et les outils. Vous pourrez le modifier plus tard.'
            : 'Le modèle change les couleurs et la typographie de la boutique.'}
        </p>

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {BUSINESSES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pickBusiness(item.id)}
                className={`text-left p-6 rounded-2xl border-2 bg-white transition ${
                  business === item.id ? 'border-slate-900' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <p className="text-xl font-semibold">{item.title}</p>
                <p className="text-sm text-slate-500 mt-2">{item.text}</p>
              </button>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nom de la boutique</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex. Maison Atelier"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {templatesFor(business).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTemplate(item.id)}
                className={`text-left rounded-2xl border-2 bg-white overflow-hidden transition ${
                  template === item.id ? 'border-slate-900' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <div className="h-28 flex">
                  {item.swatch.map((color) => (
                    <div key={color} className="flex-1" style={{ background: color }} />
                  ))}
                </div>
                <div className="p-5">
                  <p className="text-lg font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-10">
          {step === 2 ? (
            <button type="button" onClick={() => setStep(1)} className="px-5 py-3 text-sm font-semibold text-slate-500">
              Retour
            </button>
          ) : <span />}
          {step === 1 ? (
            <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-full bg-slate-900 text-white font-semibold">
              Continuer
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={finish} className="px-6 py-3 rounded-full bg-slate-900 text-white font-semibold disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Ouvrir la boutique'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
