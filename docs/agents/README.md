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
| `.codex/agents/bazaar_release.toml` | freigegebenen Stand nach GitHub pushen, CI und veröffentlichtes Image prüfen |
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

## GitHub-Veröffentlichung und Image-Prüfung

Für einen Release-Auftrag genügt beispielsweise:

> Setze die Änderung nach AGENTS.md um. Nach QA-PASS und PO-Abnahme soll
> bazaar_release die abgenommenen Änderungen nach origin/main pushen und die
> Image-Veröffentlichung prüfen.

Der Hauptagent übergibt Ticket/Vertrag, freigegebenen Inhaltsstand samt Diff
und Dateiliste, Developer-/QA-Nachweise, PO-Abnahme, Nutzerautorisierung und
Remote/Zielbranch sowie bekannte GitHub-/Registry-Werkzeuge und Zugänge ohne
Secrets. Die vollständige Übergabe und Rückgabe
stehen im Task-Template. Eine read-only Vorprüfung ist auch vor Abnahme möglich.
Mutierender Release beginnt erst nach den Freigaben für denselben Inhalt.

Release schützt fremde Änderungen und prüft alle zu pushenden Commits. Lokale
Freigabe, Push und CI/Image erhalten getrennte Nachweise. Push auf `main`
startet die bestehende Pipeline mit Tests, Container-Smoke und amd64/arm64-
Images. Der konkrete Commit muss im Remote, CI-Lauf und `sha-<vollständiger SHA>`-
Image übereinstimmen. `latest` allein belegt keine Version.

Die Zuständigkeit des Release-Agenten endet mit der Prüfung des veröffentlichten
Images. Fehlt ein nötiger GitHub-/Registry-Zugang, meldet Release diese Phase
`BLOCKED` mit nächster Aktion; lokale Abnahme bleibt davon getrennt.
Nicht beauftragte Phasen sind `NICHT_BEAUFTRAGT`.

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
