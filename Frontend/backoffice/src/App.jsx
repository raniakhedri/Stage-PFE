import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useEffect } from 'react'
import 'react-toastify/dist/ReactToastify.css'

import { applyAllColors, applyAllFonts, applyLogos, applySidebarLayout, applyBorderRadius, applyDarkMode, applyLogoScale, applyLogoAlign } from './utils/brandColor'
import RequireAuth from './components/auth/RequireAuth'
import Layout from './components/layout/Layout'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Produits from './pages/Produits'
import AjouterProduit from './pages/AjouterProduit'
import EditProduit from './pages/EditProduit'
import Apparence from './pages/Apparence'
import Clients from './pages/Clients'
import DetailClient from './pages/DetailClient'
import AjouterCompte from './pages/AjouterCompte'
import RolesPermissions from './pages/RolesPermissions'
import Retours from './pages/Retours'
import DetailRetour from './pages/DetailRetour'
import HistoriqueRemboursements from './pages/HistoriqueRemboursements'
import CompteHebergement from './pages/CompteHebergement'
import Categories from './pages/Categories'
import AjouterCategorie from './pages/AjouterCategorie'
import EditCategorie from './pages/EditCategorie'
import Commandes from './pages/Commandes'
import DetailCommande from './pages/DetailCommande'
import Bannieres from './pages/Bannieres'
import AjouterBanniere from './pages/AjouterBanniere'
import TvaLivraison from './pages/TvaLivraison'
import Avis from './pages/Avis'
import Comportement from './pages/Comportement'
import Promotions from './pages/Promotions'
import Fidelite from './pages/Fidelite'
import EmailMarketing from './pages/EmailMarketing'
import NotFound from './pages/NotFound'
import ConfigurationBoutique from './pages/ConfigurationBoutique'
import SellioLogin from './pages/SellioLogin'
import SellioInscription from './pages/SellioInscription'
import NouvelleBoutique from './pages/NouvelleBoutique'
import SellioConsole from './pages/SellioConsole'
import SellioHome from './pages/SellioHome'
import VerificationBoutique from './pages/VerificationBoutique'
import MotDePasseOublie from './pages/MotDePasseOublie'
import ChangerMotDePasse from './pages/ChangerMotDePasse'
import { RESERVED_PATHS } from './lib/sellio'

const RESERVED = RESERVED_PATHS

function App() {
  useEffect(() => {
    // Load backoffice appearance settings (public endpoint, no auth needed)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    fetch(`${baseURL}/public/appearance/backoffice`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          applyAllColors(data)
          applyAllFonts(data)
          applyLogos(data)
          applySidebarLayout(data)
          applyBorderRadius(data.borderRadius)
          applyDarkMode(data.darkMode)
          applyLogoScale(data.logoScale)
          applyLogoAlign(data.logoAlign)
        }
      })
      .catch(() => {})
  }, [])

  const first = window.location.pathname.split('/').filter(Boolean)[0]
  const basename = first && !RESERVED.has(first) ? `/${first}` : ''

  return (
    <BrowserRouter basename={basename}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/login" element={<SellioLogin />} />
        <Route path="/inscription" element={<SellioInscription />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/changer-mot-de-passe" element={<ChangerMotDePasse />} />
        {/* Port 3000 root: the public Sellio home page (sign in / sign up live at /login and /inscription). */}
        <Route path="/" element={basename ? <Navigate to="/dashboard" replace /> : <SellioHome />} />

        <Route element={<RequireAuth />}>
          <Route path="/nouvelle-boutique" element={<NouvelleBoutique />} />
          <Route path="/verification" element={<VerificationBoutique />} />
          <Route path="/sellio" element={<SellioConsole />} />
          <Route element={<Layout />}>
            <Route path="/configuration" element={<ConfigurationBoutique />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/produits" element={<Produits />} />
            <Route path="/produits/nouveau" element={<AjouterProduit />} />
            <Route path="/produits/edit/:id" element={<EditProduit />} />
            <Route path="/apparence" element={<Apparence />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/nouveau" element={<AjouterCompte />} />
            <Route path="/clients/:id" element={<DetailClient />} />
            <Route path="/roles" element={<RolesPermissions />} />
            <Route path="/retours" element={<Retours />} />
            <Route path="/retours/:id" element={<DetailRetour />} />
            <Route path="/retours/historique" element={<HistoriqueRemboursements />} />
            <Route path="/compte" element={<CompteHebergement />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/nouveau" element={<AjouterCategorie />} />
            <Route path="/categories/edit/:id" element={<EditCategorie />} />
            <Route path="/commandes" element={<Commandes />} />
            <Route path="/commandes/:id" element={<DetailCommande />} />
            <Route path="/bannieres" element={<Bannieres />} />
            <Route path="/bannieres/nouveau" element={<AjouterBanniere />} />
            <Route path="/bannieres/edit/:id" element={<AjouterBanniere />} />
            <Route path="/tva-livraison" element={<TvaLivraison />} />
            <Route path="/avis" element={<Avis />} />
            <Route path="/comportement" element={<Comportement />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/fidelite" element={<Fidelite />} />
            <Route path="/email-marketing" element={<EmailMarketing />} />
          </Route>
        </Route>

        {/* Page 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
