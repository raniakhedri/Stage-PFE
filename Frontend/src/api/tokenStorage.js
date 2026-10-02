// ── Token storage (localStorage vs sessionStorage based on "remember me") ──────
// Auth tokens live in sessionStorage by default (clears when browser is closed).
// When "Se souvenir de moi" is checked they move to localStorage (persistent).
// All reads check sessionStorage first so both paths work transparently.
//
// Every shop is served from the same origin (/<shop>/...), and a customer account belongs to one shop:
// the same person can have a different account in each shop. Keys are therefore prefixed with the shop
// slug, so signing in on one shop never signs the visitor in (or out) on another.

const AUTH_KEYS = ['accessToken', 'refreshToken', 'user'];

function shopSlug() {
  return window.location.pathname.split('/').filter(Boolean)[0] || '';
}

function key(name) {
  const slug = shopSlug();
  return slug ? `${slug}:${name}` : name;
}

const rememberKey = () => key('ne_remember');

// Sessions saved before keys were per shop: keep the one that belongs to this shop, drop the rest.
(function migrateLegacySession() {
  const slug = shopSlug();
  if (!slug) return;
  [localStorage, sessionStorage].forEach((store) => {
    const raw = store.getItem('user');
    if (!raw) return;
    try {
      if (JSON.parse(raw)?.shopSlug === slug && !store.getItem(key('accessToken'))) {
        AUTH_KEYS.forEach((k) => store.getItem(k) && store.setItem(key(k), store.getItem(k)));
        if (store === localStorage && localStorage.getItem('ne_remember')) localStorage.setItem(rememberKey(), '1');
      }
    } catch { /* ignore a corrupted entry */ }
    AUTH_KEYS.forEach((k) => store.removeItem(k));
  });
  localStorage.removeItem('ne_remember');
})();

export function setTokens(accessToken, refreshToken, user, remember) {
  // Clear both storages before writing to avoid stale tokens in the other one
  clearTokens();
  const store = remember ? localStorage : sessionStorage;
  if (remember) {
    localStorage.setItem(rememberKey(), '1');
  } else {
    localStorage.removeItem(rememberKey());
  }
  store.setItem(key('accessToken'), accessToken);
  store.setItem(key('refreshToken'), refreshToken);
  store.setItem(key('user'), typeof user === 'string' ? user : JSON.stringify(user));
}

export function isRemembered() {
  return localStorage.getItem(rememberKey()) === '1';
}

export function getAccessToken() {
  return sessionStorage.getItem(key('accessToken')) || localStorage.getItem(key('accessToken'));
}

export function getRefreshToken() {
  return sessionStorage.getItem(key('refreshToken')) || localStorage.getItem(key('refreshToken'));
}

export function getUser() {
  const raw = sessionStorage.getItem(key('user')) || localStorage.getItem(key('user'));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearTokens() {
  AUTH_KEYS.forEach((k) => {
    localStorage.removeItem(key(k));
    sessionStorage.removeItem(key(k));
  });
  localStorage.removeItem(rememberKey());
}

// ── Auto-logout on JWT expiry ──────────────────────────────────────────────────
let _logoutTimer = null;

function _getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function _loginPage() {
  const slug = shopSlug();
  return slug ? `/${slug}/login` : '/';
}

function _doLogout() {
  if (_logoutTimer) { clearTimeout(_logoutTimer); _logoutTimer = null; }
  clearTokens();
  window.location.replace(_loginPage());
}

export function scheduleAutoLogout() {
  if (_logoutTimer) { clearTimeout(_logoutTimer); _logoutTimer = null; }
  const token = getAccessToken();
  if (!token) return;
  const expiry = _getTokenExpiry(token);
  if (!expiry) return;
  const delay = expiry - Date.now();
  if (delay <= 0) { _doLogout(); return; }
  _logoutTimer = setTimeout(_doLogout, delay);
}

// Cancel any pending timer (used on logout)
export function cancelAutoLogout() {
  if (_logoutTimer) { clearTimeout(_logoutTimer); _logoutTimer = null; }
}

// Schedule on app load if a token already exists
scheduleAutoLogout();

// Sync logout across tabs of the same shop
window.addEventListener('storage', (e) => {
  if (e.key === key('accessToken') && !e.newValue) {
    // Token was removed in another tab → log out here too
    AUTH_KEYS.forEach((k) => sessionStorage.removeItem(key(k)));
    window.location.replace(_loginPage());
  }
});
