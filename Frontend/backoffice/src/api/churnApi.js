import apiClient from './apiClient'

export const churnApi = {
  getByUser: (userId) => apiClient.get(`/analytics/churn/${userId}`).then((r) => r.data),
  getBatchIds: (userIds) =>
    apiClient.post('/analytics/churn/batch-ids', userIds).then((r) => r.data),
}
