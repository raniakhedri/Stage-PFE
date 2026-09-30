// Behavioural tracking for the storefront.
// Events are queued and sent in small batches (every few seconds, or when the tab is hidden),
// so tracking never slows the page. The server attaches the customer id from the JWT itself.

import { getAccessToken } from '../api/tokenStorage'

const ENDPOINT = 'http://localhost:8080/api/v1/analytics/events'
const FLUSH_MS = 4000
const MAX_BATCH = 25
const SESSION_IDLE_MS = 30 * 60 * 1000

let queue = []
let timer = null

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function storage(key, create) {
  try {
    let value = localStorage.getItem(key)
    if (!value) {
      value = create()
      localStorage.setItem(key, value)
    }
    return value
  } catch {
    return create()
  }
}

/** Anonymous visitor id kept across visits (merged with the customer account on the server). */
export function visitorId() {
  return storage('sellio_vid', uuid)
}

/** A visit ends after 30 minutes without activity. */
function sessionId() {
  try {
    const now = Date.now()
    const last = Number(localStorage.getItem('sellio_sid_at') || 0)
    let sid = localStorage.getItem('sellio_sid')
    if (!sid || now - last > SESSION_IDLE_MS) {
      sid = uuid()
      localStorage.setItem('sellio_sid', sid)
    }
    localStorage.setItem('sellio_sid_at', String(now))
    return sid
  } catch {
    return uuid()
  }
}

function shopSlug() {
  return window.location.pathname.split('/').filter(Boolean)[0] || ''
}

function flush() {
  clearTimeout(timer)
  timer = null
  if (!queue.length) return
  const events = queue.splice(0, MAX_BATCH)
  const token = getAccessToken()
  fetch(ENDPOINT, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ shop: shopSlug(), visitorId: visitorId(), sessionId: sessionId(), events }),
  }).catch(() => { /* analytics must never break the shop */ })
  if (queue.length) schedule()
}

function schedule() {
  if (!timer) timer = setTimeout(flush, FLUSH_MS)
}

/**
 * track('VIEW_PRODUCT', { productId, price })
 * Types: PAGE_VIEW, VIEW_CATEGORY, VIEW_PRODUCT, CLICK_PRODUCT, SEARCH, SEARCH_CLICK, ADD_TO_CART,
 * REMOVE_FROM_CART, WISHLIST_ADD, BEGIN_CHECKOUT, PURCHASE, RECOMMENDATION_CLICK
 */
export function track(type, data = {}) {
  if (!shopSlug()) return
  queue.push({
    type,
    productId: data.productId ?? null,
    categorySlug: data.categorySlug ?? null,
    query: data.query ?? null,
    resultsCount: data.resultsCount ?? null,
    quantity: data.quantity ?? null,
    price: data.price ?? null,
    page: window.location.pathname.slice(0, 300),
    ts: Date.now(),
  })
  if (queue.length >= MAX_BATCH || type === 'PURCHASE') flush()
  else schedule()
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
  window.addEventListener('pagehide', flush)
}
