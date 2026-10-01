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
import MesCommandes from './pages/MesCommandes';
import MonProfil from './pages/MonProfil';
import MesRetours from './pages/MesRetours';
import MotDePasseOublie from './pages/MotDePasseOublie';
import ChangerMotDePasse from './pages/ChangerMotDePasse';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
      <Route path="/changer-mot-de-passe" element={<ChangerMotDePasse />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/produits/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/favoris" element={<FavorisPage />} />
        <Route path="/commandes" element={<MesCommandes />} />
        <Route path="/retours" element={<MesRetours />} />
        <Route path="/profile" element={<MonProfil />} />
      </Route>
    </Routes>
  );
}
