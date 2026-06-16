// RisquePage.jsx — fully translated to English
import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import './RisquePage.css'
import { getToken, getRole } from '../../services/tokenService'
import AiRisquePanel from './AiRisquePanel'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const PROBABILITES = ['FAIBLE', 'MOYENNE', 'ELEVEE']
const IMPACTS      = ['FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE']
const STATUTS_R    = ['OUVERT', 'EN_SUIVI', 'FERME', 'EVITE']
const NIVEAUX      = ['BAS', 'MODERE', 'HAUT', 'EXTREME']

const niveauClass = n => ({ BAS:'bas', MODERE:'modere', HAUT:'haut', EXTREME:'extreme' }[n] || 'bas')
const statutClass = s => ({ OUVERT:'ouvert', EN_SUIVI:'suivi', FERME:'ferme', EVITE:'evite' }[s] || 'ouvert')
const EMPTY_FORM  = () => ({ description:'', probabilite:'FAIBLE', impact:'FAIBLE', planMitigation:'', planContingence:'', responsableId:'', statut:'OUVERT', dateIdentification:'' })

// ── Level icon/color ──────────────────────────────────────────────
const NIVEAU_CFG = {
  EXTREME: { ico:'🔴', icoStyle:{ background:'#FEE2E2' }, border:'#DC2626', badge:'rq2-badge--extreme' },
  HAUT:    { ico:'🟠', icoStyle:{ background:'#FEF3EC' }, border:'#C1622A', badge:'rq2-badge--haut'    },
  MODERE:  { ico:'🟡', icoStyle:{ background:'#FEF9C3' }, border:'#D97706', badge:'rq2-badge--modere'  },
  BAS:     { ico:'🟢', icoStyle:{ background:'#DCFCE7' }, border:'#16A34A', badge:'rq2-badge--bas'     },
}

// ── Badge display labels ──────────────────────────────────────────
const PROB_LABEL   = { FAIBLE:'Low', MOYENNE:'Medium', ELEVEE:'High' }
const IMPACT_LABEL = { FAIBLE:'Low', MOYEN:'Medium', ELEVE:'High', CRITIQUE:'Critical' }
const STATUT_LABEL = { OUVERT:'Active', EN_SUIVI:'Monitoring', FERME:'Closed', EVITE:'Avoided' }
const NIVEAU_LABEL = { BAS:'Low', MODERE:'Moderate', HAUT:'High', EXTREME:'Extreme' }

// ── Badge components ──────────────────────────────────────────────
function NiveauBadge({ niveau }) {
  const cls = `rq2-badge rq2-badge--niveau rq2-badge--${niveauClass(niveau)}`
  return <span className={cls}>{NIVEAU_LABEL[niveau] || niveau || '—'}</span>
}
function StatutBadge({ statut }) {
  const cls = `rq2-badge rq2-badge--statut rq2-badge--${statutClass(statut)}`
  return <span className={cls}>{STATUT_LABEL[statut] || statut?.replace('_',' ')}</span>
}
function ProbBadge({ val }) {
  const map = { FAIBLE:'bas', MOYENNE:'modere', ELEVEE:'haut' }
  return <span className={`rq2-badge rq2-badge--prob rq2-badge--${map[val]||'bas'}`}>{PROB_LABEL[val] || val}</span>
}
function ImpactBadge({ val }) {
  const map = { FAIBLE:'bas', MOYEN:'modere', ELEVE:'haut', CRITIQUE:'extreme' }
  return <span className={`rq2-badge rq2-badge--impact rq2-badge--${map[val]||'bas'}`}>{IMPACT_LABEL[val] || val}</span>
}

// ── Risk card ─────────────────────────────────────────────────────
function RiskCard({ r, onEdit, onDelete, delay }) {
  const cfg = NIVEAU_CFG[r.niveauRisque] || NIVEAU_CFG.BAS
  const projetNom = r.projetNom || r.projet?.nom || '—'
  return (
    <div className="rq2-card" style={{ borderLeftColor: cfg.border, animationDelay: `${delay}ms` }}>
      <div className="rq2-card-hdr">
        <div className="rq2-card-ico" style={cfg.icoStyle}>{cfg.ico}</div>
        <div className="rq2-card-info">
          <div className="rq2-card-title">{r.description}</div>
          {r.planMitigation && (
            <div className="rq2-card-mit">Mitigation: {r.planMitigation}</div>
          )}
        </div>
        <div className="rq2-card-actions">
          <button className="rq2-act-btn rq2-act-btn--edit" title="Edit" onClick={() => onEdit(r)}>
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z"/>
            </svg>
          </button>
          <button className="rq2-act-btn rq2-act-btn--delete" title="Delete" onClick={() => onDelete(r)}>
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4h4M3 6h14M5 6l1 11h8L15 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="rq2-card-meta">
        <div className="rq2-meta-item">
          <div className="rq2-meta-lbl">PROBABILITY</div>
          <ProbBadge val={r.probabilite} />
        </div>
        <div className="rq2-meta-item">
          <div className="rq2-meta-lbl">IMPACT</div>
          <ImpactBadge val={r.impact} />
        </div>
        <div className="rq2-meta-item">
          <div className="rq2-meta-lbl">LEVEL</div>
          <NiveauBadge niveau={r.niveauRisque} />
        </div>
        <div className="rq2-meta-item">
          <div className="rq2-meta-lbl">STATUS</div>
          <StatutBadge statut={r.statut} />
        </div>
        <div className="rq2-meta-item rq2-meta-item--right">
          <div className="rq2-meta-lbl">PROJECT</div>
          <div className="rq2-meta-proj">{projetNom}</div>
        </div>
      </div>
    </div>
  )
}

// ── Risk level preview in modal ───────────────────────────────────
function RiskPreview({ probabilite, impact }) {
  const matrix = {
    FAIBLE:  { FAIBLE:'BAS', MOYEN:'BAS',    ELEVE:'MODERE', CRITIQUE:'MODERE' },
    MOYENNE: { FAIBLE:'BAS', MOYEN:'MODERE', ELEVE:'MODERE', CRITIQUE:'HAUT'   },
    ELEVEE:  { FAIBLE:'MODERE', MOYEN:'HAUT', ELEVE:'HAUT',  CRITIQUE:'EXTREME' },
  }
  const niveau = matrix[probabilite]?.[impact] || 'BAS'
  return (
    <div className="rq2-preview">
      <span className="rq2-preview-label">Calculated level:</span>
      <NiveauBadge niveau={niveau} />
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────
function ToastStack({ toasts, remove }) {
  return (
    <div className="rq2-toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`rq2-toast rq2-toast--${t.type}`}>
          <span className="rq2-toast-icon">{t.type==='success'?'✓':t.type==='error'?'✕':'⚠'}</span>
          <span className="rq2-toast-msg">{t.message}</span>
          <button className="rq2-toast-x" onClick={() => remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
export default function RisquePage() {
  const [projets,    setProjets]    = useState([])
  const [users,      setUsers]      = useState([])
  const [risques,    setRisques]    = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM())
  const [saving,     setSaving]     = useState(false)
  const [filtStatut, setFiltStatut] = useState('')
  const [filtNiveau, setFiltNiveau] = useState('')
  const [filtSearch, setFiltSearch] = useState('')
  const [confirmCfg, setConfirmCfg] = useState(null)
  const [toasts,     setToasts]     = useState([])
  const pendingDelete = useRef(null)
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4000)
  }, [])
  const removeToast = id => setToasts(ts => ts.filter(x => x.id !== id))

  useEffect(() => {
    fetch(`${API}/projets`, { headers: authH() })
      .then(r => r.ok ? r.json() : []).then(data => {
        setProjets(data)
        const saved = localStorage.getItem('gp_activeProjetId')
        if (saved) setSelectedId(Number(saved))
        else if (data.length > 0) setSelectedId(data[0].id)
      }).catch(() => {})
    fetch(`${API}/utilisateurs`, { headers: authH() })
      .then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {})
  }, [])

  const loadRisques = useCallback(async (pid, st = '', niv = '') => {
    if (!pid) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (st)  params.set('statut', st)
      if (niv) params.set('niveau', niv)
      const r = await fetch(`${API}/projets/${pid}/risques?${params}`, { headers: authH() })
      if (r.ok) setRisques(await r.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadRisques(selectedId, filtStatut, filtNiveau) },
    [selectedId, filtStatut, filtNiveau, loadRisques])

  const filtered = risques.filter(r =>
    !filtSearch || r.description?.toLowerCase().includes(filtSearch.toLowerCase())
  )

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM()); setModalOpen(true) }
  const openEdit = r => {
    setEditingId(r.id)
    setForm({
      description: r.description || '', probabilite: r.probabilite || 'FAIBLE',
      impact: r.impact || 'FAIBLE', planMitigation: r.planMitigation || '',
      planContingence: r.planContingence || '',
      responsableId: r.responsableId ? String(r.responsableId) : '',
      statut: r.statut || 'OUVERT', dateIdentification: r.dateIdentification || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { addToast('Description is required', 'warn'); return }
    setSaving(true)
    try {
      const payload = {
        description: form.description, probabilite: form.probabilite, impact: form.impact,
        planMitigation: form.planMitigation || null, planContingence: form.planContingence || null,
        responsableId: form.responsableId ? Number(form.responsableId) : null,
        statut: form.statut, dateIdentification: form.dateIdentification || null,
      }
      const url    = editingId ? `${API}/risques/${editingId}` : `${API}/projets/${selectedId}/risques`
      const method = editingId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: authH(), body: JSON.stringify(payload) })
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Server error') }
      addToast(editingId ? 'Risk updated ✓' : 'Risk identified ✓')
      setModalOpen(false)
      loadRisques(selectedId, filtStatut, filtNiveau)
    } catch (e) { addToast(e.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const askDelete = r => {
    pendingDelete.current = r.id
    setConfirmCfg({ title:`Delete risk #${r.id}?`, body: r.description?.substring(0,80) })
  }
  const confirmDelete = async () => {
    const id = pendingDelete.current; setConfirmCfg(null)
    try {
      const res = await fetch(`${API}/risques/${id}`, { method:'DELETE', headers: authH() })
      if (!res.ok) throw new Error()
      addToast('Risk deleted')
      loadRisques(selectedId, filtStatut, filtNiveau)
    } catch { addToast('Deletion error', 'error') }
  }

  const selectedProjet = projets.find(p => p.id === selectedId)
  const userLabel = u => `${u.prenom||''} ${u.nom||''}`.trim()

  // ── KPI counts ────────────────────────────────────────────────
  const total   = risques.length
  const extreme = risques.filter(r => r.niveauRisque === 'EXTREME').length
  const haut    = risques.filter(r => r.niveauRisque === 'HAUT').length
  const modere  = risques.filter(r => r.niveauRisque === 'MODERE').length
  const actifs  = risques.filter(r => ['OUVERT','EN_SUIVI'].includes(r.statut)).length

  const filteredWithProjet = filtered.map(r => ({
    ...r, projetNom: selectedProjet?.nom || r.projetNom || '—'
  }))

  return (
    <div className="rq2-page">

      {/* ── Page header ── */}
      <div className="rq2-page-hdr">
        <div>
          <div className="rq2-page-title">Risk Management</div>
          <div className="rq2-page-sub">Monitor and mitigate project risks</div>
        </div>
        <div className="rq2-hdr-actions">
          <AiRisquePanel
            projetId={selectedId}
            projetNom={selectedProjet?.nom}
            onRisquesChanged={() => loadRisques(selectedId, filtStatut, filtNiveau)}
            addToast={addToast}
          />
          <button className="rq2-btn rq2-btn--primary" onClick={openAdd} disabled={!selectedId}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>
            Identify a Risk
          </button>
        </div>
      </div>

      {/* ── KPI stats row ── */}
      <div className="rq2-stats">
        <div className="rq2-stat">
          <div className="rq2-stat-val">{total}</div>
          <div className="rq2-stat-lbl">TOTAL</div>
        </div>
        <div className="rq2-stat">
          <div className="rq2-stat-val rq2-stat-val--extreme">{extreme}</div>
          <div className="rq2-stat-lbl">EXTREME</div>
        </div>
        <div className="rq2-stat">
          <div className="rq2-stat-val rq2-stat-val--haut">{haut}</div>
          <div className="rq2-stat-lbl">HIGH</div>
        </div>
        <div className="rq2-stat">
          <div className="rq2-stat-val rq2-stat-val--modere">{modere}</div>
          <div className="rq2-stat-lbl">MODERATE</div>
        </div>
        <div className="rq2-stat">
          <div className="rq2-stat-val rq2-stat-val--actif">{actifs}</div>
          <div className="rq2-stat-lbl">ACTIVE</div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="rq2-filterbar">
        <div className="rq2-search-wrap">
          <svg className="rq2-search-ico" viewBox="0 0 20 20" fill="none" width="14" height="14">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input className="rq2-search-input" placeholder="Search a risk…"
            value={filtSearch} onChange={e => setFiltSearch(e.target.value)} />
        </div>

        <select className="rq2-sel" value={selectedId || ''}
          onChange={e => { const id = Number(e.target.value); setSelectedId(id); localStorage.setItem('gp_activeProjetId', id) }}>
          <option value="">— Project —</option>
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>

        <select className="rq2-sel" value={filtStatut} onChange={e => setFiltStatut(e.target.value)}>
          <option value="">All statuses</option>
          {STATUTS_R.map(s => <option key={s} value={s}>{STATUT_LABEL[s] || s.replace('_',' ')}</option>)}
        </select>

        <select className="rq2-sel" value={filtNiveau} onChange={e => setFiltNiveau(e.target.value)}>
          <option value="">All levels</option>
          {NIVEAUX.map(n => <option key={n} value={n}>{NIVEAU_LABEL[n] || n}</option>)}
        </select>

        <span className="rq2-count">{filtered.length} risk{filtered.length!==1?'s':''}</span>
      </div>

      {/* ── Risk cards ── */}
      <div className="rq2-cards">
        {loading ? (
          <div className="rq2-empty-state"><div className="rq2-spinner"/><p>Loading…</p></div>
        ) : !selectedId ? (
          <div className="rq2-empty-state"><div style={{fontSize:'2.5rem'}}>📋</div><p>Select a project to view its risks.</p></div>
        ) : filteredWithProjet.length === 0 ? (
          <div className="rq2-empty-state"><div style={{fontSize:'2.5rem'}}>🎉</div><p>No risks identified for this project.</p></div>
        ) : (
          filteredWithProjet.map((r, i) => (
            <RiskCard key={r.id} r={r} onEdit={openEdit} onDelete={askDelete} delay={i * 60} />
          ))
        )}
      </div>

      {/* ── Modal ── */}
      {modalOpen && ReactDOM.createPortal(
        <div className="rq2-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="rq2-modal">
            <div className="rq2-modal-hdr">
              <h2 className="rq2-modal-title">
                {editingId ? `Edit Risk #${editingId}` : 'Identify a New Risk'}
              </h2>
              <button className="rq2-modal-close" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="rq2-modal-body">
              <RiskPreview probabilite={form.probabilite} impact={form.impact} />

              <div className="rq2-field">
                <label className="rq2-label">Description <span className="rq2-req">*</span></label>
                <textarea className="rq2-input rq2-textarea" rows={3} placeholder="Describe the identified risk…"
                  value={form.description} onChange={e => sf('description', e.target.value)} />
              </div>

              <div className="rq2-grid-2">
                <div className="rq2-field">
                  <label className="rq2-label">Probability <span className="rq2-req">*</span></label>
                  <select className="rq2-input rq2-sel-f" value={form.probabilite} onChange={e => sf('probabilite', e.target.value)}>
                    {PROBABILITES.map(p => <option key={p} value={p}>{PROB_LABEL[p] || p}</option>)}
                  </select>
                </div>
                <div className="rq2-field">
                  <label className="rq2-label">Impact <span className="rq2-req">*</span></label>
                  <select className="rq2-input rq2-sel-f" value={form.impact} onChange={e => sf('impact', e.target.value)}>
                    {IMPACTS.map(i => <option key={i} value={i}>{IMPACT_LABEL[i] || i}</option>)}
                  </select>
                </div>
              </div>

              <div className="rq2-grid-2">
                <div className="rq2-field">
                  <label className="rq2-label">Status</label>
                  <select className="rq2-input rq2-sel-f" value={form.statut} onChange={e => sf('statut', e.target.value)}>
                    {STATUTS_R.map(s => <option key={s} value={s}>{STATUT_LABEL[s] || s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="rq2-field">
                  <label className="rq2-label">Responsible</label>
                  <select className="rq2-input rq2-sel-f" value={form.responsableId} onChange={e => sf('responsableId', e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{userLabel(u)}</option>)}
                  </select>
                </div>
              </div>

              <div className="rq2-field">
                <label className="rq2-label">Identification Date</label>
                <input type="date" className="rq2-input" value={form.dateIdentification}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => sf('dateIdentification', e.target.value)} />
              </div>

              <div className="rq2-field">
                <label className="rq2-label">Mitigation Plan</label>
                <textarea className="rq2-input rq2-textarea" rows={3}
                  placeholder="Actions to reduce probability or impact…"
                  value={form.planMitigation} onChange={e => sf('planMitigation', e.target.value)} />
              </div>

              <div className="rq2-field">
                <label className="rq2-label">Contingency Plan</label>
                <textarea className="rq2-input rq2-textarea" rows={3}
                  placeholder="Actions to take if the risk materialises…"
                  value={form.planContingence} onChange={e => sf('planContingence', e.target.value)} />
              </div>
            </div>
            <div className="rq2-modal-footer">
              <button className="rq2-btn rq2-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="rq2-btn rq2-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingId ? '✔ Update' : '✔ Identify'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Confirm delete ── */}
      {confirmCfg && ReactDOM.createPortal(
        <div className="rq2-overlay">
          <div className="rq2-confirm">
            <div className="rq2-confirm-emoji">⚠️</div>
            <h3 className="rq2-confirm-title">{confirmCfg.title}</h3>
            <p className="rq2-confirm-body">{confirmCfg.body}</p>
            <div className="rq2-confirm-btns">
              <button className="rq2-btn rq2-btn--ghost" onClick={() => setConfirmCfg(null)}>Cancel</button>
              <button className="rq2-btn rq2-btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ToastStack toasts={toasts} remove={removeToast} />
    </div>
  )
}
