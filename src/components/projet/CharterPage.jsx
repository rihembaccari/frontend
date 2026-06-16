// ═══════════════════════════════════════════════════════════════════
// CharterPage.jsx  —  Sprint 3 · Project Charter + i18n
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react'

import { getToken, getRole, isAdmin } from '../../services/tokenService'
import { useLanguage } from '../../i18n/LanguageContext'
import LanguageSwitcher from '../../i18n/LanguageSwitcher'
import '../user/userPage.css'
import './css/CharterPage.css'


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

// ── PDF export button — dynamic import so missing deps never crash page ──
function ExportPdfBtn({ charter, selectedProjet, charterBodyRef, t, lang }) {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runExport = async (type) => {
    setOpen(false); setBusy(true)
    try {
      if (type === 'clean') {
        const mod = await import('../../utils/charterPdfExport')
        mod.exportCharterPdf(charter, selectedProjet, t, lang)
      } else {
        const mod = await import('../../utils/charterVisualExport')
        await mod.exportCharterVisual(charterBodyRef, charter?.projectName || selectedProjet?.nom)
      }
    } catch { alert('PDF export failed. Run: npm install jspdf html2canvas') }
    finally { setBusy(false) }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
        <button className="btn btn--ghost" onClick={() => runExport('clean')} disabled={busy}
          style={{ borderRadius: 0, borderRight: '1px solid var(--border)', gap: 6 }}>
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M4 16h12M10 3v9M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {busy ? '…' : (t('charter', 'btnExportPdf') || 'Export PDF')}
        </button>
        <button className="btn btn--ghost" onClick={() => setOpen(o => !o)} disabled={busy}
          style={{ borderRadius: 0, padding: '0 9px' }}>▾</button>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,.13)',
          padding: 6, zIndex: 500, minWidth: 240 }}>
          <button onClick={() => runExport('clean')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
              background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <div><div style={{ fontWeight: 600 }}>Clean Document</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Professional layout</div></div>
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 2px' }}/>
          <button onClick={() => runExport('visual')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
              background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🖥️</span>
            <div><div style={{ fontWeight: 600 }}>Visual Export</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Screenshot of the page</div></div>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Toast stack ────────────────────────────────────────────────────
function ToastStack({ toasts, removeToast }) {
  return (
    <div className="toast-stack">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '⚠'}</span>
          <span className="toast-msg">{toast.message}</span>
          <button className="toast-x" onClick={() => removeToast(toast.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Confirm modal ──────────────────────────────────────────────────
function ConfirmModal({ config, onConfirm, onCancel }) {
  if (!config) return null
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={`confirm-box confirm-box--${config.variant || 'danger'}`}>
        <div className="confirm-emoji">{config.icon || '⚠️'}</div>
        <h3 className="confirm-title">{config.title}</h3>
        {config.body && <p className="confirm-body">{config.body}</p>}
        <div className="confirm-btns">
          <button className="btn btn--ghost" onClick={onCancel}>{config.cancelLabel}</button>
          {config.showConfirm && (
            <button className={`btn btn--${config.variant || 'danger'}`} onClick={onConfirm}>{config.confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="ch-section-header">
      <span className="ch-section-icon">{icon}</span>
      <div>
        <h3 className="ch-section-title">{title}</h3>
        {subtitle && <p className="ch-section-sub">{subtitle}</p>}
      </div>
    </div>
  )
}

function EmptyRow({ cols, message }) {
  return <tr><td colSpan={cols} className="ch-table-empty">{message}</td></tr>
}

// ── Default milestone rows per supervisor template ─────────────────
const DEFAULT_MILESTONES = [
  { id: null, description: 'Form Project Team / Preliminary Review / Scope', dateDebut: '', dateFin: '' },
  { id: null, description: 'Finalize Project Plan / Charter / Kick Off',     dateDebut: '', dateFin: '' },
  { id: null, description: 'Define Phase',                                    dateDebut: '', dateFin: '' },
  { id: null, description: 'Measurement Phase',                               dateDebut: '', dateFin: '' },
  { id: null, description: 'Analysis Phase',                                  dateDebut: '', dateFin: '' },
  { id: null, description: 'Improvement Phase',                               dateDebut: '', dateFin: '' },
  { id: null, description: 'Control Phase',                                   dateDebut: '', dateFin: '' },
  { id: null, description: 'Project Summary Report and Close Out',            dateDebut: '', dateFin: '' },
]

const EMPTY_FORM = {
  projectSponsor: '', withinScope: '', outsideScope: '',
  specialNeeds: '', risks: '', constraints: '', assumptions: '',
  milestones: [], teamMembers: [], costLines: [],
}

// ══════════════════════════════════════════════════════════════════
export default function CharterPage({ onNavigate }) {
  const { t, lang }    = useLanguage()
  const userIsAdmin    = isAdmin()
  const userRole       = getRole()
  const charterBodyRef = useRef(null)

  // Open list view by default — open detail directly if ProjetPage set a flag
  const [view, setView] = useState(() => {
    return Number(localStorage.getItem('gp_openCharterForProject')) ? 'detail' : 'list'
  })

  const [projets,          setProjets]          = useState([])
  const [charterList,      setCharterList]      = useState([])
  const [selectedProjetId, setSelectedProjetId] = useState(() => {
    const id = Number(localStorage.getItem('gp_openCharterForProject'))
    if (id) { localStorage.removeItem('gp_openCharterForProject'); return id }
    return null
  })
  const [charter,  setCharter]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)

  const [confirmCfg,  setConfirmCfg]  = useState(null)
  const pendingAction = useRef(null)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200)
  }, [])

  // ── Load projects + charter list ─────────────────────────────────
  const loadProjets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/projets`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setProjets(data)
      const list = await Promise.all(data.map(async (p) => {
        try {
          const r = await fetch(`${API_BASE}/charters/projet/${p.id}`, { headers: authHeaders() })
          const c = r.ok ? await r.json() : null
          return { projetId: p.id, projetNom: p.nom, chefProjet: p.chefProjetNomComplet, statut: p.statutLibelle, dateDebut: p.dateDebut, dateFin: p.dateFinPrevue, hasCharter: !!(c?.id) }
        } catch {
          return { projetId: p.id, projetNom: p.nom, chefProjet: p.chefProjetNomComplet, statut: p.statutLibelle, dateDebut: p.dateDebut, dateFin: p.dateFinPrevue, hasCharter: false }
        }
      }))
      setCharterList(list)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadProjets() }, [loadProjets])

  // ── Load charter for selected project ────────────────────────────
  const loadCharter = useCallback(async (projetId) => {
    if (!projetId) { setCharter(null); setForm({ ...EMPTY_FORM, milestones: DEFAULT_MILESTONES }); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/charters/projet/${projetId}`, { headers: authHeaders() })
      if (!res.ok) {
        setCharter(null)
        setForm({ ...EMPTY_FORM, milestones: DEFAULT_MILESTONES })
        return
      }
      const data = await res.json()
      // Backend returns {id: null} empty response when no charter exists
      if (!data || !data.id) {
        setCharter(null)
        setForm({ ...EMPTY_FORM, milestones: DEFAULT_MILESTONES })
        return
      }
      setCharter(data)
      setForm({
        projectSponsor: data.projectSponsor || '',
        withinScope:    data.withinScope    || '',
        outsideScope:   data.outsideScope   || '',
        specialNeeds:   data.specialNeeds   || '',
        risks:          data.risks          || '',
        constraints:    data.constraints    || '',
        assumptions:    data.assumptions    || '',
        // If saved charter has no milestones, still show defaults
        milestones:  data.milestones?.length  > 0 ? data.milestones  : DEFAULT_MILESTONES,
        teamMembers: data.teamMembers || [],
        costLines:   data.costLines   || [],
      })
    } catch {
      setCharter(null)
      setForm({ ...EMPTY_FORM, milestones: DEFAULT_MILESTONES })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProjetId) loadCharter(selectedProjetId)
    else { setCharter(null); setForm(EMPTY_FORM); setEditMode(false) }
  }, [selectedProjetId, loadCharter])

  // ── Navigation ───────────────────────────────────────────────────
  const openDetail = (projetId, startEdit = false) => {
    setSelectedProjetId(projetId)
    localStorage.setItem('gp_activeProjetId', projetId)
    setEditMode(startEdit)
    setView('detail')
  }

  const goBackToList = () => {
    setView('list')
    setEditMode(false)
    setSelectedProjetId(null)
    localStorage.removeItem('gp_activeProjetId')
    loadProjets()
  }

  const handleProjectChange = (e) => {
    setSelectedProjetId(Number(e.target.value) || null)
    setEditMode(false)
  }

  // ── Edit helpers ─────────────────────────────────────────────────
  const enterEdit = () => {
    setEditMode(true)
  }

  const cancelEdit = () => {
    if (charter) {
      setForm({
        projectSponsor: charter.projectSponsor || '',
        withinScope:    charter.withinScope    || '',
        outsideScope:   charter.outsideScope   || '',
        specialNeeds:   charter.specialNeeds   || '',
        risks:          charter.risks          || '',
        constraints:    charter.constraints    || '',
        assumptions:    charter.assumptions    || '',
        milestones:     charter.milestones     || [],
        teamMembers:    charter.teamMembers    || [],
        costLines:      charter.costLines      || [],
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setEditMode(false)
  }

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const addMilestone    = () => setForm(f => ({ ...f, milestones:  [...f.milestones,  { id: null, description: '', dateDebut: '', dateFin: '' }] }))
  const updateMilestone = (i, key, val) => setForm(f => { const ms = [...f.milestones]; ms[i] = { ...ms[i], [key]: val }; return { ...f, milestones: ms } })
  const removeMilestone = (i) => setForm(f => ({ ...f, milestones:  f.milestones.filter((_, idx) => idx !== i) }))

  const addTeamMember    = () => setForm(f => ({ ...f, teamMembers: [...f.teamMembers, { id: null, name: '', roleResponsibility: '', description: '' }] }))
  const updateTeamMember = (i, key, val) => setForm(f => { const tm = [...f.teamMembers]; tm[i] = { ...tm[i], [key]: val }; return { ...f, teamMembers: tm } })
  const removeTeamMember = (i) => setForm(f => ({ ...f, teamMembers: f.teamMembers.filter((_, idx) => idx !== i) }))

  const addCostLine    = () => setForm(f => ({ ...f, costLines: [...f.costLines, { id: null, costType: '', vendorLaborName: '', rate: '', qty: '', amount: 0 }] }))
  const updateCostLine = (i, key, val) => setForm(f => { const cl = [...f.costLines]; cl[i] = { ...cl[i], [key]: val }; return { ...f, costLines: cl } })
  const removeCostLine = (i) => setForm(f => ({ ...f, costLines: f.costLines.filter((_, idx) => idx !== i) }))

  const estimatedTotal = form.costLines.reduce((sum, cl) => sum + (parseFloat(cl.rate) || 0) * (parseInt(cl.qty) || 0), 0)

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedProjetId) return
    setSaving(true)
    try {
      const payload = {
        projetId:       selectedProjetId,
        projectSponsor: form.projectSponsor,
        withinScope:    form.withinScope,
        outsideScope:   form.outsideScope,
        specialNeeds:   form.specialNeeds,
        risks:          form.risks,
        constraints:    form.constraints,
        assumptions:    form.assumptions,
        milestones:  form.milestones.map(m  => ({ id: m.id  || null, description: m.description, dateDebut: m.dateDebut || null, dateFin: m.dateFin || null })),
        teamMembers: form.teamMembers.map(tm => ({ id: tm.id || null, name: tm.name, roleResponsibility: tm.roleResponsibility, description: tm.description })),
        costLines:   form.costLines.map(c   => ({ id: c.id  || null, costType: c.costType, vendorLaborName: c.vendorLaborName, rate: parseFloat(c.rate) || 0, qty: parseInt(c.qty) || 0, amount: 0 })),
      }

      const res = await fetch(`${API_BASE}/charters`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      const updated = await res.json()
      // Update state — stay on the same detail page, just exit edit mode
      setCharter(updated)
      setForm({
        projectSponsor: updated.projectSponsor || '',
        withinScope:    updated.withinScope    || '',
        outsideScope:   updated.outsideScope   || '',
        specialNeeds:   updated.specialNeeds   || '',
        risks:          updated.risks          || '',
        constraints:    updated.constraints    || '',
        assumptions:    updated.assumptions    || '',
        milestones:     updated.milestones     || [],
        teamMembers:    updated.teamMembers    || [],
        costLines:      updated.costLines      || [],
      })
      setEditMode(false)
      addToast(t('charter', 'saveSuccess'), 'success')
    } catch {
      addToast(t('charter', 'saveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────
  const askDelete = () => {
    const projet = projets.find(p => p.id === selectedProjetId)
    pendingAction.current = async () => {
      setConfirmCfg(null)
      try {
        const res = await fetch(`${API_BASE}/charters/projet/${selectedProjetId}`, { method: 'DELETE', headers: authHeaders() })
        if (!res.ok) throw new Error()
        setCharter(null); setForm(EMPTY_FORM); setEditMode(false)
        addToast(t('charter', 'deleteSuccess'), 'success')
      } catch { addToast(t('charter', 'deleteError'), 'error') }
    }
    setConfirmCfg({ variant: 'danger', icon: '🗑️', title: t('charter', 'deleteConfTitle', projet?.nom || ''), body: t('charter', 'deleteConfBody'), cancelLabel: t('common', 'cancel'), confirmLabel: t('common', 'yes') + ', ' + (t('common', 'delete') || 'delete').toLowerCase(), showConfirm: true })
  }

  const fmtDate = (d) => { if (!d) return '—'; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}` }
  const fmtCurrency = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0)

  const selectedProjet = projets.find(p => p.id === selectedProjetId)
  const hasCharter     = !!(charter && charter.id)
  const isReadonly     = !editMode

  const delBtn = (fn) => (
    <button className="gp-btn-action gp-btn-action--delete" onClick={fn}>
      <svg viewBox="0 0 20 20" fill="none"><path d="M8 4h4M3 6h14M5 6l1 11h8L15 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  )

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="gp-page">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="gp-nav">
        <div className="gp-nav__left">
          <button className="gp-hamburger"><span /><span /><span /></button>
          <h1 className="gp-nav__brand">
            {view === 'detail' && (
              <button className="ch-back-btn" onClick={goBackToList} title="Back to list">
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
            {t('charter', 'pageTitle')}
          </h1>
        </div>
        <div className="gp-nav__right">
          {selectedProjet && view === 'detail' && (
            <div className="gp-active-pill">
              <span className="gp-active-pill__pulse" />
              <span className="gp-active-pill__text">{t('charter', 'selectProject')} : <strong>{selectedProjet.nom}</strong></span>
            </div>
          )}
          <span className={`gp-role-badge gp-role-badge--${userRole?.toLowerCase()}`}>
            {userIsAdmin ? `👑 ${t('common', 'admin')}` : `👤 ${t('common', 'chefProjet')}`}
          </span>
          <div className="gp-user-chip">
            <span className="gp-user-chip__avatar">{userIsAdmin ? 'A' : 'C'}</span>
            <span>{userRole}</span>
            <span className="gp-user-chip__caret">▾</span>
          </div>
          <LanguageSwitcher />
          <button className="gp-notif-btn">🔔<span className="gp-notif-dot" /></button>
        </div>
      </header>

      <main className="gp-main gp-main--compact">

        {/* ════════════════════════════════════
            LIST VIEW
        ════════════════════════════════════ */}
        {view === 'list' && (
          <>
            <div className="gp-toolbar">
              <h2 className="gp-toolbar__heading">{t('charter', 'heading')}</h2>
            </div>
            <div className="gp-table-card">
              {charterList.length === 0 ? (
                <div className="gp-center-state">
                  <div className="gp-empty-icon">📋</div>
                  <p className="gp-empty-title">{t('charter', 'noProjectTitle')}</p>
                  <p className="gp-empty-sub">{t('charter', 'noProjectSub')}</p>
                </div>
              ) : (
                <table className="gp-table">
                  <thead>
                    <tr className="gp-table__head-row">
                      <th className="gp-th gp-th--id">{t('common', 'id')}</th>
                      <th className="gp-th">{t('projets', 'colNom')}</th>
                      <th className="gp-th">{t('projets', 'colChef')}</th>
                      <th className="gp-th">{t('projets', 'colStatut')}</th>
                      <th className="gp-th gp-th--date">{t('projets', 'colDebut')}</th>
                      <th className="gp-th gp-th--date">{t('projets', 'colFin')}</th>
                      <th className="gp-th">Charter</th>
                      <th className="gp-th gp-th--actions">{t('common', 'actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charterList.map((item) => (
                      <tr key={item.projetId} className="gp-tr">
                        <td className="gp-td gp-td--id"><span className="gp-id">{item.projetId}</span></td>
                        <td className="gp-td gp-td--nom">{item.projetNom}</td>
                        <td className="gp-td gp-td--muted">{item.chefProjet || <span className="gp-na">—</span>}</td>
                        <td className="gp-td">{item.statut ? <span className="ch-status-badge">{item.statut}</span> : <span className="gp-na">—</span>}</td>
                        <td className="gp-td gp-td--date">{fmtDate(item.dateDebut)}</td>
                        <td className="gp-td gp-td--date">{fmtDate(item.dateFin)}</td>
                        <td className="gp-td">
                          {item.hasCharter
                            ? <span className="ch-list-tag ch-list-tag--saved">● {t('charter', 'tagSaved')}</span>
                            : <span className="ch-list-tag ch-list-tag--none">— {t('charter', 'noCharterTitle')}</span>}
                        </td>
                        <td className="gp-td gp-td--actions">
                          {item.hasCharter ? (
                            <button className="gp-btn-action gp-btn-action--edit" title={t('charter', 'btnModify')} onClick={() => openDetail(item.projetId)}>
                              <svg viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          ) : (
                            <button className="gp-btn-action gp-btn-action--add" title={t('charter', 'btnCreate')} onClick={() => openDetail(item.projetId, true)}>
                              <svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════════════════
            DETAIL VIEW
        ════════════════════════════════════ */}
        {view === 'detail' && (
          <>
            {/* Toolbar */}
            <div className="gp-toolbar">
              <h2 className="gp-toolbar__heading">
                {t('charter', 'heading')}
                {hasCharter && <span className="ch-saved-tag">{t('charter', 'tagSaved')}</span>}
                {editMode   && <span className="ch-edit-tag">{t('charter', 'tagEdit')}</span>}
              </h2>
              <div className="ch-toolbar-actions">
                {hasCharter && !editMode && (<>
                  <ExportPdfBtn charter={charter} selectedProjet={selectedProjet} charterBodyRef={charterBodyRef} t={t} lang={lang} />
                  <button className="btn btn--primary" onClick={enterEdit}>
                    <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('charter', 'btnModify')}
                  </button>
                  {userIsAdmin && <button className="btn btn--ghost" onClick={askDelete}>{t('charter', 'btnDelete')}</button>}
                </>)}
                {!hasCharter && !editMode && selectedProjetId && (
                  <button className="btn btn--primary" onClick={enterEdit}>{t('charter', 'btnCreate')}</button>
                )}
                {editMode && (<>
                  <button className="btn btn--ghost" onClick={cancelEdit} disabled={saving}>{t('charter', 'btnCancel')}</button>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                    {saving
                      ? <><span className="ch-btn-spinner"/>{t('charter', 'btnSaving')}</>
                      : <><svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M4 10.5l4.5 4.5 7.5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>{t('charter', 'btnSave')}</>}
                  </button>
                </>)}
              </div>
            </div>

            {/* Project selector */}
            <section className="gp-filterbar ch-project-bar">
              <label className="ch-select-label">
                <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M3 8h14" stroke="currentColor" strokeWidth="1.6"/><path d="M8 4V2M12 4V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                {t('charter', 'selectProject')}
              </label>
              <select className="gp-filterbar__sel ch-project-select" value={selectedProjetId || ''} onChange={handleProjectChange}>
                <option value="">{t('charter', 'selectPlaceholder')}</option>
                {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
              {selectedProjet && (
                <div className="ch-project-meta">
                  {selectedProjet.chefProjetNomComplet && <span className="ch-meta-chip">👤 {selectedProjet.chefProjetNomComplet}</span>}
                  {selectedProjet.statutLibelle && <span className="ch-meta-chip ch-meta-chip--status">● {selectedProjet.statutLibelle}</span>}
                  {selectedProjet.dateDebut && <span className="ch-meta-chip">📅 {fmtDate(selectedProjet.dateDebut)} → {fmtDate(selectedProjet.dateFinPrevue)}</span>}
                </div>
              )}
            </section>

            {!selectedProjetId && (
              <div className="gp-table-card"><div className="gp-center-state"><div className="gp-empty-icon">📋</div><p className="gp-empty-title">{t('charter', 'noProjectTitle')}</p></div></div>
            )}
            {selectedProjetId && loading && (
              <div className="gp-table-card"><div className="gp-center-state"><div className="gp-spinner"/><p>{t('charter', 'loadingCharter')}</p></div></div>
            )}

            {selectedProjetId && !loading && (
              <div className="ch-body ch-body--compact" ref={charterBodyRef}>

                {!hasCharter && !editMode && (
                  <div className="gp-table-card"><div className="gp-center-state">
                    <div className="gp-empty-icon">📄</div>
                    <p className="gp-empty-title">{t('charter', 'noCharterTitle')}</p>
                    <p className="gp-empty-sub">{t('charter', 'noCharterSub')}</p>
                  </div></div>
                )}

                {(hasCharter || editMode) && (<>

                  {/* ── Section 1: Overview ── */}
                  <div className="gp-table-card ch-section ch-section--compact">
                    <SectionHeader icon="🏢" title={t('charter', 'sec1Title')} subtitle={t('charter', 'sec1Sub')} />
                    <div className="ch-grid-2 ch-grid--compact">
                      <div className="ch-field-group ch-col-full">
                        <label className="ch-label">{t('charter', 'fieldName')}</label>
                        <div className="ch-readonly-val ch-readonly-val--highlight">{charter?.projectName || selectedProjet?.nom || '—'}</div>
                      </div>
                      <div className="ch-field-group">
                        <label className="ch-label">{t('charter', 'fieldManager')}</label>
                        <div className="ch-readonly-val">{charter?.projectManager || selectedProjet?.chefProjetNomComplet || '—'}</div>
                      </div>
                      <div className="ch-field-group">
                        <label className="ch-label">{t('charter', 'fieldSponsor')}</label>
                        {isReadonly
                          ? <div className="ch-readonly-val">{form.projectSponsor || <span className="gp-na">{t('common', 'notSet')}</span>}</div>
                          : <input className="ch-input" type="text" placeholder={t('charter', 'fieldSponsorPh')} value={form.projectSponsor} onChange={e => setField('projectSponsor', e.target.value)}/>}
                      </div>
                      <div className="ch-field-group">
                        <label className="ch-label">{t('charter', 'fieldStart')}</label>
                        <div className="ch-readonly-val">{fmtDate(charter?.startDate || selectedProjet?.dateDebut)}</div>
                      </div>
                      <div className="ch-field-group">
                        <label className="ch-label">{t('charter', 'fieldEnd')}</label>
                        <div className="ch-readonly-val">{fmtDate(charter?.expectedCompletionDate || selectedProjet?.dateFinPrevue)}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2: Scope ── */}
                  <div className="gp-table-card ch-section ch-section--compact">
                    <SectionHeader icon="🎯" title={t('charter', 'sec2Title')} subtitle={t('charter', 'sec2Sub')} />
                    <div className="ch-grid-1 ch-grid--compact">
                      {[['withinScope','fieldInScope','fieldInScopePh'],['outsideScope','fieldOutScope','fieldOutScopePh'],['specialNeeds','fieldSpecial','fieldSpecialPh']].map(([key,lbl,ph]) => (
                        <div className="ch-field-group" key={key}>
                          <label className="ch-label">{t('charter', lbl)}</label>
                          {isReadonly
                            ? <div className="ch-readonly-val ch-readonly-val--text">{form[key] || <span className="gp-na">{t('common', 'notSet')}</span>}</div>
                            : <textarea className="ch-textarea ch-textarea--compact" rows={2} placeholder={t('charter', ph)} value={form[key]} onChange={e => setField(key, e.target.value)}/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Section 3: Risks / Constraints / Assumptions ── */}
                  <div className="gp-table-card ch-section ch-section--compact">
                    <SectionHeader icon="⚠️" title={t('charter', 'sec3Title')} />
                    <div className="ch-grid-3 ch-grid--compact">
                      {[['risks','fieldRisks','fieldRisksPh'],['constraints','fieldConstraints','fieldConstraintsPh'],['assumptions','fieldAssumptions','fieldAssumptionsPh']].map(([key,lbl,ph]) => (
                        <div className="ch-field-group" key={key}>
                          <label className="ch-label">{t('charter', lbl)}</label>
                          {isReadonly
                            ? <div className="ch-readonly-val ch-readonly-val--text">{form[key] || <span className="gp-na">{t('common', 'notSet')}</span>}</div>
                            : <textarea className="ch-textarea ch-textarea--compact" rows={3} placeholder={t('charter', ph)} value={form[key]} onChange={e => setField(key, e.target.value)}/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Section 4: Milestones ── */}
                  <div className="gp-table-card ch-section ch-section--compact">
                    <div className="ch-section-header-row">
                      <SectionHeader icon="🚩" title={t('charter', 'sec4Title')} subtitle={t('charter', 'sec4Sub')} />
                      {editMode && <button className="btn btn--ghost btn--sm" onClick={addMilestone}>{t('charter', 'btnAddMilestone')}</button>}
                    </div>
                    <div className="ch-table-wrap">
                      <table className="gp-table gp-table--compact">
                        <thead>
                          <tr className="gp-table__head-row">
                            <th className="gp-th">{t('charter', 'colDescription')}</th>
                            <th className="gp-th ch-th-date">{t('charter', 'colStartDate')}</th>
                            <th className="gp-th ch-th-date">{t('charter', 'colEndDate')}</th>
                            {editMode && <th className="gp-th ch-th-action">{t('common', 'actions')}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {form.milestones.length === 0
                            ? <EmptyRow cols={editMode ? 4 : 3} message={t('charter', 'emptyMilestones')}/>
                            : form.milestones.map((m, i) => (
                              <tr key={i} className="gp-tr gp-tr--compact">
                                <td className="gp-td">{editMode ? <input className="ch-input ch-input--inline" placeholder={t('charter', 'colDescription') + '…'} value={m.description} onChange={e => updateMilestone(i, 'description', e.target.value)}/> : (m.description || <span className="gp-na">—</span>)}</td>
                                <td className="gp-td gp-td--date">{editMode ? <input type="date" className="ch-input ch-input--date" value={m.dateDebut || ''} onChange={e => updateMilestone(i, 'dateDebut', e.target.value)}/> : fmtDate(m.dateDebut)}</td>
                                <td className="gp-td gp-td--date">{editMode ? <input type="date" className="ch-input ch-input--date" value={m.dateFin || ''} onChange={e => updateMilestone(i, 'dateFin', e.target.value)}/> : fmtDate(m.dateFin)}</td>
                                {editMode && <td className="gp-td gp-td--actions">{delBtn(() => removeMilestone(i))}</td>}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Section 5: Team ── */}
                  <div className="gp-table-card ch-section ch-section--compact">
                    <div className="ch-section-header-row">
                      <SectionHeader icon="👥" title={t('charter', 'sec5Title')} subtitle={t('charter', 'sec5Sub')} />
                      {editMode && <button className="btn btn--ghost btn--sm" onClick={addTeamMember}>{t('charter', 'btnAddMember')}</button>}
                    </div>
                    <div className="ch-table-wrap">
                      <table className="gp-table gp-table--compact">
                        <thead>
                          <tr className="gp-table__head-row">
                            <th className="gp-th">{t('charter', 'colName')}</th>
                            <th className="gp-th">{t('charter', 'colRole')}</th>
                            <th className="gp-th">{t('charter', 'colDescription2')}</th>
                            {editMode && <th className="gp-th ch-th-action">{t('common', 'actions')}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {form.teamMembers.length === 0
                            ? <EmptyRow cols={editMode ? 4 : 3} message={t('charter', 'emptyTeam')}/>
                            : form.teamMembers.map((tm, i) => (
                              <tr key={i} className="gp-tr gp-tr--compact">
                                <td className="gp-td">{editMode ? <input className="ch-input ch-input--inline" placeholder={t('charter', 'colName') + '…'} value={tm.name} onChange={e => updateTeamMember(i, 'name', e.target.value)}/> : <span className="ch-member-name">{tm.name || <span className="gp-na">—</span>}</span>}</td>
                                <td className="gp-td gp-td--muted">{editMode ? <input className="ch-input ch-input--inline" placeholder={t('charter', 'colRole') + '…'} value={tm.roleResponsibility} onChange={e => updateTeamMember(i, 'roleResponsibility', e.target.value)}/> : (tm.roleResponsibility || <span className="gp-na">—</span>)}</td>
                                <td className="gp-td gp-td--muted">{editMode ? <input className="ch-input ch-input--inline" placeholder={t('charter', 'colDescription2') + '…'} value={tm.description} onChange={e => updateTeamMember(i, 'description', e.target.value)}/> : (tm.description || <span className="gp-na">—</span>)}</td>
                                {editMode && <td className="gp-td gp-td--actions">{delBtn(() => removeTeamMember(i))}</td>}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Section 6: Costs ── */}
                  <div className="gp-table-card ch-section ch-section--compact">
                    <div className="ch-section-header-row">
                      <SectionHeader icon="💰" title={t('charter', 'sec6Title')} subtitle={t('charter', 'sec6Sub')} />
                      {editMode && <button className="btn btn--ghost btn--sm" onClick={addCostLine}>{t('charter', 'btnAddCost')}</button>}
                    </div>
                    <div className="ch-table-wrap">
                      <table className="gp-table gp-table--compact">
                        <thead>
                          <tr className="gp-table__head-row">
                            <th className="gp-th">{t('charter', 'colCostType')}</th>
                            <th className="gp-th">{t('charter', 'colVendor')}</th>
                            <th className="gp-th ch-th-num">{t('charter', 'colRate')}</th>
                            <th className="gp-th ch-th-num">{t('charter', 'colQty')}</th>
                            <th className="gp-th ch-th-num">{t('charter', 'colAmount')}</th>
                            {editMode && <th className="gp-th ch-th-action">{t('common', 'actions')}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {form.costLines.length === 0
                            ? <EmptyRow cols={editMode ? 6 : 5} message={t('charter', 'emptyCosts')}/>
                            : form.costLines.map((c, i) => {
                              const lineAmt = editMode ? (parseFloat(c.rate) || 0) * (parseInt(c.qty) || 0) : c.amount
                              return (
                                <tr key={i} className="gp-tr gp-tr--compact">
                                  <td className="gp-td">{editMode ? <input className="ch-input ch-input--inline" placeholder={t('charter', 'colCostType') + '…'} value={c.costType} onChange={e => updateCostLine(i, 'costType', e.target.value)}/> : (c.costType || <span className="gp-na">—</span>)}</td>
                                  <td className="gp-td gp-td--muted">{editMode ? <input className="ch-input ch-input--inline" placeholder={t('charter', 'colVendor') + '…'} value={c.vendorLaborName} onChange={e => updateCostLine(i, 'vendorLaborName', e.target.value)}/> : (c.vendorLaborName || <span className="gp-na">—</span>)}</td>
                                  <td className="gp-td ch-td-num">{editMode ? <input className="ch-input ch-input--num" type="number" min="0" step="0.01" placeholder="0.00" value={c.rate} onChange={e => updateCostLine(i, 'rate', e.target.value)}/> : fmtCurrency(c.rate)}</td>
                                  <td className="gp-td ch-td-num">{editMode ? <input className="ch-input ch-input--num" type="number" min="0" step="1" placeholder="0" value={c.qty} onChange={e => updateCostLine(i, 'qty', e.target.value)}/> : c.qty}</td>
                                  <td className="gp-td ch-td-num ch-td-amount">{fmtCurrency(lineAmt)}</td>
                                  {editMode && <td className="gp-td gp-td--actions">{delBtn(() => removeCostLine(i))}</td>}
                                </tr>
                              )
                            })}
                        </tbody>
                        {form.costLines.length > 0 && (
                          <tfoot>
                            <tr className="ch-tfoot-row">
                              <td colSpan={editMode ? 4 : 3} className="ch-tfoot-label">{editMode ? t('charter', 'totalLabelEdit') : t('charter', 'totalLabel')}</td>
                              <td className="ch-tfoot-total">{fmtCurrency(editMode ? estimatedTotal : charter?.totalCosts)}</td>
                              {editMode && <td/>}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                </>)}
              </div>
            )}
          </>
        )}
      </main>

      <ConfirmModal config={confirmCfg} onConfirm={() => pendingAction.current?.()} onCancel={() => setConfirmCfg(null)}/>
      <ToastStack toasts={toasts} removeToast={id => setToasts(ts => ts.filter(x => x.id !== id))}/>
    </div>
  )
}
