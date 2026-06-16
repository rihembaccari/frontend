import { saveToken, saveUser } from './tokenService'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(text || 'Échec de connexion')
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Réponse invalide du serveur')
  }

  // ── Save token + user so every subsequent API call is authenticated ──
  if (data.token) {
    saveToken(data.token)
    saveUser({ role: data.role, status: data.status, email })
  }

  return data
}
