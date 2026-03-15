# Paragliding course-finder wizard (Vue, score-based)

## Goal

A wizard on our website where students answer questions; each question maps to a **skill**. Skills are **weighted per course**, and a **combined score** is compared to a **course threshold**. If the score is below threshold → recommend a more basic course. **Missing or weak skills** are always tracked and shown at the end so students are reminded to practice them even when they qualify. Record of the skills are saved for later use, so we can remind them to practire or prepare weak areas. 

---

## Core logic (score + threshold + missing skills)

- **Skills**: Each question contributes to one (or more) skills. Each skill gets a score.
- **Courses**: Each course defines:
  - **Threshold**: minimum combined (weighted) score needed to recommend that course.
  - **Weights**: per-skill weights for that course (e.g. "thermalling" counts more than "kiting" for an XC tour).
- **Combined score**: e.g. `sum(skillScore[skill] * weight[course][skill])` for all skills, or a normalized version (e.g. out of 100). Same formula for every course, different weights and thresholds.
- **Missing skills**: For the **target course**, compare each skill score to a required or "good" level (e.g. minimum 2 out of 3). Skills below that level are "missing" or "to practice".
- **Result**:
  - If score ≥ threshold → "This course is suitable"; show **missing skills** as "We recommend you practice: …".
  - If score < threshold → "We recommend a more basic course first" (e.g. link or name); still show **missing skills** so they know what to work on.

So: one run of the wizard is "for one course" (e.g. "Is XC Tour right for me?"). If you have multiple courses, the student either picks the course first, or you run the same answers against multiple courses and show which are suitable (same data model supports both).

---

## Data model (conceptual)

- **Questions**: id, text, type (see below), mapping to which skill(s) and how the answer contributes (e.g. choice A → skill "thermalling" = 2).
- Question Types: 
  - Multiple chioce: Each answer has a different score.
  - Numerical: The answer is multiplied by the score.
  - Likert scale: Never: -3 Rarely: -1 Sometimes: 0, Regularly: 1 Always: 3. Each number on the scale is multiplied by the score.
  - Text input: Used for URLs or links to other evidence, presence or absence determines the score.
- **Skills**: id, name, optional "target level" per course (or globally) to decide "missing".
- **Courses**: id, name, threshold (number), weights `{ skillId: number }`, optional "more basic course" id or link if below threshold.
- **Wizard config**: which course(s) this wizard is for (one or many), order of questions.

You can store this in JSON/config files (e.g. `questions.json`, `courses.json`) that the Vue app loads, so you or a dev can edit without a CMS.

---

## Tech choices (already decided)

- **Vue 3** (Composition API or Options API – your choice).
- **Embeddable**: Single Vue app; script-only embed (modal, trigger selector, sessionStorage, form prefill). No need for Vue Router (linear wizard).
- **Embed config (built-in, not runtime).** The following are hardcoded in the JS at build time and do not change at runtime: (1) **trigger selector** = `a[href*=allgaeu][class~=booking]` (links that open the wizard), (2) **result field selector** = `input#bemerkungen` (field that receives the stored result), (3) **storage key** = `"skyteam_o_mat"` (sessionStorage key for the wizard result). To change them, edit the constants in the source and rebuild.
- **Build: single JS file, no separate CSS.** Both the default build (`npm run build`) and the embed build (`npm run build:embed`) produce **one JavaScript file** only. All CSS is injected at runtime by the JS (via a plugin), so there is **no additional CSS file** in `dist/` or `dist/assets/`. The host page only needs to include the one script.
- **Language**: User-facing text is **German**. The primary audience is German-speaking; all content in `questions.json` and `courses.json` (question text, options, labels, course names, descriptions, fallback labels) and any UI strings in the wizard (buttons, verdicts, “practice these skills”) should be in German. Technical keys (e.g. `id`, `skillId`, `type`) stay in English for consistency.

---

## Suggested wizard flow

1. **Start**: Optional course selector ("Check for: XC Tour / SIV / …") or assume one course.
2. **Steps**: One or more questions per screen; progress indicator (e.g. "Question 3 of 8").
3. **Scoring**: On each answer, update in-memory skill scores (and optionally persist in `sessionStorage` so refresh doesn't lose progress).
4. **End**:
  - Compute combined score for the course; compare to threshold.
  - Compute missing skills (scores below target for that course).
  - Show:
    - **Verdict**: "Suitable" or "We recommend [more basic course] first."
    - **Missing skills**: "We recommend you practice: [list]" (whether they qualified or not).
    - Optional: link to course page or booking, link to "more basic" course.

---

## What we're not deciding yet (flexible later)

- **Who edits content**: You can start with JSON/config; add a simple admin later if needed.
- **Exact outcome**: e.g. "show result + link to course" is a good default; "save/email result" can be added as a second phase.
- **Multi-course in one run**: The same model supports "answer once, check all courses"; we can add that once the single-course flow works.

---

## Implementation order (when you're ready to build)

1. **Vue app scaffold**: Embeddable bundle, one entry, mount on `#course-finder-wizard`.
2. **Data**: Use the example `questions.json` and `courses.json` that we already defined as input.
3. **Wizard UI**: Step-by-step flow, next/back, progress, store answers in state (and optionally `sessionStorage`).
4. **Scoring**: Compute skill scores from answers, then weighted score and missing skills; implement threshold check.
5. **Result screen**: Verdict + missing-skills reminder + optional links.
6. **Polish**: Styling to match your site, basic a11y (focus, labels).

If you want, next step can be to fix the exact formula (e.g. normalized 0–100 vs raw weighted sum) and a minimal example of `questions.json` / `courses.json` for one of your real courses.