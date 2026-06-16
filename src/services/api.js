// ═══════════════════════════════════════════════════════════
// api.js  —  Centralized API config for GestionPro frontend
//
// IMPORTANT: All API calls and token storage go through here.
// If your login page uses a different localStorage key, 
// change TOKEN_KEY below to match it.
// ═══════════════════════════════════════════════════════════

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ── Token key: must match what your login page stores ────
// Common values: 'jwtToken', 'token', 'accessToken'
export const TOKEN_KEY = 'jwtToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Generic fetch wrapper with auth ──────────────────────
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  return res;
}