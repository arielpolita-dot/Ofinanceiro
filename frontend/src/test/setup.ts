import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:3000',
    VITE_STORAGE_PREFIX: 'test',
    PROD: false,
    DEV: true,
    MODE: 'test',
  },
  writable: true,
})

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: 'pt-br' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))
