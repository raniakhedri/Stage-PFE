import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser } from '../api/tokenStorage';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useStore } from '../context/StoreContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { ready, missing, status, storeName } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!ready) return null
  // A temporary password (account created by the shop) must be replaced before shopping.
  if (getUser()?.mustChangePassword) return <Navigate to="/changer-mot-de-passe" replace />
  if (missing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-500">Cette boutique n’existe pas.</p>
      </div>
    )
  }

  if (status && status !== 'ACTIVE') {
    const suspended = status === 'SUSPENDED'
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface text-ink">
        <div className="max-w-md text-center">
          <p className="font-headline text-3xl">{storeName || 'Boutique'}</p>
          <p className="mt-4 text-neutral-500">
            {suspended ? 'Cette boutique est temporairement indisponible.' : 'Cette boutique ouvre très bientôt. Revenez dans quelques jours !'}
          </p>
        </div>
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
