# Skyteam-o-mat – Kurs-Finder Wizard

Ein Vue-3-Wizard zur Einschätzung, ob ein Gleitschirm-Kurs oder eine Tour zum Kenntnisstand der Teilnehmer passt. Als **einzelnes JavaScript** auf beliebigen Seiten einbindbar (oder über das **WordPress-Plugin**): Klick auf die im Embed festgelegten Trigger-Elemente öffnet den Wizard als **Modal-Popup**. Am Ende werden die Ergebnisse in **sessionStorage** gespeichert und in das im Embed konfigurierte **Formularfeld** geschrieben (siehe `src/embed.js` / `PLAN.md`).

## Einbindung (Produktion)

### Statische Seite / beliebiges CMS

1. **Embed-Build erzeugen:** `npm run build:embed`  
   → **eine** Datei: `dist/skyteam-wizard.js` (inkl. CSS, Vue, Fragen/Kurse).

2. **Auf der Zielseite** nur dieses Script einbinden (**ohne** `type="module"`). Trigger, Ergebnisfeld und sessionStorage-Key sind **fest im Build** hinterlegt (Konstanten in `src/embed.js`); zum Ändern Quelle anpassen und neu bauen.

```html
<script src="/pfad/zu/skyteam-wizard.js"></script>
```

**Aktuelles Standard-Verhalten** (siehe auch `PLAN.md`):

| Aspekt | Wert (in `src/embed.js`) |
|--------|---------------------------|
| Trigger | z. B. Buchungs-Links `a[href*=hike-fly-woche][class~=booking]` |
| Ergebnisfeld | `input#bemerkungen` |
| sessionStorage-Key | `skyteam_o_mat` |

Nach **Buchen** / **Trotzdem buchen** oder **Abbrechen**: Ergebnis unter diesem Key in sessionStorage und das Ergebnisfeld mit dem JSON-String befüllt (sofern das Element existiert). Nur bei **Buchen** / **Trotzdem buchen** folgt die Navigation zur Buchungs-URL des Trigger-Links. Inhalt u. a. `courseId`, `meetsThreshold`, `skillScores` (alle Skill-IDs → Nutzer-Score), `weightedScore`, `threshold`, `completedAt`.

### WordPress

1. **`npm run build:wp`** schreibt die Plugin-Version aus `package.json` in `wordpress/skyteam-o-mat/skyteam-o-mat.php`, baut das Embed-Bundle nach `wordpress/skyteam-o-mat/assets/skyteam-wizard.js` und erzeugt im Projektroot eine Zip **`skyteam-o-mat-wp-plugin-v` + gleiche Version + `.zip`** (siehe `scripts/sync-wp-version.mjs` und `scripts/zip-wp-plugin.mjs`).
2. In WordPress: **Plugins → Installieren → Plugin hochladen** mit der Zip, oder den Ordner `wordpress/skyteam-o-mat` nach `wp-content/plugins/` kopieren und das Plugin **Skyteam-o-mat** aktivieren.
3. **Einbindung:** Das Plugin registriert das Script für das Frontend (siehe `skyteam-o-mat.php`). Über den Filter `skyteam_o_mat_enqueue_script` kann das Laden global abgeschaltet werden; dann Shortcode **`[skyteam_o_mat]`** auf die gewünschten Seiten setzen, damit das Script geladen wird.

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
- **`npm run build:embed`** – Einzeldatei für die Script-Einbindung (IIFE, CSS im JS) → `dist/skyteam-wizard.js`.
- **`npm run build:wp`** – Version aus `package.json` ins PHP-Plugin übernehmen, Embed-Lib-Build → `wordpress/skyteam-o-mat/assets/skyteam-wizard.js`, dann versionierte Plugin-Zip im Projektroot (benötigt **`zip`**).

## Konfiguration (Daten)

- **questions.json**: Reihenfolge (`questionOrder`), Fragen (Text, Typ, Skill-Zuordnung, Optionen/Skalen).
- **courses.json**: Skills (id, name), Kurse (name, threshold, weights, minSkillLevel, fallbackCourseId/fallbackLabel).

Siehe PLAN.md für die Logik (gewichteter Score, Schwellwert, fehlende Skills).
