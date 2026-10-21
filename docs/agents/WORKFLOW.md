# Ablauf: Anforderung bis Abnahme

Der Hauptchat ist Koordinator und hält den Zustand. Die vier Rollen sind
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
| LOCAL_ACCEPTED | Hauptagent | QA-PASS + PO-ACCEPTED für dokumentierten Inhaltsstand |
| RELEASE | bazaar_release | Beauftragten GitHub-Push und CI/Image-Prüfung nach lokaler Abnahme ausführen |
| DONE | Hauptagent | Lokale Abnahme + alle beauftragten Release-Schritte belegt, keine notwendige Prüflücke |
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
Die Release-Rolle arbeitet nach den anderen Phasen; vier Rollen erfordern
keine vier gleichzeitig geöffneten Subagent-Threads. Falls erforderlich,
abgeschlossene Rollen beenden, bevor Release gestartet wird.

## Release-Übergabe und Prüfung

`bazaar_release` erhält nach QA-PASS und PO-ACCEPTED den Auftrag aus dem
Release-Abschnitt des Task-Templates. Erforderlicher Kontext:

- Repo-Pfad, Ticket und vollständiger PO-Vertrag.
- Freigegebener Basiscommit plus Diff, vollständige Dateiliste inklusive neuer
  Dateien und zu pushende Commits; bei bereits committem Stand dessen SHA.
- Developer-Bericht, unabhängige QA-Evidenz und PO-Abnahme für denselben Inhalt.
- Nutzerautorisierung mit Umfang: Commit/Push, Zielremote/-branch und Image-Publish.
  Bereits erteilte Autorisierung gilt weiter.
- Bekannte GitHub-/Registry-Werkzeuge und Zugänge sowie Image-Name, soweit
  vorhanden. Keine Secrets übergeben oder im Ticket speichern.
- Schreibrechte und gewünschter Bericht gemäß Template; Ticket bleibt beim
  Hauptagenten. Release ändert keinen Anwendungscode und keine Tests.

Eine ausdrücklich read-only Vorprüfung darf vorher Repo-/Pipelinekontext und
Blocker erheben. Vor mutierendem Release müssen die Freigaben vorliegen.
Status, Branch, Remote, Staging, aktueller Remote-Stand und alle zu pushenden
Commits sind gegen die Freigabe zu prüfen. Nur benannte freigegebene Dateien
stagen; kein blindes `git add .`, kein Force-Push, Überschreiben fremder Arbeit,
eigenmächtiger Merge/Rebase oder Umgehen von Branchschutz. Fremde Änderungen,
zusätzliche ungeprüfte Commits, fehlende QA oder ein nicht als Fast-forward
auflösbares Remote blockieren den Push. Ein Commit darf den abgenommenen Inhalt
nur verpacken. Inhaltsänderungen erfordern Developer-Korrektur, erneute
betroffene QA und PO-Abnahme. Erfolgreicher `node scripts/check.mjs`-Nachweis
muss genau zum finalen freigegebenen Inhaltsstand gehören.

Den Veröffentlichungskontext aus `.github/workflows/publish-image.yml` und `Dockerfile`
erneut lesen. Die aktuelle Pipeline startet bei Push auf `main`, testet die
Anwendung, baut ein Testimage, prüft Containerstart/Healthcheck und Icon und
veröffentlicht amd64/arm64-Images als `latest` und `sha-<vollständiger SHA>`.
Remote-Commit, erfolgreicher CI-Lauf inklusive Publish und Image müssen
derselben SHA zugeordnet werden. Ein fremder grüner Lauf oder `latest` allein
reichen nicht. CI kann den Container-Nachweis liefern, wenn Docker lokal fehlt.

Release umfasst ausschließlich GitHub-Veröffentlichung und die Prüfung des
veröffentlichten Images. Lokale Freigabe, GitHub-Push und CI/Image erhalten
getrennte Status und Belege. Fehlende notwendige GitHub-/Registry-Zugriffe oder
Prüfungen ergeben für die betroffene Phase `BLOCKED` mit nächster Aktion;
nicht beauftragte Phasen werden `NICHT_BEAUFTRAGT`. Lokale Abnahme kann dabei
vorliegen; der Gesamtabschluss muss offene beauftragte Release-Aufgaben nennen.

Jede Netzwerkanfrage ist explizit auf höchstens 30 Sekunden zu begrenzen.
Registry-Abfragen haben insgesamt höchstens 120 Sekunden, CI-Warten inklusive
Wiederholungen höchstens zehn Minuten je Prüflauf. Bei Ablauf die betroffene
Phase `BLOCKED` melden, mit letztem Stand, vorhandener CI-URL und konkreter
Fortsetzung. Keine Endlosschleifen oder unbegrenzten Downloads; verwendete
Grenzen und tatsächliche Ergebnisse im Release-Bericht nennen.

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
- Ohne Release-Auftrag endet die Arbeit lokal. Mit vorhandenem Auftrag führt
  Release ihn nach Abnahme ohne erneute fachliche Bestätigung aus; notwendige
  offene Release-Schritte ergeben BLOCKED im Gesamtabschluss.

## Offline-Probe der Rückgabe

`node scripts/workflow-probe.mjs --expected-profit 19.8` muss mit Fehler enden:
Die bewusst falsche Erwartung verwechselt Brutto mit Netto. QA meldet den
Befund, Developer korrigiert die Erwartung auf `18.30125`, QA führt
`node scripts/workflow-probe.mjs --expected-profit 18.30125` erneut aus.
Anschließend `node scripts/check.mjs`. Es wird kein Produktcode beschädigt.
Die Probe belegt die fachliche Prüfung/Rückgabe; eine neu gestartete Codex-
Session ist zusätzlich nötig, um das Laden der TOML-Rollen zu verifizieren.
