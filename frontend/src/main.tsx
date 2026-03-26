import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App'
// Import design system (includes base styles)
import './design-system'
// Then import local overrides/extensions
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
