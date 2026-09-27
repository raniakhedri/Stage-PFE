import apiClient from './apiClient'
import { currentShopSlug, shopQuery } from '../lib/sellio'

const BASE = '/admin/categories'

export const categoryApi = {
  getAll: () => apiClient.get(`${BASE}${shopQuery()}`).then(r => r.data),
  getById: (id) => apiClient.get(`${BASE}/${id}`).then(r => r.data),
  create: (data) => apiClient.post(BASE, { ...data, shopSlug: currentShopSlug() || data.shopSlug }).then(r => r.data),
  update: (id, data) => apiClient.put(`${BASE}/${id}`, data).then(r => r.data),
  delete: (id) => apiClient.delete(`${BASE}/${id}`).then(r => r.data),
  reorder: (orderedIds) => apiClient.put(`${BASE}/reorder`, orderedIds).then(r => r.data),
}
