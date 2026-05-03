import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const harnessDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: harnessDir,
  testMatch: 'outcomes.spec.js',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node scripts/prepare-public.mjs && npx serve public -l 4179 --no-request-logging',
    cwd: harnessDir,
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
