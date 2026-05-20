// ── Token storage (localStorage vs sessionStorage based on "remember me") ──────
// Auth tokens live in sessionStorage by default (clears when browser is closed).
// When "Se souvenir de moi" is checked they move to localStorage (persistent).
// All reads check sessionStorage first so both paths work transparently.

const REMEMBER_KEY = 'ne_remember';
const AUTH_KEYS = ['accessToken', 'refreshToken', 'user'];

export function setTokens(accessToken, refreshToken, user, remember) {
  // Clear both storages before writing to avoid stale tokens in the other one
  clearTokens();
  const store = remember ? localStorage : sessionStorage;
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, '1');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
  store.setItem('accessToken', accessToken);
  store.setItem('refreshToken', refreshToken);
  store.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
}

export function getAccessToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export function getRefreshToken() {
  return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
}

export function getUser() {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearTokens() {
  AUTH_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  localStorage.removeItem(REMEMBER_KEY);
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

function _doLogout() {
  if (_logoutTimer) { clearTimeout(_logoutTimer); _logoutTimer = null; }
  clearTokens();
  window.location.replace('/login');
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

// Sync logout across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'accessToken' && !e.newValue) {
    // Token was removed in another tab → log out here too
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    window.location.replace('/login');
  }
});
