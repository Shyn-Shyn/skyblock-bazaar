# Ablauf: Anforderung bis Abnahme

Der Hauptchat ist Koordinator und hält den Zustand. Die drei Rollen sind
separate Subagenten mit gemeinsamen Dateien; TOML definiert Rollen, keinen
deterministischen Scheduler. Der Hauptagent führt die Übergaben aktiv aus.

## Zustände und Übergaben

| Zustand | Verantwortlich | Nächster Schritt |
|---|---|---|
| INTAKE | Hauptagent -> PO | Anforderung und relevante Repo-Dateien übergeben |
| READY | PO | Vertrag mit AC-IDs, Annahmen und Testplan liegt vor |
| IMPLEMENTING | Developer | Umsetzung und eigener Prüfnachweis |
| QA | separater QA-Agent | Vertrag + aktueller Diff + Developer-Bericht |
| CHANGES_REQUESTED | QA -> Hauptagent -> derselbe Developer | vollständige BUG-Liste; anschließend erneut QA |
| ACCEPTANCE | PO | Nach QA-PASS fachliche Abnahme |
| DONE | Hauptagent | QA-PASS + PO-ACCEPTED + keine notwendige Prüflücke |
| BLOCKED | Hauptagent | offene Entscheidung/Umgebung oder drei erfolglose QA-Runden |

Ein Ticket pro Anforderung unter `docs/agents/tasks/<ID>.md` aus
`TASK-TEMPLATE.md` anlegen. Hauptagent ist alleiniger Ticket-Editor. Die Rollen
geben Berichte zurück; Developer schreibt Anwendung/Tests nur während seiner
Phase. QA wartet, bis Developer fertig ist, und prüft denselben Dateistand.
Nach jeder erneuten Änderung erlischt die betroffene QA-Freigabe.

Der Spawn-Auftrag muss enthalten: Rollenname, Repo-Pfad, Ticket/Vertrag,
konkrete Aufgabe, relevante Dateien, erlaubte Schreibrechte und Rückgabeformat.
Wenn benutzerdefinierte Rollen nicht geladen sind, Standard-Subagent mit den
vollständigen `developer_instructions` aus der betreffenden TOML starten und
Fallback im Ticket benennen. Rollen erben Modell, Berechtigungen und Tools;
die Read-only-Anweisung für PO/QA ist eine Arbeitsregel, keine Sandbox-Grenze.

## QA und Fehler-Rückgabe

Jede QA-Runde erhöht den Zähler im Ticket, höchstens drei Runden insgesamt.
`PASS` nur bei erfüllten verbindlichen ACs mit eigener Evidenz.
`CHANGES_REQUESTED` bei reproduzierbarer Abweichung.
`BLOCKED` bei fehlender notwendiger Prüfung, Zugriff oder ungeklärtem Vertrag.
Ein allgemeines Test-PASS deckt keine ungetesteten UI-/API-Eigenschaften ab.

QA sendet pro Befund beispielsweise:

```text
BUG-001 | hoch | AC-02 | CHANGES_REQUESTED
Ort: Datei und Zeile oder Reportfeld
Reproduktion: exakter Befehl / Eingaben / Fixture
Soll: 18.30125 Coins Netto pro Item
Ist: 19.8 Coins (Bruttospread als Netto bezeichnet)
Regression: Steuer von 1.25 % auf Verkaufserlös prüfen
```

Der Hauptagent sendet den unveränderten Befund an den Developer. Developer
liefert pro BUG Ursache, Fix und Prüfnachweis. QA wiederholt Reproduktion und
relevante Tests; der PO wird nur bei fachlicher Mehrdeutigkeit erneut einbezogen.
Ein geänderter Vertrag muss versioniert und erneut geprüft werden.
Nach Runde 3 ohne PASS verbleibende Punkte als BLOCKED berichten. Bei späterem
Fortsetzen Ticket, Diff und bisherigen QA-Stand lesen, keine Wiederholung ohne
neue Evidenz. Ein unterbrochener Lauf wird nicht automatisch im Hintergrund
weitergeführt.

## Fertig bedeutet

- Alle verbindlichen ACs durch unabhängige QA belegt und PO-ACCEPTED.
- `node scripts/check.mjs` erfolgreich für den finalen Dateistand.
- Betroffene UI-Abläufe geprüft oder als notwendige Prüflücke BLOCKED.
- Kurzer deutscher Abschluss: Ergebnis, Prüfungen, Grenzen und Bedienung.
- Kein Push/Merge/Deployment als Nebenwirkung der Abnahme.

## Offline-Probe der Rückgabe

`node scripts/workflow-probe.mjs --expected-profit 19.8` muss mit Fehler enden:
Die bewusst falsche Erwartung verwechselt Brutto mit Netto. QA meldet den
Befund, Developer korrigiert die Erwartung auf `18.30125`, QA führt
`node scripts/workflow-probe.mjs --expected-profit 18.30125` erneut aus.
Anschließend `node scripts/check.mjs`. Es wird kein Produktcode beschädigt.
Die Probe belegt die fachliche Prüfung/Rückgabe; eine neu gestartete Codex-
Session ist zusätzlich nötig, um das Laden der TOML-Rollen zu verifizieren.
