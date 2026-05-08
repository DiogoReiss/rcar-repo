/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./src/app/core', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/app/shared', import.meta.url)),
      '@admin': fileURLToPath(new URL('./src/app/admin', import.meta.url)),
      '@lavajato': fileURLToPath(new URL('./src/app/lavajato', import.meta.url)),
      '@aluguel': fileURLToPath(new URL('./src/app/aluguel', import.meta.url)),
      '@portal': fileURLToPath(new URL('./src/app/portal-cliente', import.meta.url)),
      '@env': fileURLToPath(new URL('./src/environments', import.meta.url)),
      '@rcar/shared-types': fileURLToPath(new URL('../../packages/shared-types/src/index.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    setupFiles: ['src/test-setup.browser.ts'],
    include: ['src/**/*.browser.spec.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});

