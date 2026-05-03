# Outcome harness (browser + mock remarks)

Black-box checks against the **built** embed (`dist/skyteam-wizard.js`): three fixed answer personas, real modal UI, and assertions on `#bemerkungen` (and on the booking fixture page after navigation).

## Run from repo root

```bash
npm install
npx playwright install   # once per machine
npm run test:outcomes
```

`test:outcomes` runs `build:embed` first (embed build wipes `dist/`), copies the IIFE into `public/`, then runs Playwright. The dev server is started by Playwright’s `webServer` hook.

## Cursor Task (shell subagent)

Use a **shell** Task so the agent does not need repository source context. Example instruction:

> From the repository root, run only: `npm install` (if needed), `npx playwright install` (if needed), and `npm run test:outcomes`. Report pass/fail. Do not open or edit files under `src/`.

Maintainers still change personas, fixtures, and specs under `outcome-harness/` and `tests/outcome-personas.test.js` in git.

## Vitest guard on recipes

Unit checks that `personas.json` answer maps produce the intended `evaluateCourse` outcomes (no UI):

```bash
npx vitest run tests/outcome-personas.test.js
```
