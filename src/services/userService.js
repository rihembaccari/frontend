function getAuthHeaders() {
  const token = localStorage.getItem('gestionpro_token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchPendingUsers() {
  const res = await fetch('/api/utilisateurs/pending', { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch pending users')
  return res.json()
}

export async function assignRole(userId, role) {
  const res = await fetch(`/api/utilisateurs/${userId}/role`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  })
  if (!res.ok) throw new Error('Failed to assign role')
  return res.json()
}