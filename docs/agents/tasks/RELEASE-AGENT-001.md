# RELEASE-AGENT-001: Release-Agent mit GitHub- und Deployment-Nachweis

Status: RELEASE
QA-Runden: 1 / 3
Rollenmodus: native custom agents für PO/Developer/QA; neue Release-Rolle zunächst explizit geladener Fallback

## Nutzerziel und Scope

Nutzer: „Erstelle einen weiteren Agent der das Deployment prüft und die Änderungen nach Github pusht. Gib dem Agent Kontext. Falls dafür deiner Meinung nach kein eigener Agent notwendig ist kann auch der Entwickler die Aufgabe erhalten nach der Abnahme vom PO zu deployen.“

Eigene Rolle `bazaar_release`, weil Release-Nachweise und Zugriffe sich von Entwicklung und fachlicher Abnahme unterscheiden. Scope: neue Rollen-TOML, AGENTS.md, Workflow, Task-Template, Agenten-README, optional Rollenhinweis im Haupt-README. Keine Produkt-, Markt-, Docker- oder Pipelineänderung. Hauptagent alleiniger Ticket-Editor.

## PO-Vertrag v1

READY durch separaten bazaar_product_owner am 21.10.2026.
Ausgangsstand sauber, Branch main, HEAD 8e7d180da465f97307929cd1a44fca3903ebc6cd, origin https://github.com/Shyn-Shyn/skyblock-bazaar.git.
Nutzerauftrag autorisiert den Push der hier abgenommenen Änderungen nach origin/main einschließlich bestehender Image-Veröffentlichung. Keine erneute fachliche Bestätigung nötig; technische Sandbox-Freigaben bleiben wirksam. Keine pauschale Vollmacht für künftige Features, Merges oder unbekannte Produktionsumgebungen. Bereits erteilte Autorisierung gilt innerhalb ihres Umfangs weiter.
GHCR-Veröffentlichung aktualisiert Portainer nicht automatisch. Kein konkretes Live-Ziel oder Zugriff bekannt; dies blockiert gegebenenfalls die Live-Phase, nicht lokale Konfig-Abnahme. gh und docker lokal nicht gefunden. Keine Modell-/Effort- oder Parallelitätsänderung erforderlich: Release erfolgt nach den anderen Phasen.

| ID | Verbindliches Soll | Prüfung |
|---|---|---|
| AC-01 | Standalone-TOML mit name bazaar_release, deutscher Beschreibung und vollständigen developer_instructions; Modell, Tools, Berechtigungen geerbt; keine Abhängigkeiten. | Struktur/Inhalt unabhängig prüfen. |
| AC-02 | Release erst nach QA-PASS und PO-ACCEPTED für denselben Stand. Änderungen an abgenommenen Inhalten zurück an Developer/QA/PO; Release behebt keinen Anwendungscode. | Fehlende QA oder nachträgliche Änderung → kein Push. |
| AC-03 | Übergabe enthält Ticket/Vertrag, Repo, freigegebenen Stand und Diff/Dateiliste, QA-/Developer-Nachweise, PO-Abnahme, Nutzerautorisierung mit Umfang, Remote/Zielbranch, Zugänge/Zielumgebung und Rückgabeformat. Hauptagent bleibt Ticket-Editor; Fallback explizit. | Übergabevorlage prüfen. |
| AC-04 | Status, Branch, Remote, freigegebener Inhalt und tatsächlich zu pushende Commits prüfen. Nur autorisierter Scope in Commit/Staging; kein blindes git add ., Force-Push, Überschreiben fremder Änderungen, eigenmächtiger Merge oder Branchschutzumgehung. node scripts/check.mjs für finalen freigegebenen Inhaltsstand erfolgreich. | Negativszenarien fremde Änderungen, ungeprüfter zusätzlicher Commit, nicht vorwärts auflösbarer Remote. |
| AC-05 | Kontext nennt publish-image.yml, Dockerfile, GITHUB-PORTAINER.md, PORTAINER.md, portainer-ghcr.yaml, README; main-Trigger, Tests/Container-Smoke, amd64/arm64, latest und sha-<vollständiger SHA>. Remote-Commit, Workflow und Image derselben SHA zuordnen. | Gegen Dateien prüfen; fremder grüner Vorlauf oder latest allein reichen nicht. |
| AC-06 | Bericht trennt Push, CI/Image und Live-Deployment. Live-Erfolg erfordert echtes Ziel/Stack, Zugriff, beauftragte Aktion, verwendetes Image und Erreichbarkeit. /healthz belegt App-Erreichbarkeit, keine frischen Hypixel-Daten. Fehlende notwendige Prüfung BLOCKED. | Push + grünes Image ohne Portainerzugriff ergeben keinen Live-Erfolg. |
| AC-07 | Workflow/Template enthalten Release-Übergabe und Bericht: Commit/Remote/Branch, Befehle/Ergebnisse, CI-URL/Status für SHA, Image-Tag/Digest soweit nachgewiesen, Live-Ziel/Status, offene Punkte/nächste Aktion. Lokale Abnahme und beauftragter Release getrennt; offene Release-Aufgaben im Gesamtabschluss sichtbar. | Konsistente Zustände; nicht beauftragte Phase ausweisen, notwendige ungeprüfte Phase BLOCKED. |
| AC-08 | Neue Rolle mit Kontext tatsächlich starten, nativ oder transparentem Fallback. Read-only-Vorprüfung erhebt Repo-/Pipelinekontext und Blocker, ohne vor QA/PO zu pushen. Vollständiger Offline-Check, unabhängige QA für alle ACs, PO-Abnahme. Keine Secrets. | Sichtbarer Spawn/Rückgabe; eigener QA-Check. Kein UI-Scope. Native Neuladung nicht ohne Nachweis behaupten. |

Testplan: statische Konfig-/Dokumentprüfung und Negativszenarien, vollständiger Offline-Check, read-only Kontextprobe, unabhängige QA, PO-Abnahme, danach autorisierter Push und SHA-bezogene CI-Prüfung. Fehlende Authentifizierung/Zugriffe/Live-Zielinformationen konkret ausweisen.
Quellen geprüft 21.10.2026: lokale Rollen und Deploymentdateien; https://learn.chatgpt.com/docs/agent-configuration/subagents vom Hauptagenten geöffnet. Keine neuen Hypixel-Regelbehauptungen. Risiken: main-Push veröffentlicht Images, latest veränderlich, Image-Veröffentlichung beweist keine Portainer-Aktualisierung.

## Developer-Übergabe

Separate native Rolle bazaar_developer: neue .codex/agents/bazaar_release.toml;
ergänzt AGENTS.md, README.md, docs/agents/README.md, WORKFLOW.md, TASK-TEMPLATE.md.
AC-01/02 Rollenstruktur/Gates; AC-03/04 Übergabe und Git-Schutz;
AC-05/06 Pipeline-/Portainerkontext und getrennte Nachweise; AC-07 Template/Status.
git diff --check erfolgreich, node scripts/check.mjs erfolgreich: 38/38 Tests.
Keine Produkt-/Pipelineänderungen, keine UI-Prüfung erforderlich. Kein Commit/Push.
AC-08: separate read-only Kontextprobe im Standard-Agenten mit vollständigen
developer_instructions bestanden (transparenter Fallback). Native Neuladung
der neuen Rolle nicht belegt. Developer ändert ab Übergabe keine Dateien mehr.
Probe hat HEAD/Branch/Remote, leeren Index, fünf geänderte Dokumente, neue Rolle
und Ticket selbst erhoben; alle sechs Betriebskontextdateien gelesen. Pipeline
mit Tests, Container-Smoke und amd64/arm64-Publish samt SHA-Tag bestätigt.
Negativszenarien korrekt: ohne QA/PO kein Push; Inhaltsänderungen zurück in
Abnahme; fremde Änderungen/zusätzliche ungeprüfte Commits/Remote-Divergenz
blockieren; fremder grüner Lauf/latest allein beweisen nichts; kein Live-Erfolg
ohne Portainerzugriff; healthz beweist keine Marktfrische. Keine Mutationen.
Vorläufige Releasephasen BLOCKED wegen noch fehlender Abnahmen; Live-Aktion
NICHT_BEAUFTRAGT, notwendige Live-Prüfung mangels Ziel/Zugriff BLOCKED.

## QA Runde 1

PASS durch separaten nativen bazaar_qa. AC-01 bis AC-08 einzeln PASS mit
eigener Konfig-/Dokumentprüfung, Pipelineabgleich und Prüfung des Probeberichts.
Eigener node scripts/check.mjs: 38/38 Tests, Syntaxprüfungen bestanden;
git diff --check PASS, Index leer, ausschließlich vereinbarte Dateien.
Kein UI-Scope, kein nativer Neuladungsbeweis behauptet. Keine Befunde.

Abgenommene Inhaltsdateien in dieser Reihenfolge:
.codex/agents/bazaar_release.toml, AGENTS.md, README.md,
docs/agents/README.md, docs/agents/TASK-TEMPLATE.md, docs/agents/WORKFLOW.md.
QA_CONTENT_SHA256: 75515e533c44589ea47b386bb6ffe797fba146c5cf85433eddc5abcd87a73f8b.
Berechnung: pro Datei CRLF zu LF normalisieren, dann Pfad + LF + Inhalt + LF
in obiger Reihenfolge hashen. Basiscommit wie im Vertrag.
Ticket einschließlich Vertrag/Probebericht geprüft. Weitere wahrheitsgetreue
QA-/PO-/Release-Audit-Ergänzungen des Hauptagenten erlaubt; Änderungen am
Vertrag oder den sechs Inhaltsdateien benötigen erneute Prüfung.
Tatsächliche Push-/CI-/Image-/Live-Nachweise sind separat und noch offen.

## PO-Abnahme und Abschluss

ACCEPTED durch ursprünglichen separaten PO für Vertrag v1 und AC-01..08.
PO hat den QA-Fingerprint selbst nachgerechnet und bestätigt. Lokale
Rolleneinrichtung LOCAL_ACCEPTED; keine Inhaltsänderungen seit QA. Fachliche
Abnahme erweitert den Nutzerauftrag nicht. Native Neuladung nicht belegt.

## Release-Übergabe und Bericht

Push nach Abnahme autorisiert: origin/main, ausschließlich dieser Scope.
Release-Agent: bereits kontextgeprüfter Standard-Fallback mit vollständigen
Instructions aus .codex/agents/bazaar_release.toml.
Freigegeben: Basiscommit und sechs Inhaltsdateien samt Fingerprint wie oben,
zusätzlich dieses Ticket inklusive wahrheitsgetreuer Audit-Ergänzungen.
Developer/QA je node scripts/check.mjs 38/38 erfolgreich; PO ACCEPTED.
Erlaubt: gezieltes Staging dieser sieben Dateien, Scope-Commit und normaler
Fast-forward-Push nach https://github.com/Shyn-Shyn/skyblock-bazaar.git main.
Keine Merge-/Force-Push-/Produktionsvollmacht. Fehlender erforderlicher
Netzzugriff ist über technische Sandbox-Freigabe anzufragen.
Release prüft aktuellen Remote, zu pushende Commits, Staging/Commitinhalt,
Remote-SHA, zugehörigen CI-Lauf und Image. Keine Produkt-/Test-/Vertragsänderung.
gh/docker lokal nicht vorhanden, Git Credential Manager konfiguriert.
Live-Ziel/Stack/Zugriff nicht bekannt; kein konkretes Live-Update beauftragt.
Finaler Release-Bericht folgt im Hauptchat; notwendige fehlende Nachweise
werden phasenbezogen BLOCKED gemeldet, kein pauschaler Deployment-Erfolg.
