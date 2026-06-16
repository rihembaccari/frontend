// ═══════════════════════════════════════════════════════════════════
// src/i18n/LanguageContext.jsx
// Global language context — wrap App with <LanguageProvider>
// Usage in any component:
//   const { t, lang, setLang, dir } = useLanguage()
//   t('projets', 'heading')         → translated string
//   t('projets', 'results', 3)      → function-based translation
// ═══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, DEFAULT_LANG, LANGUAGES } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('gp_lang') || DEFAULT_LANG
  )

  // Persist + apply RTL direction to <html> element
  const setLang = (code) => {
    localStorage.setItem('gp_lang', code)
    setLangState(code)
  }

  const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr'

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir',  dir)
  }, [lang, dir])

  // t(section, key, ...args)
  // - For string keys:   t('projets', 'heading')
  // - For function keys: t('projets', 'results', 3)
  const t = (section, key, ...args) => {
    // Try main section first
    const sectionData = translations[section]
    if (sectionData) {
      const langData = sectionData[lang] || sectionData[DEFAULT_LANG]
      if (langData) {
        const val = langData[key]
        if (val !== undefined) {
          if (typeof val === 'function') return val(...args)
          return val
        }
      }
    }
    // Fallback: look in 'extra' section for supplemental keys
    const extra = translations['extra']
    if (extra) {
      const extraLang = extra[lang] || extra[DEFAULT_LANG]
      if (extraLang) {
        const val = extraLang[key]
        if (val !== undefined) {
          if (typeof val === 'function') return val(...args)
          return val
        }
      }
    }
    // Final fallback: also check 'common'
    const common = translations['common']
    if (common) {
      const commonLang = common[lang] || common[DEFAULT_LANG]
      if (commonLang) {
        const val = commonLang[key]
        if (val !== undefined) {
          if (typeof val === 'function') return val(...args)
          return val
        }
      }
    }
    return key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
