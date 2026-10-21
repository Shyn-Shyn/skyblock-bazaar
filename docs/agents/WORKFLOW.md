# Ablauf: Anforderung bis Abnahme

Der Hauptchat ist Koordinator und hält den Zustand. Die vier Rollen sind
separate Subagenten mit gemeinsamen Dateien; TOML definiert Rollen, keinen
deterministischen Scheduler. Der Hauptagent führt die Übergaben aktiv aus.

## Zustände und Übergaben

| Zustand | Verantwortlich | Nächster Schritt |
|---|---|---|
| INTAKE | Hauptagent -> PO | Anforderung und relevante Repo-Dateien übergeben |
| READY | PO/Hauptagent | Vertrag liegt vor; Basiscommit und codex/<thema>-Branch dokumentiert |
| IMPLEMENTING | Developer | Umsetzung und eigener Prüfnachweis |
| QA | separater QA-Agent | Vertrag + aktueller Diff + Developer-Bericht |
| CHANGES_REQUESTED | QA -> Hauptagent -> derselbe Developer | vollständige BUG-Liste; anschließend erneut QA |
| ACCEPTANCE | PO | Nach QA-PASS fachliche Abnahme |
| LOCAL_ACCEPTED | Hauptagent | QA-PASS + PO-ACCEPTED für dokumentierten Inhaltsstand |
| PR | bazaar_release | Freigegebenen Featurebranch pushen, PR nach main erstellen/aktualisieren, PR-CI prüfen |
| MERGE | bazaar_release | Nur mit konkretem Nutzer-Mergemandat und aktuellen Freigaben/PR-Prüfungen |
| IMAGE | bazaar_release | Tatsächlichen main-SHA und dessen erneute CI/Publish/Image prüfen |
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

## Featurebranch vor der Umsetzung

Der Hauptagent prüft `git status`, Branch, Remote und den aktuellen Remote-main.
Er dokumentiert den Basiscommit und erstellt einen kurzlebigen `codex/<thema>`-
Branch vom aktuellen `main`. Bei fremden Änderungen oder abweichender Historie
erst klären und erhalten, nicht resetten oder ungeprüft übernehmen. Ein bereits
passender Featurebranch darf fortgesetzt werden. Developer ändert nur dort
Dateien; kein dauerhafter `develop` und kein routinemäßiger Feature-Push nach main.

Eine neue Featureanforderung umfasst im etablierten Ablauf Branch-Push und
PR-Erstellung für genau diesen Scope nach QA/PO-Abnahme. Dafür keine erneute
Nachfrage, sofern der Nutzer den Auftrag nicht etwa auf lokale Arbeit begrenzt.
Ein Merge braucht zusätzlich einen konkreten Nutzerauftrag. Weder PO-Abnahme
noch eine GitHub-Review erteilen diese Autorisierung.

QA/PO prüfen dokumentierten Basiscommit, Feature-HEAD oder freigegebenen Inhalt
mit Diff und vollständiger Dateiliste. Neue Featurecommits oder relevante
Änderungen an der PR-Basis verlangen erneute Prüfung vor Merge. Ticket-Audit-
Ergänzungen dürfen keine ungeprüften Vertrags-/Produktänderungen verstecken.

## Release-Übergabe und Prüfung

`bazaar_release` erhält nach QA-PASS und PO-ACCEPTED den Auftrag aus dem
Release-Abschnitt des Task-Templates. Erforderlicher Kontext:

- Repo-Pfad, Ticket und vollständiger PO-Vertrag.
- Basiscommit, Featurebranch/HEAD, aktueller Remote-main-SHA und freigegebener
  Diff mit vollständiger Dateiliste inklusive neuer Dateien und Push-Commits.
- Developer-Bericht, unabhängige QA-Evidenz und PO-Abnahme für denselben Inhalt.
- Nutzerauftrag mit PR-Scope und gegebenenfalls gesondertem Mergemandat.
  Bereits erteilte Autorisierung gilt innerhalb ihres Umfangs weiter.
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

Den Veröffentlichungskontext aus `.github/workflows/publish-image.yml` und
`Dockerfile` erneut lesen. Release pusht die freigegebenen Commits auf den
Featurebranch, erstellt/aktualisiert einen PR nach `main` und hängt dessen URL
mit `attach_artifact` an den Chat. Der PR-Bericht nennt Feature-HEAD, Base-SHA,
PR-URL, CI-Lauf und dessen synthetischen Merge-SHA. Ein alter grüner Lauf reicht
nicht. Vor Mergebereitschaft aktuellen Feature-/Base-Stand erneut vergleichen.

Die Pipeline validiert PRs nach `main` mit `node scripts/check.mjs`, Dockerbuild
und Container-Smoke über `/healthz` und `/app-icon.png`. Der `validate`-Job hat
nur `contents: read`, keine Registry-Anmeldung und keine expliziten Secrets.
Der Standard-Checkout prüft den synthetischen PR-Merge-Stand, nicht zwingend
den Feature-HEAD. `publish` muss in PR-Läufen übersprungen sein.

Ohne konkreten Nutzer-Mergeauftrag endet die Arbeit am geprüften PR; Merge und
Image sind `NICHT_BEAUFTRAGT`. Ein vorhandener Mergeauftrag wird nach aktuellen
QA-/PO-Freigaben und erfolgreicher aktueller PR-CI ohne Schutzumgehung ausgeführt.
Neue Featurecommits oder relevante Base-Änderungen benötigen erneute Prüfung.
Merge gegen den geprüften Feature-HEAD ausführen und tatsächlichen main-SHA
anschließend am Remote bestätigen. Featurebranch erst nach bestätigtem Merge
löschen, sofern er nicht weiterverwendet wird.

Nach Push auf `main` validiert die Pipeline den tatsächlichen main-SHA erneut.
Der davon abhängige `publish`-Job hat als einziger `packages: write` und
veröffentlicht amd64/arm64-Images als `latest` und `sha-<vollständiger SHA>`.
Manueller `workflow_dispatch` veröffentlicht ebenfalls nur auf `refs/heads/main`;
auf Featurebranches wird nur validiert. Remote-main-SHA, erfolgreicher main-CI-
Lauf einschließlich Publish und Image müssen zusammenpassen. `latest` allein
reicht nicht. PR-CI-SHA und tatsächlicher main-SHA sind getrennte Nachweise.

Lokale Abnahme, Branch-Push, PR/CI, Merge und main-CI/Image erhalten getrennte
Status. Fehlende notwendige Zugriffe oder Prüfungen ergeben `BLOCKED` mit
nächster Aktion; nicht beauftragte Phasen sind `NICHT_BEAUFTRAGT`. Fehlendes
lokales Docker ist eine Prüflücke, bis passende externe PR-CI den Container-
Nachweis liefert. Vorher keinen vollständigen Container-/CI-Erfolg behaupten.
Die lokale Konfigabnahme erlaubt den PR-Push für diese externe Prüfung.
Release bleibt ausschließlich für GitHub-Veröffentlichung und Image-Prüfung zuständig.

## Empfohlener Branchschutz

In den GitHub-Einstellungen für `main` Pull Requests und den erfolgreichen Check
`Validate application and container` verlangen, möglichst mit aktueller Base.
Der übersprungene Publish-Job ist kein geeigneter erforderlicher Check.
Diese Repositorydateien aktivieren keine Branchschutz-Regeln. Ohne tatsächlichen
Nachweis niemals behaupten, die Empfehlung sei bereits technisch erzwungen.
PO-Abnahme im Ticket ersetzt keine konfigurierte GitHub-Review.

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
