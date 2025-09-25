import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: ( {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      // thresholds enforced as a test-time check; cast to any to avoid typing errors
      thresholds: {
        global: {
          statements: 65,
          branches: 55,
          functions: 60,
          lines: 65,
        },
      },
    } as any ),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})