import apiClient from './apiClient'

const BASE = '/admin/products'

export const productApi = {
  getAll:           ()        => apiClient.get(BASE).then(r => r.data),
  getStats:         ()        => apiClient.get(`${BASE}/stats`).then(r => r.data),
  getById:          (id)      => apiClient.get(`${BASE}/${id}`).then(r => r.data),
  create:           (data)    => apiClient.post(BASE, data).then(r => r.data),
  update:           (id, data)=> apiClient.put(`${BASE}/${id}`, data).then(r => r.data),
  delete:           (id)      => apiClient.delete(`${BASE}/${id}`).then(r => r.data),
  toggleArchive:    (id)      => apiClient.patch(`${BASE}/${id}/archive`).then(r => r.data),
  toggleDeactivate: (id)      => apiClient.patch(`${BASE}/${id}/deactivate`).then(r => r.data),
  uploadImage:      (file)    => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
