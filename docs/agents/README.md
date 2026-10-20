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
koordiniert die drei Subagenten und liefert das Ergebnis. Bei fachlich wichtigen
Unklarheiten fragt der PO nach. Es sind keine drei manuell verwalteten Chats
und kein OpenAI-API-Key für einen eigenen Orchestrator nötig.

## Rollen und Dateien

| Datei | Aufgabe |
|---|---|
| `AGENTS.md` | automatisch gelesene Projektregeln, Delegationsauftrag |
| `.codex/config.toml` | Multi-Agent-Einstellungen, bis zu drei Subagent-Threads |
| `.codex/agents/bazaar_product_owner.toml` | Bazaar-kundiger PO |
| `.codex/agents/bazaar_developer.toml` | Umsetzung und Fehlerkorrektur |
| `.codex/agents/bazaar_qa.toml` | unabhängige Prüfung und BUG-Rückgabe |
| `docs/agents/WORKFLOW.md` | Übergaben, QA-Runden und Fertig-Kriterien |
| `docs/agents/BAZAAR.md` | Fachwissen, Quellen und Modellgrenzen |
| `docs/agents/TASK-TEMPLATE.md` | Vertrag und nachvollziehbarer Verlauf |
| `docs/agents/tasks/<ID>.md` | vom Hauptagenten gepflegte Feature-Tickets |
| `scripts/check.mjs` | Syntaxprüfung und alle automatisierten Tests |
| `scripts/workflow-probe.mjs` | Offline-Probe mit absichtlich falscher Erwartung |

Modelle und Denkaufwand erben die im Chat gewählten Einstellungen. PO/QA
bearbeiten laut Rollenauftrag keine Dateien, teilen aber die Berechtigungen
des Hauptchats. Die Rollen stellen keine getrennten Sicherheitsumgebungen dar.

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
Das Team erstellt lokale Änderungen; Push, Merge und Deployment brauchen einen
eigenen Auftrag. Push auf `main` startet hier die vorhandene Image-Pipeline.

Referenz für die Konfiguration:
[OpenAI: Custom agents / Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
und [Konfiguration](https://learn.chatgpt.com/docs/config-file/config-reference).
