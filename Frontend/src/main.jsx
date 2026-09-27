import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './context/ToastContext'
import { ShopProvider } from './context/ShopContext'
import { StoreProvider } from './context/StoreContext'
import './index.css'

const RESERVED = new Set([
  'login', 'inscription', 'produits', 'categories', 'checkout', 'confirmation',
  'profile', 'commandes', 'retours', 'favoris',
])

const parts = window.location.pathname.split('/').filter(Boolean)
if (parts.length === 0 || RESERVED.has(parts[0])) {
  const rest = window.location.pathname === '/' ? '' : window.location.pathname
  window.location.replace(`/naturessence${rest}${window.location.search}${window.location.hash}`)
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter basename={`/${parts[0]}`}>
      <StoreProvider>
        <ToastProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>,
  )
}
