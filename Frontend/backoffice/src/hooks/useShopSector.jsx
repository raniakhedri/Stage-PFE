import { useEffect, useState } from 'react'
import apiClient from '../api/apiClient'
import { sectorOf } from '../data/sectors'

/**
 * The shop's sector, read from the server (never from the profile saved in the browser, which can be
 * older than the shop: a stale copy used to show the cosmetics sheet to a jewellery shop).
 * Returns { sector: null while loading, error }. Also refreshes the saved profile.
 */
export function useShopSector() {
  const [state, setState] = useState({ sector: null, error: '' })

  useEffect(() => {
    let alive = true
    apiClient.get('/auth/my-shop')
      .then(({ data }) => {
        if (!alive) return
        const sector = sectorOf(data?.businessType)
        setState({ sector, error: sector ? '' : `Secteur inconnu : ${data?.businessType || '—'}` })
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          if (user && data?.businessType && user.businessType !== data.businessType) {
            localStorage.setItem('user', JSON.stringify({ ...user, businessType: data.businessType, templateKey: data.templateKey }))
          }
        } catch {
          // the saved profile is only a cache
        }
      })
      .catch(() => alive && setState({ sector: null, error: 'Impossible de charger le secteur de la boutique.' }))
    return () => { alive = false }
  }, [])

  return state
}

export function SectorLoading({ error }) {
  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        {error ? <span className="text-red-600">{error}</span> : 'Chargement de la fiche produit…'}
      </div>
    </div>
  )
}
