import apiClient from './apiClient'

export const storeApi = {
  get() {
    return apiClient.get('/admin/store').then((res) => res.data)
  },
  save(payload) {
    return apiClient.put('/admin/store', payload).then((res) => res.data)
  },
}
