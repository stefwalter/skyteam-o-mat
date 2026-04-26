import { defineConfig, mergeConfig } from 'vite'
import embedConfig from './vite.embed.config.js'

/** Same as embed build; ships JS into the WordPress plugin `assets` folder. */
export default mergeConfig(
  embedConfig,
  defineConfig({
    build: {
      outDir: 'wordpress/skyteam-o-mat/assets',
      emptyOutDir: true,
    },
  })
)
