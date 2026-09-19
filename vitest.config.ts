import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // See the comment in the stub: Next resolves this specifier itself, so
      // Vitest needs an empty module to stand in for it.
      'server-only': path.resolve(import.meta.dirname, './src/test/server-only.ts'),
      '@payload-config': path.resolve(import.meta.dirname, './payload.config.ts'),
      '@payload-types': path.resolve(import.meta.dirname, './payload-types.ts'),
    },
  },
})
