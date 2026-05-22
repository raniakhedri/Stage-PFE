import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getUser, getAccessToken } from '../api/tokenStorage';
import { fetchMyOrders, fetchMyReturns, fetchMyReviews } from '../api/apiClient';

const STORAGE_KEY = 'notif_snapshot';
const POLL_MS = 60_000; // 1 minute

const ORDER_STATUS_LABEL = {
  EN_ATTENTE:     'En attente',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE:       'Expédiée',
  LIVREE:         'Livrée',
  ANNULEE:        'Annulée',
};

const RETURN_STATUS_LABEL = {
  EN_ATTENTE: 'En attente',
  APPROUVEE:  'Approuvée',
  REFUSEE:    'Refusée',
  REMBOURSEE: 'Remboursée',
};

function loadSnapshot() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveSnapshot(snap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
}

function detectNewNotifs(orders, returns, reviews, snap) {
  const notifs = [];

  // 1 — Order status changes (skip EN_ATTENTE → it's the initial state)
  orders.forEach(o => {
    const prev = snap.orders?.[o.id];
    const curr = o.status;
    if (prev && prev !== curr && curr !== 'EN_ATTENTE') {
      notifs.push({
        id: `order-${o.id}-${curr}`,
        type: 'order',
        message: `Commande ${o.reference} : ${ORDER_STATUS_LABEL[curr] || curr}`,
        link: '/commandes',
        time: Date.now(),
      });
    }
  });

  // 2 — Return status changes (skip EN_ATTENTE → new return, not a notification)
  returns.forEach(r => {
    const prev = snap.returns?.[r.id];
    const curr = r.status;
    if (prev && prev !== curr && curr !== 'EN_ATTENTE') {
      notifs.push({
        id: `return-${r.id}-${curr}`,
        type: 'return',
        message: `Retour ${r.reference} : ${RETURN_STATUS_LABEL[curr] || curr}`,
        link: '/retours',
        time: Date.now(),
      });
    }
  });

  // 3 — New admin reply on a review
  reviews.forEach(rev => {
    const prevReponse = snap.reviews?.[rev.id];
    const hasReply = !!rev.reponse;
    if (hasReply && prevReponse !== rev.reponse) {
      notifs.push({
        id: `review-${rev.id}-reply`,
        type: 'review',
        message: `Réponse à votre avis sur ${rev.productName}`,
        link: '/commandes',
        time: Date.now(),
      });
    }
  });

  return notifs;
}

function buildSnapshot(orders, returns, reviews) {
  return {
    orders:  Object.fromEntries(orders.map(o => [o.id, o.status])),
    returns: Object.fromEntries(returns.map(r => [r.id, r.status])),
    reviews: Object.fromEntries(reviews.map(r => [r.id, r.reponse || null])),
  };
}

export default function NotificationBell() {
  const user = getUser();
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_list') || '[]'); } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(() => {
    return parseInt(localStorage.getItem('notif_unread') || '0', 10);
  });
  const panelRef = useRef(null);
  const isInit = useRef(false);

  const persist = useCallback((list, count) => {
    localStorage.setItem('notif_list', JSON.stringify(list.slice(0, 30)));
    localStorage.setItem('notif_unread', String(count));
  }, []);

  const poll = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const [orders, returns, reviews] = await Promise.all([
        fetchMyOrders().catch(() => []),
        fetchMyReturns().catch(() => []),
        fetchMyReviews().catch(() => []),
      ]);

      const snap = loadSnapshot();

      if (!isInit.current) {
        isInit.current = true;
        // If no snapshot exists yet (truly first ever load), just initialise — no notifications
        if (!snap.orders) {
          saveSnapshot(buildSnapshot(orders, returns, reviews));
          return;
        }
        // Snapshot already exists → a session was restored, detect changes that happened between sessions
      }

      const newNotifs = detectNewNotifs(orders, returns, reviews, snap);
      saveSnapshot(buildSnapshot(orders, returns, reviews));

      if (newNotifs.length > 0) {
        setNotifications(prev => {
          const merged = [...newNotifs, ...prev].slice(0, 30);
          const count = merged.length > 0 ? (parseInt(localStorage.getItem('notif_unread') || '0') + newNotifs.length) : 0;
          persist(merged, count);
          setUnread(count);
          return merged;
        });
      }
    } catch {
      // Silent fail — non-critical
    }
  }, [persist]);

  // Poll on mount and then every POLL_MS
  useEffect(() => {
    if (!user) return;
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [user, poll]);

  // Close panel on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markAllRead = () => {
    setUnread(0);
    localStorage.setItem('notif_unread', '0');
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) markAllRead();
  };

  if (!user) return null;

  const TYPE_ICON = { order: '📦', return: '↩️', review: '💬' };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative hover:opacity-80 transition-opacity focus:outline-none"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-[200]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
            <span className="font-headline font-bold text-sm text-primary">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => { setNotifications([]); persist([], 0); setUnread(0); }}
                className="text-xs text-outline hover:text-primary transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-outline font-body">
                Aucune notification pour le moment
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors"
                >
                  <span className="text-base mt-0.5 shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                  <p className="text-sm font-body text-primary leading-snug">{n.message}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
