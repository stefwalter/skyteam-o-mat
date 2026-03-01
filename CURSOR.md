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
- **Embed**: The app mounts on `#course-finder-wizard`. Build outputs go in `dist/`; the host page includes the built JS and CSS and provides a `<div id="course-finder-wizard">`.
- **Data**: Questions and courses are defined in **`questions.json`** and **`courses.json`** at the project root. The app imports them at build time (they are bundled).
- **Plan**: Full logic, data model, and implementation order are in **`PLAN.md`**.

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

---

## Conventions

- When adding or changing **user-visible** copy (in Vue or in the JSON), keep it in **German**.
- When changing **scoring or data shape**, align with **PLAN.md** and the existing `questions.json` / `courses.json` structure.
- For **embedding**, document any new build or path requirements in **README.md**.
