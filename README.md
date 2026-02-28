# RuneScape Skill Calculator (Web)

Web-only RuneScape skill calculator.

## Run locally

Serve this repository root with a static server and open:

- `http://localhost:<port>/`

Example:

```powershell
python -m http.server 8080
```

Then open:

- `http://localhost:8080/`

## Key files

- App entry: `index.html`
- Logic: `app.js`
- Styles: `styles.css`
- Runtime config: `import-config.js`
- Changelog: `CHANGELOG.md`
- Skills manifest: `skills-manifest.json`
- Skill files: `skills/*.skill`
- Skill icons: `skill_icons/*.png`

## Runtime config

Set optional values in `import-config.js`:

- `window.RS3_IMPORT_PROXY`
- `window.WIKI_API_PROXY`
- `window.REPORT_ISSUE_URL`

## Data storage

- App data is stored in browser `localStorage`.
- Use `Export Data` / `Import Data` in the UI for backups/migration.
