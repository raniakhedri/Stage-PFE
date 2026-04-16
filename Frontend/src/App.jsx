import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import Login from './pages/Login';
import Inscription from './pages/Inscription';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/produits/:slug" element={<ProductPage />} />
      </Route>
    </Routes>
  );
}
