import { Outlet } from 'react-router-dom'

export default function RequireAuth() {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    window.location.replace('http://localhost:3001/login')
    return null
  }
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user?.roleName === 'CLIENT') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = 'http://localhost:3001'
      return null
    }
  } catch { /* ignore parse error */ }
  return <Outlet />
}