import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  base: './',
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
