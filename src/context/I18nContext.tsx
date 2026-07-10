import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translations, type Lang, type TranslationKey } from '../i18n/translations'
import { loadJson, saveJson } from '../lib/storage'

const LANG_KEY = 'stridematch.lang.v1'

type Vars = Record<string, string | number | undefined>

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Vars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function format(template: string, vars?: Vars) {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key]
    return value == null ? '' : String(value)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = loadJson<Lang | null>(LANG_KEY, null)
    if (saved === 'en' || saved === 'ms') setLangState(saved)
    setReady(true)
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveJson(LANG_KEY, next)
    document.documentElement.lang = next === 'ms' ? 'ms' : 'en'
  }, [])

  useEffect(() => {
    if (ready) document.documentElement.lang = lang === 'ms' ? 'ms' : 'en'
  }, [lang, ready])

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const raw = translations[lang][key] ?? translations.en[key] ?? key
      return format(raw, vars)
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
