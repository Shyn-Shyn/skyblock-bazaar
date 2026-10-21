# RELEASE-AGENT-002: GitHub-Veröffentlichung und Image-Prüfung

Status: RELEASE
QA-Runden: 1 / 3
Rollenmodus: native PO/Developer/QA; Release mit vollständigem TOML-Fallback

## Nutzerziel und Scope

Nutzerkorrektur: „Der Agent soll sich rein auf GitHub Veröffentlichung und Prüfung des Images beschränken. Soll hier nichts mit Portainer zu tun haben.“
Dieser Vertrag ersetzt die bisherigen Live-/Portainer-Kriterien aus RELEASE-AGENT-001.
Scope: .codex/agents/bazaar_release.toml, AGENTS.md, docs/agents/WORKFLOW.md,
docs/agents/TASK-TEMPLATE.md, docs/agents/README.md und Haupt-README-Einstieg.
Betriebsanleitungen, historische Tickets, Produkt und Pipeline bleiben erhalten.
Hauptagent alleiniger Ticket-Editor, kein paralleles Schreiben.

## PO-Vertrag v1

READY durch separaten ursprünglichen PO am 21.10.2026.
Ausgangsstand sauber, main, HEAD 91b1f3f351015b1b2c7ac0010ab625ed1d03dc7e.
Bereits erteilte Push-Autorisierung dieses zusammenhängenden Konfigauftrags gilt
nach Abnahme weiter: origin/main, https://github.com/Shyn-Shyn/skyblock-bazaar.git.
Keine erneute fachliche Bestätigung nötig, technische Freigaben bleiben wirksam.
Fehlendes Docker darf durch passende CI-Evidenz ersetzt werden.

| ID | Verbindliches Soll | Prüfung |
|---|---|---|
| AC-01 | Release ausschließlich beauftragter Commit/Push und SHA-bezogene Actions-/GHCR-Prüfung. Keine Portainer-Lesepflicht, Live-Aktion, Host-/Stack-/Live-Zugriffsabfrage, Live-Berichtsfelder oder Live-Blocker. | Aktive Anweisungen/Vorlagen prüfen; fehlender Portainerzugang beeinflusst Release nicht. Allgemeine Betriebshinweise außerhalb des Agentenablaufs bleiben zulässig. |
| AC-02 | QA-PASS, PO-ACCEPTED und Nutzerautorisierung für denselben Inhalt. Status, Remote/Branch, Staging und alle Push-Commits prüfen; nur freigegebene Pfade. Keine fremden Änderungen, Force-Pushes, eigenmächtigen Merges oder Schutzumgehung. Änderungen zurück an Developer/QA/PO. | Fehlende Abnahme, Zusatzcommit, fremde Änderung, Divergenz blockieren Push. |
| AC-03 | Kontext: Repo/Ticket/Vertrag, Stand/Diff/Dateiliste, Developer-/QA-/PO-Nachweise, Autorisierung, Remote/Branch, publish-image.yml, Dockerfile. Bericht: lokale Freigabe, Push, CI/Image mit Belegen derselben vollen SHA; latest allein reicht nicht. | Pipelineabgleich: Tests/Container-Smoke/Publish/amd64/arm64/SHA-Tag; fremder grüner Lauf beweist nichts. |
| AC-04 | Explizite Netzgrenzen: maximal 30 Sekunden je Anfrage, 120 Sekunden Registry insgesamt, zehn Minuten CI-Warten je Prüflauf. Bei Ablauf Phase BLOCKED mit letztem Stand, CI-URL und Fortsetzung; keine Endlosschleifen/unbegrenzten Downloads. | Statische Prüfung; tatsächlicher Bericht nennt Grenzen/Ergebnis. Kein künstlicher Timeout-Test. |
| AC-05 | Developer/QA je node scripts/check.mjs erfolgreich; unabhängige QA für AC-01..04, PO-Abnahme. Aktualisierte Release-Rolle danach nativ oder vollständiger benannter TOML-Fallback. Nach Push Remote-SHA, CI-Endstatus inkl. Publish, SHA-Image und zugängliche Manifest-/Architekturbelege prüfen. Fehlende notwendige Evidenz BLOCKED, lokale Konfigabnahme separat. | Eigener QA-Check/Rollenstart; Release-Nachweise separat. Kein UI-Scope. |

Quellen geprüft 21.10.2026: vorhandene Projektdateien und zuvor geöffnete
https://learn.chatgpt.com/docs/agent-configuration/subagents. Keine Schema-,
Modell- oder Marktregeländerung. Keine offene Produktentscheidung.

## Developer-Übergabe

Separate native Rolle bazaar_developer: sechs freigegebene Inhaltsdateien
angepasst. Portainer-/Livepflichten und Berichtsfelder entfernt, Git/QA/PO-
Gates und SHA-Belege erhalten; Netzgrenzen 30s/120s/10min ergänzt.
node scripts/check.mjs: Syntax erfolgreich, 38/38 Tests PASS.
git diff --check PASS. Keine Produkt-/Pipeline-/Betriebsdocänderung,
historische Tickets unverändert. Kein Commit/Push; Developer schreibt ab jetzt nicht.

## QA Runde 1

PASS durch separaten nativen bazaar_qa, keine Befunde. AC-01..04 vollständig
geprüft; AC-05 lokaler Anteil PASS, tatsächlicher Release folgt separat.
Eigener node scripts/check.mjs: Syntax erfolgreich, 38/38 Tests bestanden.
git diff --check PASS; Index leer; keine Produkt-/UI-/Pipeline-/Betriebsdocänderung.
Ticket und sechs Inhaltsdateien geprüft; wahrheitsgetreue QA-/PO-/Release-
Audit-Ergänzungen durch Hauptagent erlaubt, Vertrag/Inhalte bleiben gebunden.
QA_CONTENT_SHA256: b1e06336eb390045c2dcc01024ae2d37a29ab4adbb577fd5f63662480eda6865.
Formel: je Datei Pfad + LF + CRLF-zu-LF-normalisierter Inhalt + LF.
Reihenfolge: .codex/agents/bazaar_release.toml, AGENTS.md, README.md,
docs/agents/README.md, docs/agents/TASK-TEMPLATE.md, docs/agents/WORKFLOW.md.

## PO-Abnahme und Abschluss

ACCEPTED durch ursprünglichen separaten PO für Vertrag v1, AC-01..04 und
lokalen Anteil AC-05. Fingerprint selbst nachgerechnet und identisch.
LOCAL_ACCEPTED; keine Inhaltsänderungen seit QA. Rollenstart/Push/CI/Image
folgen separat; kein Gesamt-DONE ohne notwendige Nachweise.

## Release-Übergabe und Bericht

Nach Abnahme Push der sieben benannten Dateien dieses Scopes nach origin/main
autorisiert. Inhalt/Git prüfen; nur GitHub und GHCR, keine Instanzverwaltung.
Finaler tatsächlicher Release-Bericht im Hauptchat; keine zusätzliche Audit-Commit-Schleife.
Freigabe: sechs Dateien mit obigem Fingerprint plus dieses Ticket samt
wahrheitsgetreuen Audit-Ergänzungen. Basiscommit im Vertrag; Developer/QA je
38/38 Tests, PO ACCEPTED. Rollenmodus vollständiger aktualisierter TOML-Fallback.
Erlaubt: gezieltes Staging dieser sieben Pfade, Commit und normaler Push;
keine Inhaltsänderungen, Force-Pushes, Merges oder Branchschutzumgehung.
Remote-Commit/CI/Image derselben vollen SHA prüfen. gh/docker lokal fehlen.
Netzgrenzen 30s je Anfrage,120s Registry insgesamt,10min CI-Warten; bei
Sandboxproblemen technische Freigabe nutzen, keine anderen Zugangswege umgehen.
