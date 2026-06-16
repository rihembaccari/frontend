// ═══════════════════════════════════════════════════════════════════
// TachePage.jsx — fully translated to English
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import './css/TachePage.css'
import { getToken, getRole, isAdmin } from '../../services/tokenService'
import LanguageSwitcher from '../../i18n/LanguageSwitcher'
import AiTachePanel from './AiTachePanel'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({ Authorization: `Bearer ${getToken()}` })

const MODULES_ERP = [
  'DMI (Medical Records)','HR (Human Resources)',
  'Finance & Accounting','Reception & Admission','Pharmacy',
  'Laboratory','Medical Imaging','Operating Room','Other',
]
const PHASES = [
  'Analysis & Scoping','Configuration & Development',
  'Testing & Validation','Training','Deployment','Post Go-Live Support',
]
const TYPES     = ['Configuration','Development','Testing','Training','Documentation','Meeting','Analysis','Other']
const PRIORITES = ['Critique','Haute','Moyenne','Basse']
const STATUTS   = ['Nouvelle','Planifiée','En cours','En attente','En retard','Terminée','Annulée']

// Display labels for status and priority (backend values kept as-is)
const STATUT_LABEL = {
  'Nouvelle':'New', 'Planifiée':'Planned', 'En cours':'In Progress',
  'En attente':'On Hold', 'En retard':'Late', 'Terminée':'Done', 'Annulée':'Cancelled',
}
const PRIO_LABEL = { 'Critique':'Critical', 'Haute':'High', 'Moyenne':'Medium', 'Basse':'Low' }

const KANBAN_COLS = [
  { key:'Nouvelle',   label:'New',         color:'#2563eb', bg:'#eff6ff' },
  { key:'Planifiée',  label:'Planned',     color:'#0369a1', bg:'#f0f9ff' },
  { key:'En cours',   label:'In Progress', color:'#16a34a', bg:'#f0fdf4' },
  { key:'En attente', label:'On Hold',     color:'#71717a', bg:'#fafafa' },
  { key:'En retard',  label:'Late',        color:'#dc2626', bg:'#fef2f2' },
  { key:'Terminée',   label:'Done',        color:'#15803d', bg:'#dcfce7' },
  { key:'Annulée',    label:'Cancelled',   color:'#94a3b8', bg:'#f1f5f9' },
]

const prioriteClass = p => ({'Critique':'crit','Haute':'high','Moyenne':'med','Basse':'low'}[p]||'med')
const statutClass   = s => ({'Nouvelle':'new','Planifiée':'planned','En cours':'inprogress','En attente':'waiting','En retard':'late','Terminée':'done','Annulée':'cancelled'}[s]||'new')
const PRIO_COLORS   = { Critique:'#dc2626', Haute:'#ea580c', Moyenne:'#4f46e5', Basse:'#16a34a' }

const EMPTY_FORM = () => ({
  titre:'', description:'', projetId:'', moduleErp:'', phaseProjet:'', typeTache:'',
  priorite:'Moyenne', statut:'Nouvelle', chefProjetAssigneId:'', assigneAId:'',
  dateDebut:'', dateFin:'', effortEstime:'',
  impactAutresModules:'', ressourcesNecessaires:'', criteresAcceptation:'', commentaires:'', prerequis:'',
})

let _users = []
const userLabel = u => u?.nomComplet || `${u?.prenom||''} ${u?.nom||''}`.trim() || u?.email || ''
const fmtDate   = d => { if (!d) return '—'; const [y,m,dd] = String(d).split('-'); return `${dd}/${m}/${y}` }

// ─── Toast ────────────────────────────────────────────────────────
function ToastStack({ toasts, remove }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-icon">{t.type==='success'?'✓':t.type==='error'?'✕':'⚠'}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-x" onClick={() => remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── PrereqPicker ─────────────────────────────────────────────────
const PrereqPicker = ({ taches, value, onChange }) => {
  const [q, setQ]       = useState('')
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  const available = taches.filter(t => {
    const id = t.idTacheString || String(t.id)
    if (selected.includes(id) || selected.includes(String(t.id))) return false
    if (!q) return true
    return (t.idTacheString||'').toLowerCase().includes(q.toLowerCase()) ||
           String(t.id).includes(q) ||
           (t.titre||'').toLowerCase().includes(q.toLowerCase())
  })

  const dropdown = q
    ? available
    : taches.filter(t => {
        const id = t.idTacheString || String(t.id)
        return !selected.includes(id) && !selected.includes(String(t.id))
      })

  const addPre = t => {
    const id = t.idTacheString || String(t.id)
    onChange([...selected, id].join(', '))
    setQ('')
  }
  const removePre = id => onChange(selected.filter(s => s !== id).join(', '))
  const findTache = id => taches.find(t => t.idTacheString === id || String(t.id) === id)

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div
        style={{
          display:'flex', flexWrap:'wrap', gap:6, padding:'8px 10px',
          border:'1.5px solid var(--bord)', borderRadius:9,
          background:'#fafbfc', minHeight:42, cursor:'text',
          transition:'border-color .2s',
        }}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
      >
        {selected.map(id => {
          const t = findTache(id)
          return (
            <span key={id} title={t ? t.titre : id} style={{
              display:'inline-flex', alignItems:'center', gap:5,
              background:'var(--cl)', border:'1px solid var(--cb)',
              borderRadius:6, padding:'3px 8px 3px 10px',
              fontSize:11.5, fontFamily:'var(--mono)', color:'var(--c)',
              fontWeight:600, whiteSpace:'nowrap',
            }}>
              {id}
              {t && <span style={{ fontFamily:'var(--font)', fontWeight:400, color:'var(--cd)', fontSize:11 }}>· {t.titre.length > 20 ? t.titre.substring(0,20)+'…' : t.titre}</span>}
              <button type="button" onClick={e => { e.stopPropagation(); removePre(id) }}
                style={{
                  background:'rgba(193,98,42,.15)', border:'none', cursor:'pointer',
                  color:'var(--c)', fontSize:12, lineHeight:1, padding:'0 2px',
                  borderRadius:3, display:'flex', alignItems:'center',
                }}>×</button>
            </span>
          )
        })}
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length ? 'Add a task…' : 'Search by ID or title…'}
          style={{
            border:'none', outline:'none', flex:1, minWidth:140,
            background:'transparent', fontSize:13, color:'var(--t1)',
            fontFamily:'var(--font)',
          }}
        />
      </div>

      {open && dropdown.length > 0 && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999,
          background:'white', border:'1.5px solid var(--bord)', borderRadius:10,
          boxShadow:'0 8px 24px rgba(0,0,0,.12)', maxHeight:220, overflowY:'auto',
        }}>
          <div style={{ padding:'8px 12px 6px', fontSize:10.5, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--bord)' }}>
            Project tasks ({dropdown.length})
          </div>
          {dropdown.map(t => {
            const id = t.idTacheString || String(t.id)
            return (
              <div key={t.id} onClick={() => addPre(t)}
                style={{ padding:'9px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #f8fafc' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cl)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--c)', fontWeight:700, background:'var(--cl)', border:'1px solid var(--cb)', borderRadius:5, padding:'2px 6px', whiteSpace:'nowrap', flexShrink:0 }}>
                  {id}
                </span>
                <span style={{ fontSize:13, color:'var(--t1)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {t.titre}
                </span>
                {t.statut && (
                  <span style={{ fontSize:10.5, color:'var(--t3)', flexShrink:0 }}>{STATUT_LABEL[t.statut] || t.statut}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && dropdown.length === 0 && q && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999,
          background:'white', border:'1.5px solid var(--bord)', borderRadius:10,
          padding:'14px 12px', fontSize:13, color:'var(--t3)', textAlign:'center',
        }}>
          No tasks found for "{q}"
        </div>
      )}

      {open && taches.length === 0 && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999,
          background:'white', border:'1.5px solid var(--bord)', borderRadius:10,
          padding:'14px 12px', fontSize:13, color:'var(--t3)', textAlign:'center',
        }}>
          Select a project to load its tasks
        </div>
      )}
    </div>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────
function KanbanView({ taches, onEdit, onDelete, onStatusChange }) {
  const [dragging, setDragging] = useState(null)
  const [overCol,  setOverCol]  = useState(null)

  const handleDragStart = (e, t)    => { setDragging(t); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver  = (e, col)  => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col) }
  const handleDrop      = (e, col)  => { e.preventDefault(); if (dragging && dragging.statut !== col) onStatusChange(dragging, col); setDragging(null); setOverCol(null) }
  const handleDragEnd   = ()        => { setDragging(null); setOverCol(null) }

  return (
    <div className="kb-board">
      {KANBAN_COLS.map(col => {
        const colTaches = taches.filter(t => t.statut === col.key)
        return (
          <div key={col.key}
            className={`kb-col${overCol === col.key ? ' kb-col--over' : ''}`}
            onDragOver={e => handleDragOver(e, col.key)}
            onDrop={e => handleDrop(e, col.key)}
            onDragLeave={() => setOverCol(null)}>

            <div className="kb-col__header" style={{ borderTopColor: col.color }}>
              <span className="kb-col__title" style={{ color: col.color }}>{col.label}</span>
              <span className="kb-col__count" style={{ background: col.bg, color: col.color }}>{colTaches.length}</span>
            </div>

            <div className="kb-col__body">
              {colTaches.length === 0 && <div className="kb-empty">Drop here</div>}
              {colTaches.map(t => (
                <div key={t.id}
                  className={`kb-card${dragging?.id === t.id ? ' kb-card--dragging' : ''}`}
                  draggable onDragStart={e => handleDragStart(e, t)} onDragEnd={handleDragEnd}>
                  <div className="kb-card__top">
                    <span className="kb-card__id">{t.idTacheString || `#${t.id}`}</span>
                    {t.priorite && <span className={`tk-prio tk-prio--${prioriteClass(t.priorite)}`}>{PRIO_LABEL[t.priorite] || t.priorite}</span>}
                  </div>
                  <p className="kb-card__title">{t.titre}</p>
                  {t.moduleErp   && <p className="kb-card__meta">📦 {t.moduleErp}</p>}
                  {t.assigneANom && <p className="kb-card__meta">👤 {t.assigneANom}</p>}
                  {(t.dateDebut || t.dateFin) && (
                    <p className="kb-card__meta">📅 {fmtDate(t.dateDebut)} → {fmtDate(t.dateFin)}</p>
                  )}
                  <div className="kb-card__actions">
                    <button className="gp-btn-action gp-btn-action--edit" title="Edit" onClick={() => onEdit(t)}>
                      <svg viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button className="gp-btn-action gp-btn-action--delete" title="Delete" onClick={() => onDelete(t)}>
                      <svg viewBox="0 0 20 20" fill="none"><path d="M8 4h4M3 6h14M5 6l1 11h8L15 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Gantt View ───────────────────────────────────────────────────
function GanttView({ taches }) {
  const today   = new Date()
  const allDates  = taches.flatMap(t => [t.dateDebut, t.dateFin]).filter(Boolean).map(d => new Date(d))

  const minDate = allDates.length ? new Date(Math.min(...allDates)) : new Date()
  const maxDate = allDates.length ? new Date(Math.max(...allDates)) : new Date()
  minDate.setDate(minDate.getDate() - 3)
  maxDate.setDate(maxDate.getDate() + 3)

  const totalDays = Math.max(1, (maxDate - minDate) / 86400000)
  const pct       = d => Math.max(0, Math.min(100, ((new Date(d) - minDate) / 86400000 / totalDays) * 100))
  const todayPct  = pct(today)

  const barLeft  = t => pct(t.dateDebut || t.dateFin)
  const barWidth = t => {
    const s = new Date(Math.max(new Date(t.dateDebut || t.dateFin), minDate))
    const e = new Date(Math.min(new Date(t.dateFin   || t.dateDebut), maxDate))
    return Math.max(0.8, ((e - s) / 86400000 / totalDays) * 100)
  }

  const months = []
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  while (cur <= maxDate) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }

  if (taches.length === 0) return <div className="gp-empty">No tasks to display in Gantt.</div>

  return (
    <div className="gantt-wrap">
      <div className="gantt-left">
        <div className="gantt-left__head">
          <span style={{ flex:2 }}>Task</span>
          <span style={{ flex:1, textAlign:'center' }}>Start</span>
          <span style={{ flex:1, textAlign:'center' }}>End</span>
        </div>
        {taches.map(t => (
          <div key={t.id} className="gantt-row-label">
            <span className="gantt-row-label__id">{t.idTacheString || `#${t.id}`}</span>
            <span className="gantt-row-label__title" title={t.titre}>{t.titre}</span>
            <span className="gantt-row-label__date">{fmtDate(t.dateDebut)}</span>
            <span className="gantt-row-label__date">{fmtDate(t.dateFin)}</span>
          </div>
        ))}
      </div>

      <div className="gantt-right">
        <div className="gantt-months">
          {months.map((m, i) => {
            const mStart = new Date(m.getFullYear(), m.getMonth(), 1)
            const mEnd   = new Date(m.getFullYear(), m.getMonth() + 1, 0)
            const left   = pct(Math.max(mStart, minDate))
            const right  = 100 - pct(Math.min(mEnd, maxDate))
            return (
              <div key={i} className="gantt-month-label" style={{ left:`${left}%`, right:`${right}%` }}>
                {m.toLocaleString('en', { month:'short', year:'numeric' })}
              </div>
            )
          })}
        </div>

        <div className="gantt-grid">
          {todayPct >= 0 && todayPct <= 100 && (
            <div className="gantt-today" style={{ left:`${todayPct}%` }}>
              <span className="gantt-today__label">Today</span>
            </div>
          )}

          {taches.map(t => (
            <div key={t.id} className="gantt-row">
              {months.map((m, i) => (
                <div key={i} className="gantt-vline" style={{ left:`${pct(new Date(m.getFullYear(), m.getMonth(), 1))}%` }}/>
              ))}
              {(t.dateDebut || t.dateFin) ? (
                <div className="gantt-bar"
                  style={{ left:`${barLeft(t)}%`, width:`${barWidth(t)}%`, background: PRIO_COLORS[t.priorite] || '#4f46e5' }}
                  title={`${t.titre} · ${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}${t.effortEstime ? ` · ${t.effortEstime}d` : ''}`}>
                  <span className="gantt-bar__label">{t.titre}</span>
                </div>
              ) : (
                <span className="gantt-nodate">No dates set</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────
export default function TachePage({ onNavigate }) {
  const [projets,          setProjets]          = useState([])
  const [users,            setUsers]            = useState([])
  const [taches,           setTaches]           = useState([])
  const [allProjectTaches, setAllProjectTaches] = useState([])
  const [selectedId,       setSelectedId]       = useState(() => Number(localStorage.getItem('gp_activeProjetId')) || null)
  const [loading,          setLoading]          = useState(false)
  const [viewMode,         setViewMode]         = useState('table')

  const [filtStatut,   setFiltStatut]   = useState('')
  const [filtPriorite, setFiltPriorite] = useState('')
  const [filtAssigne,  setFiltAssigne]  = useState('')
  const [filtTitre,    setFiltTitre]    = useState('')

  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingId,     setEditingId]     = useState(null)
  const [editingTskId,  setEditingTskId]  = useState('')
  const [form,          setForm]          = useState(EMPTY_FORM())
  const [newFiles,      setNewFiles]      = useState([])
  const [existingFiles, setExistingFiles] = useState([])
  const [saving,        setSaving]        = useState(false)
  const fileInputRef = useRef(null)

  const [confirmCfg,  setConfirmCfg]  = useState(null)
  const pendingDelete = useRef(null)

  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200)
  }, [])
  const removeToast = id => setToasts(ts => ts.filter(x => x.id !== id))

  useEffect(() => {
    fetch(`${API}/projets`, { headers: authH() }).then(r => r.ok ? r.json() : []).then(setProjets).catch(() => {})
    fetch(`${API}/utilisateurs`, { headers: authH() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          if (a.role === b.role) return (a.nomComplet||'').localeCompare(b.nomComplet||'')
          return a.role === 'CHEF_PROJET' ? -1 : 1
        })
        _users = sorted; setUsers(sorted)
      }).catch(() => {})
  }, [])

  const loadAllForPrereq = async pid => {
    if (!pid) return
    try { const r = await fetch(`${API}/projets/${pid}/taches`, { headers: authH() }); if (r.ok) setAllProjectTaches(await r.json()) } catch {}
  }

  const loadTaches = useCallback(async pid => {
    if (!pid) { setTaches([]); return }
    setLoading(true)
    try { const r = await fetch(`${API}/projets/${pid}/taches`, { headers: authH() }); setTaches(r.ok ? await r.json() : []) }
    catch { setTaches([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadTaches(selectedId); loadAllForPrereq(selectedId) }, [selectedId])

  const filtered = taches.filter(t => {
    if (filtStatut   && t.statut   !== filtStatut)   return false
    if (filtPriorite && t.priorite !== filtPriorite)  return false
    if (filtAssigne  && String(t.assigneAId) !== filtAssigne) return false
    if (filtTitre    && !t.titre?.toLowerCase().includes(filtTitre.toLowerCase())) return false
    return true
  })

  const openAdd = () => {
    setEditingId(null); setEditingTskId('')
    setForm({ ...EMPTY_FORM(), projetId: selectedId ? String(selectedId) : '' })
    setNewFiles([]); setExistingFiles([]); setModalOpen(true)
  }
  const openEdit = t => {
    if (t.projetId) loadAllForPrereq(t.projetId)
    setEditingId(t.id); setEditingTskId(t.idTacheString || `#${t.id}`)
    setForm({
      titre: t.titre||'', description: t.description||'', projetId: String(t.projetId||''),
      moduleErp: t.moduleErp||'', phaseProjet: t.phaseProjet||'', typeTache: t.typeTache||'',
      priorite: t.priorite||'Moyenne', statut: t.statut||'Nouvelle',
      chefProjetAssigneId: t.chefProjetAssigneId ? String(t.chefProjetAssigneId) : '',
      assigneAId: t.assigneAId ? String(t.assigneAId) : '',
      dateDebut: t.dateDebut||'', dateFin: t.dateFin||'', effortEstime: t.effortEstime||'',
      impactAutresModules: t.impactAutresModules||'', ressourcesNecessaires: t.ressourcesNecessaires||'',
      criteresAcceptation: t.criteresAcceptation||'', commentaires: t.commentaires||'', prerequis: t.prerequisIds||'',
    })
    setNewFiles([]); setExistingFiles(t.fichiersJoints||[]); setModalOpen(true)
  }

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.titre.trim()) { addToast('Title is required', 'warn'); return }
    if (!form.projetId)     { addToast('Select a project', 'warn'); return }
    setSaving(true)
    try {
      const td = {
        titre: form.titre, description: form.description, statut: form.statut, priorite: form.priorite,
        moduleErp: form.moduleErp||null, phaseProjet: form.phaseProjet||null, typeTache: form.typeTache||null,
        effortEstime: form.effortEstime||null, dateDebut: form.dateDebut||null, dateFin: form.dateFin||null,
        chefProjetAssigneId: form.chefProjetAssigneId ? Number(form.chefProjetAssigneId) : null,
        assigneAId: form.assigneAId ? Number(form.assigneAId) : null,
        impactAutresModules: form.impactAutresModules||null, ressourcesNecessaires: form.ressourcesNecessaires||null,
        criteresAcceptation: form.criteresAcceptation||null, commentaires: form.commentaires||null, prerequis: form.prerequis||null,
      }
      const fd = new FormData()
      fd.append('tache', new Blob([JSON.stringify(td)], { type:'application/json' }))
      newFiles.forEach(f => fd.append('fichiers', f))
      const res = await fetch(
        editingId ? `${API}/taches/${editingId}` : `${API}/projets/${form.projetId}/taches`,
        { method: editingId ? 'PUT' : 'POST', headers: authH(), body: fd }
      )
      if (!res.ok) throw new Error((await res.text()) || 'Server error')
      addToast(editingId ? 'Task updated ✓' : 'Task created ✓', 'success')
      setModalOpen(false); loadTaches(selectedId || Number(form.projetId))
    } catch(e) { addToast(e.message || 'Save error', 'error') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (tache, newStatut) => {
    setTaches(ts => ts.map(t => t.id === tache.id ? { ...t, statut: newStatut } : t))
    try {
      const toStrOrNull  = v => (v !== undefined && v !== null && v !== '') ? String(v) : null
      const toLongOrNull = v => (v !== undefined && v !== null && v !== '') ? Number(v) : null
      const toDateOrNull = v => (v !== undefined && v !== null && v !== '') ? String(v) : null

      const cleanData = {
        titre:                 tache.titre        || '',
        description:           toStrOrNull(tache.description),
        statut:                newStatut,
        priorite:              toStrOrNull(tache.priorite),
        moduleErp:             toStrOrNull(tache.moduleErp),
        phaseProjet:           toStrOrNull(tache.phaseProjet),
        typeTache:             toStrOrNull(tache.typeTache),
        effortEstime:          toStrOrNull(tache.effortEstime),
        dateDebut:             toDateOrNull(tache.dateDebut),
        dateFin:               toDateOrNull(tache.dateFin),
        chefProjetAssigneId:   toLongOrNull(tache.chefProjetAssigneId),
        assigneAId:            toLongOrNull(tache.assigneAId),
        impactAutresModules:   toStrOrNull(tache.impactAutresModules),
        ressourcesNecessaires: toStrOrNull(tache.ressourcesNecessaires),
        criteresAcceptation:   toStrOrNull(tache.criteresAcceptation),
        commentaires:          toStrOrNull(tache.commentaires),
        prerequis:             toStrOrNull(tache.prerequisIds),
      }

      const fd = new FormData()
      fd.append('tache', new Blob([JSON.stringify(cleanData)], { type: 'application/json' }))
      const res = await fetch(`${API}/taches/${tache.id}`, { method: 'PUT', headers: authH(), body: fd })
      if (!res.ok) {
        setTaches(ts => ts.map(t => t.id === tache.id ? { ...t, statut: tache.statut } : t))
        const msg = await res.text().catch(() => '')
        throw new Error(msg || `Server error (${res.status})`)
      }
      addToast(`Status → ${STATUT_LABEL[newStatut] || newStatut}`, 'success')
    } catch(e) {
      addToast(e.message || 'Status update error', 'error')
    }
  }

  const askDelete = t => {
    pendingDelete.current = t.id
    setConfirmCfg({ title:`Delete "${t.titre}"?`, body:'This action is irreversible.' })
  }
  const confirmDelete = async () => {
    const id = pendingDelete.current; setConfirmCfg(null)
    try {
      const res = await fetch(`${API}/taches/${id}`, { method:'DELETE', headers: authH() })
      if (res.status === 409) { addToast('Cannot delete: ' + (await res.text()), 'error'); return }
      if (!res.ok) throw new Error()
      addToast('Task deleted ✓', 'success'); loadTaches(selectedId)
    } catch { addToast('Deletion error', 'error') }
  }

  const removeExistingFile = async (tacheId, fichierId) => {
    try {
      await fetch(`${API}/taches/${tacheId}/fichiers/${fichierId}`, { method:'DELETE', headers: authH() })
      setExistingFiles(ef => ef.filter(f => f.id !== fichierId)); addToast('File deleted ✓', 'success')
    } catch { addToast('File deletion error', 'error') }
  }

  const selectedProjet = projets.find(p => p.id === selectedId)

  return (
    <div className="gp-page">
      {/* ── Navbar ── */}
      <header className="gp-nav">
        <div className="gp-nav__left">
          <button className="gp-hamburger"><span/><span/><span/></button>
          <h1 className="gp-nav__brand">Tasks</h1>
        </div>
        <div className="gp-nav__right">
          {selectedProjet && <span className="gp-badge-projet">● Project: {selectedProjet.nom}</span>}
          <span className={`gp-role-badge gp-role-badge--${getRole() === 'ADMIN' ? 'admin' : 'chef'}`}>
            {getRole() === 'ADMIN' ? '👑 Admin' : '👷 Project Manager'}
          </span>
          <div className="gp-avatar">{(getRole()||'U')[0].toUpperCase()}</div>
          <span className="gp-nav__username">{getRole()?.toUpperCase()}</span>
          <span className="gp-chevron">▾</span>
          {typeof LanguageSwitcher !== 'undefined' && <LanguageSwitcher/>}
          <button className="gp-notif">🔔</button>
        </div>
      </header>

      <div className="gp-content">
        <div className="gp-page-header">
          <h2 className="gp-page-title">Task Management</h2>
          <div className="gp-page-header__actions">
            <AiTachePanel
              projetId={selectedId}
              projetNom={selectedProjet?.nom}
              onTasksChanged={() => loadTaches(selectedId)}
              addToast={addToast}
            />
            <button className="btn btn--primary" onClick={openAdd}>+ Add Task</button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="tk-filterbar">
          <div className="tk-filter-proj-wrap">
            <span className="tk-filter-icon">📅</span>
            <select className="tk-filter-sel tk-filter-sel--proj" value={selectedId||''} onChange={e => setSelectedId(Number(e.target.value)||null)}>
              <option value="">-- Project --</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div className="tk-filter-search-wrap">
            <span className="tk-search-icon">🔍</span>
            <input className="tk-filter-input" placeholder="Search by title..." value={filtTitre} onChange={e => setFiltTitre(e.target.value)}/>
          </div>

          {viewMode !== 'gantt' && <>
            <div className="tk-filter-sel-wrap">
              <select className="tk-filter-sel" value={filtStatut} onChange={e => setFiltStatut(e.target.value)}>
                <option value="">All statuses</option>
                {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABEL[s] || s}</option>)}
              </select>
            </div>
            <div className="tk-filter-sel-wrap">
              <select className="tk-filter-sel" value={filtPriorite} onChange={e => setFiltPriorite(e.target.value)}>
                <option value="">All priorities</option>
                {PRIORITES.map(p => <option key={p} value={p}>{PRIO_LABEL[p] || p}</option>)}
              </select>
            </div>
            <div className="tk-filter-sel-wrap">
              <select className="tk-filter-sel" value={filtAssigne} onChange={e => setFiltAssigne(e.target.value)}>
                <option value="">All assignees</option>
                {users.map(u => <option key={u.id} value={u.id}>{userLabel(u)}</option>)}
              </select>
            </div>
          </>}

          <span className="tk-count">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>

          {/* ── View switcher ── */}
          <div className="tk-view-switcher">
            <button className={`tk-view-btn${viewMode === 'table'  ? ' tk-view-btn--active' : ''}`} onClick={() => setViewMode('table')}>
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <rect x="2" y="4" width="16" height="2.5" rx="1" fill="currentColor"/>
                <rect x="2" y="8.5" width="16" height="2.5" rx="1" fill="currentColor"/>
                <rect x="2" y="13" width="16" height="2.5" rx="1" fill="currentColor"/>
              </svg>
              Table
            </button>
            <button className={`tk-view-btn${viewMode === 'kanban' ? ' tk-view-btn--active' : ''}`} onClick={() => setViewMode('kanban')}>
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <rect x="2"  y="3" width="4" height="14" rx="1" fill="currentColor"/>
                <rect x="8"  y="3" width="4" height="10" rx="1" fill="currentColor"/>
                <rect x="14" y="3" width="4" height="12" rx="1" fill="currentColor"/>
              </svg>
              Kanban
            </button>
            <button className={`tk-view-btn${viewMode === 'gantt'  ? ' tk-view-btn--active' : ''}`} onClick={() => setViewMode('gantt')}>
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <rect x="2"  y="4"  width="8"  height="3" rx="1" fill="currentColor"/>
                <rect x="6"  y="9"  width="10" height="3" rx="1" fill="currentColor"/>
                <rect x="3"  y="14" width="12" height="3" rx="1" fill="currentColor"/>
              </svg>
              Gantt
            </button>
          </div>
        </div>

        {/* ── Views ── */}
        {loading ? (
          <div className="gp-spinner">Loading...</div>
        ) : !selectedId ? (
          <div className="gp-empty">Select a project to view its tasks.</div>
        ) : viewMode === 'table' ? (
          filtered.length === 0 ? <div className="gp-empty">No tasks found.</div> : (
            <div className="tk-table-wrap">
              <table className="tk-table">
                <thead>
                  <tr>
                    <th className="gp-th">Task ID</th>
                    <th className="gp-th">Title</th>
                    <th className="gp-th">ERP Module</th>
                    <th className="gp-th">Phase</th>
                    <th className="gp-th">Priority</th>
                    <th className="gp-th">Status</th>
                    <th className="gp-th">Assigned To</th>
                    <th className="gp-th">Start</th>
                    <th className="gp-th">End</th>
                    <th className="gp-th gp-th--actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="tk-row">
                      <td className="gp-td"><span className={t.idTacheString ? 'tk-id-pill tk-id-pill--full' : 'tk-id-pill tk-id-pill--num'}>{t.idTacheString||`#${t.id}`}</span></td>
                      <td className="gp-td gp-td--titre">{t.titre}</td>
                      <td className="gp-td gp-td--muted tk-cell-sm">{t.moduleErp||<span className="gp-na">—</span>}</td>
                      <td className="gp-td gp-td--muted tk-cell-sm">{t.phaseProjet||<span className="gp-na">—</span>}</td>
                      <td className="gp-td">{t.priorite ? <span className={`tk-prio tk-prio--${prioriteClass(t.priorite)}`}>{PRIO_LABEL[t.priorite] || t.priorite}</span> : <span className="gp-na">—</span>}</td>
                      <td className="gp-td"><span className={`tk-statut tk-statut--${statutClass(t.statut)}`}>{STATUT_LABEL[t.statut] || t.statut}</span></td>
                      <td className="gp-td gp-td--muted tk-cell-sm">{t.assigneANom||<span className="gp-na">—</span>}</td>
                      <td className="gp-td gp-td--date">{fmtDate(t.dateDebut)}</td>
                      <td className="gp-td gp-td--date">{fmtDate(t.dateFin)}</td>
                      <td className="gp-td gp-td--actions">
                        <button className="gp-btn-action gp-btn-action--edit" title="Edit" onClick={() => openEdit(t)}>
                          <svg viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5-3.414.586.586-3.414 8.5-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button className="gp-btn-action gp-btn-action--delete" title="Delete" onClick={() => askDelete(t)}>
                          <svg viewBox="0 0 20 20" fill="none"><path d="M8 4h4M3 6h14M5 6l1 11h8L15 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : viewMode === 'kanban' ? (
          <KanbanView taches={filtered} onEdit={openEdit} onDelete={askDelete} onStatusChange={handleStatusChange}/>
        ) : (
          <GanttView taches={filtered}/>
        )}
      </div>

      {/* ── Modal ── */}
      {modalOpen && ReactDOM.createPortal(
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="tk-modal">
            <div className="tk-modal__header">
              <h2 className="tk-modal__title">{editingId ? `Edit Task: ${editingTskId}` : 'Add a Task'}</h2>
              <button className="tk-modal__close" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="tk-modal__body">
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Task ID</label>
                  <input className="tk-input tk-readonly" readOnly value={editingId ? editingTskId : 'Auto-generated'}/></div>
                <div className="tk-field"><label className="tk-label">Title <span className="tk-req">*</span></label>
                  <input className="tk-input" placeholder="Task title" value={form.titre} onChange={e => sf('titre', e.target.value)}/></div>
              </div>
              <div className="tk-field"><label className="tk-label">Detailed Description <span className="tk-req">*</span></label>
                <textarea className="tk-input tk-textarea tk-textarea--tall" rows={3} placeholder="Describe the task in detail…"
                  value={form.description} onChange={e => sf('description', e.target.value)}/></div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Associated Project <span className="tk-req">*</span></label>
                  <select className="tk-input tk-input--sel" value={form.projetId} onChange={e => sf('projetId', e.target.value)}>
                    <option value="">-- Select --</option>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.nom} (ID: {p.id})</option>)}
                  </select></div>
                <div className="tk-field"><label className="tk-label">ERP Module <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-module" placeholder="Select or type…" value={form.moduleErp} onChange={e => sf('moduleErp', e.target.value)}/>
                  <datalist id="dl-module">{MODULES_ERP.map(m => <option key={m} value={m}/>)}</datalist></div>
              </div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Project Phase <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-phase" placeholder="Select or type…" value={form.phaseProjet} onChange={e => sf('phaseProjet', e.target.value)}/>
                  <datalist id="dl-phase">{PHASES.map(p => <option key={p} value={p}/>)}</datalist></div>
                <div className="tk-field"><label className="tk-label">Task Type <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-type" placeholder="Select or type…" value={form.typeTache} onChange={e => sf('typeTache', e.target.value)}/>
                  <datalist id="dl-type">{TYPES.map(t => <option key={t} value={t}/>)}</datalist></div>
              </div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Priority <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-prio" placeholder="Select or type…" value={form.priorite} onChange={e => sf('priorite', e.target.value)}/>
                  <datalist id="dl-prio">{PRIORITES.map(p => <option key={p} value={p}/>)}</datalist></div>
                <div className="tk-field"><label className="tk-label">Status <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-statut" placeholder="Select or type…" value={form.statut} onChange={e => sf('statut', e.target.value)}/>
                  <datalist id="dl-statut">{STATUTS.map(s => <option key={s} value={s}/>)}</datalist></div>
              </div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Assigned Project Manager <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-chef" placeholder="Select or type…"
                    value={form.chefProjetAssigneId ? (users.find(u => String(u.id) === form.chefProjetAssigneId) ? userLabel(users.find(u => String(u.id) === form.chefProjetAssigneId)) : form.chefProjetAssigneId) : ''}
                    onChange={e => { const m = users.find(u => userLabel(u) === e.target.value); sf('chefProjetAssigneId', m ? String(m.id) : e.target.value) }}/>
                  <datalist id="dl-chef">{users.filter(u => u.role==='CHEF_PROJET'||u.role==='ADMIN').map(u => <option key={u.id} value={userLabel(u)}/>)}</datalist></div>
                <div className="tk-field"><label className="tk-label">Assigned To <span className="tk-req">*</span></label>
                  <input className="tk-input" list="dl-assigne" placeholder="Select or type…"
                    value={form.assigneAId ? (users.find(u => String(u.id) === form.assigneAId) ? userLabel(users.find(u => String(u.id) === form.assigneAId)) : form.assigneAId) : ''}
                    onChange={e => { const m = users.find(u => userLabel(u) === e.target.value); sf('assigneAId', m ? String(m.id) : e.target.value) }}/>
                  <datalist id="dl-assigne">{users.map(u => <option key={u.id} value={userLabel(u)}/>)}</datalist></div>
              </div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Planned Start Date <span className="tk-req">*</span></label>
                  <input type="date" className="tk-input" value={form.dateDebut}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { sf('dateDebut', e.target.value); if (form.dateFin && e.target.value > form.dateFin) sf('dateFin', '') }}/></div>
                <div className="tk-field"><label className="tk-label">Planned End Date <span className="tk-req">*</span></label>
                  <input type="date" className="tk-input" value={form.dateFin}
                    min={form.dateDebut || new Date().toISOString().split('T')[0]}
                    onChange={e => sf('dateFin', e.target.value)}/></div>
              </div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Estimated Effort (D/H) <span className="tk-req">*</span></label>
                  <input type="number" min="0" step="0.5" className="tk-input" placeholder="e.g. 5"
                    value={form.effortEstime}
                    onChange={e => { const v = e.target.value; if (v === '' || Number(v) >= 0) sf('effortEstime', v) }}
                    onKeyDown={e => ['e','E','+','-'].includes(e.key) && e.preventDefault()}/></div>
                <div className="tk-field"><label className="tk-label">Attachments</label>
                  <div className="tk-file-row">
                    <button type="button" className="tk-file-btn" onClick={() => fileInputRef.current?.click()}>Select files</button>
                    <span className="tk-file-names">{newFiles.length ? newFiles.map(f => f.name).join(', ') : 'No file chosen'}</span>
                    <input ref={fileInputRef} type="file" multiple hidden onChange={e => setNewFiles(Array.from(e.target.files))}/>
                  </div>
                  {existingFiles.length > 0 && <div className="tk-existing-files">
                    {existingFiles.map(f => (
                      <span key={f.id} className="tk-file-chip">📎 {f.nomFichier}
                        <button type="button" className="tk-file-chip__del" onClick={() => editingId && removeExistingFile(editingId, f.id)}>✕</button>
                      </span>
                    ))}
                  </div>}</div>
              </div>
              <div className="tk-section-sep">Optional Fields</div>
              <div className="tk-row tk-row--2">
                <div className="tk-field"><label className="tk-label">Prerequisite Tasks</label>
                  <PrereqPicker taches={allProjectTaches.filter(t => !editingId || t.id !== editingId)} value={form.prerequis} onChange={v => sf('prerequis', v)}/></div>
                <div className="tk-field"><label className="tk-label">Impact on Other Modules</label>
                  <input className="tk-input" placeholder="e.g. Reception & Admission" value={form.impactAutresModules} onChange={e => sf('impactAutresModules', e.target.value)}/></div>
              </div>
              <div className="tk-field"><label className="tk-label">Required Resources</label>
                <input className="tk-input" placeholder="e.g. ERP admin access" value={form.ressourcesNecessaires} onChange={e => sf('ressourcesNecessaires', e.target.value)}/></div>
              <div className="tk-field"><label className="tk-label">Acceptance Criteria</label>
                <textarea className="tk-input tk-textarea" rows={2} value={form.criteresAcceptation} onChange={e => sf('criteresAcceptation', e.target.value)}/></div>
              <div className="tk-field"><label className="tk-label">Comments</label>
                <textarea className="tk-input tk-textarea" rows={2} value={form.commentaires} onChange={e => sf('commentaires', e.target.value)}/></div>
            </div>
            <div className="tk-modal__footer">
              <button className="btn btn--secondary" onClick={() => setModalOpen(false)}>Close</button>
              <button className="btn btn--primary tk-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '✔ Save Task'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── Confirm delete ── */}
      {confirmCfg && ReactDOM.createPortal(
        <div className="overlay">
          <div className="confirm-dialog">
            <div className="confirm-emoji">🗑️</div>
            <h3 className="confirm-title">{confirmCfg.title}</h3>
            <p className="confirm-body">{confirmCfg.body}</p>
            <div className="confirm-actions">
              <button className="btn btn--secondary" onClick={() => setConfirmCfg(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      , document.body)}

      <ToastStack toasts={toasts} remove={removeToast}/>
    </div>
  )
}
