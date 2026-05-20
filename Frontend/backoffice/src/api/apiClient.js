import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Auto-logout on JWT expiry ──────────────────────────────
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

let logoutTimer = null

function performLogout() {
  if (logoutTimer) { clearTimeout(logoutTimer); logoutTimer = null }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  // If we are on the auth-callback route, new tokens are about to be written
  // from the URL — don't navigate away; AuthCallback will redirect to /dashboard.
  if (!window.location.pathname.includes('auth-callback')) {
    window.location.href = 'http://localhost:3001/login?redirect=backoffice'
  }
}

export function scheduleAutoLogout() {
  if (logoutTimer) { clearTimeout(logoutTimer); logoutTimer = null }
  const token = localStorage.getItem('accessToken')
  if (!token) return
  const expiry = getTokenExpiry(token)
  if (!expiry) return
  const delay = expiry - Date.now()
  if (delay <= 0) { performLogout(); return }
  logoutTimer = setTimeout(performLogout, delay)
}

// Schedule on app load
scheduleAutoLogout()

// Sync across browser tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'accessToken') {
    if (!e.newValue) performLogout()
    else scheduleAutoLogout()
  }
})
// ────────────────────────────────────────────────────────────

// Intercepteur pour ajouter le token JWT automatiquement
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh token queue to avoid race conditions with parallel requests
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

// Intercepteur pour gérer les erreurs globales + refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        // Another request is already refreshing — wait for it
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`
            resolve(apiClient(original))
          })
        })
      }

      isRefreshing = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            'http://localhost:8080/api/v1/auth/refresh',
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          isRefreshing = false
          scheduleAutoLogout()
          onRefreshed(data.accessToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient(original)
        } catch {
          isRefreshing = false
          refreshSubscribers = []
          performLogout()
        }
      } else {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
