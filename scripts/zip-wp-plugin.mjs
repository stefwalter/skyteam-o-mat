#!/usr/bin/env node
/**
 * Creates skyteam-o-mat-wp-plugin-v<package.json version>.zip from wordpress/skyteam-o-mat/.
 */
import { readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const version = String(pkg.version || '').trim()
const zipName = `skyteam-o-mat-wp-plugin-v${version}.zip`
const zipPath = join(ROOT, zipName)

for (const name of readdirSync(ROOT)) {
  if (name.startsWith('skyteam-o-mat-wp-plugin-v') && name.endsWith('.zip')) {
    unlinkSync(join(ROOT, name))
  }
}
try {
  unlinkSync(join(ROOT, 'skyteam-o-mat-wp-plugin.zip'))
} catch (_) {
  /* ignore */
}

const r = spawnSync('zip', ['-r', zipPath, 'skyteam-o-mat'], {
  cwd: join(ROOT, 'wordpress'),
  stdio: 'inherit',
})
if (r.error) {
  console.error(r.error.message)
  process.exit(1)
}
if (r.status !== 0) {
  process.exit(r.status ?? 1)
}
console.log(`zip-wp-plugin: ${zipPath}`)
