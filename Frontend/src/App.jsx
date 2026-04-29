import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import Login from './pages/Login';
import Inscription from './pages/Inscription';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';
import FavorisPage from './pages/FavorisPage';
import RecettesPage from './pages/RecettesPage';
import MesCommandes from './pages/MesCommandes';
import MonProfil from './pages/MonProfil';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/produits/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/favoris" element={<FavorisPage />} />
        <Route path="/recettes" element={<RecettesPage />} />
        <Route path="/commandes" element={<MesCommandes />} />
        <Route path="/profile" element={<MonProfil />} />
      </Route>
    </Routes>
  );
}
