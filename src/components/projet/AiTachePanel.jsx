// ═══════════════════════════════════════════════════════════════════
// AiTachePanel.jsx  —  AI Task Generation & Admin Review Panel
// Place in: src/components/projet/AiTachePanel.jsx
//
// KEY BEHAVIOUR:
//   - Generate: tasks returned from Gemini, kept in React state ONLY
//   - Accept / Edit+Save: task sent to backend → saved to DB as "Nouvelle"
//   - Refuse: task removed from React state, nothing saved to DB
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { getToken } from '../../services/tokenService'
import './css/AiTachePanel.css'

// ── API helpers ────────────────────────────────────────────────────
const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type':  'application/json',
})
const apiFetch = (path, opts = {}) =>
  fetch(`${API}${path}`, { ...opts, headers: { ...authH(), ...(opts.headers || {}) } })

// ── Priority config ────────────────────────────────────────────────
const PRIO_CFG = {
  Critique: { cls: 'tk-prio--crit', label: 'Critical' },
  Haute:    { cls: 'tk-prio--high', label: 'High'     },
  Moyenne:  { cls: 'tk-prio--med',  label: 'Medium'   },
  Basse:    { cls: 'tk-prio--low',  label: 'Low'      },
}

const PHASES     = [
  'Analysis & Scoping',
  'Configuration & Development',
  'Testing & Validation',
  'Training',
  'Deployment',
  'Post Go-Live Support',
]
const PRIORITIES = ['Critique', 'Haute', 'Moyenne', 'Basse']

// ── Edit Modal ─────────────────────────────────────────────────────
function EditModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    titre:        task.titre        || '',
    description:  task.description  || '',
    priorite:     task.priorite     || 'Moyenne',
    phaseProjet:  task.phaseProjet  || '',
    typeTache:    task.typeTache    || '',
    effortEstime: task.effortEstime || '',
    moduleErp:    task.moduleErp    || '',
  })
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return ReactDOM.createPortal(
    <div className="overlay ai-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tk-modal ai-edit-modal">

        <div className="tk-modal__header">
          <h2 className="tk-modal__title">✎ Edit AI Task</h2>
          <button className="tk-modal__close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="tk-modal__body">
          <div className="tk-field">
            <label className="tk-label">Title <span className="tk-req">*</span></label>
            <input
              className="tk-input"
              value={form.titre}
              onChange={e => sf('titre', e.target.value)}
            />
          </div>

          <div className="tk-field">
            <label className="tk-label">Description</label>
            <textarea
              className="tk-input tk-textarea tk-textarea--tall"
              rows={4}
              value={form.description}
              onChange={e => sf('description', e.target.value)}
            />
          </div>

          <div className="tk-row tk-row--2">
            <div className="tk-field">
              <label className="tk-label">Priority</label>
              <select
                className="tk-input tk-input--sel"
                value={form.priorite}
                onChange={e => sf('priorite', e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIO_CFG[p]?.label || p}</option>
                ))}
              </select>
            </div>
            <div className="tk-field">
              <label className="tk-label">Estimated Effort</label>
              <input
                className="tk-input"
                placeholder="e.g. 8h"
                value={form.effortEstime}
                onChange={e => sf('effortEstime', e.target.value)}
              />
            </div>
          </div>

          <div className="tk-row tk-row--2">
            <div className="tk-field">
              <label className="tk-label">Project Phase</label>
              <select
                className="tk-input tk-input--sel"
                value={form.phaseProjet}
                onChange={e => sf('phaseProjet', e.target.value)}
              >
                <option value="">-- Select --</option>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="tk-field">
              <label className="tk-label">Task Type</label>
              <input
                className="tk-input"
                placeholder="e.g. Development"
                value={form.typeTache}
                onChange={e => sf('typeTache', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="tk-modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onSave(form)}>
            ✔ Save &amp; Accept
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Task Card ──────────────────────────────────────────────────────
function AiTaskCard({ task, onAccept, onRefuse, onEdit, isProcessing }) {
  const prioCfg = PRIO_CFG[task.priorite] || PRIO_CFG.Moyenne
  return (
    <div className={`ai-card${isProcessing ? ' ai-card--processing' : ''}`}>

      <div className="ai-card__header">
        <div className="ai-card__header-left">
          <span className="ai-card__icon">◈</span>
          {task.moduleErp && (
            <span className="tk-id-pill tk-id-pill--full ai-card__id">
              {task.moduleErp}
            </span>
          )}
        </div>
        <span className={`tk-prio ${prioCfg.cls}`}>{prioCfg.label}</span>
      </div>

      <h4 className="ai-card__title">{task.titre}</h4>

      {task.description && (
        <p className="ai-card__desc">{task.description}</p>
      )}

      <div className="ai-card__meta-row">
        {task.effortEstime && <span className="ai-card__meta">◷ {task.effortEstime}</span>}
        {task.phaseProjet  && <span className="ai-card__meta">◎ {task.phaseProjet}</span>}
        {task.typeTache    && <span className="ai-card__meta">⚙ {task.typeTache}</span>}
      </div>

      <div className="ai-card__actions">
        {/* Pass the full task object — not an id */}
        <button
          className="btn ai-btn ai-btn--accept"
          onClick={() => onAccept(task)}
          disabled={isProcessing}
        >
          ✓ Accept
        </button>
        <button
          className="btn ai-btn ai-btn--modify"
          onClick={() => onEdit(task)}
          disabled={isProcessing}
        >
          ✎ Edit
        </button>
        <button
          className="btn ai-btn ai-btn--refuse"
          onClick={() => onRefuse(task)}
          disabled={isProcessing}
        >
          ✕ Refuse
        </button>
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────
export default function AiTachePanel({ projetId, projetNom, onTasksChanged, addToast }) {
  const [open,          setOpen]          = useState(false)
  const [tasks,         setTasks]         = useState([])       // kept in memory only
  const [generating,    setGenerating]    = useState(false)
  const [processingKeys,setProcessingKeys]= useState(new Set()) // keyed by titre
  const [editingTask,   setEditingTask]   = useState(null)
  const [pendingCount,  setPendingCount]  = useState(0)

  // Reset when project changes — no DB fetch needed
  useEffect(() => {
    setTasks([])
    setPendingCount(0)
  }, [projetId])

  const handleOpen = () => setOpen(true)

  // ── Generate: call Gemini, store in React state, DO NOT save to DB
  const handleGenerate = async () => {
    if (!projetId) { addToast('Please select a project first', 'warn'); return }
    setGenerating(true)
    try {
      const res  = await apiFetch(`/projets/${projetId}/ai/generer-taches`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Generation failed')
      const generated = data.taches || []
      setTasks(generated)
      setPendingCount(generated.length)
      addToast(
        `${generated.length} AI tasks generated — review them below`,
        'success'
      )
    } catch (e) {
      addToast(e.message || 'AI generation error', 'error')
    } finally {
      setGenerating(false)
    }
  }

  // ── Processing state keyed by task titre (no DB id yet) ────────
  const setProcessing = (titre, val) =>
    setProcessingKeys(s => {
      const n = new Set(s)
      val ? n.add(titre) : n.delete(titre)
      return n
    })

  // ── Core review: sends task data to backend, backend saves if ACCEPT/CHANGE
  const reviewOne = async (task, action, overrides = {}) => {
    const key = task.titre
    setProcessing(key, true)
    try {
      // Merge any edits (from EditModal) into the task before sending
      const payload = { action, ...task, ...overrides }

      const res  = await apiFetch(`/projets/${projetId}/ai/taches/review`, {
        method: 'PATCH',
        body:   JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error')

      // Remove from React state regardless of action
      setTasks(ts => ts.filter(t => t.titre !== task.titre))
      setPendingCount(c => Math.max(0, c - 1))

      const msgs = {
        ACCEPT: 'Task accepted and added to project ✓',
        REFUSE: 'Task refused',
        CHANGE: 'Task edited and accepted ✓',
      }
      addToast(msgs[action] || 'Done', 'success')

      // Only refresh the parent task list when something was actually saved
      if (action === 'ACCEPT' || action === 'CHANGE') {
        onTasksChanged?.()
      }
    } catch (e) {
      addToast(e.message || 'Error', 'error')
    } finally {
      setProcessing(key, false)
    }
  }

  const handleAccept   = task => reviewOne(task, 'ACCEPT')
  const handleRefuse   = task => reviewOne(task, 'REFUSE')
  const handleSaveEdit = form => {
    reviewOne(editingTask, 'CHANGE', form)
    setEditingTask(null)
  }

  // ── Bulk: ACCEPT saves all to DB, REFUSE discards all silently ──
  const handleBulk = async action => {
    const label = action === 'ACCEPT' ? 'accept' : 'refuse'
    if (!window.confirm(
      `Are you sure you want to ${label} all ${tasks.length} AI tasks?`
    )) return

    try {
      const res  = await apiFetch(`/projets/${projetId}/ai/review-all`, {
        method: 'POST',
        body:   JSON.stringify({ action, tasks }), // send full task list
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTasks([])
      setPendingCount(0)
      addToast(data.message || 'Done', 'success')
      if (action === 'ACCEPT') onTasksChanged?.()
    } catch (e) {
      addToast(e.message || 'Bulk action failed', 'error')
    }
  }

  if (!projetId) return null

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        className={`btn ai-trigger-btn${pendingCount > 0 ? ' ai-trigger-btn--has-pending' : ''}`}
        onClick={handleOpen}
        title="Generate tasks with Gemini AI"
      >
        <span className="ai-trigger-btn__icon">◈</span>
        AI Tasks
        {pendingCount > 0 && (
          <span className="ai-pending-badge">{pendingCount}</span>
        )}
      </button>

      {/* ── Slide-in panel ── */}
      {open && ReactDOM.createPortal(
        <div
          className="ai-panel-overlay"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="ai-panel">

            {/* Header */}
            <div className="ai-panel__header">
              <div className="ai-panel__header-left">
                <div className="ai-panel__icon-wrap">◈</div>
                <div>
                  <h2 className="ai-panel__title">AI Tasks — Gemini</h2>
                  <p className="ai-panel__subtitle">
                    {projetNom || `Project #${projetId}`}
                  </p>
                </div>
              </div>
              <button className="tk-modal__close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="ai-panel__desc">
              Gemini AI analyzes your project and suggests tasks.
              Only <strong>accepted</strong> tasks are saved to the project —
              refused tasks are discarded without touching the database.
            </div>

            {/* Generate button */}
            <div className="ai-panel__generate-row">
              <button
                className={`btn btn--primary ai-generate-btn${generating ? ' ai-generate-btn--loading' : ''}`}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating
                  ? <><span className="ai-spinner"/> Generating...</>
                  : <>◈ Generate Tasks with Gemini</>
                }
              </button>
            </div>

            {/* Bulk bar — only shown when tasks exist */}
            {tasks.length > 0 && (
              <div className="ai-bulk-bar">
                <span className="ai-bulk-bar__count">
                  {tasks.length} task{tasks.length > 1 ? 's' : ''} awaiting review
                </span>
                <div className="ai-bulk-bar__actions">
                  <button
                    className="btn ai-btn ai-btn--refuse-sm"
                    onClick={() => handleBulk('REFUSE')}
                  >
                    ✕ Refuse all
                  </button>
                  <button
                    className="btn ai-btn ai-btn--accept-sm"
                    onClick={() => handleBulk('ACCEPT')}
                  >
                    ✓ Accept all
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="ai-panel__body">
              {tasks.length === 0 ? (
                <div className="ai-empty">
                  <div className="ai-empty__icon">◈</div>
                  <p className="ai-empty__title">No AI tasks pending</p>
                  <p className="ai-empty__sub">
                    Click "Generate Tasks with Gemini" to get started.
                  </p>
                </div>
              ) : (
                <div className="ai-cards-grid">
                  {tasks.map((t, idx) => (
                    <AiTaskCard
                      key={`${t.titre}-${idx}`}
                      task={t}
                      isProcessing={processingKeys.has(t.titre)}
                      onAccept={handleAccept}
                      onRefuse={handleRefuse}
                      onEdit={task => setEditingTask(task)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Edit modal */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  )
}
