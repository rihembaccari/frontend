// ═══════════════════════════════════════════════════════════════════
// tokenService.js — JWT persistence + expiry check
// Token and user info are stored in localStorage so they survive
// page refreshes. On every read we verify the JWT exp claim —
// if expired the session is cleared automatically.
// ═══════════════════════════════════════════════════════════════════

const TOKEN_KEY = 'gestionpro_token'
const USER_KEY  = 'gestionpro_user'

// ── JWT decode (no external library needed) ────────────────────────
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json    = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// ── Check if a token is still valid (not expired) ─────────────────
export function isTokenValid(token) {
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return false
  // exp is in seconds, Date.now() is ms
  return payload.exp * 1000 > Date.now()
}

// ── Token ──────────────────────────────────────────────────────────
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  // Auto-clear if expired
  if (token && !isTokenValid(token)) {
    logout()
    return null
  }
  return token
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ── User info ──────────────────────────────────────────────────────
export function saveUser(data) {
  localStorage.setItem(USER_KEY, JSON.stringify(data))
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  // Only return user if token is still valid
  const token = localStorage.getItem(TOKEN_KEY)
  if (!isTokenValid(token)) {
    logout()
    return null
  }
  try { return JSON.parse(raw) } catch { return null }
}

export function getRole() {
  return getUser()?.role || null
}

export function isAdmin() {
  return getRole() === 'ADMIN'
}

export function isChefProjet() {
  return getRole() === 'CHEF_PROJET'
}

export function isCCBManager() {
  return getRole() === 'CCB_MANAGER'
}

export function isDeveloppeur() {
  return getRole() === 'DEVELOPPEUR'
}

export function canAccessChangements() {
  const r = getRole()
  return r === 'ADMIN' || r === 'CHEF_PROJET' || r === 'CCB_MANAGER' || r === 'DEVELOPPEUR'
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

// ── Check if user is currently logged in with a valid token ────────
export function isLoggedIn() {
  const token = localStorage.getItem(TOKEN_KEY)
  return isTokenValid(token)
}

// ── Logout — clears everything ─────────────────────────────────────
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// ── Get milliseconds until token expires (for auto-logout timer) ───
export function msUntilExpiry() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return 0
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return 0
  return Math.max(0, payload.exp * 1000 - Date.now())
}