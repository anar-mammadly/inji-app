import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'

const STORAGE_KEY = 'boncuk_lang'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'az')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  function t(key, vars = {}) {
    const template = translations[lang][key] ?? key
    return Object.entries(vars).reduce(
      (str, [name, value]) => str.replaceAll(`{${name}}`, value),
      template,
    )
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  return useContext(LanguageContext)
}
