import apiClient from './apiClient'

const BASE = '/admin/products'
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:8080'

export function resolveImgUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}

export function parseProductImages(p) {
  const raw = String(p?.images || '').trim()
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch { /* ignore */ }
  }
  if (raw.startsWith('data:')) return [raw]
  const fromList = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []
  if (fromList.length) return fromList
  return p?.imageUrl ? [p.imageUrl] : []
}

export function serializeProductImages(urls) {
  const list = (urls || []).filter(Boolean)
  if (!list.length) return { imageUrl: null, images: null }
  if (list.some((u) => u.startsWith('data:') || u.includes(','))) {
    return { imageUrl: list[0], images: JSON.stringify(list) }
  }
  return { imageUrl: list[0], images: list.join(',') }
}

export function computeProductStock(productStock) {
  return Math.max(0, parseInt(productStock, 10) || 0)
}

function currentShopSlug() {
  const first = window.location.pathname.split('/').filter(Boolean)[0]
  const reserved = new Set(['login', 'inscription', 'auth-callback', 'nouvelle-boutique', 'sellio', 'verification', 'mot-de-passe-oublie', 'changer-mot-de-passe'])
  if (!first || reserved.has(first)) return ''
  return first
}

export const productApi = {
  getAll:           ()        => {
    const slug = currentShopSlug()
    const q = slug ? `?shop=${encodeURIComponent(slug)}` : ''
    return apiClient.get(`${BASE}${q}`).then(r => r.data)
  },
  getStats:         ()        => {
    const slug = currentShopSlug()
    const q = slug ? `?shop=${encodeURIComponent(slug)}` : ''
    return apiClient.get(`${BASE}/stats${q}`).then(r => r.data)
  },
  getById:          (id)      => apiClient.get(`${BASE}/${id}`).then(r => r.data),
  create:           (data)    => apiClient.post(BASE, { ...data, shopSlug: currentShopSlug() || data.shopSlug }).then(r => r.data),
  update:           (id, data)=> apiClient.put(`${BASE}/${id}`, data).then(r => r.data),
  delete:           (id)      => apiClient.delete(`${BASE}/${id}`).then(r => r.data),
  toggleArchive:    (id)      => apiClient.patch(`${BASE}/${id}/archive`).then(r => r.data),
  toggleDeactivate: (id)      => apiClient.patch(`${BASE}/${id}/deactivate`).then(r => r.data),
  uploadImage:      async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('accessToken')
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const res = await fetch(`${base}/admin/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || data.message || `Upload impossible (${res.status})`)
    }
    if (!data.url) throw new Error('Réponse upload invalide')
    return data
  },
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(file)
  })
}

/** Server upload, or a data URL so the form can still be saved. */
export async function applyProductImage(file) {
  try {
    return await productApi.uploadImage(file)
  } catch {
    const url = await fileToDataUrl(file)
    return { url, local: true }
  }
}
