import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ptBr from './locales/pt-br.json'
import en from './locales/en.json'

const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'
const LANGUAGE_KEY = `${STORAGE_PREFIX}_language`

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-br': { translation: ptBr },
      en: { translation: en },
    },
    fallbackLng: 'pt-br',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
  })

export default i18n
