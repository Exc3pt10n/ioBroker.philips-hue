# Hinweise für die Weiterentwicklung

`philips-hue` ist ein eigenständiger ioBroker-Adapter für Philips-Hue-Bridges, der ausschließlich auf der
Hue API v2 (CLIP v2) aufbaut. Er hat nichts mit dem `hue`-Adapter aus dem ioBroker-Repository zu tun und kann
parallel dazu installiert werden (Instanzen `philips-hue.<n>`). Kein Code, keine Texte und keine Grafiken aus dem
`hue`-Adapter übernehmen.

## Aufbau

- `src/main.ts` – Adapter: Lebenszyklus, Abgleich der Objekte, Events, Steuerbefehle, Nachrichten der Admin-Seite
  (`discoverBridges`, `pairBridge`)
- `src/lib/hue/` – Hue-API-v2-Client: REST, Eventstream (SSE), Befehlswarteschlange, Bridge-Suche
- `src/lib/model.ts`, `src/lib/commands.ts`, `src/lib/color.ts` – reine Logik ohne Adapterzugriff
  (Objektbaum und State-Werte aus den Ressourcen, State-Writes → v2-Befehle, Farbumrechnung)
- `test/unit/` – Unit-Tests der reinen Logik, `test/integrationAdapter.ts` – Integrationstests
  gegen eine simulierte Bridge (`test/integration/mockBridge.ts`), Fixtures in `test/fixtures.ts`
- Entwicklerdoku auf Englisch in `DEVELOPMENT.md`

## Sprache

- README, `DEVELOPMENT.md`, Code, Kommentare und Log-Meldungen sind **englisch** (ioBroker-Repochecker).
- Texte der Einstellungsseite stehen als englische Schlüssel in `admin/jsonConfig.json` und übersetzt in
  `admin/i18n/<sprache>/translations.json` (en, de, ru, pt, nl, fr, it, es, pl, uk, zh-cn).
- Objektnamen in `io-package.json` (`instanceObjects`) und `common.news` immer in allen 11 Sprachen.

## Versionierung

Jede Änderung, die gemergt werden soll, zieht die Adapter-Version **einmal pro Pull Request** hoch
(Semantic Versioning, solange < 1.0):

| Änderung | Version |
|---|---|
| Neue Funktion | Minor: 0.1.0 → 0.2.0 |
| Fehlerbehebung, kleine Verbesserung | Patch: 0.2.0 → 0.2.1 |
| Inkompatible Änderung (Objektstruktur, Einstellungen) | Minor, im Changelog als **Breaking** markiert |

Bei mehreren Änderungen in einem Pull Request gilt die höchste Stufe.

Ausnahme: Reine Änderungen an Entwicklungswerkzeugen ohne Auswirkung auf Nutzer (CI-Workflows,
Tests, Lint-Konfiguration, `CLAUDE.md`, `DEVELOPMENT.md`) brauchen keine neue Version.

Anzupassen sind jeweils:

- `package.json` und `package-lock.json` (Feld `version`, im Lockfile oben und unter `packages[""]`)
- `io-package.json`: `common.version` und ein neuer Eintrag ganz oben in `common.news`
  (alle Sprachen: en, de, ru, pt, nl, fr, it, es, pl, uk, zh-cn; **höchstens 7 Einträge** behalten, ältere
  einfach entfernen – der Repository-Builder kürzt sonst, der `release-guard` prüft das)
- `README.md`: Abschnitt `### <version> (<datum>)` oben im Changelog, Einträge auf Englisch im Stil
  `- (Exc3pt10n) …`

Wird ein Pull Request erweitert, bevor er gemergt ist, bleibt es bei dieser einen Erhöhung
(ggf. von Patch auf Minor anheben). Nach einem Merge beginnt die nächste Änderung mit einer neuen Erhöhung.

### Release

Releases entstehen automatisch über den zentralen Workflow aus
[Exc3pt10n/ioBroker-workflows](https://github.com/Exc3pt10n/ioBroker-workflows) (eingebunden in
`.github/workflows/test-and-release.yml` über `@v1`, Dateiname wie vom ioBroker-Repochecker und für Trusted
Publishing erwartet). Nach einem Merge auf `main` laufen alle Checks; nur wenn sie grün sind und die Version aus
`package.json` noch keinen Tag hat, legt der Release-Job an:

- den annotierten Tag `vX.Y.Z`,
- ein GitHub-Release mit den Notes aus dem Changelog-Abschnitt der README und dem fertig gebauten
  `iobroker.philips-hue-X.Y.Z.tgz` als Asset,
- danach veröffentlicht der Job `deploy` (`npm-publish.yml`) genau dieses `.tgz` auf npm (Trusted Publishing,
  kein Token).

Tags, Releases und npm-Versionen also nie selbst anlegen, pushen oder veröffentlichen – insbesondere nicht bei
einem Versionssprung auf einem Feature-Branch. Ist lokal versehentlich ein Tag entstanden, ihn mit
`git tag -d vX.Y.Z` wieder löschen. Ein Merge ohne Versionssprung (z. B. nur Werkzeuge) erzeugt kein Release.

Der `release-guard` im Workflow prüft die Regeln oben maschinell: Ändert ein Pull Request ausgelieferte Dateien
(`files`/`main` aus `package.json`, `io-package.json`, `src/`) oder Laufzeit-Abhängigkeiten (auch nur im Lockfile,
z. B. durch `npm audit fix`), muss die Version erhöht und vollständig eingetragen sein.

## Verteilung über npm

Der Adapter wird über npm verteilt (Parameter `npm-package: true` im zentralen Workflow), vorerst nicht über das
ioBroker-Repository:

- Es gibt **kein** `prepare`-Skript: Nutzer bekommen das fertig gebaute Paket, der Build läuft nur in der CI.
- `common.nogit` ist in `io-package.json` gesetzt (der Build liegt nicht im Repository).
- `@iobroker/testing` bleibt auf dem aktuellen Stand (6.x, bringt mocha und chai mit), `admin` als globale
  Abhängigkeit mindestens 7.6.20.
- Alles, was der Build braucht, steht in `devDependencies`.
- Für Tester ohne npm-Version: das `.tgz` am jeweiligen GitHub-Release
  (`iobroker url https://github.com/Exc3pt10n/ioBroker.philips-hue/releases/download/vX.Y.Z/iobroker.philips-hue-X.Y.Z.tgz philips-hue`).
  Eine Installation aus `tarball/main` funktioniert nicht.
- Im Code die Timer des Adapters (`this.setTimeout`/`this.clearTimeout`) statt der globalen verwenden, in
  TypeScript-Interfaces Methoden als Property-Signatur schreiben (sonst Repochecker E5005).

Vor einem Pull Request auf Funde des ioBroker-Repocheckers achten:

```bash
npx @iobroker/repochecker https://github.com/Exc3pt10n/ioBroker.philips-hue <branch>
```

## Automatische Tests (GitHub Actions)

`.github/workflows/test-and-release.yml` folgt dem ioBroker-Standard: `check-and-lint` (offizielle ioBroker-Action),
`adapter` (zentraler Workflow), `adapter-tests` (offizielle ioBroker-Action auf Linux, Windows und macOS mit
Node 22, 24 und 26) und `deploy` (nach einem Release auf npm). Der zentrale Workflow prüft:

- Pull Requests und `main`: Lint, Typprüfung, Build, Unit- und Paket-Tests auf Node 22 und 24,
  Integrationstest, Installationstest (Installation des gepackten Pakets wie aus npm),
  `npm audit` der Laufzeit-Abhängigkeiten und bei Pull Requests der `release-guard`
- wöchentlich: volle Matrix Linux und Windows, Node 22, 24 und 26

Pflicht-Checks im Branch-Schutz von `main` sind `adapter / ci-result` und `check-and-lint`.

Änderungen an den Checks oder am Release gehören in das zentrale Repo, nicht in diesen Adapter. Wird die
Node-Mindestversion geändert: `engines` in `package.json`/`package-lock.json`, README (Voraussetzungen) und
ggf. den Parameter `node-versions` in `test-and-release.yml` gemeinsam anpassen.

Dependabot mergt nur Entwicklungs-Abhängigkeiten automatisch (`.github/auto-merge.yml`). Updates von
Laufzeit-Abhängigkeiten brauchen einen Patch-Release und werden von Hand gemergt.

## Prüfen vor dem Push

```bash
npm run lint && npm run check && npm test && npm run build
```

Den `release-guard` lokal ausführen (mit einem Klon von ioBroker-workflows daneben):

```bash
node ../ioBroker-workflows/scripts/check-release.mjs pr --base origin/main --npm-package true
```

Bei Änderungen an `src/main.ts` oder `src/lib/hue/` zusätzlich:

```bash
npm run test:integration
```
