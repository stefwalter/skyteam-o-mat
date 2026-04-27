#!/usr/bin/env node
/**
 * Writes package.json "version" into the WordPress plugin header and SKYTEAM_O_MAT_VERSION.
 * Run automatically from npm run build:wp.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const version = String(pkg.version || '').trim()
if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error('sync-wp-version: package.json "version" must look like semver (e.g. 0.1.2)')
  process.exit(1)
}

const phpPath = join(ROOT, 'wordpress/skyteam-o-mat/skyteam-o-mat.php')
let php = readFileSync(phpPath, 'utf8')
const next = php
  .replace(/^(\s*\*\s*Version:\s*)\S+(\s*)$/m, `$1${version}$2`)
  .replace(
    /define\s*\(\s*'SKYTEAM_O_MAT_VERSION'\s*,\s*'[^']*'\s*\)/,
    `define( 'SKYTEAM_O_MAT_VERSION', '${version}' )`
  )

if (next !== php) {
  writeFileSync(phpPath, next)
  console.log(`sync-wp-version: ${phpPath} → ${version}`)
} else {
  console.log(`sync-wp-version: ${phpPath} already at ${version}`)
}
