import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const POLL_MS = 60_000; // 1 minute

function isOverdue(createdAt) {
  if (!createdAt) return false;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() < cutoff;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results = [];

    try {
      // ── Out-of-stock products ────────────────────────────────────────────
      const { data: products } = await apiClient.get('/admin/products');
      const oos = (Array.isArray(products) ? products : []).filter(p => p.stock === 0 && p.statut !== 'ARCHIVE');
      oos.forEach(p => results.push({
        id:       `oos-${p.id}`,
        type:     'stock',
        icon:     'inventory_2',
        title:    'Rupture de stock',
        message:  p.nom,
        link:     `/produits/edit/${p.id}`,
        severity: 'error',
      }));

      // ── Pending returns (EN_ATTENTE) ─────────────────────────────────────
      const { data: returns } = await apiClient.get('/admin/returns');
      const pending = (Array.isArray(returns) ? returns : []).filter(r => r.status === 'EN_ATTENTE');
      pending.forEach(r => results.push({
        id:       `ret-${r.id}`,
        type:     'return',
        icon:     'keyboard_return',
        title:    'Retour en attente',
        message:  `${r.customerName} — ${r.productName}`,
        link:     `/retours`,
        severity: 'warning',
      }));

      // ── Overdue orders (EN_ATTENTE / EN_PREPARATION for > 24 h) ─────────
      const { data: orders } = await apiClient.get('/admin/orders');
      const overdue = (Array.isArray(orders) ? orders : []).filter(
        o =>
          (o.status === 'EN_ATTENTE' || o.status === 'EN_PREPARATION') &&
          isOverdue(o.createdAt)
      );
      overdue.forEach(o => results.push({
        id:       `ord-${o.id}`,
        type:     'order',
        icon:     'schedule',
        title:    'Commande non traitée (>24h)',
        message:  `${o.reference} — ${o.firstName} ${o.lastName}`,
        link:     `/commandes/${o.id}`,
        severity: 'warning',
      }));

      // ── Pending reviews awaiting moderation ──────────────────────────────
      const { data: reviews } = await apiClient.get('/admin/reviews');
      const pendingReviews = (Array.isArray(reviews) ? reviews : []).filter(r => r.statut === 'EN_ATTENTE');
      pendingReviews.forEach(r => results.push({
        id:       `rev-${r.id}`,
        type:     'review',
        icon:     'rate_review',
        title:    'Avis en attente de modération',
        message:  `${r.clientName} — ${r.productName}`,
        link:     `/avis`,
        severity: 'info',
      }));
    } catch (err) {
      console.error('[AdminNotifications] fetch error:', err);
    }

    setNotifications(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { notifications, count: notifications.length, loading, refresh };
}
