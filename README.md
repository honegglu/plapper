# Plapper

Wortschatz-Trainer für Muttersprachler: seltene, aber echte Wörter aus dem Duden entdecken, im Tinder-Stil wischen, abfragen und dauerhaft behalten. Web-App für Handy und Desktop.

## Starten

```bash
npm install
npm run dev          # Entwicklungsserver auf http://localhost:5173
npm run build        # Produktions-Build nach dist/
npm run build:single # alles in einer HTML-Datei (dist-single/index.html)
npm test             # Logik-Tests (Vitest)
```

## So funktioniert die App

- **Entdecken:** Karten mit je einem Wort. Tippen zeigt Bedeutung, Beispiel, Herkunft und ähnliche Wörter.
  Nach rechts wischen = «Kenne ich», nach links = «Neu für mich» (auch per Buttons oder Pfeiltasten).
- **Abfragen:** Runden mit bis zu 10 Fragen aus dem Lernstapel. Fragetypen: Bedeutung wählen, Wort zur Bedeutung finden,
  Lückentext und «Stimmt's?» zum Wischen.
- **Wiederholen nach Leitner:** Jedes Wort steigt bei richtiger Antwort eine Stufe auf (fällig nach 0, 1, 3, 7, 16 Tagen),
  bei einem Fehler fällt es auf Stufe 1 zurück. Ab Stufe 6 gilt es als gemeistert.
  «Kenne ich» legt das Wort auf Stufe 4 und fragt es nach zwei Tagen zur Kontrolle ab.

## Motivation (Nudging)

| Technik | Umsetzung |
|---|---|
| Ziel setzen, Standard vorgeben | Tagesziel im Onboarding, «Normal» ist vorausgewählt und als empfohlen markiert |
| Geschenkter Fortschritt | 10 XP Startbonus, das Tagesziel ist ab dem ersten Tag angebrochen |
| Serie und Verlustaversion | Tage in Folge mit erreichtem Tagesziel; Hinweis «Deine Serie endet in X Stunden» |
| Serienschutz | Alle 7 Serientage gibt es einen Schutz (max. 2), der einen verpassten Tag überbrückt |
| Zielgradient | Ring fürs Tagesziel, Balken «noch X XP bis zum nächsten Rang» |
| Variable Belohnung | Seltene Goldwörter mit dreifachen Punkten |
| Flow und Kombos | Kombo-Multiplikator ×1.5 / ×2 / ×3, Bonus für schnelle Antworten |
| Ehrlichkeit belohnen | «Neu für mich» bringt mehr Punkte als «Kenne ich» |
| Nächste Aktion vorschlagen | Startseite zeigt immer den sinnvollsten Schritt (fällige Wörter zuerst) |
| Feiern | Konfetti beim Tagesziel und bei Rangaufstieg, 20 Auszeichnungen, 15 Ränge |

## Technik

- React 19, TypeScript, Vite, Tailwind CSS 4, Motion (Animationen), Zustand (Zustand + localStorage), Phosphor Icons, Inter.
- Design nach der Notion-DESIGN.md: violetter Primär-CTA, Pastell-Tints, 8px Buttons, 12px Karten; Hell- und Dunkelmodus (Navy).
- Schreibweise umschaltbar: Schweiz (ss) oder Deutschland (ß). Die Daten speichern die Duden-Schreibweise.
- Lernstand liegt im Browser (localStorage). Läuft die App als claude.ai-Artifact, wird der Stand zusätzlich privat pro Person synchronisiert (`src/lib/cloud.ts`).

## Wörter

`src/data/words.json` enthält 209 Einträge (Wort, Artikel, Wortart, Definition, Beispielsatz, Herkunft, Synonyme, Seltenheit 1-3).
Stilangaben wie «gehoben:» am Anfang der Definition werden automatisch als Etikett abgetrennt.
Die Definitionen sind eigene Formulierungen und wurden nicht aus dem Duden kopiert. Bitte stichprobenartig gegenprüfen.
