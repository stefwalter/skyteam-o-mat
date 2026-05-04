import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))

export default defineConfig({
  define: {
    __SKYTEAM_O_MAT_VERSION__: JSON.stringify(pkg.version ?? ''),
  },
  plugins: [vue(), cssInjectedByJsPlugin()],
  base: './',
  /** Only *.test.js — Playwright lives under outcome-harness/*.spec.js and must not run under Vitest. */
  test: {
    include: ['src/**/*.test.js', 'tests/**/*.test.js'],
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/skyteam-o-mat-[name].js',
        chunkFileNames: 'assets/skyteam-o-mat-[name].js',
        assetFileNames: 'assets/skyteam-o-mat-[name][extname]',
      },
    },
  },
})
