import { useState, useEffect } from 'react'
import { fetchPendingUsers, assignRole } from '../services/userService'
import './css/AdminPage.css'

const ROLE_OPTIONS = ['MANAGER', 'CHEF_PROJET', 'TEAM_MEMBER']

export default function AdminPage({ onLogout }) {
  const [pending,   setPending]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState({}) // userId → role
  const [saving,    setSaving]    = useState({})  // userId → bool
  const [success,   setSuccess]   = useState({})  // userId → bool

  useEffect(() => {
    fetchPendingUsers()
      .then(setPending)
      .finally(() => setLoading(false))
  }, [])

  const handleAssign = async (userId) => {
    const role = selected[userId]
    if (!role) return
    setSaving(s => ({ ...s, [userId]: true }))
    try {
      await assignRole(userId, role)
      setSuccess(s => ({ ...s, [userId]: true }))
      setPending(p => p.filter(u => u.id !== userId))
    } catch (err) {
      alert('Failed to assign role: ' + err.message)
    } finally {
      setSaving(s => ({ ...s, [userId]: false }))
    }
  }

  return (
    <div className="admin-root">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin — Role Management</h1>
          <p className="admin-sub">Assign roles to pending users to grant them access</p>
        </div>
        <button className="admin-logout" onClick={onLogout}>Sign out</button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading pending users...</div>
        ) : pending.length === 0 ? (
          <div className="admin-empty">
            <span>✅</span>
            <p>No pending users — all users have been approved.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Assign Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge-pending">PENDING</span>
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={selected[user.id] || ''}
                      onChange={e => setSelected(s => ({ ...s, [user.id]: e.target.value }))}
                    >
                      <option value="">-- Select role --</option>
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="assign-btn"
                      onClick={() => handleAssign(user.id)}
                      disabled={!selected[user.id] || saving[user.id]}
                    >
                      {saving[user.id] ? 'Saving...' : 'Assign →'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}