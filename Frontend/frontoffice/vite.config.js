import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Storefront tests live in ../src. This config is what `npm run test` uses inside the workspace. */
export default defineConfig({
  plugins: [react()],
  root: '..',
  test: {
    environment: 'jsdom',
    setupFiles: './frontoffice/src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
