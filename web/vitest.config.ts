import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, '.next/**'],
    environment: 'jsdom',
    globals: true,
    maxWorkers: 4,
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 15_000,
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/test/server-only.ts'),
    },
  },
})
