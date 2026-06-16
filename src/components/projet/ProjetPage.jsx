// ProjetPage.jsx — Animated UI v2 — matches clinisys_ui_proposal exactly
import React, { useState, useEffect, useCallback, useRef } from 'react'
import ProjetModal from './ProjetModal'
import './css/ProjetPage.css'
import { getToken, getRole, isAdmin } from '../../services/tokenService'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

// ── Statut config ─────────────────────────────────────────────────
const STATUT_STYLE = {
  EN_COURS:   { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  PLANIFIE:   { bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  TERMINE:    { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  EN_ATTENTE: { bg: '#e0f2fe', color: '#0369a1', dot: '#38bdf8' },
  ANNULE:     { bg: '#fee2e2', color: '#b91c1c', dot: '#f87171' },
}

// ── Avatar initials helper ────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg,#C1622A,#E8855A)',
  'linear-gradient(135deg,#4A7FA5,#6BA3C2)',
  'linear-gradient(135deg,#7C3AED,#9D5CF0)',
  'linear-gradient(135deg,#16A34A,#22C55E)',
  'linear-gradient(135deg,#D97706,#F59E0B)',
  'linear-gradient(135deg,#DC2626,#F87171)',
  'linear-gradient(135deg,#0369A1,#38BDF8)',
]
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}
function avatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length] }

// ── StatutBadge ───────────────────────────────────────────────────
function StatutBadge({ code, libelle }) {
  const s = STATUT_STYLE[code] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' }
  return (
    <span className="pp-badge" style={{ background: s.bg, color: s.color }}>
      <span className="pp-badge-dot" style={{ background: s.dot }} />
      {libelle}
    </span>
  )
}

// ── Progress bar ──────────────────────────────────────────────────
function ProgressBar({ pct, color }) {
  return (
    <div className="pp-prog-wrap">
      <div className="pp-prog-bg">
        <div className="pp-prog-fill" style={{ width: `${pct}%`, background: color || 'var(--c)' }} />
      </div>
      <span className="pp-prog-pct" style={{ color: color || 'var(--c)' }}>{pct}%</span>
    </div>
  )
}

// ── Avatar stack (team) ───────────────────────────────────────────
function AvatarStack({ members = [], maxShow = 3 }) {
  const shown = members.slice(0, maxShow)
  const extra = members.length - maxShow
  return (
    <div className="pp-avatar-stack">
      {shown.map((m, i) => (
        <div key={i} className="pp-av" style={{ background: avatarColor(i), zIndex: maxShow - i }} title={m.name}>
          {initials(m.name)}
        </div>
      ))}
      {extra > 0 && (
        <div className="pp-av pp-av--more">+{extra}</div>
      )}
    </div>
  )
}

// ── Chef avatar ───────────────────────────────────────────────────
function ChefAvatar({ nom, id }) {
  if (!nom) return <span className="pp-na">—</span>
  return (
    <div className="pp-chef-wrap">
      <div className="pp-av pp-av--chef" style={{ background: avatarColor(id || 0) }}>{initials(nom)}</div>
      <span className="pp-chef-name">{nom}</span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────
function ToastStack({ toasts, removeToast }) {
  return (
    <div className="pp-toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`pp-toast pp-toast--${t.type}`}>
          <span className="pp-toast-icon">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warn' ? '⚠' : 'ℹ'}
          </span>
          <span className="pp-toast-msg">{t.message}</span>
          <button className="pp-toast-x" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────────
function ConfirmModal({ config, onConfirm, onCancel }) {
  if (!config) return null
  return (
    <div className="pp-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={`pp-confirm pp-confirm--${config.variant || 'danger'}`}>
        <div className="pp-confirm-emoji">{config.icon || '⚠️'}</div>
        <h3 className="pp-confirm-title">{config.title}</h3>
        {config.body && <p className="pp-confirm-body">{config.body}</p>}
        {config.blockedItems?.length > 0 && (
          <ul className="pp-confirm-list">
            {config.blockedItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
        <div className="pp-confirm-btns">
          <button className="pp-btn pp-btn--ghost" onClick={onCancel}>{config.cancelLabel || 'Cancel'}</button>
          {config.showConfirm && (
            <button className={`pp-btn pp-btn--${config.variant || 'danger'}`} onClick={onConfirm}>
              {config.confirmLabel || 'Confirm'}
            </button>
          )}
          {!config.showConfirm && <button className="pp-btn pp-btn--primary" onClick={onCancel}>Close</button>}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function ProjetPage({ onNavigate }) {
  const userIsAdmin = isAdmin()
  const userRole    = getRole()

  const [projets,      setProjets]      = useState([])
  const [statuts,      setStatuts]      = useState([])
  const [utilisateurs, setUtilisateurs] = useState([])
  const [regions,      setRegions]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [searchNom,    setSearchNom]    = useState('')
  const [filtStatut,   setFiltStatut]   = useState('')
  const [filtChef,     setFiltChef]     = useState('')
  const [filtRegion,   setFiltRegion]   = useState('')
  const defaultApplied = useRef(false)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingProjet, setEditingProjet] = useState(null)
  const [confirmCfg,    setConfirmCfg]    = useState(null)
  const pendingAction = useRef(null)
  const [activeId, setActiveId] = useState(() => Number(localStorage.getItem('gp_activeProjetId')) || null)
  const [toasts,   setToasts]   = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 4200)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [pR, sR, uR, rR] = await Promise.all([
        fetch(`${API_BASE}/projets`,      { headers: authHeaders() }),
        fetch(`${API_BASE}/statuts`,      { headers: authHeaders() }),
        fetch(`${API_BASE}/utilisateurs`, { headers: authHeaders() }),
        fetch(`${API_BASE}/regions`,      { headers: authHeaders() }),
      ])
      if (!pR.ok || !sR.ok || !uR.ok || !rR.ok) throw new Error('HTTP error')
      const [p, s, u, r] = await Promise.all([pR.json(), sR.json(), uR.json(), rR.json()])
      setProjets(p); setStatuts(s); setUtilisateurs(u); setRegions(r)
      if (!defaultApplied.current) { defaultApplied.current = true }
    } catch { addToast('Unable to load data from server', 'error') }
    finally { setLoading(false) }
  }, [addToast])

  useEffect(() => { loadAll() }, [loadAll])

  const filtered = projets.filter(p => {
    if (searchNom  && !p.nom?.toLowerCase().includes(searchNom.toLowerCase())) return false
    if (filtStatut && String(p.statutId)     !== filtStatut) return false
    if (filtChef   && String(p.chefProjetId) !== filtChef)   return false
    if (filtRegion && String(p.regionId)     !== filtRegion) return false
    return true
  })

  const hasFilters = !!(searchNom || filtStatut || filtChef || filtRegion)
  const resetFilters = () => { setSearchNom(''); setFiltStatut(''); setFiltChef(''); setFiltRegion('') }

  const openCreate = () => { setEditingProjet(null); setModalOpen(true) }
  const openEdit   = p  => { setEditingProjet(p);    setModalOpen(true) }
  const closeModal = () => { setModalOpen(false);    setEditingProjet(null) }

  const handleSave = async (payload) => {
    const isEdit = !!editingProjet
    const url    = isEdit ? `${API_BASE}/projets/${editingProjet.id}` : `${API_BASE}/projets`
    const res    = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
    if (!res.ok) { const txt = await res.text().catch(() => 'Erreur serveur'); throw new Error(txt) }
    closeModal(); await loadAll()
    addToast(isEdit ? 'Project updated successfully ✓' : 'Project created successfully ✓', 'success')
  }

  const askDelete = (projet) => {
    pendingAction.current = async () => {
      setConfirmCfg(null)
      const res = await fetch(`${API_BASE}/projets/${projet.id}`, { method: 'DELETE', headers: authHeaders() })
      if (res.status === 409) {
        const msg = await res.text().catch(() => '')
        setConfirmCfg({ variant:'warn', icon:'🔒', title:'Deletion blocked',
          body:`Le projet "${projet.nom}" has linked financial data and cannot be deleted.`,
          blockedItems: msg ? [msg] : ['Linked billing lines','Linked payment lines'],
          cancelLabel:'Close', showConfirm:false })
        return
      }
      if (!res.ok) { addToast('Deletion error', 'error'); return }
      if (activeId === projet.id) { setActiveId(null); localStorage.removeItem('gp_activeProjetId') }
      await loadAll(); addToast(`Projet "${projet.nom}" deleted successfully`, 'success')
    }
    setConfirmCfg({ variant:'danger', icon:'🗑️', title:`Delete "${projet.nom}"?`,
      body:'This action is irreversible. If the project has financial data, deletion will be blocked.',
      cancelLabel:'Cancel', confirmLabel:'Yes, delete', showConfirm:true })
  }

  const selectActive = (projet) => {
    setActiveId(projet.id)
    localStorage.setItem('gp_activeProjetId', String(projet.id))
    addToast(`"${projet.nom}" is now the active project`, 'info')
  }

  const fmtDate = (d) => { if (!d) return '—'; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}` }

  // ── KPI computed values ───────────────────────────────────
  const totalProjets = projets.length
  const enCoursProjets = projets.filter(p => p.statutCode === 'EN_COURS' || p.statutLibelle?.toLowerCase().includes('cours')).length
  const planifiesProjets = projets.filter(p => p.statutCode === 'PLANIFIE' || p.statutLibelle?.toLowerCase().includes('planif')).length
  const terminesProjets  = projets.filter(p => p.statutCode === 'TERMINE'  || p.statutLibelle?.toLowerCase().includes('terminé')).length

  // ── Fake progress per project (0% since no task data here) ──
  const getPct = () => 0

  // ── Team members from utilisateurs for a projet (fake stack) ──
  const getTeam = (projet) => {
    const members = []
    if (projet.chefProjetNomComplet) members.push({ name: projet.chefProjetNomComplet })
    return members
  }

  return (
    <div className="pp-page">

      {/* ── Page header ── */}
      <div className="pp-page-hdr">
        <div>
          <div className="pp-page-title">Projects</div>
          <div className="pp-page-sub">Complete management of all your projects{!userIsAdmin && ' — your assigned projects'}</div>
        </div>
        <div className="pp-hdr-actions">
        
          {userIsAdmin && (
            <button className="pp-btn pp-btn--primary" onClick={openCreate}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>
              New project
            </button>
          )}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="pp-kpi-grid">
        <div className="pp-kpi">
          <div className="pp-kpi-top">
            <div className="pp-kpi-ico">📁</div>
            <span className="pp-trend pp-trend--up">Total</span>
          </div>
          <div className="pp-kpi-val">{totalProjets}</div>
          <div className="pp-kpi-lbl">Total Projects</div>
          <div className="pp-kpi-sub">{enCoursProjets} in progress · {planifiesProjets} planned</div>
        </div>
        <div className="pp-kpi pp-kpi--blue">
          <div className="pp-kpi-top">
            <div className="pp-kpi-ico">🔵</div>
            <span className="pp-trend pp-trend--info">{enCoursProjets}</span>
          </div>
          <div className="pp-kpi-val">{enCoursProjets}</div>
          <div className="pp-kpi-lbl">In Progress</div>
          <div className="pp-kpi-sub">Currently active projects</div>
        </div>
        <div className="pp-kpi pp-kpi--green">
          <div className="pp-kpi-top">
            <div className="pp-kpi-ico">✅</div>
            <span className="pp-trend pp-trend--up">{terminesProjets}</span>
          </div>
          <div className="pp-kpi-val">{terminesProjets}</div>
          <div className="pp-kpi-lbl">Completed</div>
          <div className="pp-kpi-sub">Successfully delivered</div>
        </div>
        <div className="pp-kpi pp-kpi--amber">
          <div className="pp-kpi-top">
            <div className="pp-kpi-ico">📋</div>
            <span className="pp-trend pp-trend--warn">{planifiesProjets}</span>
          </div>
          <div className="pp-kpi-val">{planifiesProjets}</div>
          <div className="pp-kpi-lbl">Planned</div>
          <div className="pp-kpi-sub">Awaiting start</div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="pp-filterbar">
        <div className="pp-search-wrap">
          <svg className="pp-search-ico" viewBox="0 0 20 20" fill="none" width="15" height="15">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input className="pp-search-input" type="text" placeholder="Search a project…"
            value={searchNom} onChange={e => setSearchNom(e.target.value)} />
          {searchNom && <button className="pp-clear-x" onClick={() => setSearchNom('')}>✕</button>}
        </div>

        <select className="pp-sel" value={filtStatut} onChange={e => setFiltStatut(e.target.value)}>
          <option value="">All statuses</option>
          {statuts.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
        </select>

        <select className="pp-sel" value={filtRegion} onChange={e => setFiltRegion(e.target.value)}>
          <option value="">All regions</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>

        {userIsAdmin && (
          <select className="pp-sel" value={filtChef} onChange={e => setFiltChef(e.target.value)}>
            <option value="">All managers</option>
            {utilisateurs.map(u => <option key={u.id} value={u.id}>{u.nomComplet}</option>)}
          </select>
        )}

        {hasFilters && (
          <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={resetFilters}>✕ Reset</button>
        )}

        <span className="pp-result-count">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ── */}
      <div className="pp-table-card">
        {loading ? (
          <div className="pp-center-state">
            <div className="pp-spinner"/>
            <p style={{color:'var(--t3)',marginTop:10}}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-center-state">
            <div style={{fontSize:'2.8rem'}}>📭</div>
            <p style={{fontWeight:600,color:'var(--t1)',marginTop:8}}>No projects found</p>
            <p style={{color:'var(--t3)',fontSize:'.85rem'}}>
              {hasFilters ? 'Adjust your filters to see more results.' : userIsAdmin ? 'Create your first project.' : 'No projects assigned to you yet.'}
            </p>
            {hasFilters && <button className="pp-btn pp-btn--ghost pp-btn--sm" style={{marginTop:12}} onClick={resetFilters}>Clear filters</button>}
          </div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr className="pp-thead-row">
                <th className="pp-th">Project</th>
                <th className="pp-th">Status</th>
                <th className="pp-th">Progress</th>
                <th className="pp-th">Region</th>
                <th className="pp-th">Project Manager</th>
                <th className="pp-th">Start</th>
                <th className="pp-th">Expected End</th>
                <th className="pp-th pp-th--center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((projet, i) => {
                const isActive = activeId === projet.id
                const pct   = 0   // progress from tasks, not available here
                const team  = getTeam(projet)
                const barColor = projet.statutCode === 'EN_COURS' ? 'var(--c)' :
                                 projet.statutCode === 'TERMINE'  ? 'var(--green)' :
                                 projet.statutCode === 'PLANIFIE' ? 'var(--c2)' : 'var(--amber)'
                return (
                  <tr key={projet.id}
                    className={`pp-tr${isActive ? ' pp-tr--active' : ''}`}
                    style={{ '--row-delay': `${i * 30}ms` }}>

                    {/* Projet name */}
                    <td className="pp-td pp-td--name">
                      {isActive && <span className="pp-active-tag">active</span>}
                      <span className="pp-proj-name">{projet.nom}</span>
                      <span className="pp-proj-id">#{projet.id}</span>
                    </td>

                    {/* Statut */}
                    <td className="pp-td">
                      {projet.statutLibelle
                        ? <StatutBadge code={projet.statutCode} libelle={projet.statutLibelle} />
                        : <span className="pp-na">—</span>}
                    </td>

                    {/* Progression */}
                    <td className="pp-td">
                      <ProgressBar pct={pct} color={barColor} />
                    </td>

                    {/* Région */}
                    <td className="pp-td pp-td--muted">{projet.regionNom || <span className="pp-na">—</span>}</td>

                    {/* Chef de Projet */}
                    <td className="pp-td">
                      <ChefAvatar nom={projet.chefProjetNomComplet} id={projet.chefProjetId} />
                    </td>

                    {/* Début */}
                    <td className="pp-td pp-td--date">{fmtDate(projet.dateDebut)}</td>

                    {/* Fin prévue */}
                    <td className="pp-td pp-td--date">{fmtDate(projet.dateFinPrevue)}</td>

                    {/* Actions */}
                    <td className="pp-td pp-td--actions">
                      {/* View / select active */}
                      <button
                        className={`pp-act-btn pp-act-btn--view${isActive ? ' pp-act-btn--active' : ''}`}
                        title={isActive ? 'Active project' : 'Set as active'}
                        onClick={() => selectActive(projet)}>
                        <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          {isActive
                            ? <><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5" fill="currentColor"/></>
                            : <><path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="2.5"/></>
                          }
                        </svg>
                      </button>

                      {/* Edit */}
                      <button className="pp-act-btn pp-act-btn--edit" title="Edit" onClick={() => openEdit(projet)}>
                        <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z"/>
                        </svg>
                      </button>

                      {/* Delete (admin only) */}
                      {userIsAdmin && (
                        <button className="pp-act-btn pp-act-btn--delete" title="Delete" onClick={() => askDelete(projet)}>
                          <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 4h4M3 6h14M5 6l1 11h8L15 6"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal / Confirm / Toasts ── */}
      {modalOpen && (
        <ProjetModal
          projet={editingProjet} statuts={statuts}
          utilisateurs={utilisateurs} regions={regions}
          onSave={handleSave} onClose={closeModal}
        />
      )}
      <ConfirmModal config={confirmCfg} onConfirm={() => pendingAction.current?.()} onCancel={() => setConfirmCfg(null)} />
      <ToastStack toasts={toasts} removeToast={id => setToasts(ts => ts.filter(t => t.id !== id))} />
    </div>
  )
}
