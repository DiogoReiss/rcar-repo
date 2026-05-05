/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular()],
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

