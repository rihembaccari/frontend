// ═══════════════════════════════════════════════════════════════════
// src/i18n/LanguageSwitcher.jsx
// Compact flag+code dropdown — drop into any navbar's right section
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from './LanguageContext'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { lang, setLang, LANGUAGES } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        className={`lang-btn${open ? ' lang-btn--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <svg className="lang-caret" viewBox="0 0 10 6" fill="none" width="9" height="9">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
            fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <ul className="lang-dropdown" role="listbox">
          {LANGUAGES.map(l => (
            <li
              key={l.code}
              className={`lang-option${l.code === lang ? ' lang-option--active' : ''}`}
              role="option"
              aria-selected={l.code === lang}
              onClick={() => { setLang(l.code); setOpen(false) }}
            >
              <span className="lang-flag">{l.flag}</span>
              <span className="lang-option-label">{l.label}</span>
              {l.code === lang && (
                <svg viewBox="0 0 16 16" fill="none" width="12" height="12" className="lang-check">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
