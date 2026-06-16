import { useState, useEffect, useRef } from 'react'
import './css/LoginForm.css'
import { loginUser as login } from '../services/authService'
import { useLanguage } from '../i18n/LanguageContext'

export default function LoginForm({ onLoginSuccess }) {
  const { t } = useLanguage()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const particlesRef = useRef(null)

  // Spawn floating particles
  useEffect(() => {
    const cont = particlesRef.current
    if (!cont) return
    cont.innerHTML = ''
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div')
      p.className = 'lp-particle'
      const s   = Math.random() * 10 + 4
      const dur = Math.random() * 8 + 6
      const del = Math.random() * -10
      const op  = Math.random() * .25 + .05
      p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${op};animation-duration:${dur}s;animation-delay:${del}s`
      cont.appendChild(p)
    }
  }, [])

  const handleLogin = async () => {
    if (!email || !password) { setError(t('login','errorInvalid')); return }
    setLoading(true); setError('')
    try {
      const data = await login(email, password)
      onLoginSuccess(data, email)
    } catch (e) {
      setError(e.message || t('login','errorServer'))
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="lp-root">
      {/* Animated background */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div ref={particlesRef} />

      <div className="lp-card">
        {/* Logo */}
        <div className="lp-logo-block">
          <div className="lp-logo-mark">
            <div className="lp-logo-icon"><div className="a1"/><div className="a2"/></div>
          </div>
          <div className="lp-logo-name"><span>Clinisys</span>ERP GestionPro</div>
          <div className="lp-logo-sub">{t('login','hisLabel')}</div>
        </div>

        <h1 className="lp-title">{t('login','title')}</h1>
        <p  className="lp-sub">{t('login','subtitle')}</p>

        {error && (
          <div className="lp-error">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{flexShrink:0}}>
              <circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01"/>
            </svg>
            {error}
          </div>
        )}

        <div className="lp-fields">
          <div className="lp-field">
            <label className="lp-label">{t('login','emailLabel')}</label>
            <div className="lp-input-wrap">
              <svg className="lp-input-ico" viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 5h14a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M3 6l7 5 7-5"/>
              </svg>
              <input className="lp-input" type="email" placeholder={t('login','emailPlaceholder')}
                value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} autoFocus />
            </div>
          </div>

          <div className="lp-field">
            <label className="lp-label">{t('login','passwordLabel')}</label>
            <div className="lp-input-wrap">
              <svg className="lp-input-ico" viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/>
              </svg>
              <input className="lp-input lp-input--pwd" type={showPwd ? 'text' : 'password'}
                placeholder={t('login','passwordPlaceholder')}
                value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
              <button className="lp-eye" type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                {showPwd
                  ? <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="2.5"/><line x1="3" y1="3" x2="17" y2="17"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="2.5"/></svg>
                }
              </button>
            </div>
          </div>
        </div>

        <button className="lp-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <><span className="lp-spinner"/>{t('login','submitting')}</> : t('login','submit')}
        </button>

        {/* Wave decoration */}
        <div className="lp-wave">
          {[1,2,3,4,5].map(i => <div key={i} className="lp-wave-bar"/>)}
        </div>

        <p className="lp-footer">{t('login','footer')}</p>
      </div>
    </div>
  )
}
