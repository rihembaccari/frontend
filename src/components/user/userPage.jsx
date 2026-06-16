import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { getToken } from '../../services/tokenService'
import './userPage.css'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({ Authorization: `Bearer ${getToken()}` })
const jsonH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const ROLES = [
  { value: 'ADMIN',       labelFr: 'Administrateur',  labelEn: 'Administrator'  },
  { value: 'CHEF_PROJET', labelFr: 'Chef de Projet',  labelEn: 'Project Manager' },
  { value: 'CCB_MANAGER', labelFr: 'CCB Manager',     labelEn: 'CCB Manager'    },
]

// ── Role badge config ────────────────────────────────────────────
const ROLE_CFG = {
  ADMIN:       { bg:'#DBEAFE', color:'#1E40AF', label:'Admin',           kpiColor:'#1E40AF', kpiBg:'#DBEAFE' },
  CHEF_PROJET: { bg:'#FEF9C3', color:'#854D0E', label:'Project Manager', kpiColor:'#854D0E', kpiBg:'#FEF9C3' },
  CCB_MANAGER: { bg:'#DCFCE7', color:'#166534', label:'CCB Manager',     kpiColor:'#166534', kpiBg:'#DCFCE7' },
}
const STATUS_CFG = {
  ACTIVE:  { bg:'#DCFCE7', color:'#166534', label:'Active'  },
  PENDING: { bg:'#FEF9C3', color:'#854D0E', label:'Pending' },
}

const EMPTY_FORM = () => ({ prenom:'', nom:'', email:'', password:'', role:'CHEF_PROJET' })

// ── Role Badge ────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const s = ROLE_CFG[role] || { bg:'#F1F5F9', color:'#64748B', label: role || '—' }
  return (
    <span style={{ background:s.bg, color:s.color, padding:'4px 12px', borderRadius:999, fontSize:'11.5px', fontWeight:600, display:'inline-block', whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || { bg:'#F1F5F9', color:'#64748B', label: status || '—' }
  return (
    <span style={{ background:s.bg, color:s.color, padding:'4px 12px', borderRadius:999, fontSize:'11.5px', fontWeight:600, display:'inline-block', whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4200); return () => clearTimeout(t) }, [onClose])
  const borderColor = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--c)'
  const iconColor   = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--c)'
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      display:'flex', alignItems:'center', gap:10, background:'white',
      borderLeft:`4px solid ${borderColor}`, borderRadius:10, padding:'12px 16px',
      maxWidth:360, boxShadow:'0 8px 32px rgba(0,0,0,.12)',
      fontFamily:'var(--font)', fontSize:'.875rem', fontWeight:500,
      animation:'rowIn .25s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <span style={{ color:iconColor, fontWeight:700 }}>{type==='success'?'✓':type==='error'?'✕':'⚠'}</span>
      <span style={{ flex:1, color:'var(--t1)' }}>{message}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:13 }}>✕</button>
    </div>
  )
}

// ── User Create/Edit Modal ────────────────────────────────────────
function UserModal({ user, onSave, onClose }) {
  const { lang } = useLanguage()
  const isEdit = !!user
  const [form,    setFormState] = useState(user
    ? { prenom:user.prenom||'', nom:user.nom||'', email:user.email||'', password:'', role:user.role||'CHEF_PROJET' }
    : EMPTY_FORM()
  )
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const setField = (k, v) => { setFormState(f => ({ ...f, [k]:v })); setErrors(e => ({ ...e, [k]:'' })) }

  const validate = () => {
    const e = {}
    if (!form.prenom.trim())          e.prenom   = 'First name is required'
    if (!form.nom.trim())             e.nom      = 'Last name is required'
    if (!form.email.trim())           e.email    = 'Email is required'
    if (!isEdit && !form.password.trim()) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try { await onSave(form) } finally { setLoading(false) }
  }

  const roleHint = {
    ADMIN:       '🛡 Full access — complete platform management',
    CHEF_PROJET: '📋 Manage assigned projects — full lifecycle',
    CCB_MANAGER: '✅ Analyze and approve change requests',
  }[form.role] || ''

  return ReactDOM.createPortal(
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="um-modal">

        {/* Header */}
        <div className="um-modal__header">
          <div className="um-modal__header-icon">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M4 20v-1a8 8 0 0116 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div className="um-modal__title">
              {isEdit ? `Edit: ${user.prenom} ${user.nom}` : 'Create a user account'}
            </div>
            <div className="um-modal__sub">
              {isEdit ? 'Edit the account information' : 'Fill in the information to create a new account'}
            </div>
          </div>
          <button className="um-modal__close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="um-modal__body">

          <div className="um-section-label">Personal information</div>
          <div className="um-grid-2">
            {/* First name */}
            <div className={`um-field${errors.prenom ? ' um-field--error' : ''}`}>
              <label className="um-label">First name <span className="um-required">*</span></label>
              <div className="um-input-wrap">
                <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 18v-.5a7 7 0 0114 0v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input className="um-input" type="text" placeholder="e.g. John"
                  value={form.prenom} onChange={e => setField('prenom', e.target.value)}/>
              </div>
              {errors.prenom && <span className="um-error">{errors.prenom}</span>}
            </div>
            {/* Last name */}
            <div className={`um-field${errors.nom ? ' um-field--error' : ''}`}>
              <label className="um-label">Last name <span className="um-required">*</span></label>
              <div className="um-input-wrap">
                <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 18v-.5a7 7 0 0114 0v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input className="um-input" type="text" placeholder="e.g. Smith"
                  value={form.nom} onChange={e => setField('nom', e.target.value)}/>
              </div>
              {errors.nom && <span className="um-error">{errors.nom}</span>}
            </div>
          </div>

          <div className="um-section-label">Account</div>

          {/* Email */}
          <div className={`um-field${errors.email ? ' um-field--error' : ''}`}>
            <label className="um-label">Email <span className="um-required">*</span></label>
            <div className="um-input-wrap">
              <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                <rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input className="um-input" type="email" placeholder="first.last@clinisys.ma"
                value={form.email} onChange={e => setField('email', e.target.value)} disabled={isEdit}/>
            </div>
            {errors.email && <span className="um-error">{errors.email}</span>}
          </div>

          {/* Password — create only */}
          {!isEdit && (
            <div className={`um-field${errors.password ? ' um-field--error' : ''}`}>
              <label className="um-label">Password <span className="um-required">*</span></label>
              <div className="um-input-wrap">
                <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input className="um-input um-input--pwd"
                  type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 characters"
                  value={form.password} onChange={e => setField('password', e.target.value)}/>
                <button className="um-eye" type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}>
                  {showPwd
                    ? <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M3 3l14 14M8.5 8.6A3 3 0 0011.4 11.5M6.3 6.4A7.5 7.5 0 002 10s3 5 8 5a7.4 7.4 0 003.7-1M9 4.1A7.5 7.5 0 0118 10s-.8 1.5-2 2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>
              {errors.password && <span className="um-error">{errors.password}</span>}
            </div>
          )}

          <div className="um-section-label">Role & Permissions</div>

          {/* Role selector */}
          <div className="um-field">
            <label className="um-label">Role <span className="um-required">*</span></label>
            <div className="um-input-wrap">
              <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM3 18a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M16 8l2 2-4 4-2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <select className="um-input um-input--select" value={form.role} onChange={e => setField('role', e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{lang === 'fr' ? r.labelFr : r.labelEn}</option>)}
              </select>
            </div>
            {roleHint && <div className="um-role-hint">{roleHint}</div>}
          </div>

          {/* Role preview */}
          <div className="um-role-preview">
            <span>Preview:</span>
            <RoleBadge role={form.role} />
          </div>

        </div>

        {/* Footer */}
        <div className="um-modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><span className="um-spinner"/> Saving…</>
              : isEdit ? '✔ Save' : '✔ Create account'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Password Reset Modal ──────────────────────────────────────────
function PasswordModal({ user, onClose, addToast }) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const handleReset = async () => {
    if (password.length < 6)    { addToast('Minimum 6 characters', 'warn'); return }
    if (password !== confirm)   { addToast('Passwords do not match', 'warn'); return }
    setLoading(true)
    try {
      const r = await fetch(`${API}/utilisateurs/${user.id}/password`, {
        method:'PUT', headers:jsonH(), body:JSON.stringify({ password }),
      })
      if (!r.ok) throw new Error(await r.text())
      addToast('Password reset ✓')
      onClose()
    } catch (e) { addToast(e.message || 'Error', 'error') }
    finally { setLoading(false) }
  }

  return ReactDOM.createPortal(
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="um-modal" style={{ maxWidth:440 }}>
        <div className="um-modal__header">
          <div className="um-modal__header-icon" style={{ background:'var(--c2l)', color:'var(--c2)' }}>
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <rect x="4" y="11" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div className="um-modal__title">Reset password</div>
            <div className="um-modal__sub">{user.prenom} {user.nom}</div>
          </div>
          <button className="um-modal__close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="um-modal__body">
          <div className="um-field">
            <label className="um-label">New password</label>
            <div className="um-input-wrap">
              <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input className="um-input um-input--pwd" type={showPwd ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password} onChange={e => setPassword(e.target.value)}/>
              <button className="um-eye" type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}>
                <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="um-field">
            <label className="um-label">Confirm password</label>
            <div className="um-input-wrap">
              <svg className="um-input-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
                <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input className="um-input" type="password" placeholder="Repeat the password"
                value={confirm} onChange={e => setConfirm(e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="um-modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleReset} disabled={loading}>
            {loading ? 'Resetting…' : '🔑 Reset'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Confirm Delete Modal ──────────────────────────────────────────
function ConfirmModal({ user, onConfirm, onClose }) {
  return ReactDOM.createPortal(
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="um-confirm">
        <div className="um-confirm__emoji">⚠️</div>
        <h3 className="um-confirm__title">Delete {user.prenom} {user.nom}?</h3>
        <p className="um-confirm__body">This action is irreversible. The account will be permanently deleted.</p>
        <div className="um-confirm__actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function UtilisateurPage({ onLogout }) {
  const { lang } = useLanguage()
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [editUser,    setEditUser]    = useState(null)
  const [pwdUser,     setPwdUser]     = useState(null)
  const [deleteUser,  setDeleteUser]  = useState(null)
  const [toast,       setToast]       = useState(null)

  const addToast = (message, type = 'success') => setToast({ message, type })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/utilisateurs`, { headers: authH() })
      if (r.ok) setUsers(await r.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    const r = await fetch(`${API}/utilisateurs`, { method:'POST', headers:jsonH(), body:JSON.stringify(form) })
    if (!r.ok) throw new Error(await r.text())
    addToast('Account created successfully ✓')
    setCreateModal(false); load()
  }

  const handleEdit = async (form) => {
    const r = await fetch(`${API}/utilisateurs/${editUser.id}`, { method:'PUT', headers:jsonH(), body:JSON.stringify(form) })
    if (!r.ok) throw new Error(await r.text())
    addToast('Account updated ✓')
    setEditUser(null); load()
  }

  const handleDelete = async () => {
    try {
      const r = await fetch(`${API}/utilisateurs/${deleteUser.id}`, { method:'DELETE', headers:authH() })
      if (!r.ok) throw new Error(await r.text())
      addToast('Account deleted')
      setDeleteUser(null); load()
    } catch (e) { addToast(e.message || 'Delete error', 'error'); setDeleteUser(null) }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (u.prenom||'').toLowerCase().includes(q) ||
      (u.nom   ||'').toLowerCase().includes(q) ||
      (u.email ||'').toLowerCase().includes(q)
    return matchSearch && (!filterRole || u.role === filterRole)
  })

  const stats = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length, cfg: ROLE_CFG[r.value] }))

  // Avatar color per role
  const avatarBg = (role) => ({
    ADMIN:'linear-gradient(135deg,#1E40AF,#3B82F6)',
    CHEF_PROJET:'linear-gradient(135deg,var(--c),#E8855A)',
    CCB_MANAGER:'linear-gradient(135deg,#166534,#22C55E)',
  }[role] || 'linear-gradient(135deg,var(--c),#E8855A)')

  return (
    <div className="um-page">

      {/* ── Page header ── */}
      <div className="um-page-header">
        <div>
          <div className="um-page-title">User Management</div>
          <div className="um-page-sub">{users.length} account{users.length!==1?'s':''} registered</div>
        </div>
        <button className="btn btn--primary" onClick={() => setCreateModal(true)}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>
          Create account
        </button>
      </div>

      {/* ── KPI stat cards ── */}
      <div className="um-stats">
        <div className="um-stat-card" onClick={() => setFilterRole('')}
          style={{ borderTop:'3.5px solid var(--c)', cursor:'pointer' }}>
          <span className="um-stat-num">{users.length}</span>
          <span className="um-stat-lbl">Total</span>
        </div>
        {stats.map((s, i) => (
          <div key={s.value} className="um-stat-card"
            style={{ background: filterRole === s.value ? s.cfg.kpiBg : '', borderTop:`3.5px solid ${s.cfg.color}`, animationDelay:`${(i+1)*0.07}s` }}
            onClick={() => setFilterRole(filterRole === s.value ? '' : s.value)}>
            <span className="um-stat-num" style={{ color:s.cfg.color }}>{s.count}</span>
            <span className="um-stat-lbl" style={{ color:s.cfg.color }}>
              {lang === 'fr' ? s.labelFr : s.labelEn}
              {filterRole === s.value && ' ✓'}
            </span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="um-filterbar">
        <div className="um-search-wrap">
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M15 15l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input className="um-search" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="um-filter-sel" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{lang==='fr' ? r.labelFr : r.labelEn}</option>)}
        </select>
        {(search || filterRole) && (
          <button className="btn btn--ghost um-clear-btn" onClick={() => { setSearch(''); setFilterRole('') }}>
            ✕ Clear
          </button>
        )}
        <span className="um-count">{filtered.length} result{filtered.length!==1?'s':''}</span>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="um-empty">
          <div style={{width:24,height:24,border:'3px solid rgba(0,0,0,.08)',borderTopColor:'var(--c)',borderRadius:'50%',animation:'spin .65s linear infinite',marginRight:12}}/>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="um-empty">
          <span style={{fontSize:'2rem',marginRight:12}}>👤</span>
          No users found.
        </div>
      ) : (
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th" style={{width:48}}>#</th>
                <th className="um-th">Full name</th>
                <th className="um-th">Email</th>
                <th className="um-th">Role</th>
                <th className="um-th">Status</th>
                <th className="um-th um-th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className="um-row" style={{'--row-delay':`${i*30}ms`}}>
                  <td className="um-td um-td--num">{i + 1}</td>
                  <td className="um-td">
                    <div className="um-avatar-row">
                      <div className="um-avatar" style={{ background: avatarBg(u.role) }}>
                        {(u.prenom?.[0]||'').toUpperCase()}{(u.nom?.[0]||'').toUpperCase()}
                      </div>
                      <span className="um-fullname">{u.prenom} {u.nom}</span>
                    </div>
                  </td>
                  <td className="um-td um-td--email">{u.email}</td>
                  <td className="um-td"><RoleBadge role={u.role}/></td>
                  <td className="um-td"><StatusBadge status={u.status}/></td>
                  <td className="um-td um-td--actions">
                    <button className="um-action-btn um-action-btn--edit" title="Edit" onClick={() => setEditUser(u)}>
                      <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5l4 4L6 18H2v-4L11 5z"/><path d="M14 3l3 3"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-action-btn--pwd" title="Reset password" onClick={() => setPwdUser(u)}>
                      <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-action-btn--delete" title="Delete" onClick={() => setDeleteUser(u)}>
                      <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 4h4M3 6h14M5 6l1 11h8L15 6"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {createModal && <UserModal user={null}   onSave={handleCreate} onClose={() => setCreateModal(false)}/>}
      {editUser    && <UserModal user={editUser} onSave={handleEdit}  onClose={() => setEditUser(null)}/>}
      {pwdUser     && <PasswordModal user={pwdUser} onClose={() => setPwdUser(null)} addToast={addToast}/>}
      {deleteUser  && <ConfirmModal  user={deleteUser} onConfirm={handleDelete} onClose={() => setDeleteUser(null)}/>}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  )
}
