// ═══════════════════════════════════════════════════════════════════
// ProcessusPage.jsx — fully translated to English
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react'
import './css/ProcessusPage.css'
import { getToken, getRole, isAdmin } from '../../services/tokenService'
import { useLanguage } from '../../i18n/LanguageContext'
import LanguageSwitcher from '../../i18n/LanguageSwitcher'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

// Status values kept as-is for the backend, displayed in English
const STATUTS = ['Planifiée', 'En cours', 'Terminée', 'En retard', 'Suspendue']
const STATUT_LABEL = {
  'Planifiée':  'Planned',
  'En cours':   'In Progress',
  'Terminée':   'Done',
  'En retard':  'Late',
  'Suspendue':  'Suspended',
}

const EMPTY_TACHE = () => ({
  _key: Math.random(), id: null,
  nom: '', dateDebut: '', dateFin: '',
  statut: 'Planifiée',
  raciRId: '', raciAId: '', raciCId: '', raciIId: '',
})

const EMPTY_FORM = () => ({ nom: '', taches: [EMPTY_TACHE()] })

// ── Toast ──────────────────────────────────────────────────────────
function ToastStack({ toasts, remove }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '⚠'}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-x" onClick={() => remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Confirm modal ──────────────────────────────────────────────────
function ConfirmModal({ cfg, onConfirm, onCancel }) {
  if (!cfg) return null
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box confirm-box--danger">
        <div className="confirm-emoji">🗑️</div>
        <h3 className="confirm-title">{cfg.title}</h3>
        <p className="confirm-body">{cfg.body}</p>
        <div className="confirm-btns">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const map = {
    'Planifiée': 'planned', 'En cours': 'inprogress',
    'Terminée': 'done', 'En retard': 'late', 'Suspendue': 'suspended',
  }
  return (
    <span className={`statut-badge statut-badge--${map[statut] || 'planned'}`}>
      {STATUT_LABEL[statut] || statut}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function ProcessusPage({ onNavigate }) {
  const { t, lang } = useLanguage()
  const userIsAdmin = isAdmin()
  const userRole    = getRole()

  const [projets,       setProjets]       = useState([])
  const [selectedId,    setSelectedId]    = useState(null)
  const [processusList, setProcessusList] = useState([])
  const [openItems,     setOpenItems]     = useState({})
  const [loading,       setLoading]       = useState(false)
  const [users,         setUsers]         = useState([])

  // Modal state
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM())
  const [saving,     setSaving]     = useState(false)

  // Confirm delete
  const [confirmCfg,  setConfirmCfg]  = useState(null)
  const pendingDelete = useRef(null)

  // Toast
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4000)
  }, [])

  // ── Load projects ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/projets`, { headers: auth() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setProjets(data))
      .catch(() => {})
  }, [])

  // ── Load users for RACI dropdowns ──────────────────────────────
  useEffect(() => {
    fetch(`${API}/utilisateurs`, { headers: auth() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          if (a.role === b.role) return (a.nomComplet || '').localeCompare(b.nomComplet || '')
          if (a.role === 'CHEF_PROJET') return -1
          return 1
        })
        setUsers(sorted)
      })
      .catch(() => {})
  }, [])

  // ── Load processus for selected project ────────────────────────
  const loadProcessus = useCallback(async (projetId) => {
    if (!projetId) { setProcessusList([]); return }
    setLoading(true)
    try {
      const r = await fetch(`${API}/projets/${projetId}/processus`, { headers: auth() })
      setProcessusList(r.ok ? await r.json() : [])
    } catch { setProcessusList([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadProcessus(selectedId) }, [selectedId, loadProcessus])

  // ── Accordion toggle ───────────────────────────────────────────
  const toggleItem = (id) => setOpenItems(o => ({ ...o, [id]: !o[id] }))

  // ── Open modal for create ──────────────────────────────────────
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM())
    setModalOpen(true)
  }

  // ── Open modal for edit ────────────────────────────────────────
  const openEdit = (proc) => {
    setEditingId(proc.id)
    setForm({
      nom: proc.nom,
      taches: proc.taches.map(tk => ({
        _key:      Math.random(),
        id:        tk.id,
        nom:       tk.nom,
        dateDebut: tk.dateDebut || '',
        dateFin:   tk.dateFin   || '',
        statut:    tk.statut    || 'Planifiée',
        raciRId:   tk.raciRId != null ? String(tk.raciRId) : '',
        raciAId:   tk.raciAId != null ? String(tk.raciAId) : '',
        raciCId:   tk.raciCId != null ? String(tk.raciCId) : '',
        raciIId:   tk.raciIId != null ? String(tk.raciIId) : '',
      }))
    })
    setModalOpen(true)
  }

  // ── Form helpers ───────────────────────────────────────────────
  const setFormNom   = (v)           => setForm(f => ({ ...f, nom: v }))
  const addTache     = ()            => setForm(f => ({ ...f, taches: [...f.taches, EMPTY_TACHE()] }))
  const removeTache  = (key)         => setForm(f => ({ ...f, taches: f.taches.filter(tk => tk._key !== key) }))
  const updateTache  = (key, field, val) => setForm(f => ({
    ...f,
    taches: f.taches.map(tk => tk._key === key ? { ...tk, [field]: val } : tk)
  }))

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nom.trim()) { addToast('Process name is required', 'warn'); return }
    if (!selectedId)      { addToast('Select a project first', 'warn'); return }
    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        taches: form.taches.map(tk => ({
          id:        tk.id || null,
          nom:       tk.nom,
          dateDebut: tk.dateDebut || null,
          dateFin:   tk.dateFin   || null,
          statut:    tk.statut,
          raciRId:   tk.raciRId ? Number(tk.raciRId) : null,
          raciAId:   tk.raciAId ? Number(tk.raciAId) : null,
          raciCId:   tk.raciCId ? Number(tk.raciCId) : null,
          raciIId:   tk.raciIId ? Number(tk.raciIId) : null,
        }))
      }
      const url    = editingId ? `${API}/processus/${editingId}` : `${API}/projets/${selectedId}/processus`
      const method = editingId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: auth(), body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      addToast(editingId ? 'Process saved ✓' : 'Process created ✓', 'success')
      setModalOpen(false)
      loadProcessus(selectedId)
    } catch { addToast('Error saving process', 'error') }
    finally { setSaving(false) }
  }

  // ── Delete ─────────────────────────────────────────────────────
  const askDelete = (proc) => {
    pendingDelete.current = proc.id
    setConfirmCfg({
      title: 'Delete this process?',
      body:  'This process and all its tasks will be permanently deleted.',
    })
  }

  const confirmDelete = async () => {
    const id = pendingDelete.current
    setConfirmCfg(null)
    try {
      const res = await fetch(`${API}/processus/${id}`, { method: 'DELETE', headers: auth() })
      if (!res.ok) throw new Error()
      addToast('Process deleted ✓', 'success')
      loadProcessus(selectedId)
    } catch { addToast('Deletion error', 'error') }
  }

  const selectedProjet = projets.find(p => p.id === selectedId)

  const userLabel = (u) => u ? `${u.prenom} ${u.nom}` : '—'
  const fmtDate   = (d) => { if (!d) return '—'; const [y,m,dd]=d.split('-'); return `${dd}/${m}/${y}` }

  const statutClass = (s) => ({
    'Planifiée': 'planned', 'En cours': 'inprogress',
    'Terminée': 'done', 'En retard': 'late', 'Suspendue': 'suspended',
  }[s] || 'planned')

  // ── Inline status change ────────────────────────────────────────
  const handleStatutChange = async (tacheId, newStatut, procId) => {
    setProcessusList(list => list.map(p =>
      p.id !== procId ? p : {
        ...p,
        taches: p.taches.map(tk =>
          tk.id !== tacheId ? tk : { ...tk, statut: newStatut }
        )
      }
    ))
    try {
      const res = await fetch(`${API}/taches/${tacheId}/statut`, {
        method: 'PATCH',
        headers: auth(),
        body: JSON.stringify({ statut: newStatut }),
      })
      if (!res.ok) throw new Error()
      addToast('Status updated ✓', 'success')
    } catch {
      addToast('Update error', 'error')
      loadProcessus(selectedId)
    }
  }

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="gp-page">

      {/* ── Navbar ── */}
      <header className="gp-nav">
        <div className="gp-nav__left">
          <button className="gp-hamburger"><span/><span/><span/></button>
          <h1 className="gp-nav__brand">Processes</h1>
        </div>
        <div className="gp-nav__right">
          {selectedProjet && (
            <div className="gp-active-pill">
              <span className="gp-active-pill__pulse"/>
              <span className="gp-active-pill__text">Project: <strong>{selectedProjet.nom}</strong></span>
            </div>
          )}
          <span className={`gp-role-badge gp-role-badge--${userRole?.toLowerCase()}`}>
            {userIsAdmin ? `👑 Admin` : `👤 Project Manager`}
          </span>
          <div className="gp-user-chip">
            <span className="gp-user-chip__avatar">{userIsAdmin ? 'A' : 'C'}</span>
            <span>{userRole}</span>
            <span className="gp-user-chip__caret">▾</span>
          </div>
          <LanguageSwitcher/>
          <button className="gp-notif-btn">🔔<span className="gp-notif-dot"/></button>
        </div>
      </header>

      <main className="gp-main">

        {/* ── Toolbar ── */}
        <div className="gp-toolbar">
          <h2 className="gp-toolbar__heading">Process Management</h2>
          {selectedId && (
            <button className="btn btn--primary" onClick={openCreate}>
              <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              + Add Process
            </button>
          )}
        </div>

        {/* ── Project selector ── */}
        <section className="gp-filterbar pc-project-bar">
          <label className="pc-select-label">
            <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
              <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M3 8h14M8 4V2M12 4V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Select a project
          </label>
          <select className="gp-filterbar__sel pc-project-select"
            value={selectedId || ''} onChange={e => setSelectedId(Number(e.target.value) || null)}>
            <option value="">— Choose a project —</option>
            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          {selectedProjet && (
            <div className="pc-project-meta">
              {selectedProjet.chefProjetNomComplet &&
                <span className="ch-meta-chip">👤 {selectedProjet.chefProjetNomComplet}</span>}
              {selectedProjet.statutLibelle &&
                <span className="ch-meta-chip">● {selectedProjet.statutLibelle}</span>}
            </div>
          )}
        </section>

        {/* ── Empty states ── */}
        {!selectedId && (
          <div className="gp-table-card"><div className="gp-center-state">
            <div className="gp-empty-icon">📋</div>
            <p className="gp-empty-title">No project selected</p>
            <p className="gp-empty-sub">Select a project above to view its processes.</p>
          </div></div>
        )}

        {selectedId && loading && (
          <div className="gp-table-card"><div className="gp-center-state">
            <div className="gp-spinner"/>
            <p>Loading…</p>
          </div></div>
        )}

        {selectedId && !loading && processusList.length === 0 && (
          <div className="gp-table-card"><div className="gp-center-state">
            <div className="gp-empty-icon">🔧</div>
            <p className="gp-empty-title">No processes</p>
            <p className="gp-empty-sub">Add the first process for this project.</p>
          </div></div>
        )}

        {/* ── Accordion ── */}
        {selectedId && !loading && processusList.map((proc, pi) => (
          <div key={proc.id} className="pc-accordion" style={{ animationDelay: `${pi * 60}ms` }}>

            {/* Accordion header */}
            <div className={`pc-accordion__header${openItems[proc.id] ? ' pc-accordion__header--open' : ''}`}
              onClick={() => toggleItem(proc.id)}>
              <div className="pc-accordion__left">
                <span className="pc-accordion__chevron">
                  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="pc-accordion__icon">
                  <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M6 5V4a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <span className="pc-accordion__title">{proc.nom}</span>
                  <span className="pc-accordion__badge">
                    {proc.taches.length} task{proc.taches.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="pc-accordion__actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn--ghost btn--sm" onClick={() => openEdit(proc)}>
                  <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => askDelete(proc)}>
                  <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
                    <path d="M8 4h4M3 6h14M5 6l1 11h8L15 6"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Accordion body */}
            {openItems[proc.id] && (
              <div className="pc-accordion__body">
                {proc.taches.length === 0 ? (
                  <p className="pc-empty-taches">No tasks for this process.</p>
                ) : (
                  <div className="pc-table-wrap">
                    <table className="gp-table pc-table">
                      <thead>
                        <tr className="gp-table__head-row">
                          <th className="gp-th" style={{width:52}}>ID</th>
                          <th className="gp-th">Title</th>
                          <th className="gp-th" style={{width:100}}>Start</th>
                          <th className="gp-th" style={{width:100}}>End</th>
                          <th className="gp-th" style={{width:130}}>Status</th>
                          <th className="gp-th pc-raci">R</th>
                          <th className="gp-th pc-raci">A</th>
                          <th className="gp-th pc-raci">C</th>
                          <th className="gp-th pc-raci">I</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proc.taches.map((tache, ti) => (
                          <tr key={tache.id} className="gp-tr" style={{animationDelay:`${ti*30}ms`}}>
                            <td className="gp-td">
                              <span className="gp-id">{tache.id}</span>
                            </td>
                            <td className="gp-td gp-td--nom">{tache.nom}</td>
                            <td className="gp-td gp-td--date">{fmtDate(tache.dateDebut)}</td>
                            <td className="gp-td gp-td--date">{fmtDate(tache.dateFin)}</td>

                            {/* ── Status inline dropdown ── */}
                            <td className="gp-td">
                              <div className={`pc-statut-wrap pc-statut-wrap--${statutClass(tache.statut)}`}>
                                <select
                                  className={`pc-statut-select pc-statut-select--${statutClass(tache.statut)}`}
                                  value={tache.statut}
                                  onChange={e => handleStatutChange(tache.id, e.target.value, proc.id)}>
                                  {STATUTS.map(s => (
                                    <option key={s} value={s}>{STATUT_LABEL[s] || s}</option>
                                  ))}
                                </select>
                                <svg className="pc-statut-caret" viewBox="0 0 10 6" fill="none" width="9" height="9">
                                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </div>
                            </td>

                            {/* ── RACI pills ── */}
                            <td className="gp-td">
                              {tache.raciRNom ? <span className="pc-raci-pill pc-raci-pill--r">{tache.raciRNom}</span> : <span className="gp-na">—</span>}
                            </td>
                            <td className="gp-td">
                              {tache.raciANom ? <span className="pc-raci-pill pc-raci-pill--a">{tache.raciANom}</span> : <span className="gp-na">—</span>}
                            </td>
                            <td className="gp-td">
                              {tache.raciCNom ? <span className="pc-raci-pill pc-raci-pill--c">{tache.raciCNom}</span> : <span className="gp-na">—</span>}
                            </td>
                            <td className="gp-td">
                              {tache.raciINom ? <span className="pc-raci-pill pc-raci-pill--i">{tache.raciINom}</span> : <span className="gp-na">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* ════════════════════════════════════
          PROCESS MODAL
      ════════════════════════════════════ */}
      {modalOpen && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="pc-modal">

            {/* Modal header */}
            <div className="pc-modal__header">
              <div className="pc-modal__header-icon">
                <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                  <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M6 5V4a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="pc-modal__title">
                {editingId ? 'Edit Process' : '+ Add Process'}
              </h2>
              <button className="pc-modal__close" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="pc-modal__body">

              {/* Process name */}
              <div className="pc-form-section">
                <label className="pc-label">Title <span className="pc-required">*</span></label>
                <input className="pc-input" type="text"
                  placeholder="Process name…"
                  value={form.nom} onChange={e => setFormNom(e.target.value)}/>
              </div>

              {/* Tasks section */}
              <div className="pc-form-section">
                <div className="pc-taches-header">
                  <span className="pc-label">Process Tasks</span>
                  <button className="btn btn--ghost btn--sm" onClick={addTache}>
                    <svg viewBox="0 0 20 20" fill="none" width="12" height="12">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    + Add a Task
                  </button>
                </div>

                <div className="pc-taches-list">
                  {form.taches.map((tache, idx) => (
                    <div key={tache._key} className="pc-tache-row">
                      <div className="pc-tache-row__top">
                        <span className="pc-tache-num">{idx + 1}</span>
                        <div className="pc-tache-fields">
                          {/* Task name */}
                          <div className="pc-field">
                            <label className="pc-field-label">Task Name</label>
                            <input className="pc-input pc-input--sm"
                              placeholder="Task description…"
                              value={tache.nom}
                              onChange={e => updateTache(tache._key, 'nom', e.target.value)}/>
                          </div>
                          {/* Dates */}
                          <div className="pc-field-row">
                            <div className="pc-field">
                              <label className="pc-field-label">Start Date</label>
                              <input type="date" className="pc-input pc-input--sm pc-input--date"
                                value={tache.dateDebut}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => {
                                  updateTache(tache._key, 'dateDebut', e.target.value)
                                  if (tache.dateFin && e.target.value > tache.dateFin)
                                    updateTache(tache._key, 'dateFin', '')
                                }}/>
                            </div>
                            <div className="pc-field">
                              <label className="pc-field-label">End Date</label>
                              <input type="date" className="pc-input pc-input--sm pc-input--date"
                                value={tache.dateFin}
                                min={tache.dateDebut || new Date().toISOString().split('T')[0]}
                                onChange={e => updateTache(tache._key, 'dateFin', e.target.value)}/>
                            </div>
                          </div>
                          {/* RACI */}
                          <div className="pc-field-row pc-field-row--raci">
                            {[
                              ['raciRId','R:','pc-raci-sel--r'],
                              ['raciAId','A:','pc-raci-sel--a'],
                              ['raciCId','C:','pc-raci-sel--c'],
                              ['raciIId','I:','pc-raci-sel--i'],
                            ].map(([field, lbl, cls]) => (
                              <div className="pc-field pc-field--raci" key={field}>
                                <label className="pc-field-label">{lbl}</label>
                                <select className={`pc-select ${cls}`}
                                  value={tache[field]}
                                  onChange={e => updateTache(tache._key, field, e.target.value)}>
                                  <option value="">— Unassigned</option>
                                  {users.filter(u => u.role === 'CHEF_PROJET').length > 0 && (
                                    <optgroup label="Project Managers">
                                      {users.filter(u => u.role === 'CHEF_PROJET').map(u => (
                                        <option key={u.id} value={u.id}>{u.nomComplet}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {users.filter(u => u.role === 'ADMIN').length > 0 && (
                                    <optgroup label="Administrators">
                                      {users.filter(u => u.role === 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.nomComplet}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button className="pc-tache-remove" onClick={() => removeTache(tache._key)}
                          title="Remove this task">
                          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/>
                            <path d="M7 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {form.taches.length === 0 && (
                    <div className="pc-taches-empty">
                      <p>No tasks — click "+ Add a Task" to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="pc-modal__footer">
              <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Close</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="pc-spinner"/>Saving…</>
                  : <><svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                      <path d="M4 10l4.5 4.5 7.5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>Save</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal cfg={confirmCfg} onConfirm={confirmDelete} onCancel={() => setConfirmCfg(null)}/>
      <ToastStack toasts={toasts} remove={id => setToasts(ts => ts.filter(x => x.id !== id))}/>
    </div>
  )
}
