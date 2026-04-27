import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))

export default defineConfig({
  /** Vue runtime references `process.env.NODE_ENV`; browsers have no `process` unless replaced. */
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    __SKYTEAM_O_MAT_VERSION__: JSON.stringify(pkg.version ?? ''),
  },
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/embed.js',
      name: 'SkyteamWizard',
      formats: ['iife'],
      fileName: () => 'skyteam-wizard.js',
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
  },
})
