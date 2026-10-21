# Mit dem Codex-Team arbeiten

Öffne in Codex das Projekt **Minecraft Skyblock** und beginne dort einen neuen
Chat. Der Projektpfad ist `C:\Users\SHYN\Documents\ChatGPT\Minecraft Skyblock`.
Neue Sessions laden `AGENTS.md` und in vertrauenswürdigen Projekten die
projektbezogene Konfiguration. Falls Codex den Ordner noch nicht als
vertrauenswürdig behandelt, prüfe die Projektdateien und bestätige das
Projektvertrauen im Client. Das Setup ändert keine globale Trust-/Sandboxregel.

Schreibe zum Beispiel:

> Ich möchte im Investitionsplan Items mit geringem Tagesdurchsatz klarer
> erkennen. Lass PO, Developer und QA die Anforderung nach AGENTS.md bearbeiten.

Danach genügt im Projekt normalerweise deine Anforderung. Der Hauptchat
koordiniert PO, Developer und QA; für beauftragte Veröffentlichung folgt nach
QA-PASS und PO-Abnahme ein eigener Release-Agent. Bei fachlich wichtigen
Unklarheiten fragt der PO nach. Es sind keine manuell verwalteten Rollen-Chats
und kein OpenAI-API-Key für einen eigenen Orchestrator nötig.

## Rollen und Dateien

| Datei | Aufgabe |
|---|---|
| `AGENTS.md` | automatisch gelesene Projektregeln, Delegationsauftrag |
| `.codex/config.toml` | Multi-Agent-Einstellungen, bis zu drei Subagent-Threads |
| `.codex/agents/bazaar_product_owner.toml` | Bazaar-kundiger PO |
| `.codex/agents/bazaar_developer.toml` | Umsetzung und Fehlerkorrektur |
| `.codex/agents/bazaar_qa.toml` | unabhängige Prüfung und BUG-Rückgabe |
| `.codex/agents/bazaar_release.toml` | Featurebranch/PR veröffentlichen, PR-CI und nach autorisiertem Merge das Image prüfen |
| `.github/pull_request_template.md` | Scope, Freigabestand, Prüfbelege und getrenntes Mergemandat |
| `docs/agents/WORKFLOW.md` | Übergaben, QA-Runden und Fertig-Kriterien |
| `docs/agents/BAZAAR.md` | Fachwissen, Quellen und Modellgrenzen |
| `docs/agents/TASK-TEMPLATE.md` | Vertrag und nachvollziehbarer Verlauf |
| `docs/agents/tasks/<ID>.md` | vom Hauptagenten gepflegte Feature-Tickets |
| `scripts/check.mjs` | Syntaxprüfung und alle automatisierten Tests |
| `scripts/workflow-probe.mjs` | Offline-Probe mit absichtlich falscher Erwartung |

Modelle und Denkaufwand erben die im Chat gewählten Einstellungen. PO/QA
bearbeiten laut Rollenauftrag keine Dateien, teilen aber die Berechtigungen
des Hauptchats. Die Rollen stellen keine getrennten Sicherheitsumgebungen dar.
Release läuft nach den anderen Phasen; das Limit von drei gleichzeitig
geöffneten Subagent-Threads kann bestehen bleiben.

## Featurebranch, Pull Request und Image

Für neue Features und Fehlerkorrekturen gilt standardmäßig:

1. Hauptagent prüft Arbeitsbaum, Remote und aktuellen `main`-Stand; er erstellt
   einen kurzlebigen `codex/<thema>`-Branch. Fremde Änderungen bleiben erhalten.
2. Developer setzt dort den PO-Vertrag um. QA prüft unabhängig; PO nimmt denselben
   dokumentierten Basis-/Featurestand oder freigegebenen Inhalt/Diff ab.
3. Release pusht nur freigegebene Commits, erstellt/aktualisiert einen PR nach
   `main`, hängt ihn an den Chat und prüft die aktuelle PR-CI.
4. Nur bei konkretem Nutzer-Mergemandat und aktuellen Freigaben/Prüfungen wird
   zusammengeführt. Danach prüft Release den tatsächlichen main-SHA, dessen
   erneute CI/Publish und das GHCR-SHA-Image. Abgeschlossenen Branch dann löschen.

Ein dauerhafter `develop`-Branch entfällt. Features werden nicht routinemäßig
direkt nach `main` gepusht. Eine konkrete Featureanforderung umfasst Branch-Push
und PR nach QA/PO-Abnahme, sofern du den Scope nicht etwa auf lokale Arbeit
beschränkst. Dafür ist keine zusätzliche pauschale Bestätigung nötig.
Ein Merge ist ein eigener Nutzerauftrag; PO-Abnahme oder GitHub-Approval allein
genügen dafür nicht. Ohne Mergemandat erhältst du den geprüften PR; Merge und
Image sind `NICHT_BEAUFTRAGT`.

Der Hauptagent übergibt Ticket/Vertrag, Basiscommit, Featurebranch/HEAD bzw.
freigegebenen Diff mit vollständiger Dateiliste, aktuellen Base-main-SHA,
Developer-/QA-Nachweise, PO-Abnahme, PR-/Mergemandat und Werkzeuge/Zugänge ohne
Secrets. Task- und PR-Vorlage enthalten die Felder. Eine read-only Vorprüfung
ist vor Abnahme möglich; mutierender Release erst nach den Freigaben.

PR-CI führt `node scripts/check.mjs`, Dockerbuild und Container-Smoke aus.
Sie verwendet den synthetischen Merge-SHA und nur Lesezugriff, keine expliziten
Secrets und keinen Registry-Login. Der Publish-Job ist im PR übersprungen.
Feature-HEAD, PR-CI-Merge-SHA und späterer tatsächlicher main-SHA sind getrennte
Prüfstände. Neue Featurecommits oder relevante Base-Änderungen verlangen vor
Merge erneute Prüfung; ein alter grüner Lauf reicht nicht.

Nach Push auf `main` oder manuellem Dispatch auf `main` wird erneut validiert;
erst danach veröffentlicht der eigene Publish-Job amd64/arm64-Images mit
`latest` und `sha-<vollständiger main-SHA>`. Dispatch auf Featurebranches
validiert nur. Remote-main, CI und Image müssen zusammenpassen; `latest`
allein belegt keine Version. Release endet bei GitHub-/Image-Prüfung.

Lokale Abnahme, Branch-Push, PR/CI, Merge und main-CI/Image erhalten getrennte
Status. Fehlendes Docker lokal bleibt eine konkrete Prüflücke, bis passende
externe PR-CI den Containernachweis liefert. Fehlende notwendige Zugriffe oder
Prüfungen ergeben `BLOCKED`; nicht beauftragte Phasen `NICHT_BEAUFTRAGT`.

Empfehlung für GitHub-Branchschutz: Pull Requests und erfolgreichen Check
`Validate application and container` für `main` verlangen, möglichst mit
aktueller Base. Diese Dateien aktivieren keine Schutzregeln; deren Aktivierung
muss separat tatsächlich nachgewiesen werden. Ein übersprungener Publish-Job
ist kein geeigneter Required Check.

Netzwerkanfragen sind auf höchstens 30 Sekunden je Anfrage begrenzt. Registry-
Abfragen enden insgesamt nach höchstens 120 Sekunden, CI-Warten einschließlich
Wiederholungen nach höchstens zehn Minuten je Prüflauf. Bei Ablauf folgt
`BLOCKED` mit letztem Stand, vorhandener CI-URL und konkreter Fortsetzung;
verwendete Grenzen und Ergebnisse stehen im Bericht.

Ist die neue native Rolle im laufenden Client noch nicht geladen, startet der
Hauptagent einen Standard-Subagenten mit den **vollständigen**
`developer_instructions` aus `.codex/agents/bazaar_release.toml` und dem obigen
Auftragskontext. Dieser Fallback wird im Ticket benannt; er beweist keine native
Neuladung. Neue Sessions können die projektbezogene Rolle laden.

## Sichtbarkeit und Steuerung

Im Hauptchat kannst du jederzeit „Zeige den PO-Vertrag“, „Zeige die offenen
QA-Fehler“ oder „Setze Ticket <ID> fort“ schreiben. Ergebnisse stehen außerdem
im jeweiligen Ticket. Subagent-Aktivität zeigt der Client an; in der CLI ist
`/subagents` verfügbar.

Bei QA-Fehlern sendet der Hauptagent die BUG-Liste an den Developer und lässt
danach erneut prüfen. Nach höchstens drei QA-Runden ohne Erfolg erscheint
BLOCKED mit den verbliebenen Punkten. Fehlende Browser- oder Umgebungsprüfungen
werden ausdrücklich ausgewiesen. Laufende Arbeit setzt eine aktive Codex-Session
voraus; dieses Setup ist kein unbeaufsichtigter Hintergrunddienst.

## Lokal prüfen

Node.js >=22 genügt; keine Paketinstallation erforderlich:

```powershell
Set-Location 'C:\Users\SHYN\Documents\ChatGPT\Minecraft Skyblock'
node scripts/check.mjs
```

CLI-Alternative zum App-Chat:

```powershell
codex -C 'C:\Users\SHYN\Documents\ChatGPT\Minecraft Skyblock'
```

Einmalige Probe nach Installation oder Clientwechsel im neuen Projektchat:

> Verifiziere das Agenten-Setup. Nutze die drei benannten Rollen, melde, ob die
> nativen Rollen geladen sind oder der dokumentierte Fallback nötig ist.
> PO soll SETUP-SMOKE-001 definieren. Developer führt die Offline-Probe bewusst
> mit --expected-profit 19.8 aus. QA soll CHANGES_REQUESTED melden. Gib den
> Befund an denselben Developer zurück, korrigiere die Erwartung auf 18.30125
> und lass QA erneut prüfen sowie PO abnehmen. Keine Produktänderung.

Das erste Fehlschlagen ist beabsichtigt. Der erfolgreiche zweite Lauf beweist
die korrigierte Erwartung; nur die sichtbare Delegation im neuen Chat belegt
zusätzlich, dass dieser Client die benannten TOML-Rollen tatsächlich geladen hat.
Kann ein Client keine Subagenten starten, ist die unabhängige QA nicht verfügbar;
das muss als Einschränkung erscheinen. Alte Chats gegebenenfalls neu starten.

## Pflege

Fachregeln bei relevanten Änderungen mit aktuellen Hypixel-Quellen prüfen und
Prüfdatum notieren. Bei Stackänderungen Projektkarte/Prüfbefehl aktualisieren.
Push, Merge und Deployment benötigen einen passenden Nutzerauftrag. Bereits
erteilte Autorisierung innerhalb ihres Umfangs erfordert keine erneute
fachliche Bestätigung. Die PO-Abnahme allein erzeugt keinen Release-Auftrag.
Notwendige offene Release-Aufgaben bleiben im Gesamtabschluss sichtbar.

Referenz für die Konfiguration:
[OpenAI: Custom agents / Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
und [Konfiguration](https://learn.chatgpt.com/docs/config-file/config-reference).
