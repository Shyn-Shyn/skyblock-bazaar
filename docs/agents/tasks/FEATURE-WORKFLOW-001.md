# FEATURE-WORKFLOW-001: Featurebranches und Pull-Request-Prüfung

Status: RELEASE
QA-Runden: 1 / 3
Rollenmodus: native PO/Developer/QA; Release mit vollständigem TOML-Fallback falls nötig

## Nutzerziel und Scope

Nutzer beauftragt den zuvor beschriebenen Ablauf: kurzlebige Featurebranches,
QA/PO-Abnahme, PR, Prüfung vor Merge, Image-Veröffentlichung auf main.
„Passe entsprechend das Projekt dann so an, dass jeder weiß, was zu tun ist.“
Scope: AGENTS.md, betroffene Rollen-TOMLs, Workflow, Task-Template, Agenten-README,
Haupt-README, PR-Vorlage, Actions-Pipeline und gezielte Workflow-Regressionen.
Relevante Direkt-main-Anweisungen in Betriebsdokumentation als Ersteinrichtung
abgrenzen. Keine Markt-/UI-Änderung, neue Abhängigkeit oder develop-Branch.
Keine Portainer-Aufgabe für Agenten; historische Tickets erhalten.
Hauptagent alleiniger Ticket-Editor, nur eine Schreibphase gleichzeitig.

## PO-Vertrag v1

READY durch separaten PO am 21.10.2026. Ausgangsstand sauber bei
450ced8a6e0e4dd81a6a79f7a25db7566197083e auf main. Hauptagent hat vor Änderungen
codex/feature-branch-workflow angelegt (technische Git-Freigabe eingeholt).
Auftrag autorisiert aktuellen Branch-Push und PR-Erstellung, keinen ungefragten
Merge. PO-Abnahme/GitHub-Approval ersetzen kein Nutzer-Mergemandat.
PO-Präzisierung zu AC-03/07: Eine konkrete Featureanforderung autorisiert im
übernommenen Standardablauf ihren Featurebranch-Push und PR nach QA/PO, sofern
der Nutzer nicht ausdrücklich etwa lokale Umsetzung vorgibt. Keine erneute
pauschale PR-Bestätigung; Merge bleibt konkreter gesonderter Auftrag.
Remote-main vor Implementierung mit git ls-remote geprüft: exakt obiger
Basiscommit, keine Abweichung.

| ID | Verbindliches Soll | Prüfmethode |
|---|---|---|
| AC-01 | Hauptagent prüft Arbeitsbaum, Remote und aktuellen main-Stand und wählt kurzlebigen codex/<thema>-Branch; Developer arbeitet dort. Fremde Änderungen erhalten, kein Routine-Featurepush nach main, kein develop. | Aktive Regeln/Rollen und aktuelle Branch-/Diff-Evidenz; schmutziger/abweichender Checkout klären ohne Überschreiben. |
| AC-02 | Freigaben beziehen sich auf Basiscommit, Feature-HEAD oder freigegebenen Inhalt/Diff/Dateiliste. Neue Featurecommits/relevante Base-Änderungen vor Merge erneut prüfen. PR-CI synthetischer Merge-Stand unterscheidet sich von FeatureHEAD und tatsächlichem MergeSHA. | Alter grüner Lauf, veraltete Base, ungeprüfter neuer Commit begründen keine Mergebereitschaft. |
| AC-03 | Nach QA-PASS/PO-ACCEPTED pusht Release freigegebene Featurecommits und erstellt/aktualisiert PR nach main; aktuellen PR-CI-Lauf prüfen, keine Imageveröffentlichung hier. PR an Chat anhängen, URL/Feature-/Base-/CI-Stand berichten. Git-Schutz/Netzgrenzen erhalten. | Regeln und nach lokaler Abnahme tatsächlicher Push/PR/SHA-CI separat. |
| AC-04 | pull_request nach main führt Node-Prüfung, Dockerbuild, Container-Smoke über healthz und app-icon.png aus. PR-Validierung nur contents:read, kein Registrylogin/Secrets/packages:write/pull_request_target. | Workflow-/Fork-Negativprüfung; tatsächlicher PR-Lauf belegt Tests/Build/Smoke ohne Publish. |
| AC-05 | Eigener Publishjob braucht erfolgreiche Validierung und läuft ausschließlich push auf refs/heads/main oder workflow_dispatch auf refs/heads/main. PR/Dispatch-Feature kein Publish; packages:write nur Publishjob. Tests/Build/Smoke vor jedem Publish für finalen mainSHA erneut. | Eventmatrix PR→Validate, Push-main/Dispatch-main→Validate+Publish, Dispatch-feature→kein Publish; needs/if prüfen. |
| AC-06 | Release merged nur mit konkretem Nutzerauftrag und aktuellen Freigaben/PR-Prüfungen ohne Schutzumgehung. Danach Remote-main, CI/Publish und GHCR-SHA-Image für tatsächlichen MergeSHA mit zugänglichen Manifest-/Architekturbelegen prüfen. Ohne Mergeauftrag prüfbaren PR liefern, Merge/Image NICHT_BEAUFTRAGT. | Negativszenario PO accepted ohne Mergemandat. Kein Merge nur für Einrichtungstest. |
| AC-07 | Zuständigkeiten, Scope/ACs, Basis/HEAD/Diff, lokale/externe Prüfungen und PR-/Mergeautorisierung in Rollen/Workflow/Ticket-/PR-Vorlage. Lokale Abnahme, PR/CI, optional Merge/Image getrennt. Branchschutz/RequiredChecks empfohlen, ohne Nachweis nicht als aktiv behauptet. Ersteinrichtungs-Direktpush von laufender Entwicklung getrennt. | Aktive Anweisungen konsistent, Betriebsdocs gezielt; keine Live-/Portainerpflicht. |
| AC-08 | Kleine deterministische Offline-Regressionen schützen tatsächliche Workflow-Gates: kein PR-/Dispatch-feature-Publish, Publish nur nach Validateerfolg, Schreibrecht nur Publishjob, Tests/Build/Smoke vorhanden. Fehlerhafte Workflow-Fixtures müssen scheitern. Keine YAML-/Frameworkabhängigkeit/zweiter ungenutzter Gatemechanismus. | Workflow-Konfiguration und gezielte Mutanten prüfen; Developer/QA je node scripts/check.mjs. |
| AC-09 | Lokale Konfigabnahme und externe Evidenz getrennt. Docker lokal fehlt, tatsächlicher PR-CI liefert notwendigen Containernachweis. Ohne diese Evidenz kein vollständiges CI-/ContainerPASS. Nach lokaler QA/PO darf PR für externe Prüfung veröffentlicht werden. Fehlende Zugriffe/CI-Ausfall BLOCKED für betroffene Phase. | Eigene QA, PO-Abnahme, separater Releasebericht; kein UI-Scope. |

Testplan: Dokument-/Rollenprüfung, Eventmatrix und Workflow-Regressionen;
voller Offlinecheck durch Developer und separate QA, PO-Abnahme; danach
Featurepush/PR und tatsächliche CI. Höchstens drei QA-Runden.
Quellen vom Hauptagenten am 21.10.2026 geöffnet:
- https://docs.github.com/en/get-started/using-github/github-flow
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions

pull_request nutzt standardmäßig synthetischen Merge-Commit; Forktokens sind
read-only; übersprungene Jobs sind kein geeigneter erforderlicher Prüfbeleg.
Branchschutz wird durch Repositorydateien nicht automatisch eingerichtet.
Keine Schema-, Modell- oder Marktregeländerung; keine offene Produktentscheidung.

## Developer-Übergabe

Separater nativer bazaar_developer: Schreibphase abgeschlossen, 13 Inhaltsdateien
laut aktuellem Diff inkl. PR-Vorlage und Workflowtests. node scripts/check.mjs
Syntax erfolgreich, 40/40 Tests PASS inkl. zwei Workflowtests mit Eventmatrix
und zwölf unsicheren Mutanten. git diff --check PASS. Kein Commit/Push.
Keine Produkt-/UI-/Marktänderung. Docker lokal fehlt; echte PR-Containerprüfung
folgt erst nach lokaler QA/PO separat. Developer schreibt ab jetzt nicht weiter.
Developer-Fingerprint LF-normalisiert:
81a975a3c83035c6a3409d81a8b6c7331c71ed5d3a62fcbf22ff54e6d87627d9.

## QA Runde 1

PASS durch separate native Rolle bazaar_qa, keine Befunde. AC-01/02/05/06/07/08
vollständig lokal belegt; AC-03/04/09 Konfig-/lokaler Anteil PASS, echte PR-CI
folgt nach PO-Abnahme. Eigener node scripts/check.mjs 40/40 Tests und Syntax
erfolgreich; git diff --check PASS. Kein Containererfolg ohne externen Beleg.
Basis/HEAD 450ced8, Branch codex/feature-branch-workflow selbst bestätigt.
Ticket inkl PO-Präzisierung geprüft; wahrheitsgetreue QA/PO/Release-Audit-
Ergänzungen erlaubt, Vertrag/Inhaltsdateien ohne erneute QA nicht ändern.
QA-Fingerprint identisch zum Developer: 81a975a3c83035c6a3409d81a8b6c7331c71ed5d3a62fcbf22ff54e6d87627d9.
Formel je Datei: Pfad + LF + CRLF-zu-LF-normalisierter Inhalt + LF.
Explizite Freigabereihenfolge:
1. .codex/agents/bazaar_developer.toml
2. .codex/agents/bazaar_product_owner.toml
3. .codex/agents/bazaar_qa.toml
4. .codex/agents/bazaar_release.toml
5. .github/pull_request_template.md
6. .github/workflows/publish-image.yml
7. AGENTS.md
8. GITHUB-PORTAINER.md
9. README.md
10. docs/agents/README.md
11. docs/agents/TASK-TEMPLATE.md
12. docs/agents/WORKFLOW.md
13. test/workflow.test.mjs

## PO-Abnahme und Abschluss

ACCEPTED durch ursprünglichen separaten PO für v1 inkl. Autorisierungs-
präzisierung. 13 Inhaltsdateien samt Fingerprint selbst nachgerechnet und
bestätigt. LOCAL_ACCEPTED, keine Inhaltsänderungen seit QA. Actual PR/CI
inkl. Container-Smoke noch offen; ohne notwendige Evidenz kein Gesamt-DONE.
Merge und Image NICHT_BEAUFTRAGT, kein zusätzlicher Merge nur zum Test.

## Release-Übergabe und Bericht

Aktueller Scope: Branch-Push und PR nach main autorisiert, kein Merge.
Remote https://github.com/Shyn-Shyn/skyblock-bazaar.git.
Keine Veröffentlichung von Images für diesen PR. Tatsächliche PR-CI prüfen;
finaler Bericht im Hauptchat. Ticket nur wahrheitsgetreue Audit-Ergänzungen.
Freigabe: obige 13 Inhaltsdateien mit QA/PO-Fingerprint plus dieses Ticket.
14 Pfade gezielt stagen, Inhaltsstand gegen Freigabe prüfen, Commit und
normaler Push ausschließlich codex/feature-branch-workflow. Basis450ced8,
PR-Ziel main. Keine Inhalts-/Test-/Vertragsänderung durch Release.
Rolle zuerst vollständig aus aktueller TOML als Fallback laden; gh/Docker
lokal fehlen, Git Credential Manager vorhanden. Bestehende Credentials nur
intern im Prozessspeicher für erforderliche GitHub-API verwenden, nie ausgeben.
PR an Chat anhängen; Feature-/Base-/synthetischen CI-MergeSHA getrennt
nachweisen. Validate erfolgreich inkl Tests/Build/Smoke, Publish skipped.
Netzgrenzen 30sRequest/120sRegistry/10minCI, technische Freigaben bei Bedarf.
Bei vorübergehender Modellkapazität gleicher Fallback erneut; keine
unbeauftragten Modellwechsel. Finaler tatsächlicher Bericht im Hauptchat,
keine auditbedingte zweite Commit-Schleife.
