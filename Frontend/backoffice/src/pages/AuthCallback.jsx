import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { scheduleAutoLogout } from '../api/apiClient'
import { openMerchantHome } from '../lib/sellio'

export default function AuthCallback() {
  const [params] = useSearchParams()

  useEffect(() => {
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const user = params.get('user')

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      if (user) localStorage.setItem('user', user)
      scheduleAutoLogout()
      let parsed = {}
      try { parsed = user ? JSON.parse(user) : {} } catch { parsed = {} }
      openMerchantHome(parsed)
    } else {
      window.location.replace('/login')
    }
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Authentification en cours...</p>
    </div>
  )
}
