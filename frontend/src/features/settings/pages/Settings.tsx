import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Page, Card, CardHeader, CardContent, Select, Toggle } from '../../../design-system'
import './Settings.css'

const STORAGE_PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'app'
const THEME_KEY = `${STORAGE_PREFIX}_theme`
const LANGUAGE_KEY = `${STORAGE_PREFIX}_language`

function getStoredTheme(): 'light' | 'dark' {
  return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function Settings() {
  const { t, i18n } = useTranslation()
  const [isDark, setIsDark] = useState(() => getStoredTheme() === 'dark')

  useEffect(() => {
    applyTheme(isDark ? 'dark' : 'light')
  }, [isDark])

  const handleThemeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsDark(checked)
    localStorage.setItem(THEME_KEY, checked ? 'dark' : 'light')
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    localStorage.setItem(LANGUAGE_KEY, value)
    i18n.changeLanguage(value)
  }

  return (
    <Page title={t('settings.title')} description={t('settings.description')}>
      <Card>
        <CardHeader title={t('settings.themeTitle')} description={t('settings.themeDescription')} />
        <CardContent>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">{t('settings.darkMode')}</span>
              <span className="settings-row-desc">{t('settings.darkModeDescription')}</span>
            </div>
            <Toggle checked={isDark} onChange={handleThemeToggle} />
          </div>
        </CardContent>
      </Card>

      <Card className="settings-section-gap">
        <CardHeader title={t('settings.languageTitle')} description={t('settings.languageDescription')} />
        <CardContent>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">{t('settings.languageLabel')}</span>
              <span className="settings-row-desc">{t('settings.languageLabelDescription')}</span>
            </div>
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              options={[
                { value: 'pt-br', label: t('settings.languagePtBr') },
                { value: 'en', label: t('settings.languageEn') },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </Page>
  )
}
