# CURSOR.md – Project context and rules

Use this file as shared context and conventions for the Skyteam-o-mat project.

---

## What this project is

- **Skyteam-o-mat**: A wizard-style tool for a paragliding school website.
- **Audience**: Students and customers (primarily **German-speaking**).
- **Purpose**: Users answer questions; the wizard determines whether a given **course or tour** matches their skill level and recommends a more basic course if not. It also tracks **missing or weak skills** and reminds users to practice them even when they qualify.

---

## Tech and structure

- **Stack**: Vue 3, Vite. No Vue Router (linear wizard).
- **Embed (Produktion)**: Ein **einziges IIFE-Script** mit Vue, allen Komponenten und **CSS im JS** (kein separates Stylesheet). Zwei Wege, es zu erzeugen:
  - **`npm run build:embed`** → `dist/skyteam-wizard.js` (Ausgabe unter `dist/`, Ordner ist gitignored).
  - **`npm run build:wp`** → schreibt die Version aus `package.json` nach `skyteam-o-mat.php`, baut `wordpress/skyteam-o-mat/assets/skyteam-wizard.js`, legt **`skyteam-o-mat-wp-plugin-v<version>.zip`** im Projektroot an (`scripts/sync-wp-version.mjs`, `scripts/zip-wp-plugin.mjs`).
- **WordPress**: Ordner `wordpress/skyteam-o-mat/` mit `skyteam-o-mat.php` – registriert dasselbe Embed-Bundle. Siehe README.
- **Modal**: Der Wizard erscheint als **Popup-Modal**. Trigger, Ergebnisfeld und sessionStorage-Key sind im Embed **fest in `src/embed.js`** verdrahtet (nicht per Data-Attribute); siehe **PLAN.md** und README.
- **Ergebnis**: Beim Klick auf „Fertig“: sessionStorage + optionales Befüllen des Zielfelds laut den eingebauten Selektoren.
- **Data**: Questions and courses are in **`questions.json`** and **`courses.json`** at the project root; bundled at build time.
- **Plan**: Full logic and data model in **`PLAN.md`**.

---

## Language

- **User-facing text is German**: All content in the JSON files (question text, options, scale labels, course names, descriptions, fallback labels) and all wizard UI (buttons, verdicts, “practice these skills”, progress) must be in German.
- **Technical keys stay in English**: e.g. `id`, `skillId`, `type`, `questionOrder`, so the codebase and data model stay consistent.

---

## Logic (short version)

- Each question maps to a **skill** and produces a score (multiple choice → option score; likert → scale value × multiplier; numerical → value × multiplier; text → presence/absence score).
- Each **course** has a **threshold** and **per-skill weights**. Combined score = Σ(skillScore × weight). If combined score ≥ threshold → course is suitable; else show fallback course.
- **Missing skills**: For the chosen course, any skill whose score is below the course’s `minSkillLevel` is listed at the end as “practice these,” regardless of pass/fail.

---

## Files to know

| File | Role |
|------|------|
| `PLAN.md` | Authoritative plan: goal, scoring, data model, question types, flow, implementation order. |
| `questions.json` | `questionOrder` + `questions[]` (id, text, type, skillId, options/scale/scoreMultiplier etc.). |
| `courses.json` | `skills[]` (id, name) and `courses[]` (id, name, threshold, weights, minSkillLevel, fallbackCourseId/Label/Url). |
| `src/App.vue` | Root: data load, course selector, step index, answers, result; sessionStorage persistence. |
| `src/composables/useScoring.js` | `computeSkillScores()`, `evaluateCourse()` – used for result. |
| `src/components/WizardSteps.vue` | Renders current question (multiple_choice, likert, numerical, text_input), progress, next/back, “Kurs wechseln”. |
| `src/components/ResultScreen.vue` | Verdict (suitable / recommend fallback), missing-skills list, score note, “Von vorn starten”. |
| `src/embed.js` | Script-only Embed: Modal, Trigger, Feld, Storage-Key; Einstieg für `build:embed` / `build:wp`. |
| `vite.embed.config.js` | Vite-Lib-Build → IIFE `skyteam-wizard.js` (Standard-Ziel: `dist/`). |
| `vite.wordpress.config.js` | Gleicher Lib-Build, Ausgabe in `wordpress/skyteam-o-mat/assets/`. |
| `wordpress/skyteam-o-mat/skyteam-o-mat.php` | WordPress-Plugin: Script registrieren/einbinden, Filter & Shortcode. |

---

## Conventions

- When adding or changing **user-visible** copy (in Vue or in the JSON), keep it in **German**.
- When changing **scoring or data shape**, align with **PLAN.md** and the existing `questions.json` / `courses.json` structure.
- For **embedding or WordPress**, document new build steps, Pfade oder Einbindungs-API in **README.md** und hier in **CURSOR.md**, falls sich Architektur oder Konventionen ändern.
