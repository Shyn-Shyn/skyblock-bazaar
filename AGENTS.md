# Skyblock Exchange: Codex-Team

## Projekt

Deutschsprachiger, selbst gehosteter Hypixel-SkyBlock-Bazaar-Scanner und
Investitionsplaner. Trades führt der Spieler im Spiel aus.
Node.js >=22, ESM, keine npm-Abhängigkeiten, kein Frontend-Framework oder Build.

- `server.mjs`: HTTP, Hypixel-Cache, Datenalter, Item-/NPC-Daten.
- `polling.mjs`: Abfrageintervall, Backoff, Retry-After.
- `public/market.mjs`: Analyse, Eingaben, Budgetallokation.
- `public/app.mjs`, `index.html`, CSS: UI, LocalStorage, CSV.
- `test/*.test.mjs`: deterministische Node-Tests ohne Netzwerk.
- Docker/Portainer: Betrieb; `.github/workflows/publish-image.yml` veröffentlicht
  nach erfolgreicher Prüfung Images bei Push auf `main`; PRs werden ohne Publish geprüft.

## Branches und Pull Requests

Für Features und Fehlerkorrekturen gilt GitHub Flow: kurzlebiger Branch
`codex/<thema>` von aktuellem `main`, dann Pull Request nach `main`.
Kein dauerhafter `develop`-Branch und kein routinemäßiger Feature-Push direkt
nach `main`. Der Hauptagent prüft vor Änderungen Arbeitsbaum, Remote und
Remote-main, dokumentiert Basiscommit/Branch und erhält fremde Änderungen.
Bei schmutzigem oder abweichendem Checkout erst klären, nichts überschreiben.
Developer arbeitet auf diesem Branch. QA und PO prüfen denselben dokumentierten
Inhalt (Basis, Feature-HEAD oder Diff mit vollständiger Dateiliste).
Die konkrete Featureanforderung umfasst im etablierten Ablauf Branch-Push und
PR-Erstellung nach QA/PO-Abnahme, sofern der Nutzer etwa durch local-only nicht
einschränkt. Dafür keine zusätzliche pauschale Bestätigung verlangen.

## Standardablauf bei Entwicklungsanforderungen

Der Hauptagent koordiniert. Delegiere an drei getrennte Subagenten:
`bazaar_product_owner` -> `bazaar_developer` -> `bazaar_qa`.
Für beauftragte GitHub-Veröffentlichung folgt nach QA und PO-Abnahme
`bazaar_release`; eine read-only Release-Vorprüfung darf früher erfolgen.
Diese Repository-Anweisung fordert die Delegation ausdrücklich an, auch wenn
der Nutzer nur eine Anforderung nennt. Keine separaten Sidebar-Chats nötig.
Für reine Erklärungen und triviale Dokumentkorrekturen genügt der Hauptagent.

1. Lies `docs/agents/WORKFLOW.md`. PO formuliert Scope, Annahmen und nummerierte
   Akzeptanzkriterien mit dem Template `docs/agents/TASK-TEMPLATE.md`.
2. Übergib den vollständigen PO-Vertrag an den Developer; warte auf dessen
   Umsetzung und Testnachweis. Nur ein Agent schreibt zur selben Zeit.
3. Übergib Vertrag, Diff und Developer-Nachweis an einen separaten QA-Agenten.
   QA prüft unabhängig und ändert keinen Anwendungscode.
4. Bei `CHANGES_REQUESTED` sende den Bericht vollständig an denselben Developer,
   danach prüft QA erneut. Maximal drei QA-Runden insgesamt, dann `BLOCKED`
   mit verbleibenden Fehlern und konkretem nächsten Schritt. Kein falsches PASS.
5. `DONE` erfordert QA-PASS für alle verbindlichen Kriterien und PO-Abnahme.
   Nicht ausgeführte notwendige Prüfungen ergeben `BLOCKED`, niemals PASS.
6. Bei vorhandenem GitHub-Auftrag übergib den abgenommenen Feature-Stand,
   Nachweise und Autorisierungsumfang an `bazaar_release`: Branch pushen,
   PR nach `main` erstellen/aktualisieren, an den Chat anhängen und aktuelle PR-CI prüfen.
   Merge nur mit konkreter Nutzerautorisierung sowie aktuellen Freigaben und
   erfolgreicher PR-CI. PO-Abnahme oder GitHub-Approval allein sind kein Mergemandat.
   Ohne Mergeauftrag endet die beauftragte Arbeit am prüfbaren PR; Merge/Image
   sind `NICHT_BEAUFTRAGT`. Neue Commits oder relevante Base-Änderungen verlangen
   erneute Prüfung vor Merge. Nach autorisiertem Merge tatsächlichen main-SHA,
   erneute CI/Publish und SHA-Image prüfen; Branch nach Abschluss löschen.
   Lokale Abnahme und Release getrennt dokumentieren; notwendige offene
   Release-Schritte verhindern Gesamt-DONE. Änderungen am abgenommenen Inhalt
   gehen zurück an Developer, unabhängige QA und PO.

Rollen stehen in `.codex/agents/*.toml`. Wenn der Client die Namen noch nicht
anbietet, lade deren `developer_instructions` in getrennte Standard-Subagenten
und melde diesen Fallback. Ohne Subagent-Tools keine unabhängige QA behaupten;
den fehlenden Schritt transparent benennen.

## Fachliche Regeln

Bei Markt-/Berechnungsänderungen `docs/agents/BAZAAR.md` verwenden. Unterscheide
belegtes Hypixel-Verhalten, aktuelles App-Modell und neue Produktentscheidung.
Spielregeln, Gebühren und Limits bei Bedarf aktuell aus Primärquellen prüfen;
Prüfdatum und URL in der Anforderung notieren. Unverifizierbare Regeln als
Annahme/offene Frage kennzeichnen. Niemals Live-Preise oder Regeln erfinden.

Schütze insbesondere Orderbuchseiten, Nettogewinn nach konfigurierten Kosten,
ganze Mengen, gemeinsames Budget, NPC-/Bazaar-Trennung und Datenalter.
Modellierter Durchsatz, Füllzeiten und Gewinn sind Schätzungen.
Die aktuelle API liefert kein vollständiges Orderbuch und keine Preishistorie.

## Umsetzung und Prüfung

Bestehenden JavaScript-Stil und kleine Module beibehalten. Keine neuen
Frameworks oder Abhängigkeiten ohne sachlichen Bedarf. UI auf Deutsch;
programmatische Bezeichner passend zum bestehenden Code.

Prüfbefehl aus dem Repo: `node scripts/check.mjs` (Syntax + vollständige Tests).
Gezielt: `node --test test/market.test.mjs` oder andere betroffene Testdatei.
Keine Installation nötig. Tests für fachliche Änderungen müssen Grenzfälle
und ein unabhängig ausgerechnetes Beispiel prüfen. UI-Änderungen zusätzlich
im Browser prüfen; falls unmöglich, die konkrete Prüflücke melden.
Die lokalen Tests sind isoliert und dürfen selbstständig ausgeführt werden.
`node server.mjs` startet dagegen echte Hypixel-Abrufe; nicht für Offline-Tests
verwenden. Testdaten statt Live-Kursen verwenden.

## Arbeitsgrenzen

Vor Änderungen Git-Status prüfen und fremde Änderungen erhalten. Hauptagent
verwaltet das Ticket unter `docs/agents/tasks/<ID>.md`; Rollen liefern Ergebnisse
zurück. Kein paralleles Editieren desselben Checkouts. Keine Secrets in Tickets.
Reversible lokale Umsetzung und Fehlerkorrektur im angefragten Scope fortsetzen.
Push, Merge und Deployment nur im Umfang des Nutzerauftrags; bereits erteilte
Autorisierung gilt weiter und erfordert keine erneute fachliche Bestätigung.
Insbesondere löst `main` nach erfolgreicher Validierung eine Image-Veröffentlichung
aus. `bazaar_release` prüft ausschließlich Branch/PR/CI und nach beauftragtem
Merge das veröffentlichte Image für den tatsächlichen main-SHA. PR-CI verwendet
einen synthetischen Merge-SHA, nicht zwingend den Feature-HEAD oder späteren main-SHA.
Seine Zuständigkeit endet nach der Image-Prüfung.
Kein Force-Push oder ungeprüfte/fremde Änderungen veröffentlichen.
Keine In-Game-Orderausführung hinzufügen,
wenn nur Analyse/Empfehlungen beauftragt wurden.
