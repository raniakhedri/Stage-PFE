import apiClient from './apiClient'

const BASE = '/admin/appearance'

export const appearanceApi = {
  get: (scope) => apiClient.get(`${BASE}/${scope}`).then(r => r.data),
  update: (scope, data) => apiClient.put(`${BASE}/${scope}`, data).then(r => r.data),
  reset: (scope) => apiClient.post(`${BASE}/${scope}/reset`).then(r => r.data),
}
