import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

/** Centered card in the shop's colours, shared by the account pages (password reset / change). */
export default function AccountCard({ title, subtitle, children, footer }) {
  const { storeName } = useStore();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 font-body" style={{ backgroundColor: 'rgb(var(--rgb-surface))' }}>
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center text-2xl font-headline font-bold tracking-tight mb-8" style={{ color: 'rgb(var(--rgb-primary))' }}>
          {storeName || 'Boutique'}
        </Link>
        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #e6e2dd' }}>
          <h1 className="text-xl font-headline font-bold mb-1" style={{ color: '#1d1b19' }}>{title}</h1>
          {subtitle && <p className="text-sm mb-6" style={{ color: '#727974' }}>{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-xs" style={{ color: '#727974' }}>{footer}</div>}
      </div>
    </div>
  );
}

export const accountInput =
  'w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all border border-[#c1c8c3] bg-[#f8f3ee] text-[#1d1b19] focus:border-[rgb(var(--rgb-primary))] focus:ring-2 focus:ring-[rgb(var(--rgb-primary)/0.15)]';

export function AccountLabel({ children }) {
  return <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#424844' }}>{children}</span>;
}

export function AccountButton({ loading, children, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:shadow-md disabled:opacity-50"
      style={{ backgroundColor: 'rgb(var(--rgb-primary))' }}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

export function AccountMessage({ tone = 'error', children }) {
  const styles = tone === 'error'
    ? { backgroundColor: '#fef2f2', borderLeft: '3px solid #ba1a1a', color: '#ba1a1a' }
    : { backgroundColor: '#f0fdf4', borderLeft: '3px solid #15803d', color: '#15803d' };
  return <div className="mb-4 py-3 px-4 rounded-lg text-sm" style={styles}>{children}</div>;
}
