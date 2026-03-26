import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/services/**',
        'src/hooks/**',
        'src/utils/**',
        'src/components/**',
        'src/features/**',
        'src/design-system/**',
      ],
      exclude: [
        '**/*.css',
        '**/*.spec.*',
        '**/index.ts',
        '**/*.interface.ts',
        '**/*.types.ts',
        '**/*.d.ts',
      ],
    },
  },
})
