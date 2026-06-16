// AiRisquePanel.jsx — fully translated to English
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { getToken } from '../../services/tokenService'
import './AiRisquePanel.css'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
})
const apiFetch = (path, opts = {}) =>
  fetch(`${API}${path}`, { ...opts, headers: { ...authH(), ...(opts.headers || {}) } })

const PROBABILITES = ['FAIBLE', 'MOYENNE', 'ELEVEE']
const IMPACTS      = ['FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE']

const niveauClass = n =>
  ({ BAS: 'bas', MODERE: 'modere', HAUT: 'haut', EXTREME: 'extreme' }[n] || 'bas')

const PROB_LABEL   = { FAIBLE: 'Low', MOYENNE: 'Medium', ELEVEE: 'High' }
const IMPACT_LABEL = { FAIBLE: 'Low', MOYEN: 'Medium', ELEVE: 'High', CRITIQUE: 'Critical' }
const NIVEAU_LABEL = { BAS: 'Low', MODERE: 'Moderate', HAUT: 'High', EXTREME: 'Extreme' }

const scoreColor = s =>
  s >= 70 ? '#dc2626' : s >= 45 ? '#ea580c' : s >= 20 ? '#d97706' : '#16a34a'

// ── Edit Modal ────────────────────────────────────────────────────
function EditModal({ risk, onSave, onClose }) {
  const [form, setForm] = useState({
    description:     risk.description     || '',
    probabilite:     risk.probabilite     || 'MOYENNE',
    impact:          risk.impact          || 'MOYEN',
    planMitigation:  risk.planMitigation  || '',
    planContingence: risk.planContingence || '',
  })
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const matrix = {
    FAIBLE:  { FAIBLE:'BAS', MOYEN:'BAS',    ELEVE:'MODERE', CRITIQUE:'MODERE' },
    MOYENNE: { FAIBLE:'BAS', MOYEN:'MODERE', ELEVE:'MODERE', CRITIQUE:'HAUT'   },
    ELEVEE:  { FAIBLE:'MODERE', MOYEN:'HAUT', ELEVE:'HAUT',  CRITIQUE:'EXTREME'},
  }
  const previewNiveau = matrix[form.probabilite]?.[form.impact] || 'BAS'

  return ReactDOM.createPortal(
    <div className="overlay ai-rq-edit-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rq-modal ai-rq-edit-modal">

        <div className="rq-modal__header">
          <h2 className="rq-modal__title">✎ Edit AI Risk Suggestion</h2>
          <button className="rq-modal__close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="rq-modal__body">

          {/* Risk level preview */}
          <div className="rq-preview">
            <span className="rq-preview__label">Calculated level:</span>
            <span className={`rq-niveau rq-niveau--${niveauClass(previewNiveau)}`}>
              {NIVEAU_LABEL[previewNiveau] || previewNiveau}
            </span>
          </div>

          <div className="rq-field">
            <label className="rq-label">Description <span className="rq-req">*</span></label>
            <textarea className="rq-input rq-textarea" rows={3}
              value={form.description}
              onChange={e => sf('description', e.target.value)}/>
          </div>

          <div className="rq-row rq-row--2">
            <div className="rq-field">
              <label className="rq-label">Probability</label>
              <select className="rq-input rq-input--sel" value={form.probabilite}
                onChange={e => sf('probabilite', e.target.value)}>
                {PROBABILITES.map(p => <option key={p} value={p}>{PROB_LABEL[p] || p}</option>)}
              </select>
            </div>
            <div className="rq-field">
              <label className="rq-label">Impact</label>
              <select className="rq-input rq-input--sel" value={form.impact}
                onChange={e => sf('impact', e.target.value)}>
                {IMPACTS.map(i => <option key={i} value={i}>{IMPACT_LABEL[i] || i}</option>)}
              </select>
            </div>
          </div>

          <div className="rq-field">
            <label className="rq-label">Mitigation Plan</label>
            <textarea className="rq-input rq-textarea" rows={3}
              placeholder="Actions to reduce probability or impact..."
              value={form.planMitigation}
              onChange={e => sf('planMitigation', e.target.value)}/>
          </div>

          <div className="rq-field">
            <label className="rq-label">Contingency Plan</label>
            <textarea className="rq-input rq-textarea" rows={3}
              placeholder="Actions to take if the risk materialises..."
              value={form.planContingence}
              onChange={e => sf('planContingence', e.target.value)}/>
          </div>
        </div>

        <div className="rq-modal__footer">
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

// ── Risk Card ─────────────────────────────────────────────────────
function AiRiskCard({ risk, onAccept, onRefuse, onEdit, isProcessing }) {
  return (
    <div className={`ai-rq-card${isProcessing ? ' ai-rq-card--processing' : ''}`}>

      <div className="ai-rq-card__header">
        <span className="ai-rq-card__icon">⚠</span>
        <span className={`rq-niveau rq-niveau--${niveauClass(risk.niveauRisque)}`}>
          {NIVEAU_LABEL[risk.niveauRisque] || risk.niveauRisque}
        </span>
        {risk.confidence && (
          <span className="ai-rq-confidence">
            {Math.round(risk.confidence * 100)}% confidence
          </span>
        )}
      </div>

      <p className="ai-rq-card__desc">{risk.description}</p>

      <div className="ai-rq-card__badges">
        <span className={`rq-prob rq-prob--${risk.probabilite?.toLowerCase()}`}>
          P: {PROB_LABEL[risk.probabilite] || risk.probabilite}
        </span>
        <span className={`rq-impact rq-impact--${risk.impact?.toLowerCase()}`}>
          I: {IMPACT_LABEL[risk.impact] || risk.impact}
        </span>
      </div>

      {risk.planMitigation && (
        <div className="ai-rq-card__plan">
          <span className="ai-rq-card__plan-icon">🛡</span>
          <span className="ai-rq-card__plan-text">{risk.planMitigation}</span>
        </div>
      )}

      <div className="ai-rq-card__actions">
        <button className="btn ai-rq-btn ai-rq-btn--accept"
          onClick={() => onAccept(risk)} disabled={isProcessing}>
          ✓ Accept
        </button>
        <button className="btn ai-rq-btn ai-rq-btn--modify"
          onClick={() => onEdit(risk)} disabled={isProcessing}>
          ✎ Edit
        </button>
        <button className="btn ai-rq-btn ai-rq-btn--refuse"
          onClick={() => onRefuse(risk)} disabled={isProcessing}>
          ✕ Refuse
        </button>
      </div>
    </div>
  )
}

// ── Analysis Tab ──────────────────────────────────────────────────
function AnalyzeTab({ projetId, addToast }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading,  setLoading]  = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const res  = await apiFetch(`/projets/${projetId}/ai/risques/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || 'Analysis error')
      setAnalysis(data)
    } catch (e) {
      addToast(e.message || 'Analysis error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const NIVEAUX = ['BAS', 'MODERE', 'HAUT', 'EXTREME']

  return (
    <div className="ai-rq-analyze">
      <button className="btn btn--primary ai-rq-analyze-btn" onClick={runAnalysis} disabled={loading}>
        {loading
          ? <><span className="ai-rq-spinner"/> Analyzing...</>
          : <>◎ Analyze project risks</>
        }
      </button>
      <p className="ai-rq-hint">
        The ML model computes a global risk score and Gemini generates a personalized recommendation.
      </p>

      {analysis && (
        <div className="ai-rq-analysis">

          <div className="ai-rq-analysis__score-row">
            <span className="ai-rq-analysis__label">Global risk score</span>
            <div className="ai-rq-score-wrap">
              <div className="ai-rq-score-bar-bg">
                <div className="ai-rq-score-bar-fill"
                  style={{ width: `${analysis.globalScore}%`, background: scoreColor(analysis.globalScore) }}/>
              </div>
              <span className="ai-rq-score-num" style={{ color: scoreColor(analysis.globalScore) }}>
                {analysis.globalScore}/100
              </span>
            </div>
          </div>

          <div className="ai-rq-analysis__levels">
            {NIVEAUX.map(n => {
              const count = analysis.risksByLevel?.[n] || 0
              return count > 0 ? (
                <div key={n} className={`ai-rq-level-badge rq-niveau rq-niveau--${niveauClass(n)}`}>
                  {count} {NIVEAU_LABEL[n] || n}
                </div>
              ) : null
            })}
          </div>

          {analysis.topRisks?.length > 0 && (
            <div className="ai-rq-analysis__top">
              <p className="ai-rq-analysis__section-title">Priority risks to monitor</p>
              {analysis.topRisks.map((r, i) => (
                <div key={i} className="ai-rq-analysis__top-item">
                  <span className={`rq-niveau rq-niveau--${niveauClass(r.niveauRisque)}`}>
                    {NIVEAU_LABEL[r.niveauRisque] || r.niveauRisque}
                  </span>
                  <span className="ai-rq-analysis__top-desc">{r.description}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ai-rq-analysis__rec">
            {analysis.recommendation}
          </div>

          <div className="ai-rq-analysis__source">
            Source: {analysis.source === 'ml+gemini' ? '🤖 ML + Gemini' : '📊 ML only'}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────
export default function AiRisquePanel({ projetId, projetNom, onRisquesChanged, addToast }) {
  const [open,           setOpen]           = useState(false)
  const [tab,            setTab]            = useState('suggest')
  const [risks,          setRisks]          = useState([])
  const [suggesting,     setSuggesting]     = useState(false)
  const [processingKeys, setProcessingKeys] = useState(new Set())
  const [editingRisk,    setEditingRisk]    = useState(null)
  const [pendingCount,   setPendingCount]   = useState(0)

  useEffect(() => {
    setRisks([])
    setPendingCount(0)
  }, [projetId])

  if (!projetId) return null

  // ── Suggest ───────────────────────────────────────────────────
  const handleSuggest = async () => {
    setSuggesting(true)
    try {
      const res  = await apiFetch(`/projets/${projetId}/ai/risques/suggest`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || 'Suggestion error')
      const generated = data.risks || []
      setRisks(generated)
      setPendingCount(generated.length)
      addToast(`${generated.length} risk${generated.length !== 1 ? 's' : ''} suggested by AI — review before saving`, 'success')
    } catch (e) {
      addToast(e.message || 'AI suggestion error', 'error')
    } finally {
      setSuggesting(false)
    }
  }

  const setProcessing = (desc, val) =>
    setProcessingKeys(s => {
      const n = new Set(s)
      val ? n.add(desc) : n.delete(desc)
      return n
    })

  // ── Review one risk ───────────────────────────────────────────
  const reviewOne = async (risk, action, overrides = {}) => {
    const key = risk.description
    setProcessing(key, true)
    try {
      const payload = { action, projetId, ...risk, ...overrides }
      const res  = await apiFetch(`/ai/risques/review`, {
        method: 'PATCH',
        body:   JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error')

      setRisks(rs => rs.filter(r => r.description !== risk.description))
      setPendingCount(c => Math.max(0, c - 1))

      const msgs = {
        ACCEPT: 'Risk accepted and added to project ✓',
        REFUSE: 'Risk refused',
        CHANGE: 'Risk edited and accepted ✓',
      }
      addToast(msgs[action] || 'Done', 'success')

      if (action === 'ACCEPT' || action === 'CHANGE') {
        onRisquesChanged?.()
      }
    } catch (e) {
      addToast(e.message || 'Error', 'error')
    } finally {
      setProcessing(key, false)
    }
  }

  const handleAccept   = risk => reviewOne(risk, 'ACCEPT')
  const handleRefuse   = risk => reviewOne(risk, 'REFUSE')
  const handleSaveEdit = form => {
    reviewOne(editingRisk, 'CHANGE', form)
    setEditingRisk(null)
  }

  // ── Bulk review ───────────────────────────────────────────────
  const handleBulk = async action => {
    const label = action === 'ACCEPT' ? 'accept' : 'refuse'
    if (!window.confirm(`Are you sure you want to ${label} all ${risks.length} AI risks?`)) return
    try {
      const res  = await apiFetch(`/projets/${projetId}/ai/risques/review-all`, {
        method: 'POST',
        body:   JSON.stringify({ action, risks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRisks([])
      setPendingCount(0)
      addToast(data.message || 'Done', 'success')
      if (action === 'ACCEPT') onRisquesChanged?.()
    } catch (e) {
      addToast(e.message || 'Bulk action failed', 'error')
    }
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        className={`btn ai-rq-trigger${pendingCount > 0 ? ' ai-rq-trigger--has-pending' : ''}`}
        onClick={() => setOpen(true)}
        title="AI Suggestions & Risk Analysis"
        disabled={!projetId}
      >
        ⚠ AI Risks
        {pendingCount > 0 && (
          <span className="ai-rq-badge">{pendingCount}</span>
        )}
      </button>

      {/* ── Slide-in panel ── */}
      {open && ReactDOM.createPortal(
        <div className="ai-rq-panel-overlay"
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="ai-rq-panel">

            {/* Header */}
            <div className="ai-rq-panel__header">
              <div className="ai-rq-panel__header-left">
                <div className="ai-rq-panel__icon">⚠</div>
                <div>
                  <h2 className="ai-rq-panel__title">AI Risk Analysis</h2>
                  <p className="ai-rq-panel__subtitle">
                    {projetNom || `Project #${projetId}`}
                  </p>
                </div>
              </div>
              <button className="rq-modal__close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="ai-rq-tabs">
              <button
                className={`ai-rq-tab${tab === 'suggest' ? ' ai-rq-tab--active' : ''}`}
                onClick={() => setTab('suggest')}
              >
                ◈ Suggest risks
                {pendingCount > 0 && (
                  <span className="ai-rq-badge ai-rq-badge--sm">{pendingCount}</span>
                )}
              </button>
              <button
                className={`ai-rq-tab${tab === 'analyze' ? ' ai-rq-tab--active' : ''}`}
                onClick={() => setTab('analyze')}
              >
                ◎ Analyze
              </button>
            </div>

            {/* Body */}
            <div className="ai-rq-panel__body">

              {/* ── SUGGEST TAB ── */}
              {tab === 'suggest' && (
                <>
                  <div className="ai-rq-generate-row">
                    <button
                      className={`btn btn--primary ai-rq-suggest-btn${suggesting ? ' ai-rq-suggest-btn--loading' : ''}`}
                      onClick={handleSuggest}
                      disabled={suggesting}
                    >
                      {suggesting
                        ? <><span className="ai-rq-spinner"/> Generating...</>
                        : <>⚠ Suggest risks with AI</>
                      }
                    </button>
                    <p className="ai-rq-hint">
                      Gemini analyses your project and suggests risks with mitigation plans.
                      Only <strong>accepted</strong> risks are saved.
                    </p>
                  </div>

                  {/* Bulk bar */}
                  {risks.length > 0 && (
                    <div className="ai-rq-bulk-bar">
                      <span className="ai-rq-bulk-bar__count">
                        {risks.length} risk{risks.length > 1 ? 's' : ''} awaiting review
                      </span>
                      <div className="ai-rq-bulk-bar__actions">
                        <button className="btn ai-rq-btn ai-rq-btn--refuse-sm"
                          onClick={() => handleBulk('REFUSE')}>
                          ✕ Refuse all
                        </button>
                        <button className="btn ai-rq-btn ai-rq-btn--accept-sm"
                          onClick={() => handleBulk('ACCEPT')}>
                          ✓ Accept all
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cards */}
                  {risks.length === 0 ? (
                    <div className="rq-empty ai-rq-empty">
                      <div className="ai-rq-empty__icon">⚠</div>
                      <p>No suggestions pending.</p>
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Click "Suggest risks with AI" to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="ai-rq-cards">
                      {risks.map((r, idx) => (
                        <AiRiskCard
                          key={`${r.description}-${idx}`}
                          risk={r}
                          isProcessing={processingKeys.has(r.description)}
                          onAccept={handleAccept}
                          onRefuse={handleRefuse}
                          onEdit={risk => setEditingRisk(risk)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── ANALYZE TAB ── */}
              {tab === 'analyze' && (
                <AnalyzeTab projetId={projetId} addToast={addToast}/>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit modal */}
      {editingRisk && (
        <EditModal
          risk={editingRisk}
          onSave={handleSaveEdit}
          onClose={() => setEditingRisk(null)}
        />
      )}
    </>
  )
}
