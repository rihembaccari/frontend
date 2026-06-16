const BASE_URL = '/api'

function getAuthHeaders() {
  const token = localStorage.getItem('gestionpro_token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchUtilisateurs() {
  const res = await fetch('/api/utilisateurs', { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch utilisateurs')
  return res.json()
}

export async function fetchRegions() {
  const res = await fetch(`${BASE_URL}/regions`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch regions')
  return res.json()
}
export async function fetchStatuts() {
  const res = await fetch('/api/statuts', { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch statuts')
  return res.json()
}

export async function createProjet(data) {
  const res = await fetch(`${BASE_URL}/projets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to create project')
  }
  return res.json()
}

export async function updateProjet(id, data) {
  const res = await fetch(`${BASE_URL}/projets/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to update project')
  }
  return res.json()
}