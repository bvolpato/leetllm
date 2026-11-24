import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import os from 'os'
import path from 'path'

const sharedAlias = {
  '@': path.resolve(__dirname, './src'),
  'server-only': path.resolve(__dirname, './src/test/server-only.ts'),
}

const sharedExclude = [...configDefaults.exclude, '.next/**']

const jsdomTsTests = [
  'src/components/personalized-mermaid-runtime.test.ts',
  'src/lib/analytics.test.ts',
  'src/lib/content-guidelines.test.ts',
  'src/lib/content-utils.test.ts',
  'src/lib/study-state.test.ts',
  'tools/diagrams/book.test.ts',
  'tools/diagrams/lib/render.test.ts',
]

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: sharedExclude,
    globals: true,
    maxWorkers: Math.min(8, Math.max(4, os.availableParallelism())),
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 15_000,
    alias: sharedAlias,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: [...sharedExclude, ...jsdomTsTests],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['**/*.test.tsx', ...jsdomTsTests],
          exclude: sharedExclude,
        },
      },
    ],
  },
})
