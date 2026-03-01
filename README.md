# Skyteam-o-mat – Kurs-Finder Wizard

Ein Vue-3-Wizard zur Einschätzung, ob ein Gleitschirm-Kurs oder eine Tour zum Kenntnisstand der Teilnehmer passt. Nutzer beantworten Fragen; gewichtete Skill-Punkte werden mit einem Kursschwellwert verglichen. Fehlende oder schwache Skills werden am Ende angezeigt.

## Entwicklung

```bash
npm install
npm run dev
```

Öffne http://localhost:5173/ – die Seite enthält ein Beispiel-Embed des Wizards (`<div id="course-finder-wizard">`).

## Produktion einbinden

1. Build ausführen: `npm run build`
2. Aus dem Ordner `dist/` die Dateien auf deinen Server legen:
   - `index.html` (optional, für eine eigene Demo-Seite)
   - `assets/index-*.js` und `assets/index-*.css` (Namen mit Hash)

Auf deiner bestehenden Website:

```html
<div id="course-finder-wizard"></div>
<link rel="stylesheet" href="/pfad/zu/dist/assets/index-XXXXX.css" />
<script type="module" src="/pfad/zu/dist/assets/index-XXXXX.js"></script>
```

Die Fragen und Kurse kommen aus den gebündelten `questions.json` und `courses.json` im Projektroot. Nach Änderungen an den JSON-Dateien einen neuen Build ausführen.

## Konfiguration

- **questions.json**: Reihenfolge (`questionOrder`), Fragen (Text, Typ, Skill-Zuordnung, Optionen/Skalen).
- **courses.json**: Skills (id, name), Kurse (name, threshold, weights, minSkillLevel, fallbackLabel/fallbackUrl).

Siehe PLAN.md für die Logik (gewichteter Score, Schwellwert, fehlende Skills).
