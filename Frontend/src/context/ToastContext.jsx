import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  cart:     { bg: 'bg-primary',   icon: '🛍️' },
  wishlist: { bg: 'bg-sage',      icon: '♡'  },
  success:  { bg: 'bg-primary',   icon: '✓'  },
  error:    { bg: 'bg-red-600',   icon: '✕'  },
  info:     { bg: 'bg-slate-700', icon: 'ℹ'  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(toast => {
          const style = TYPE_STYLES[toast.type] || TYPE_STYLES.success;
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-body text-white max-w-xs
                ${style.bg}
                animate-[toast-in_0.3s_ease-out]`}
              style={{ animation: 'toastIn 0.3s ease-out' }}
            >
              <span className="text-base shrink-0">{style.icon}</span>
              <span>{message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
