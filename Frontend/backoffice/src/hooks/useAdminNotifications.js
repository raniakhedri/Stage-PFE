import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const POLL_MS = 60_000; // 1 minute

function isOverdue(createdAt) {
  if (!createdAt) return false;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() < cutoff;
}

function isPendingReturn(status) {
  const s = String(status || '').toUpperCase();
  return s === 'EN_ATTENTE' || s === 'PENDING';
}

function isPendingReview(statut) {
  const s = String(statut || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s === 'EN_ATTENTE' || s === 'EN ATTENTE';
}

async function safeGet(path) {
  try {
    const { data } = await apiClient.get(path);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`[AdminNotifications] ${path} failed:`, err?.response?.status || err.message);
    return [];
  }
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results = [];

    const [products, returns, orders, reviews] = await Promise.all([
      safeGet('/admin/products'),
      safeGet('/admin/returns'),
      safeGet('/admin/orders'),
      safeGet('/admin/reviews'),
    ]);

    products
      .filter((p) => p.stock === 0 && String(p.statut || '').toLowerCase() !== 'archive')
      .forEach((p) => results.push({
        id: `oos-${p.id}`,
        type: 'stock',
        icon: 'inventory_2',
        title: 'Rupture de stock',
        message: p.nom,
        link: `/produits/edit/${p.id}`,
        severity: 'error',
      }));

    returns
      .filter((r) => isPendingReturn(r.status || r.statut))
      .forEach((r) => results.push({
        id: `ret-${r.id}`,
        type: 'return',
        icon: 'keyboard_return',
        title: 'Retour en attente',
        message: `${r.customerName || 'Client'} — ${r.productName || ''}`.trim(),
        link: `/retours`,
        severity: 'warning',
      }));

    orders
      .filter((o) =>
        (o.status === 'EN_ATTENTE' || o.status === 'EN_PREPARATION') &&
        isOverdue(o.createdAt)
      )
      .forEach((o) => results.push({
        id: `ord-${o.id}`,
        type: 'order',
        icon: 'schedule',
        title: 'Commande non traitée (>24h)',
        message: `${o.reference || ''} — ${o.firstName || ''} ${o.lastName || ''}`.trim(),
        link: `/commandes/${o.id}`,
        severity: 'warning',
      }));

    reviews
      .filter((r) => isPendingReview(r.statut))
      .forEach((r) => results.push({
        id: `rev-${r.id}`,
        type: 'review',
        icon: 'rate_review',
        title: 'Avis en attente de modération',
        message: `${r.clientName || 'Client'} — ${r.productName || ''}`.trim(),
        link: `/avis`,
        severity: 'info',
      }));

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
