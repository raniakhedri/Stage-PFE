import { useEffect, useState } from 'react'
import { fetchSimilarProducts } from '../api/apiClient'
import { getAccessToken } from '../api/tokenStorage'
import { visitorId } from './tracker'

const BASE = 'http://localhost:8080/api/v1/analytics/recommendations'

function shopSlug() {
  return window.location.pathname.split('/').filter(Boolean)[0] || ''
}

/** Asks the recommendation engine for product ids, then loads the products (order preserved). */
export async function fetchRecommendations(kind, params = {}) {
  const qs = new URLSearchParams({ shop: shopSlug(), ...params })
  if (kind === 'for-you') qs.set('visitorId', visitorId())
  const token = getAccessToken()
  const res = await fetch(`${BASE}/${kind}?${qs}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) return { strategy: 'none', products: [] }
  const data = await res.json()
  const ids = (data.items || []).map((i) => i.productId)
  if (!ids.length) return { strategy: data.strategy, products: [] }
  const products = await fetchSimilarProducts(ids)
  const byId = new Map(products.map((p) => [p.id, p]))
  return { strategy: data.strategy, products: ids.map((id) => byId.get(id)).filter(Boolean) }
}

/** React hook; `key` changes trigger a reload (e.g. another product page). */
export function useRecommendations(kind, params, key) {
  const [state, setState] = useState({ loading: true, strategy: null, products: [] })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    fetchRecommendations(kind, params)
      .then((r) => alive && setState({ loading: false, ...r }))
      .catch(() => alive && setState({ loading: false, strategy: 'none', products: [] }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, key])
  return state
}
