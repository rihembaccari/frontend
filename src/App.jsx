import { useState, useEffect, useCallback } from 'react'
import './variables.css'
import './App.css'
import LoginForm        from './components/LoginForm'
import ProjetPage       from './components/projet/ProjetPage'
import DashboardPage    from './components/dashboard/DashboardPage'
import TachePage        from './components/projet/TachePage'
import RisquePage       from './components/risque/RisquePage'
import CharterPage      from './components/projet/CharterPage'
import ChangementsPage  from './components/changements/ChangementsPage'
import ProcessusPage    from './components/projet/ProcessusPage'
import UtilisateurPage  from './components/user/userPage'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import LanguageSwitcher from './i18n/LanguageSwitcher'
import {
  logout, isAdmin, getRole, getUser, isLoggedIn,
  isCCBManager, isDeveloppeur, msUntilExpiry,
} from './services/tokenService'

// ─── Ripple helper ───────────────────────────────────────────────
function addRipple(e) {
  const btn  = e.currentTarget
  const r    = document.createElement('span')
  r.className = 'cs-ripple'
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`
  btn.appendChild(r)
  setTimeout(() => r.remove(), 600)
}

// ─── Nav SVG icons ────────────────────────────────────────────────
const Icons = {
  dash:    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>,
  proj:    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 5V4a2 2 0 012-2h4a2 2 0 012 2v1M10 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  task:    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 5V4a1 1 0 012 0v1M14 5V4a1 1 0 012 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  process: <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M3 12h4l3-9 4 18 3-9h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  risk:    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  charter: <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  change:  <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  users:   <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a4 4 0 010 8M19 13a4 4 0 010 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  bell:    <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  cog:     <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  logout:  <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// ─── Role helpers (computed once per render) ─────────────────────
function getRoleFlags() {
  const role    = getRole()
  const admin   = role === 'ADMIN'
  const chef    = role === 'CHEF_PROJET'
  const ccb     = role === 'CCB_MANAGER'
  const dev     = role === 'DEVELOPPEUR'
  // CCB and DEV only see Changements
  const restricted = ccb || dev
  return { role, admin, chef, ccb, dev, restricted }
}

// ─── Default landing page by role ───────────────────────────────
function defaultPage(role) {
  if (role === 'CCB_MANAGER' || role === 'DEVELOPPEUR') return 'changements'
  return 'dashboard'
}

// ─── Topbar ─────────────────────────────────────────────────────
function Topbar({ activePage, setActivePage, userInfo, onLogout, t }) {
  const { role, admin, restricted } = getRoleFlags()

  // Build tab list based on role
  const tabs = restricted
    ? [
        { key:'changements', label: t('nav','changements'), icon: Icons.change },
      ]
    : [
        { key:'dashboard',   label: t('nav','dashboard'),   icon: Icons.dash    },
        { key:'projets',     label: t('nav','projets'),     icon: Icons.proj    },
        { key:'taches',      label: t('nav','taches'),      icon: Icons.task    },
        { key:'processus',   label: t('nav','processus'),   icon: Icons.process },
        { key:'risques',     label: t('nav','risques'),     icon: Icons.risk    },
        { key:'charter',     label: t('nav','charter'),     icon: Icons.charter },
        { key:'changements', label: t('nav','changements'), icon: Icons.change  },
        ...(admin ? [{ key:'utilisateurs', label: t('nav','utilisateurs'), icon: Icons.users }] : []),
      ]

  useEffect(() => {
    const onScroll = () => {
      const tb = document.getElementById('cs-topbar')
      if (tb) tb.classList.toggle('scrolled', window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Role label shown in user chip
  const roleLabel = {
    ADMIN:       'Admin',
    CHEF_PROJET: 'Chef Projet',
    CCB_MANAGER: 'CCB Manager',
    DEVELOPPEUR: 'Développeur',
  }[role] || role || 'User'

  const initials = userInfo?.email?.substring(0, 2).toUpperCase() || roleLabel.substring(0, 2).toUpperCase()

  return (
    <header className="cs-topbar" id="cs-topbar">
      <div className="cs-logo" onClick={() => setActivePage(defaultPage(role))}>
        <div className="cs-logo__mark">
          <div className="cs-logo__icon"><div className="a1"/><div className="a2"/></div>
        </div>
        <div className="cs-logo__text"><span>Clinisys</span>ERP GestionPro</div>
      </div>

      <nav className="cs-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`cs-tab${activePage === tab.key ? ' cs-tab--active' : ''}`}
            onClick={(e) => { addRipple(e); setActivePage(tab.key) }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="cs-topbar-right">
        <LanguageSwitcher />
        <button className="cs-icon-btn" title={t('nav','notifications')}>
          <div className="cs-notif-dot" />
          {Icons.bell}
        </button>
        <button className="cs-icon-btn" title={t('nav','settings')}>
          {Icons.cog}
        </button>
        <div className="cs-user-chip">
          <div className="cs-avatar">{initials}</div>
          <span className="cs-user-name">{roleLabel}</span>
        </div>
        <button className="cs-icon-btn" title={t('nav','logout')} onClick={onLogout}>
          {Icons.logout}
        </button>
      </div>
    </header>
  )
}

// ─── Inner App ───────────────────────────────────────────────────
function AppInner() {
  const { t } = useLanguage()

  // ── PERSIST SESSION ACROSS REFRESH ──────────────────────────────
  // Initialize userInfo from localStorage if token is still valid.
  // This is the fix for the "logs out on refresh" bug.
  // userInfo is only null when there is genuinely no valid session.
  const [userInfo, setUserInfo] = useState(() => {
    if (isLoggedIn()) {
      const stored = getUser()
      if (stored) return stored
    }
    return null
  })

  // ── ACTIVE PAGE — persist in sessionStorage so refresh keeps page ─
  const [activePage, setActivePage] = useState(() => {
    if (!isLoggedIn()) return 'dashboard'
    const role    = getRole()
    const saved   = sessionStorage.getItem('gp_activePage')
    const allowed = getAllowedPages(role)
    if (saved && allowed.includes(saved)) return saved
    return defaultPage(role)
  })

  // Sync activePage to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('gp_activePage', activePage)
  }, [activePage])

  // ── AUTO-LOGOUT when JWT expires ─────────────────────────────────
  // Set a timer that fires exactly when the token expires.
  // This replaces polling and is precise to the second.
  useEffect(() => {
    if (!userInfo) return
    const ms = msUntilExpiry()
    if (ms <= 0) { handleLogout(); return }
    const timer = setTimeout(() => {
      handleLogout()
    }, ms)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo])

  const handleLoginSuccess = useCallback((data, email) => {
    const role = getRole()
    setUserInfo({ ...data, email })
    setActivePage(defaultPage(role))
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    setUserInfo(null)
    setActivePage('dashboard')
    sessionStorage.removeItem('gp_activePage')
  }, [])

  // ── Not logged in — show login ───────────────────────────────────
  if (!userInfo) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  // ── Role flags ───────────────────────────────────────────────────
  const { admin, restricted } = getRoleFlags()

  // ── Safe page: CCB/DEV are always forced to Changements ──────────
  const safePage = restricted ? 'changements' : activePage

  return (
    <div className="cs-app">
      <Topbar
        activePage={safePage}
        setActivePage={restricted ? () => {} : setActivePage}
        userInfo={userInfo}
        onLogout={handleLogout}
        t={t}
      />
      <div className="gp-app-content">
        {/* CCB_MANAGER and DEVELOPPEUR always see Changements only */}
        {restricted && <ChangementsPage />}

        {/* All other roles — page routing */}
        {!restricted && safePage === 'dashboard'    && <DashboardPage />}
        {!restricted && safePage === 'projets'      && <ProjetPage onNavigate={setActivePage} />}
        {!restricted && safePage === 'taches'       && <TachePage />}
        {!restricted && safePage === 'processus'    && <ProcessusPage onNavigate={setActivePage} />}
        {!restricted && safePage === 'risques'      && <RisquePage />}
        {!restricted && safePage === 'charter'      && <CharterPage onNavigate={setActivePage} />}
        {!restricted && safePage === 'changements'  && <ChangementsPage />}
        {!restricted && safePage === 'utilisateurs' && admin && <UtilisateurPage onLogout={handleLogout} />}
      </div>
    </div>
  )
}

// ── Helper: which pages a role is allowed to visit ───────────────
function getAllowedPages(role) {
  if (role === 'CCB_MANAGER' || role === 'DEVELOPPEUR') return ['changements']
  const base = ['dashboard','projets','taches','processus','risques','charter','changements']
  if (role === 'ADMIN') return [...base, 'utilisateurs']
  return base
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  )
}
