// DashboardPage.jsx — Animated UI v2 (matches clinisys_ui_proposal exactly)
import { useState, useEffect, useCallback } from 'react'
import './DashboardPage.css'
import { getToken } from '../../services/tokenService'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const get   = async (path) => {
  const res  = await fetch(`${API}${path}`, { headers: authH() })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.content || data.data || [])
}

const TASK_COLORS   = { 'New':'#6366f1','In progress':'#f59e0b','Done':'#10b981','Blocked':'#ef4444' }
const RISK_COLORS   = { BAS:'#10b981', MODERE:'#f59e0b', HAUT:'#f97316', EXTREME:'#ef4444' }
const STATUS_COLORS = ['#C1622A','#10b981','#f59e0b','#ef4444','#64748b','#a855f7']

// ── Donut SVG chart ───────────────────────────────────────────────
function Donut({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div className="db-empty-chart">No data</div>
  const r = size * 0.36, cx = size / 2, cy = size / 2
  let angle = -90
  const segments = data.filter(d => d.value > 0).map(d => {
    const deg  = (d.value / total) * 360
    const rad  = angle * Math.PI / 180
    const rad2 = (angle + deg) * Math.PI / 180
    const large = deg > 180 ? 1 : 0
    const x1 = cx + r * Math.cos(rad), y1 = cy + r * Math.sin(rad)
    const x2 = cx + r * Math.cos(rad2), y2 = cy + r * Math.sin(rad2)
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angle += deg
    return { ...d, path }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      {segments.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9"><title>{s.label}: {s.value}</title></path>)}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white"/>
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size*0.17} fontWeight="800" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + size*0.13} textAnchor="middle" fontSize={size*0.1} fill="#94a3b8">total</text>
    </svg>
  )
}

function Legend({ data }) {
  return (
    <div className="db-legend">
      {data.filter(d => d.value > 0).map((d, i) => (
        <div key={i} className="db-legend-item">
          <span className="db-legend-dot" style={{ background: d.color }}/>
          <span className="db-legend-label">{d.label}</span>
          <span className="db-legend-val">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [state,   setState]   = useState('loading')
  const [errMsg,  setErrMsg]  = useState('')
  const [projets, setProjets] = useState([])
  const [tasks,   setTasks]   = useState([])
  const [risks,   setRisks]   = useState([])
  const [updated, setUpdated] = useState(null)

  const load = useCallback(async () => {
    setState('loading'); setErrMsg('')
    try {
      const projetList = await get('/projets')
      setProjets(projetList)
      const allTasks = [], allRisks = []
      for (const p of projetList) {
        try { const t = await get(`/projets/${p.id}/taches`).catch(() => get(`/taches?projetId=${p.id}`)); t.forEach(tk => allTasks.push({ ...tk, projetId: p.id, projetNom: p.nom })) } catch {}
        try { const r = await get(`/projets/${p.id}/risques`).catch(() => get(`/risques?projetId=${p.id}`)); r.forEach(rk => allRisks.push({ ...rk, projetId: p.id, projetNom: p.nom })) } catch {}
      }
      setTasks(allTasks); setRisks(allRisks)
      setState('ok'); setUpdated(new Date())
    } catch (e) { setErrMsg(e.message); setState('error') }
  }, [])

  useEffect(() => { load() }, [load])

  const realTasks = tasks.filter(t => t.statut !== 'AI_WAITING')
  const realRisks = risks.filter(r => r.statut !== 'AI_PENDING')

  const TASK_ENTRIES = [
    { bv:'Nouvelle',   label:'New',         color:'#6366f1' },
    { bv:'En cours',   label:'In progress', color:'#f59e0b' },
    { bv:'Terminée',   label:'Done',        color:'#10b981' },
    { bv:'Bloquée',    label:'Blocked',     color:'#ef4444' },
    { bv:'Planifiée',  label:'Planned',     color:'#0369a1' },
    { bv:'En attente', label:'On Hold',     color:'#71717a' },
    { bv:'En retard',  label:'Late',        color:'#dc2626' },
    { bv:'Annulée',    label:'Cancelled',   color:'#94a3b8' },
  ]
  const taskData = TASK_ENTRIES.map(({ bv, label, color }) => ({
    label, color, value: realTasks.filter(t => t.statut === bv).length
  }))
  const riskData = [
    { key:'BAS',     label:'Low',      color:'#10b981' },
    { key:'MODERE',  label:'Moderate', color:'#f59e0b' },
    { key:'HAUT',    label:'High',     color:'#f97316' },
    { key:'EXTREME', label:'Extreme',  color:'#ef4444' },
  ].map(({ key, label, color }) => ({
    label, color, value: realRisks.filter(r => r.niveauRisque === key).length
  }))
  const projStatuts = [...new Set(projets.map(p => p.statutLibelle || p.statut?.nom || p.statut || 'Unknown'))]
  const projData    = projStatuts.map((s, i) => ({
    label: s, value: projets.filter(p => (p.statutLibelle || p.statut?.nom || p.statut) === s).length, color: STATUS_COLORS[i % STATUS_COLORS.length]
  }))

  const totalTasks   = realTasks.length
  const doneTasks    = realTasks.filter(t => t.statut === 'Terminée').length
  const globalPct    = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0
  const openRisks    = realRisks.filter(r => ['OUVERT','EN_SUIVI'].includes(r.statut)).length
  const extremeRisks = realRisks.filter(r => r.niveauRisque === 'EXTREME').length
  const hautRisks    = realRisks.filter(r => r.niveauRisque === 'HAUT').length
  const aiPending    = tasks.filter(t => t.statut === 'AI_WAITING').length
  const topRisks     = realRisks.filter(r => ['EXTREME','HAUT'].includes(r.niveauRisque)).slice(0, 5)

  const activeProjets = projets.filter(p => {
    const s = (p.statut?.nom || p.statut || '').toLowerCase()
    return s.includes('cours') || s.includes('actif') || s.includes('progress')
  }).length

  if (state === 'loading') return (
    <div className="db-main">
      <div className="db-loading"><div className="db-spinner"/><p style={{color:'#94a3b8',marginTop:14}}>Loading dashboard…</p></div>
    </div>
  )
  if (state === 'error') return (
    <div className="db-main">
      <div className="db-loading">
        <div style={{fontSize:'2.5rem'}}>⚠</div>
        <p style={{color:'#ef4444',margin:'10px 0',fontWeight:600}}>Loading error</p>
        <p style={{color:'#94a3b8',fontSize:'.85rem',marginBottom:16}}>{errMsg}</p>
        <button className="btn btn--primary" onClick={load}>↻ Retry</button>
      </div>
    </div>
  )

  return (
    <div className="db-main">

      {/* ── Page header ── */}
      <div className="cs-page-hdr">
        <div>
          <div className="cs-page-title">Dashboard</div>
          <div className="cs-page-sub" style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#16A34A',display:'inline-block',animation:'dotPulse 2s infinite'}}/>
            Real-time view · {projets.length} project{projets.length!==1?'s':''}
            {updated && <span style={{color:'#cbd5e1',marginLeft:8}}>· {updated.toLocaleTimeString()}</span>}
          </div>
        </div>
        <div className="cs-hdr-actions">
          <button className="btn btn--secondary" onClick={load}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4v5h5M20 10a10 10 0 01-17 7"/></svg>
            Refresh
          </button>

        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="db-kpi-grid">
        <div className="db-kpi">
          <div className="db-kpi-icon">📁</div>
          <div>
            <div className="db-kpi-value">{projets.length}</div>
            <div className="db-kpi-label">Total Projects</div>
            <div className="db-kpi-sub">{activeProjets} in progress · {projets.length - activeProjets} planned</div>
          </div>
        </div>
        <div className="db-kpi" style={{borderLeftColor:'var(--c2)'}}>
          <div className="db-kpi-icon" style={{background:'var(--c2l)'}}>✅</div>
          <div>
            <div className="db-kpi-value">{doneTasks}/{totalTasks}</div>
            <div className="db-kpi-label">Tasks Completed</div>
            <div className="db-kpi-sub">{globalPct}% overall progress</div>
          </div>
        </div>
        <div className="db-kpi" style={{borderLeftColor:'var(--green)'}}>
          <div className="db-kpi-icon" style={{background:'var(--greenl)'}}>⚠️</div>
          <div>
            <div className="db-kpi-value">{openRisks}</div>
            <div className="db-kpi-label">Open Risks</div>
            <div className="db-kpi-sub">{extremeRisks} extreme · {hautRisks} high</div>
          </div>
        </div>
        <div className="db-kpi" style={{borderLeftColor:'var(--purple)'}}>
          <div className="db-kpi-icon" style={{background:'var(--purplel)'}}>🤖</div>
          <div>
            <div className="db-kpi-value">{aiPending}</div>
            <div className="db-kpi-label">AI Pending</div>
            <div className="db-kpi-sub">Tasks + risks to review</div>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="db-grid-3">
        <div className="db-card">
          <div className="db-card-hdr">
            <div className="db-card-title">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg>
              Tasks by Status
            </div>
          </div>
          <div className="db-chart-row"><Donut data={taskData} size={110}/><Legend data={taskData}/></div>
        </div>
        <div className="db-card">
          <div className="db-card-hdr">
            <div className="db-card-title">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 8v4M10 14.5h.01M8.5 3.5L2 16h16L11.5 3.5a1.73 1.73 0 00-3 0z"/></svg>
              Risks by Level
            </div>
          </div>
          <div className="db-chart-row"><Donut data={riskData} size={110}/><Legend data={riskData}/></div>
        </div>
        <div className="db-card">
          <div className="db-card-hdr">
            <div className="db-card-title">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>
              Projects by Status
            </div>
          </div>
          <div className="db-chart-row"><Donut data={projData} size={110}/><Legend data={projData}/></div>
        </div>
      </div>

      {/* ── Bottom 2-col ── */}
      <div className="db-grid">

        {/* Project health */}
        <div className="db-card">
          <div className="db-card-hdr">
            <div className="db-card-title">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><polyline points="3 12 7 8 11 12 17 6"/></svg>
              Project Health
            </div>
            <button className="db-card-link">View all →</button>
          </div>
          {projets.length === 0
            ? <div className="db-chart-row" style={{justifyContent:'center',padding:24,color:'#94a3b8'}}>No projects</div>
            : projets.map(p => {
                const pt   = realTasks.filter(t => t.projetId === p.id)
                const pr   = realRisks.filter(r => r.projetId === p.id)
                const done = pt.filter(t => t.statut === 'Terminée').length
                const pct  = pt.length > 0 ? Math.round(done / pt.length * 100) : 0
                const ext  = pr.filter(r => r.niveauRisque === 'EXTREME').length
                const haut = pr.filter(r => r.niveauRisque === 'HAUT').length
                const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--c2)' : 'var(--c)'
                const [hcls, hlbl] = ext > 0 ? ['bad','⚠ Extreme risk'] : haut > 1 ? ['warn','🔶 High risk'] : pct >= 80 ? ['ok','✅ On track'] : ['warn','In progress']
                return (
                  <div key={p.id} className="db-bar-row">
                    <div className="db-bar-name">{p.nom}</div>
                    <div className="db-bar-meta">
                      <div className="db-bar-bg"><div className="db-bar-fill" style={{width:`${pct}%`,background:color}}/></div>
                      <span className="db-bar-pct" style={{color}}>{pct}%</span>
                    </div>
                    <div className="db-bar-chips">
                      <span className="db-chip">{done}/{pt.length} tasks</span>
                      <span className="db-chip">{pr.length} risks</span>
                      <span className={`db-health db-health--${hcls}`}>{hlbl}</span>
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* Top risks */}
        <div className="db-card">
          <div className="db-card-hdr">
            <div className="db-card-title">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10 8v4M10 14.5h.01M8.5 3.5L2 16h16L11.5 3.5a1.73 1.73 0 00-3 0z"/></svg>
              Priority Risks
            </div>
            <button className="db-card-link">View all →</button>
          </div>
          {topRisks.length === 0
            ? <div style={{padding:'24px 20px',color:'#94a3b8',fontSize:13}}>🎉 No high or extreme risks!</div>
            : topRisks.map((r, i) => {
                const cls = {BAS:'db-rb-mod',MODERE:'db-rb-mod',HAUT:'db-rb-haut',EXTREME:'db-rb-ext'}[r.niveauRisque]||'db-rb-mod'
                return (
                  <div key={i} className="db-risk-row">
                    <span className={`db-risk-badge ${cls}`}>{r.niveauRisque}</span>
                    <div>
                      <div className="db-risk-desc">{r.description}</div>
                      <div className="db-risk-proj">{r.projetNom}</div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* ── Task breakdown table ── */}
      {projets.length > 0 && (
        <div className="db-card">
          <div className="db-card-hdr">
            <div className="db-card-title">Task Breakdown per Project</div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'#F9FAFB',borderBottom:'1.5px solid rgba(0,0,0,.06)'}}>
                {['Project','New','In progress','Done','Blocked','Total'].map(h => (
                  <th key={h} style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',color:'#475569'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projets.map(p => {
                const pt = realTasks.filter(t => t.projetId === p.id)
                return (
                  <tr key={p.id} style={{borderBottom:'1px solid rgba(0,0,0,.04)',transition:'background .12s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--cl)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{padding:'12px 16px',fontWeight:600,color:'var(--t1)'}}>{p.nom}</td>
                    <td style={{padding:'12px 16px',color:'var(--t2)'}}>{pt.filter(t=>t.statut==='Nouvelle').length}</td>
                    <td style={{padding:'12px 16px',color:'var(--amber)',fontWeight:600}}>{pt.filter(t=>t.statut==='In progress').length}</td>
                    <td style={{padding:'12px 16px',color:'var(--green)',fontWeight:600}}>{pt.filter(t=>t.statut==='Terminée').length}</td>
                    <td style={{padding:'12px 16px',color:'var(--red)',fontWeight:600}}>{pt.filter(t=>t.statut==='Bloquée').length}</td>
                    <td style={{padding:'12px 16px',fontWeight:700,color:'var(--t1)'}}>{pt.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
