import apiClient from './apiClient'

export const bannerApi = {
  getAll:      ()         => apiClient.get('/admin/banners').then(r => r.data.data),
  getById:     (id)       => apiClient.get(`/admin/banners/${id}`).then(r => r.data.data),
  create:      (data)     => apiClient.post('/admin/banners', data).then(r => r.data.data),
  update:      (id, data) => apiClient.put(`/admin/banners/${id}`, data).then(r => r.data.data),
  toggleActif: (id)       => apiClient.patch(`/admin/banners/${id}/toggle`).then(r => r.data.data),
  remove:      (id)       => apiClient.delete(`/admin/banners/${id}`).then(r => r.data),
}
