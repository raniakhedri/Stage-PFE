import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useStore } from '../context/StoreContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { ready, missing } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!ready) return null
  if (missing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-500">Cette boutique n’existe pas.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body overflow-x-clip">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
