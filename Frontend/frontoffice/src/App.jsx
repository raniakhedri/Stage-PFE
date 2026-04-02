import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AppearanceProvider } from './context/AppearanceContext'
import LoadingScreen from './components/LoadingScreen'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Profile from './pages/Profile'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  const [loading, setLoading] = useState(true)

  return (
    <AppearanceProvider>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
        <Routes>
          {/* Auth pages — no header/footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Signup />} />

          {/* Main layout with header/footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/panier" element={<Cart />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/produits" element={<Products />} />
            <Route path="/produit/:slug" element={<ProductDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppearanceProvider>
  )
}
