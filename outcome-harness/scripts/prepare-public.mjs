/**
 * Copy built IIFE into outcome-harness/public/ so the static server can serve it.
 * Run from repo root: node outcome-harness/scripts/prepare-public.mjs
 * Or from outcome-harness: node scripts/prepare-public.mjs
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const harnessRoot = join(__dirname, '..')
const repoRoot = join(harnessRoot, '..')
const src = join(repoRoot, 'dist', 'skyteam-wizard.js')
const publicDir = join(harnessRoot, 'public')
const dest = join(publicDir, 'skyteam-wizard.js')

mkdirSync(publicDir, { recursive: true })
copyFileSync(src, dest)
console.log('Copied', src, '->', dest)
