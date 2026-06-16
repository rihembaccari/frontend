import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import './ChangementsPage.css'
import { getToken, getRole } from '../../services/tokenService'
import { useLanguage } from '../../i18n/LanguageContext'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const authH = () => ({ Authorization: `Bearer ${getToken()}` })
const jsonH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

// ── Constants ──────────────────────────────────────────────────
const STATUTS   = ['EN_ATTENTE','EN_ANALYSE','APPROUVEE','REFUSEE','EN_COURS','LIVREE','FERMEE']
const URGENCES  = ['FAIBLE','MOYENNE','ELEVEE','CRITIQUE']
const TYPES     = ['CORRECTIF','EVOLUTIF','PREVENTIF','URGENT']
const IMPACTS   = ['FAIBLE','MOYEN','ELEVE','CRITIQUE']
const MODULES   = ['RH','Finance','Logistique','Ventes','Achats','Production',
                   'CRM','Qualité','Maintenance','BI & Reporting','Autre']

const STATUT_STYLE = {
  EN_ATTENTE:  { bg:'#FEF9C3', color:'#854D0E', label:'Pending'        },
  EN_ANALYSE:  { bg:'#DBEAFE', color:'#1E40AF', label:'Under Analysis' },
  APPROUVEE:   { bg:'#DCFCE7', color:'#166534', label:'Approved'       },
  REFUSEE:     { bg:'#FEE2E2', color:'#991B1B', label:'Rejected'       },
  EN_COURS:    { bg:'#FFEDD5', color:'#C2410C', label:'In Progress'    },
  LIVREE:      { bg:'#D1FAE5', color:'#065F46', label:'Delivered'      },
  FERMEE:      { bg:'#F1F5F9', color:'#64748B', label:'Closed'         },
}
const URGENCE_STYLE = {
  FAIBLE:   { bg:'#F0FDF4', color:'#15803D' },
  MOYENNE:  { bg:'#FEFCE8', color:'#854D0E' },
  ELEVEE:   { bg:'#FFF7ED', color:'#C2410C' },
  CRITIQUE: { bg:'#FEF2F2', color:'#DC2626' },
}

const EMPTY_FORM = () => ({
  titre:'', description:'', justificationMetier:'', impactEstime:'',
  typeChangement:'', urgence:'MOYENNE', impactChangement:'MOYEN', moduleErp:'',
  demandeurId:'', chefProjetAssigneId:'',
  effortEstime:'', dateLivraisonPrevue:'',
    projetId:'',
})
const EMPTY_EVAL = () => ({
  commentaire:'', effortEstime:'', dateLivraisonPrevue:'',
  approbateurId:'',
})

// ── Role helpers ───────────────────────────────────────────────
// hook added to main component
function useRoles() {
  const role = getRole()
  return {
    role,
    isAdmin:      role === 'ADMIN',
    isCCB:        role === 'ADMIN' || role === 'CCB_MANAGER',
    isChefProjet: role === 'ADMIN' || role === 'CHEF_PROJET',
    // All roles can submit
    canCreate:    true,
    canViewAll:   role === 'ADMIN' || role === 'CHEF_PROJET' || role === 'CCB_MANAGER',
  }
}

// ── Toast ──────────────────────────────────────────────────────
function ToastStack({ toasts, remove }) {
  return (
    <div className="ch-toasts">
      {toasts.map(t=>(
        <div key={t.id} className={`ch-toast ch-toast--${t.type}`}>
          <span>{t.type==='success'?'✓':t.type==='warn'?'⚠':'✕'}</span>
          <span className="ch-toast__msg">{t.message}</span>
          <button onClick={()=>remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Badges ─────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUT_STYLE[statut] || { bg:'#F1F5F9', color:'#64748B', label: statut }
  return <span className="ch-badge" style={{ background:s.bg, color:s.color }}>{s.label}</span>
}
function UrgenceBadge({ urgence }) {
  const u = URGENCE_STYLE[urgence] || { bg:'#F1F5F9', color:'#64748B' }
  return <span className="ch-badge" style={{ background:u.bg, color:u.color }}>{urgence}</span>
}

// ── Role banner shown at top ───────────────────────────────────
function RoleBanner({ role }) {
  const cfg = {
    ADMIN:       { label:'Administrator',           color:'#1E40AF', bg:'#DBEAFE', icon:'🛡' },
    CCB_MANAGER: { label:'CCB Manager',             color:'#166534', bg:'#DCFCE7', icon:'✅' },
    CHEF_PROJET: { label:'Project Manager',         color:'#854D0E', bg:'#FEF9C3', icon:'📋' },
  }
  const c = cfg[role] || { label: role, color:'#64748B', bg:'#F1F5F9', icon:'👤' }
  return (
    <div className="ch-role-banner" style={{ background:c.bg, color:c.color }}>
      <span>{c.icon} Logged in as: <strong>{c.label}</strong></span>
      <span className="ch-role-perms">{getRolePerms(role)}</span>
    </div>
  )
}

function getRolePerms(role) {
  switch(role) {
    case 'ADMIN':       return 'Full access — can do everything'
    case 'CCB_MANAGER': return 'Can analyze, approve and reject requests'
    case 'CHEF_PROJET': return 'Can create, track and manage the post-approval lifecycle'
    default:            return 'Can submit requests'
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ChangementsPage() {
  const { t } = useLanguage()
  const { role, isAdmin, isCCB, isChefProjet, canViewAll } = useRoles()

  const [projets,    setProjets]    = useState([])
  const [users,      setUsers]      = useState([])
  const [demandes,   setDemandes]   = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading,    setLoading]    = useState(false)

  // Filters
  const [filtStatut,  setFiltStatut]  = useState('')
  const [filtUrgence, setFiltUrgence] = useState('')
  const [filtModule,  setFiltModule]  = useState('')
  const [filtSearch,  setFiltSearch]  = useState('')

  // Modal
  const [modalOpen,  setModalOpen]  = useState(false)
  const [viewMode,   setViewMode]   = useState('create')
  const [current,    setCurrent]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM())
  const [evalForm,   setEvalForm]   = useState(EMPTY_EVAL())
  const [newFiles,   setNewFiles]   = useState([])
  const [saving,     setSaving]     = useState(false)

  // Comment form (in view modal for all roles)
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  const [confirmCfg, setConfirmCfg] = useState(null)
  const [toasts,     setToasts]     = useState([])
  const fileRef = useRef(null)
  const pendingAction = useRef(null)

  const sf  = (k,v) => setForm(f=>({...f,[k]:v}))
  const sef = (k,v) => setEvalForm(f=>({...f,[k]:v}))

  const addToast = useCallback((message, type='success')=>{
    const id = Date.now()+Math.random()
    setToasts(ts=>[...ts,{id,message,type}])
    setTimeout(()=>setToasts(ts=>ts.filter(x=>x.id!==id)), 4500)
  },[])
  const removeToast = id => setToasts(ts=>ts.filter(x=>x.id!==id))

  // ── Load base data ─────────────────────────────────────────
  useEffect(()=>{
    const raw = localStorage.getItem('gp_activeProjetId')
    const parsed = parseInt(raw, 10)
    if (!raw || isNaN(parsed) || parsed <= 0) localStorage.removeItem('gp_activeProjetId')

    fetch(`${API}/projets`,{headers:authH()})
      .then(r=>r.ok?r.json():[])
      .then(data=>{
        setProjets(data)
        if(data.length===0) return
        const raw2 = localStorage.getItem('gp_activeProjetId')
        const num  = parseInt(raw2, 10)
        const validIds = data.map(p=>p.id)
        if(!isNaN(num) && num>0 && validIds.includes(num)) setSelectedId(num)
        else { setSelectedId(data[0].id); localStorage.setItem('gp_activeProjetId', String(data[0].id)) }
      }).catch(()=>{})

    fetch(`${API}/utilisateurs`,{headers:authH()})
      .then(r=>r.ok?r.json():[]).then(setUsers).catch(()=>{})
  },[])

  // ── Load change requests ───────────────────────────────────
  const load = useCallback(async(pid)=>{
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if(filtStatut)  p.set('statut',   filtStatut)
      if(filtUrgence) p.set('urgence',  filtUrgence)
      if(filtModule)  p.set('moduleErp',filtModule)

      let url
      if(role === 'CCB_MANAGER' || role === 'ADMIN') {
        // CCB + Admin: all change requests across all projects
        url = `${API}/changements?${p}`
      } else {
        // Project Manager: project-scoped
        const numPid = Number(pid)
        if(!numPid||isNaN(numPid)){ setLoading(false); return }
        url = `${API}/projets/${numPid}/changements?${p}`
      }

      const r = await fetch(url,{headers:authH()})
      if(r.ok){ const j=await r.json(); setDemandes(Array.isArray(j)?j:[]) }
      else setDemandes([])
    } catch{ setDemandes([]) }
    finally{ setLoading(false) }
  },[filtStatut,filtUrgence,filtModule,role])

  useEffect(()=>{
    if(role==='CCB_MANAGER'||role==='ADMIN') load(null)
    else load(selectedId)
  },[selectedId,filtStatut,filtUrgence,filtModule,load,role])

  // ── Filtered list ──────────────────────────────────────────
  const filtered = demandes.filter(d=>
    !filtSearch||d.titre?.toLowerCase().includes(filtSearch.toLowerCase())||
    d.idChangementString?.toLowerCase().includes(filtSearch.toLowerCase())
  )

  // ── Stats bar ──────────────────────────────────────────────
  const stats = STATUTS.reduce((a,s)=>({...a,[s]:demandes.filter(d=>d.statut===s).length}),{})

  // ── Open modals ────────────────────────────────────────────
  const openAdd = () => {
    const _f = EMPTY_FORM(); if (selectedId) _f.projetId = String(selectedId)
    setForm(_f); setNewFiles([]); setEvalForm(EMPTY_EVAL())
    setViewMode('create'); setCurrent(null); setNewComment(''); setModalOpen(true)
  }

  const openView = async(d)=>{
    try {
      const r = await fetch(`${API}/changements/${d.id}`,{headers:authH()})
      if(!r.ok) throw new Error()
      const full = await r.json()
      setCurrent(full)
      setForm({
        titre:               full.titre||'',
        description:         full.description||'',
        justificationMetier: full.justificationMetier||'',
        impactEstime:        full.impactEstime||'',
        typeChangement:      full.typeChangement||'',
        urgence:             full.urgence||'MOYENNE',
        impactChangement:    full.impactChangement||'MOYEN',
        moduleErp:           full.moduleErp||'',
        demandeurId:         full.demandeurId?String(full.demandeurId):'',
        chefProjetAssigneId: full.chefProjetAssigneId?String(full.chefProjetAssigneId):'',
        effortEstime:        full.effortEstime||'',
        dateLivraisonPrevue: full.dateLivraisonPrevue||'',
      })
      setEvalForm({
        commentaire:'', effortEstime:full.effortEstime||'',
        dateLivraisonPrevue:full.dateLivraisonPrevue||'',
        approbateurId:'',
      })
      setNewComment(''); setNewFiles([])
      setViewMode('view'); setModalOpen(true)
    } catch{ addToast('Error loading request','error') }
  }

  // ── Create ─────────────────────────────────────────────────
  const handleCreate = async()=>{
    if(!form.titre.trim()){ addToast('Title is required','warn'); return }
    const pid = Number(form.projetId) || Number(selectedId)
    if(!pid||isNaN(pid)){ addToast('Select a valid project','warn'); return }
    setSaving(true)
    try {
      const r = await fetch(`${API}/projets/${pid}/changements`,{
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${getToken()}`},
        body:JSON.stringify({
          titre:form.titre, description:form.description||null,
          justificationMetier:form.justificationMetier||null,
          impactEstime:form.impactEstime||null,
          typeChangement:form.typeChangement||null,
          urgence:form.urgence||null,
          impactChangement:form.impactChangement||null,
          moduleErp:form.moduleErp||null,
          effortEstime:form.effortEstime||null,
          dateLivraisonPrevue:form.dateLivraisonPrevue||null,
          demandeurId:form.demandeurId?Number(form.demandeurId):null,
          chefProjetAssigneId:form.chefProjetAssigneId?Number(form.chefProjetAssigneId):null,
        })
      })
      if(!r.ok) throw new Error(await r.text())
      addToast('Request created successfully ✓')
      setModalOpen(false); load(pid)
    } catch(e){ addToast(e.message||'Creation error','error') }
    finally{ setSaving(false) }
  }

  // ── CCB: move to EN_ANALYSE ────────────────────────────────
  const handleAnalyse = async()=>{
    setSaving(true)
    try {
      const r = await fetch(`${API}/changements/${current.id}/statut`,{
        method:'PUT', headers:jsonH(),
        body:JSON.stringify({statut:'EN_ANALYSE', commentaire:'Request taken up for analysis.'})
      })
      if(!r.ok) throw new Error(await r.text())
      addToast('Request moved to analysis')
      setModalOpen(false); load(selectedId)
    } catch(e){ addToast(e.message||'Error','error') }
    finally{ setSaving(false) }
  }

  // ── CCB: approve / reject ──────────────────────────────────
  const handleEvaluate = async(statut)=>{
    if(statut==='REFUSEE'&&!evalForm.commentaire.trim()){
      addToast('A comment is required to reject','warn'); return
    }
    setSaving(true)
    try {
      const r = await fetch(`${API}/changements/${current.id}/evaluation`,{
        method:'PUT', headers:jsonH(),
        body:JSON.stringify({
          statut,
          commentaire:evalForm.commentaire||null,
          effortEstime:evalForm.effortEstime||null,
          dateLivraisonPrevue:evalForm.dateLivraisonPrevue||null,
          approbateurId:evalForm.approbateurId?Number(evalForm.approbateurId):null,
        })
      })
      if(!r.ok) throw new Error(await r.text())
      addToast(statut==='APPROUVEE'?'Request approved ✓':'Request rejected')
      setModalOpen(false); load(selectedId)
    } catch(e){ addToast(e.message||'Evaluation error','error') }
    finally{ setSaving(false) }
  }

  // ── Project Manager: lifecycle ─────────────────────────────
  const updateStatut = async(id, statut)=>{
    try {
      const r = await fetch(`${API}/changements/${id}/statut`,{
        method:'PUT', headers:jsonH(),
        body:JSON.stringify({statut, commentaire:`Status updated: ${STATUT_STYLE[statut]?.label||statut}`})
      })
      if(!r.ok) throw new Error(await r.text())
      addToast(`Status: ${STATUT_STYLE[statut]?.label||statut}`)
      if(modalOpen){ const d=demandes.find(x=>x.id===id); if(d) openView(d) }
      load(selectedId)
    } catch(e){ addToast(e.message||'Error updating status','error') }
  }

  // ── Add comment (all roles) ────────────────────────────────
  const handleAddComment = async()=>{
    if(!newComment.trim()){ addToast('Enter a comment','warn'); return }
    setAddingComment(true)
    try {
      const r = await fetch(`${API}/changements/${current.id}/commentaires`,{
        method:'POST', headers:jsonH(),
        body:JSON.stringify({ contenu:newComment, auteurId:null })
      })
      if(!r.ok) throw new Error(await r.text())
      addToast('Comment added')
      setNewComment('')
      // Refresh current
      const r2 = await fetch(`${API}/changements/${current.id}`,{headers:authH()})
      if(r2.ok) setCurrent(await r2.json())
    } catch(e){ addToast(e.message||'Comment error','error') }
    finally{ setAddingComment(false) }
  }

  // ── Delete ─────────────────────────────────────────────────
  const askDelete = d => {
    pendingAction.current = d.id
    setConfirmCfg({ title:`Delete "${d.titre}"?`, body:'This action is irreversible.' })
  }
  const confirmDelete = async()=>{
    const id = pendingAction.current; setConfirmCfg(null)
    try {
      const r = await fetch(`${API}/changements/${id}`,{method:'DELETE',headers:authH()})
      if(!r.ok) throw new Error(await r.text())
      addToast('Request deleted'); load(selectedId)
    } catch(e){ addToast(e.message||'Deletion error','error') }
  }

  const userLabel = u => `${u.prenom||''} ${u.nom||''}`.trim()
  const selectedProjet = projets.find(p=>p.id===selectedId)

  // ── What can be done with current request ─────────────────
  const canAnalyse   = isCCB && current?.statut==='EN_ATTENTE'
  const canEvaluate  = isCCB && (current?.statut==='EN_ANALYSE')
  const canPlanify   = isChefProjet && (current?.statut==='APPROUVEE'||current?.statut==='EN_COURS')
  const canComment   = current && current.statut !== 'FERMEE'
  const isFermee     = current?.statut === 'FERMEE'

  return (
    <div className="ch-page">

      {/* ── Role banner ── */}
      <RoleBanner role={role}/>

      {/* ── Header ── */}
      <div className="ch-page-header">
        <div>
          <h2 className="ch-page-title">Change Management</h2>
          {selectedProjet && <p className="ch-page-sub">{selectedProjet.nom}</p>}
        </div>
        <button className="btn btn--primary" onClick={openAdd}>
          + New Request
        </button>
      </div>

      {/* ── Stats bar ── */}
      {demandes.length>0 && (
        <div className="ch-stats">
          {Object.entries(STATUT_STYLE).map(([s,st])=> stats[s]>0 && (
            <div key={s} className="ch-stat" style={{background:st.bg,color:st.color}}>
              <span className="ch-stat__count">{stats[s]}</span>
              <span className="ch-stat__label">{st.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="ch-filterbar">
        {/* Project selector — hidden for CCB (they see all projects) */}
        {role !== 'CCB_MANAGER' && (
          <div className="ch-filter-proj">
            <span>📅</span>
            <select className="ch-sel" value={selectedId||''} onChange={e=>{
              const id=Number(e.target.value)
              if(!isNaN(id)&&id>0){ setSelectedId(id); localStorage.setItem('gp_activeProjetId',String(id)) }
            }}>
              <option value="">-- Project --</option>
              {projets.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        )}
        <div className="ch-filter-search">
          <span>🔍</span>
          <input className="ch-search" placeholder="Search by title or ID..."
            value={filtSearch} onChange={e=>setFiltSearch(e.target.value)}/>
        </div>
        <select className="ch-sel" value={filtStatut} onChange={e=>setFiltStatut(e.target.value)}>
          <option value="">All statuses</option>
          {STATUTS.map(s=><option key={s} value={s}>{STATUT_STYLE[s]?.label||s}</option>)}
        </select>
        <select className="ch-sel" value={filtUrgence} onChange={e=>setFiltUrgence(e.target.value)}>
          <option value="">All urgencies</option>
          {URGENCES.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
        <select className="ch-sel" value={filtModule} onChange={e=>setFiltModule(e.target.value)}>
          <option value="">All modules</option>
          {MODULES.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <span className="ch-count">{filtered.length} request{filtered.length!==1?'s':''}</span>
      </div>

      {/* ── Table ── */}
      {loading ? <div className="ch-empty">Loading...</div>
       : (!selectedId && role !== 'CCB_MANAGER' && role !== 'ADMIN') ? <div className="ch-empty">Select a project.</div>
       : filtered.length===0 ? <div className="ch-empty">No change requests.</div>
       : (
        <div className="ch-table-wrap">
          <table className="ch-table">
            <thead>
              <tr>
                <th className="ch-th">ID</th>
                <th className="ch-th">Title</th>
                <th className="ch-th">Module</th>
                <th className="ch-th">Urgency</th>
                <th className="ch-th">Status</th>
                <th className="ch-th">Project</th>
                <th className="ch-th">Project</th>
                <th className="ch-th">Requester</th>
                <th className="ch-th">Date</th>
                <th className="ch-th ch-th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d=>(
                <tr key={d.id} className="ch-row">
                  <td className="ch-td">
                    <span className="ch-id">{d.idChangementString||`#${d.id}`}</span>
                  </td>
                  <td className="ch-td ch-td--titre" onClick={()=>openView(d)}>
                    {d.titre}
                    {d.commentaires?.length>0 &&
                      <span className="ch-comment-count" title={`${d.commentaires.length} comment(s)`}>
                        💬 {d.commentaires.length}
                      </span>}
                  </td>
                  <td className="ch-td ch-td--muted">{d.moduleErp||<span className="ch-na">—</span>}</td>
                  <td className="ch-td">{d.urgence?<UrgenceBadge urgence={d.urgence}/>:<span className="ch-na">—</span>}</td>
                  <td className="ch-td"><StatutBadge statut={d.statut}/></td>
                  <td className="ch-td ch-td--muted" style={{fontSize:'0.78rem',color:'#6366f1'}}>
                    {d.projetNom||<span className="ch-na">—</span>}
                  </td>
                  <td className="ch-td ch-td--muted" style={{fontSize:'0.78rem'}}>
                    {d.projetNom||<span className="ch-na">—</span>}
                  </td>
                  <td className="ch-td ch-td--muted">{d.demandeurNom||<span className="ch-na">—</span>}</td>
                  <td className="ch-td ch-td--date">{d.dateSoumission?d.dateSoumission.split('T')[0]:'—'}</td>
                  <td className="ch-td ch-td--actions">
                    {/* CCB: move to EN_ANALYSE */}
                    {isCCB && d.statut==='EN_ATTENTE' && (
                      <button className="ch-action-btn ch-action-btn--analyse"
                        title="Take up for analysis"
                        onClick={async()=>{
                          try {
                            const r = await fetch(`${API}/changements/${d.id}/statut`,{
                              method:'PUT',headers:jsonH(),
                              body:JSON.stringify({statut:'EN_ANALYSE',commentaire:'Taken up for analysis.'})
                            })
                            if(!r.ok) throw new Error(await r.text())
                            addToast('Under analysis'); load(selectedId)
                          } catch(e){ addToast(e.message||'Error','error') }
                        }}>🔍</button>
                    )}
                    {/* Project Manager: lifecycle buttons */}
                    {isChefProjet && d.statut==='APPROUVEE' && (
                      <button className="ch-action-btn ch-action-btn--start"
                        title="Start implementation"
                        onClick={()=>updateStatut(d.id,'EN_COURS')}>▶</button>
                    )}
                    {isChefProjet && d.statut==='EN_COURS' && (
                      <button className="ch-action-btn ch-action-btn--done"
                        title="Mark as delivered"
                        onClick={()=>updateStatut(d.id,'LIVREE')}>✓</button>
                    )}
                    {isChefProjet && d.statut==='LIVREE' && (
                      <button className="ch-action-btn ch-action-btn--close"
                        title="Close the request"
                        onClick={()=>updateStatut(d.id,'FERMEE')}>🔒</button>
                    )}
                    {/* View / Edit */}
                    <button className="ch-btn-action ch-btn-action--edit"
                      title="View / Evaluate" onClick={()=>openView(d)}>
                      <svg viewBox="0 0 20 20" fill="none"><path d="M2 14L14 2l4 4L6 18H2v-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {/* Delete — ADMIN only */}
                    {isAdmin && (
                      <button className="ch-btn-action ch-btn-action--delete"
                        title="Delete" onClick={()=>askDelete(d)}>
                        <svg viewBox="0 0 20 20" fill="none"><path d="M8 4h4M3 6h14M5 6l1 11h8L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ MODAL ══ */}
      {modalOpen && ReactDOM.createPortal(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModalOpen(false)}>
          <div className="ch-modal">
            <div className="ch-modal__header">
              <div>
                <h2 className="ch-modal__title">
                  {viewMode==='create' ? 'New change request'
                   : current?.idChangementString||`Request #${current?.id}`}
                </h2>
                {current && <StatutBadge statut={current.statut}/>}
              </div>
              <button className="ch-modal__close" onClick={()=>setModalOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="ch-modal__body">

              {/* ── Submission fields (editable only in create mode) ── */}
              <div className="ch-section-label">Request information</div>

              {/* Project selector — shown for all roles in create mode */}
              {viewMode === 'create' && (
                <div className="ch-field">
                  <label className="ch-label">Project <span className="ch-req">*</span></label>
                  <select className="ch-input ch-input--sel"
                    value={form.projetId || selectedId || ''}
                    onChange={e => { sf('projetId', e.target.value); const id=Number(e.target.value); if(id){ setSelectedId(id); localStorage.setItem('gp_activeProjetId',String(id)) } }}>
                    <option value="">— Select a project —</option>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                </div>
              )}

              <div className="ch-field">
                <label className="ch-label">Title <span className="ch-req">*</span></label>
                <input className={`ch-input${viewMode==='view'?' ch-readonly':''}`}
                  readOnly={viewMode==='view'} value={form.titre}
                  onChange={e=>sf('titre',e.target.value)} placeholder="Request title"/>
              </div>

              <div className="ch-row ch-row--3">
                <div className="ch-field">
                  <label className="ch-label">ERP Module</label>
                  {viewMode==='view'
                    ? <input className="ch-input ch-readonly" readOnly value={form.moduleErp||'—'}/>
                    : <select className="ch-input ch-input--sel" value={form.moduleErp} onChange={e=>sf('moduleErp',e.target.value)}>
                        <option value="">-- Select --</option>
                        {MODULES.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>}
                </div>
                <div className="ch-field">
                  <label className="ch-label">Urgency</label>
                  {viewMode==='view'
                    ? <input className="ch-input ch-readonly" readOnly value={form.urgence||'—'}/>
                    : <select className="ch-input ch-input--sel" value={form.urgence} onChange={e=>sf('urgence',e.target.value)}>
                        {URGENCES.map(u=><option key={u} value={u}>{u}</option>)}
                      </select>}
                </div>
                <div className="ch-field">
                  <label className="ch-label">Type</label>
                  {viewMode==='view'
                    ? <input className="ch-input ch-readonly" readOnly value={form.typeChangement||'—'}/>
                    : <select className="ch-input ch-input--sel" value={form.typeChangement} onChange={e=>sf('typeChangement',e.target.value)}>
                        <option value="">--</option>
                        {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>}
                </div>
              </div>

              <div className="ch-field">
                <label className="ch-label">Description</label>
                <textarea className={`ch-textarea${viewMode==='view'?' ch-readonly':''}`}
                  rows={3} readOnly={viewMode==='view'} value={form.description}
                  onChange={e=>sf('description',e.target.value)}
                  placeholder="Describe the requested change..."/>
              </div>

              <div className="ch-field">
                <label className="ch-label">Business justification</label>
                <textarea className={`ch-textarea${viewMode==='view'?' ch-readonly':''}`}
                  rows={2} readOnly={viewMode==='view'} value={form.justificationMetier}
                  onChange={e=>sf('justificationMetier',e.target.value)}
                  placeholder="Why is this change necessary?"/>
              </div>

              <div className="ch-row ch-row--2">
                <div className="ch-field">
                  <label className="ch-label">Requester</label>
                  {viewMode==='view'
                    ? <input className="ch-input ch-readonly" readOnly value={current?.demandeurNom||'—'}/>
                    : <select className="ch-input ch-input--sel" value={form.demandeurId} onChange={e=>sf('demandeurId',e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {users.map(u=><option key={u.id} value={u.id}>{userLabel(u)}</option>)}
                      </select>}
                </div>
                <div className="ch-field">
                  <label className="ch-label">Project manager</label>
                  {viewMode==='view'
                    ? <input className="ch-input ch-readonly" readOnly value={current?.chefProjetAssigneNom||'—'}/>
                    : <select className="ch-input ch-input--sel" value={form.chefProjetAssigneId} onChange={e=>sf('chefProjetAssigneId',e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {users.map(u=><option key={u.id} value={u.id}>{userLabel(u)}</option>)}
                      </select>}
                </div>
              </div>

              {/* Estimated effort & expected delivery — new request only */}
              {viewMode === 'create' && (
                <div className="ch-row ch-row--2">
                  <div className="ch-field">
                    <label className="ch-label">Estimated effort</label>
                    <input className="ch-input" value={form.effortEstime}
                      onChange={e=>sf('effortEstime',e.target.value)} placeholder="e.g. 5 days"/>
                  </div>
                  <div className="ch-field">
                    <label className="ch-label">Expected delivery date</label>
                    <input type="date" className="ch-input" value={form.dateLivraisonPrevue}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e=>sf('dateLivraisonPrevue',e.target.value)}/>
                  </div>
                </div>
              )}

              {/* Existing planning info (read-only, shown if set) */}
              {viewMode==='view' && (current?.effortEstime||current?.dateLivraisonPrevue) && (
                <>
                  <div className="ch-section-label">Planning</div>
                  <div className="ch-row ch-row--3">
                    {current.effortEstime && (
                      <div className="ch-field">
                        <label className="ch-label">Estimated effort</label>
                        <input className="ch-input ch-readonly" readOnly value={current.effortEstime}/>
                      </div>
                    )}
                    {current.dateLivraisonPrevue && (
                      <div className="ch-field">
                        <label className="ch-label">Delivery date</label>
                        <input className="ch-input ch-readonly" readOnly value={current.dateLivraisonPrevue}/>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── CCB: EN_ANALYSE → APPROUVEE or REFUSEE ── */}
              {canEvaluate && (
                <>
                  <div className="ch-section-sep ch-section-sep--ccb">
                    <span>✅ CCB Evaluation — Approval decision</span>
                  </div>
                  <div className="ch-eval-info">
                    As a CCB Manager, you can approve or reject this request.
                    Rejection requires a mandatory comment.
                  </div>
                  <div className="ch-row ch-row--2">
                    <div className="ch-field">
                      <label className="ch-label">Estimated effort (if approved)</label>
                      <input className="ch-input" value={evalForm.effortEstime}
                        onChange={e=>sef('effortEstime',e.target.value)} placeholder="e.g. 5 days"/>
                    </div>
                    <div className="ch-field">
                      <label className="ch-label">Expected delivery date</label>
                      <input type="date" className="ch-input" value={evalForm.dateLivraisonPrevue}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e=>sef('dateLivraisonPrevue',e.target.value)}/>
                    </div>
                  </div>
                  <div className="ch-row ch-row--2">
                    <div className="ch-field">
                      <label className="ch-label">Approver</label>
                      <select className="ch-input ch-input--sel" value={evalForm.approbateurId}
                        onChange={e=>sef('approbateurId',e.target.value)}>
                        <option value="">— Select —</option>
                        {users.map(u=><option key={u.id} value={u.id}>{userLabel(u)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="ch-field">
                    <label className="ch-label">
                      Comment <span className="ch-req">*</span>
                      <span className="ch-req-note"> (required if rejected)</span>
                    </label>
                    <textarea className="ch-textarea" rows={3} value={evalForm.commentaire}
                      onChange={e=>sef('commentaire',e.target.value)}
                      placeholder="Reason for the decision..."/>
                  </div>
                </>
              )}

              {/* ── Project Manager: planning ── */}
              {canPlanify && (
                <>
                  <div className="ch-section-sep ch-section-sep--chef">
                    <span>📋 Planning — Project Manager</span>
                  </div>
                  <div className="ch-row ch-row--2">
                    <div className="ch-field">
                      <label className="ch-label">Estimated effort</label>
                      <input className="ch-input" value={evalForm.effortEstime}
                        onChange={e=>sef('effortEstime',e.target.value)} placeholder="e.g. 8 days"/>
                    </div>
                    <div className="ch-field">
                      <label className="ch-label">Delivery date</label>
                      <input type="date" className="ch-input" value={evalForm.dateLivraisonPrevue}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e=>sef('dateLivraisonPrevue',e.target.value)}/>
                    </div>
                  </div>
                </>
              )}

              {/* ── Comment history ── */}
              {viewMode==='view' && (
                <>
                  <div className="ch-section-sep">
                    <span>Comment history ({current?.commentaires?.length||0})</span>
                  </div>
                  {current?.commentaires?.length>0
                    ? <div className="ch-comments">
                        {current.commentaires.map(c=>(
                          <div key={c.id} className="ch-comment">
                            <div className="ch-comment__header">
                              <span className="ch-comment__author">{c.auteurNom||'System'}</span>
                              <span className="ch-comment__date">{c.dateCreation?c.dateCreation.split('T')[0]:''}</span>
                            </div>
                            <p className="ch-comment__body">{c.contenu}</p>
                          </div>
                        ))}
                      </div>
                    : <div style={{fontSize:'0.8rem',color:'var(--color-text-tertiary)'}}>No comments</div>}

                  {/* Add comment — all roles except on FERMEE */}
                  {canComment && (
                    <div className="ch-add-comment">
                      <textarea className="ch-textarea" rows={2} value={newComment}
                        onChange={e=>setNewComment(e.target.value)}
                        placeholder="Add a comment..."/>
                      <button className="btn btn--secondary ch-comment-submit"
                        onClick={handleAddComment} disabled={addingComment}>
                        {addingComment ? '...' : '💬 Add'}
                      </button>
                    </div>
                  )}
                  {isFermee && (
                    <div className="ch-locked-msg">🔒 This request is closed — no changes possible.</div>
                  )}
                </>
              )}
            </div>

            {/* ── Modal footer — role-based buttons ── */}
            <div className="ch-modal__footer">
              <button className="btn btn--secondary" onClick={()=>setModalOpen(false)}>
                {viewMode==='view' ? t('common','close') : t('common','cancel')}
              </button>

              {/* Team member / all: submit new */}
              {viewMode==='create' && (
                <button className="btn btn--primary" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Submitting...' : '✔ Submit request'}
                </button>
              )}

              {/* CCB: analyse button (EN_ATTENTE only) */}
              {canAnalyse && (
                <button className="btn btn--analyse" onClick={handleAnalyse} disabled={saving}>
                  🔍 Take into analysis
                </button>
              )}

              {/* CCB: approve / reject (EN_ANALYSE only) */}
              {canEvaluate && (
                <>
                  <button className="btn btn--danger" onClick={()=>handleEvaluate('REFUSEE')} disabled={saving}>
                    ✕ Reject
                  </button>
                  <button className="btn btn--approve" onClick={()=>handleEvaluate('APPROUVEE')} disabled={saving}>
                    ✔ Approve
                  </button>
                </>
              )}

              {/* Project Manager: lifecycle buttons */}
              {isChefProjet && viewMode==='view' && current?.statut==='APPROUVEE' && (
                <button className="btn btn--start" onClick={()=>updateStatut(current.id,'EN_COURS')} disabled={saving}>
                  ▶ Start
                </button>
              )}
              {isChefProjet && viewMode==='view' && current?.statut==='EN_COURS' && (
                <>
                  <button className="btn btn--start" onClick={async()=>{
                    const r = await fetch(`${API}/changements/${current.id}/planification`,{
                      method:'PUT', headers:jsonH(),
                      body:JSON.stringify({
                        effortEstime:evalForm.effortEstime||null,
                        dateLivraisonPrevue:evalForm.dateLivraisonPrevue||null,
                      })
                    })
                    if(r.ok) addToast('Planning updated')
                  }} disabled={saving}>
                    💾 Save planning
                  </button>
                  <button className="btn btn--done" onClick={()=>updateStatut(current.id,'LIVREE')} disabled={saving}>
                    ✓ Mark delivered
                  </button>
                </>
              )}
              {isChefProjet && viewMode==='view' && current?.statut==='LIVREE' && (
                <button className="btn btn--close" onClick={()=>updateStatut(current.id,'FERMEE')} disabled={saving}>
                  🔒 Close request
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Confirm dialog ── */}
      {confirmCfg && ReactDOM.createPortal(
        <div className="overlay">
          <div className="ch-confirm">
            <div className="ch-confirm__emoji">⚠️</div>
            <h3 className="ch-confirm__title">{confirmCfg.title}</h3>
            <p className="ch-confirm__body">{confirmCfg.body}</p>
            <div className="ch-confirm__actions">
              <button className="btn btn--secondary" onClick={()=>setConfirmCfg(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ToastStack toasts={toasts} remove={removeToast}/>
    </div>
  )
}
