import apiClient from './apiClient'
import { currentShopSlug, shopQuery } from '../lib/sellio'

const COUPON_BASE = '/admin/promotions/coupons'
const DISCOUNT_BASE = '/admin/promotions/discounts'
const STATS_URL = '/admin/promotions/stats'

export const promotionApi = {

  // ── Stats ────────────────────────────────────────────────
  getStats: () => apiClient.get(`${STATS_URL}${shopQuery()}`).then(r => r.data),

  // ── Coupons ──────────────────────────────────────────────
  getAllCoupons: () => apiClient.get(`${COUPON_BASE}${shopQuery()}`).then(r => r.data),
  getCouponById: (id) => apiClient.get(`${COUPON_BASE}/${id}`).then(r => r.data),
  createCoupon: (data) => apiClient.post(COUPON_BASE, { ...data, shopSlug: currentShopSlug() || data.shopSlug }).then(r => r.data),
  updateCoupon: (id, data) => apiClient.put(`${COUPON_BASE}/${id}`, data).then(r => r.data),
  deleteCoupon: (id) => apiClient.delete(`${COUPON_BASE}/${id}`).then(r => r.data),
  toggleCouponStatut: (id) => apiClient.patch(`${COUPON_BASE}/${id}/toggle`).then(r => r.data),

  // ── Discounts (Remise Rapide) ────────────────────────────
  getAllDiscounts: () => apiClient.get(DISCOUNT_BASE).then(r => r.data),
  getDiscountById: (id) => apiClient.get(`${DISCOUNT_BASE}/${id}`).then(r => r.data),
  createDiscount: (data) => apiClient.post(DISCOUNT_BASE, data).then(r => r.data),
  updateDiscount: (id, data) => apiClient.put(`${DISCOUNT_BASE}/${id}`, data).then(r => r.data),
  deleteDiscount: (id) => apiClient.delete(`${DISCOUNT_BASE}/${id}`).then(r => r.data),
  toggleDiscountStatut: (id) => apiClient.patch(`${DISCOUNT_BASE}/${id}/toggle`).then(r => r.data),
}
