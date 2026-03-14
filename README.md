# Skyteam-o-mat – Kurs-Finder Wizard

Ein Vue-3-Wizard zur Einschätzung, ob ein Gleitschirm-Kurs oder eine Tour zum Kenntnisstand der Teilnehmer passt. Als **einzelnes JavaScript** auf beliebigen Seiten einbindbar: Klick auf einen konfigurierbaren Button öffnet den Wizard als **Modal-Popup**. Am Ende werden die Ergebnisse in **sessionStorage** gespeichert und optional in ein konfigurierbares **Formularfeld** geschrieben.

## Einbindung (Produktion)

1. **Embed-Build erzeugen:** `npm run build:embed`  
   → Erzeugt **eine** Datei: `dist/skyteam-wizard.js` (inkl. CSS, Vue, Fragen/Kurse).

2. **Auf der Zielseite:** Einen Button mit dem gewünschten Selektor setzen und das Script inkludieren (ohne `type="module"`):

```html
<button type="button" data-skyteam-wizard>Kurs-Finder öffnen</button>

<!-- Optional: verstecktes oder sichtbares Feld für das Wizard-Ergebnis -->
<input type="hidden" name="wizard_result" />

<script src="/pfad/zu/skyteam-wizard.js"
  data-trigger-selector="[data-skyteam-wizard]"
  data-result-field-selector="[name=wizard_result]"
  data-storage-key="skyteam_wizard_result"></script>
```

**Data-Attribute am Script-Tag:**

| Attribut | Bedeutung |
|----------|-----------|
| `data-trigger-selector` | CSS-Selektor für den Button, der den Wizard öffnet (Klick wird abgefangen). |
| `data-result-field-selector` | Optional. CSS-Selektor für ein Feld (z. B. `input`/`textarea`); wird mit dem gespeicherten Ergebnis (JSON-String) gefüllt. |
| `data-storage-key` | Optional. sessionStorage-Schlüssel (Standard: `skyteam_wizard_result`). |

Nach Klick auf „Fertig“ im Wizard: Ergebnis wird unter dem angegebenen Key in sessionStorage gespeichert und, falls `data-result-field-selector` gesetzt ist, in das gefundene Element in `value` geschrieben. Das gespeicherte Objekt enthält u. a. `courseId`, `courseName`, `meetsThreshold`, `fallbackLabel`, `fallbackUrl`, `missingSkillNames`, `completedAt`.

## Entwicklung

```bash
npm install
npm run dev
```

Öffnen: http://localhost:5173/ – Testseite mit Button und Ergebnis-Feld; Script wird als Modul geladen und nutzt dieselbe Modal-/Trigger-Logik.

## Tests

```bash
npm run test
```

Unit-Tests für die Scoring-Logik (`src/composables/useScoring.js`). Watch-Modus: `npm run test:watch`.

## Weitere Builds

- **`npm run build`** – Standard-Vite-Build (z. B. für eine eigene Demo-Seite mit `index.html` und getrennten Assets).
- **`npm run build:embed`** – Einzeldatei für die Script-Einbindung (IIFE, CSS im JS, siehe oben).

## Konfiguration (Daten)

- **questions.json**: Reihenfolge (`questionOrder`), Fragen (Text, Typ, Skill-Zuordnung, Optionen/Skalen).
- **courses.json**: Skills (id, name), Kurse (name, threshold, weights, minSkillLevel, fallbackCourseId/fallbackLabel).

Siehe PLAN.md für die Logik (gewichteter Score, Schwellwert, fehlende Skills).
