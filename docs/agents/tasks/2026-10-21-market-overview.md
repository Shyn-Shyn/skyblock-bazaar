# 2026-10-21-market-overview: Allgemeine Flip-Übersicht und Datenpflege

Status: LOCAL_ACCEPTED
QA-Runden: 2 / 3
Rollenmodus: native bazaar_product_owner, bazaar_developer, bazaar_qa, bazaar_release

## Nutzerziel und Scope

Erster Reiter als allgemeine Übersicht bester modellierter Flip-Kandidaten ohne persönliche Budget-/Strategiefilter. Investitionsplan behält Budget und Filter. Beide Ansichten erlauben Bazaar-Sell-Order und NPC-Verkauf, Einkauf jeweils Buy-Order. Manueller Refresh entfällt; Datenstand und nächste automatische Prüfung bleiben sichtbar. Itemnamen/NPC-Preise stündlich prüfen; verdrehte Namen korrigieren.

Betroffen: Server/Polling, UI/Profile/Details, Namensauflösung, Dokumentation, deterministische Tests, Offline-Browserfixtures. Nichtziele: neue Handelsarten, Soforttransaktionen, neue Gebühren-/Limitregeln, Änderung der Investitionsheuristik, Preishistorie, Orderausführung, Merge/Deployment.

## Branch und Freigabestand

- Ausgangsarbeitsbaum sauber, Branch main; keine fremden Änderungen.
- Remote: https://github.com/Shyn-Shyn/skyblock-bazaar.git
- Nach erfolgreichem fetch am 21.10.2026: HEAD = origin/main = f35005ce80423e13496b57d9690131851365f151.
- Basiscommit: f35005ce80423e13496b57d9690131851365f151; neuer Featurebranch codex/market-overview.
- Featureinhalt: vollständiger Diff gegen Basis plus neue Dateien,21Dateien gemäß Developer-/QA-Liste unten; freigegebenes Manifest a0e97a1167698f603ad7922f4aed138856ddc4acf3d731c3424636f3ec97c055. Ticket separat Hauptagent-Audit.
- Nutzerauftrag umfasst Feature, Branch-Push und PR nach main gemäß AGENTS.md; keine local-only-Grenze.
- Konkretes Mergemandat: NICHT_BEAUFTRAGT. main-CI/Image: NICHT_BEAUFTRAGT.

## PO-Vertrag v1

Vom separaten nativen PO geliefert, 21.10.2026. Keine wesentliche offene Entscheidung.

### Produktentscheidungen und Annahmen

1. „Bazaar, Sell Orders und NPC Sell“ bezeichnet zwei Ziele: Bazaar · Sell-Order und NPC · Verkauf. Einkauf bleibt Buy-Order. Keine dritte Instant-Handelsart.
2. Allgemeine Übersicht nutzt feste Vergleichsannahmen: bestehende Scannerdefaults mit 1 Mio. Coins Referenzbudget, 1 Stunde, 1 % Marktanteil, 2–50 % Netto-ROI, mindestens 1.000 Items/Tag je benötigter Seite, höchstens 6 Stunden Orderdruck, 0,1 Coins Tick, 1,25 % angenommener Bazaar-Steuer und bestehendem Mengenlimit (71.680). Empfehlungsformel bleibt erhalten. Referenzbetrag ist kein Nutzerbudget.
3. Suche, Sortierung und Merkliste bleiben kompakte Übersichtswerkzeuge. Budget-/Strategieseitenleiste ausschließlich im Plan.
4. Bazaar bleibt standardmäßig 60 Sekunden, serverseitig konfigurierbar. Keine Garantie neuer Quelldaten pro Abruf.
5. Metadatenprüfung nach Erfolg alle 3.600 Sekunden. Nach Fehler mindestens eine Stunde bzw. längeres Retry-After. Kein minütlicher Ressourcenabruf.
6. Itemressourcennamen haben Vorrang. Fehlende SHARD_<NAME>-Namen erhalten typgebunden <Name> Shard: SHARD_SKELETON -> Skeleton Shard, SHARD_CARROT_KING -> Carrot King Shard. Fallback-Konvention, keine unabhängig belegte Zusicherung sämtlicher aktueller In-Game-Namen. Andere ID-Familien nicht pauschal umsortieren. (Die Nutzerbeschreibung „Skeleton Shards“ identifiziert die vertauschte Reihenfolge; Singular ist die explizite PO-Fallback-Konvention.)

### Quellen und Einordnung (geprüft 21.10.2026)

- https://api.hypixel.net/ : offizielle Bazaar-/Items-Dokumentation, begrenzte Summary-Orderbuchdaten, keine vollständige Historie.
- https://api.hypixel.net/v2/skyblock/bazaar : einmalige Live-Prüfung durch Hauptagent, 30s Timeout; Cache-Control public,max-age=60,s-maxage=300, Age=7. 60s sinnvoller Abrufabstand als App-Entscheidung; gemeinsamer Cache kann länger identische Daten liefern. 2–3 Minuten senken Abrufzahl und erhöhen mögliche Verzögerung, kein beweisbares Optimum.
- https://api.hypixel.net/v2/resources/skyblock/items : einmalige Live-Prüfung mit 30s Timeout; Cache-Control public,max-age=0,s-maxage=604800, Age=41920, 5680 Items; untersuchte SHARD_-IDs fehlen. Stündliche Prüfung kann identischen gecachten Quellstand liefern.
- docs/agents/BAZAAR.md, public/market.mjs und Tests belegen App-Modell, keine aktuellen Spielregeln. Keine neuen Gebühren/Spielgrenzen eingeführt.

### Verbindliche Akzeptanzkriterien

| ID | Verbindliches Soll | Prüfung |
|---|---|---|
| AC-01 | Erstaufruf aktiviert allgemeine Flip-Übersicht. Kein bearbeitbares persönliches Budget/Strategie-/Allokationsfilter dort; Ergebnisfläche nutzt freien Platz. | Offline-Browser Desktop/schmal, Tastaturreiter. |
| AC-02 | Klar beschriftete Wahl Bazaar-Sell-Order/NPC-Verkauf berechnet Übersicht neu, Einkauf bleibt Buy-Order. Keine Änderung von Planparametern. | Browser beider Ziele, Bazaar-/NPC-Fixtures, gespeichertes Planprofil vergleichen. |
| AC-03 | Übersicht nutzt feste Referenzbasis oben. Alte Scannerbudgets/-filter und neue Planänderungen beeinflussen Mengen/Ranking nicht. Basis/Modellcharakter auffindbar; Kennzahlen/Details sprechen von Referenz-/Modellwerten statt deinem Scannerbudget. | Profiltests extremer Altwerte, Browser Planbudget/ROI/Steuer ändern, gleiche Übersicht bei gleichem Snapshot/Ziel. |
| AC-04 | Plan behält Budget, Ziel, Strategie, Allokationsziele, NPC-Präferenz/-Gesamtstücklimit, Reset, Details, CSV. Gültige Planprofile bleiben. Legacy übernimmt weiterhin Budget/Steuer/Ziel in Plan, wenn noch kein Planprofil vorliegt. | Migration/Persistenztests, Browser 10M, Filter, Reiterwechsel/Reload, Plan-CSV/Details. |
| AC-05 | Suche, Sortierung, Merkliste, Pagination, Details, Übersicht-CSV bleiben. Texte/Leerzustände/Methoden/Doku passen zur allgemeinen Übersicht ohne Aufforderung zu entfernten Filtern/Budget. | Browser Treffer/Leersuche/Merken/Sortierung/Details/CSV, Textprüfung. |
| AC-06 | Refresh-Button und Event-/DOM-Zugriffe entfernt. Automatik-Erfolg, Erstfehler ohne Snapshot, Folgefehler mit Snapshot funktionieren. Kein Verweis auf entfernten Button. | Offline-Browser Erfolg/503/Folgefehler, keine Laufzeitfehler. |
| AC-07 | Marktstatus zeigt Quellzeit, laufendes Datenalter, nächste automatische Prüfung/laufende Aktualisierung. Standard 60s, längere Konfiguration/Backoff/Retry-After berücksichtigt. Alte Daten gemäß bisheriger Schwelle warnen. Abrufzeit kein neuer Quellstand. | Fake-Uhr-/Pollingtests, Browser gleicher lastUpdated/verzögertes nextRefreshAt/veraltet/Fehler. |
| AC-08 | Itemnamen/NPC beim Start, nach Erfolg frühestens +3.600.000ms; höchstens ein Ressourcenabruf gleichzeitig. Fehler erhält letzte Daten, nächste Prüfung mindestens +1h bzw. längeres Retry-After. Markt/Metadaten unabhängig. | Injizierter Fetch/Fake-Uhr: Start/+3.599.999/+3.600.000ms, Parallelaufrufe, Fehler/längeres Retry-After; offline. |
| AC-09 | Payload enthält erfolgreiche Metadaten-Abrufzeit, nächste Prüfung, Fehlerstatus. NPC-UI beider Ansichten zeigt letzte erfolgreiche Prüfung, nächste Prüfung und ggf. Fehler/alte Daten. Optionaler Quellzeitpunkt separat. Identischer Quellstand ist weder fehlende neue Prüfung noch neuer Quellstand. | Server-/Status gleicher Ressourcenstand nach Erfolg/Folgefehler, Browser beider NPC-Ansichten. |
| AC-10 | Keine NPC-Kandidaten ohne gültigen NPC-Preis oder ohne erfolgreiche Metadatenprüfung innerhalb 48h. Alter Ressourcen-Quellzeitpunkt allein sperrt aktuell geprüfte Metadaten nicht. Bazaar bei NPC-Ausfall nutzbar. | Randfälle fehlend/unmittelbar vor/bei 48h, alter itemsLastUpdated bei neuem Abruf, NPC-Ausfall/Bazaar-Erfolg. |
| AC-11 | Offizielle Namen in Originalreihenfolge, Formatcodes entfernen. Fehlende SHARD_-IDs definierte Reihenfolge/Titel-Schreibung inkl. Mehrwortnamen. Andere unbekannte IDs neutral lesbar. Einheitlich Übersicht/Plan/Details/Suche/CSV. | API-Vorrang/§-Codes/SHARD_SKELETON/SHARD_CARROT_KING/unbekannte ID testen, Browserfixture fehlender Shard-Name. |
| AC-12 | Orderbuchseiten, Netto, ganze Mengen, gemeinsames Planbudget, NPC-/Bazaar-Trennung geschützt. Vollständiger Check besteht; UI offline mit Produktionsassets geprüft. | node scripts/check.mjs, unabhängige Rechnungen unten, Browser AC-01–11; notwendige Prüflücke BLOCKED. |

### Unabhängige Rechenbeispiele

- Bazaar Gebot100/Angebot120/Tick0,1: Buy100,1, Sell119,9. Netto119,9×0,9875−100,1=18,30125 Coins/Item.
- Fluss1000/h Kauf,2000/h Verkauf,1% und1h: floor((1/(1/1000+1/2000))×0,01)=6 Stück; Einsatz600,6; Modellgewinn109,8075. Planbudget beeinflusst Referenz nicht.
- Plan24h bei gleichen Flüssen:160 Stück,16.016 Coins Einsatz,2.928,2 Gewinn, sofern sonstige Limits nicht greifen.
- NPC Buy4,1/Basis6:1,9 Coins/Item unabhängig von Bazaar-Steuer;1000/h Einkauf,1%,1h ->10 Stück,19 Coins Gewinn.

## Developer-Übergabe

Vollständiger Vertrag oben. Developer besitzt Anwendung/Tests/Doku/Fixtures im Scope, Ticket bleibt Hauptagent. Nur ein schreibender Agent gleichzeitig. Keine Dependencies/Frameworks. Neue Servermodule im Dockerfile, Browsermodule in http-assets-Allowlist berücksichtigen. Rückgabe: vollständige Dateiliste, Diff/Basis/Branch, AC-Zuordnung, Tests/Nachweise, Prüflücken; kein Push/Merge.

## QA und PO-Abnahme

### Developer-Ergebnis / geprüfter Inhalt für Runde 1

Developer schreibt seit Übergabe nicht mehr. HEAD weiterhin Basiscommit f35005ce80423e13496b57d9690131851365f151, Branch codex/market-overview. Vollständiger uncommitted Diff gegen Basis plus neue Dateien:

```text
Dockerfile
README.md
http-assets.mjs
items-cache.mjs (neu)
public/app.mjs
public/data-status.mjs (neu)
public/detail-context.mjs
public/index.html
public/market.mjs
public/profiles.mjs
public/style.css
scripts/check.mjs
server.mjs
test-support/README.md
test-support/fixture-server.mjs
test-support/setup.html
test-support/setup.mjs
test/data-status.test.mjs (neu)
test/detail-context.test.mjs
test/items-cache.test.mjs (neu)
test/profiles.test.mjs
```

Zusätzlich ausschließlich dieses Ticket (neu, Hauptagent). AC01–05: feste Referenzübersicht/getrennte Ziele, Plan/Migration; AC06–07: Refresh entfernt, Automatik inkl. initialer Fehler/Backoff; AC08–10: unabhängiger stündlicher Single-flight-Cache, Prüfung/Quellstand und48h-Sperre; AC11: zentrale Namensauflösung; AC12: Heuristik unverändert, Regressionen erweitert.

Developer-Nachweis: node scripts/check.mjs erfolgreich (11 Syntaxprüfungen,49/49Tests). node --check test-support/fixture-server.mjs und setup.mjs erfolgreich; git -c core.safecrlf=false diff --check erfolgreich. Unabhängige Beispielwerte in Regressionen bestätigt:6Stück/600,6/109,8075, Plan160/16.016/2.928,2; NPC10/19.

Offline-Fixtures auf /__setup: extreme alte Scannerfilter, Shardnamen,60Items/Pagination, Metadatenfehler/fehlend/48h,10Min alter Marktstand,3Min Intervall,10Min Backoff,2s-Automatik mit gefrorenem Quellstand. Produktionsassets über tatsächlichen Handler, keine Live-Abfragen.

Offen: unabhängige Browser-QA und PO-Abnahme; lokales Docker fehlt, externe PR-CI muss Container-Nachweis liefern. Maximal drei QA-Runden; keine fehlenden notwendigen Prüfungen als PASS ausweisen.

### QA Runde 1: vollständiger Bericht

**QA Runde 1: CHANGES_REQUESTED.** Ein reproduzierbarer Fehler in AC-09; übrige geprüfte Funktionen ohne Befund.

Basis/HEAD: `f35005ce80423e13496b57d9690131851365f151`
Branch: `codex/market-overview`
Geprüft: vollständiger uncommitted Featureinhalt, unverändert während der QA. Keine Dateien geändert.

**BUG-001 | mittel | AC-09 | CHANGES_REQUESTED**

Ort: `public/app.mjs:219–225`, insbesondere Abbruch vor `data = result`.

Reproduktion:

1. Offline-Fixture-Server starten; `/__setup` öffnen.
2. „Beide Testprofile und Fixture zurücksetzen“ wählen.
3. „Initialer API-Fehler ·503“ wählen.
4. Anwendung neu laden.
5. In der Marktübersicht „NPC · Verkauf“ auswählen.
6. Zum Investitionsplan wechseln und ebenfalls NPC auswählen.

Die API liefert HTTP 503 wegen fehlender **Marktdaten**, enthält aber gültige Metadaten:

```json
{
  "itemsFetchedAt": 1792572764991,
  "itemsLastUpdated": 1791967964991,
  "nextItemsRefreshAt": 1792576364991,
  "itemsError": null
}
```

Soll: Beide NPC-Ansichten zeigen vorhandene erfolgreiche Metadatenprüfung, nächste Prüfung und separaten Quellstand. Fehlende Marktdaten bleiben separat erkennbar; keine Flip-Berechnung ohne Snapshot.

Ist: Beide Ansichten melden fälschlich:

> Noch keine erfolgreiche Prüfung. Nächste Prüfung läuft oder steht aus. NPC-Preise fehlen oder sind veraltet.

Ursache: Bei HTTP 503 verwirft `load()` die bereits empfangenen Metadaten; `data` bleibt `null`. `metadataStatus(data)` erhält dadurch keine vorhandenen Statusinformationen.

Regression: Initiale Bazaar-503-Antwort mit erfolgreichen Ressourcenmetadaten prüfen; Metadatenstatus muss in beiden NPC-Ansichten erhalten bleiben. Marktfehler und automatische Wiederholung müssen weiterhin funktionieren.

**Eigene AC-Prüfung**

| AC | Ergebnis | Eigener Nachweis |
|---|---|---|
| 01 | PASS | Desktop und 390×844 geprüft. Übersicht ohne Budget-/Filterseitenleiste, volle Ergebnisbreite. Mobile Tabelle horizontal scrollbar; Pfeiltasten wechseln Reiter. Viewport anschließend zurückgesetzt. |
| 02 | PASS | Bazaar-/NPC-Zielwahl verändert Übersicht. Gespeichertes Planprofil bleibt unverändert. |
| 03 | PASS | Planbudget `10M`, ROI 25 %, Steuer 3 % verändert; Übersicht bleibt bei sechs Stück und 109,81 Gewinn. Extremes altes Scannerprofil ebenfalls ohne Einfluss. Referenzbasis und Details korrekt beschriftet. |
| 04 | PASS | Budgetnormalisierung, Planfilter, Zielwahl, Reset, Reload, Planpositionen, Details und echter CSV-Download geprüft. Legacy übernimmt 1.234.567 Coins, 1,8 %, NPC; Plan startet weiter mit 24h/ROI2/zwölf Positionen. Persistenz-/Allokationstests erfolgreich. |
| 05 | PASS | Pagination 50→60 Zeilen; Sortierwahl, Suche/Leersuche, Merken und Merkliste geprüft. Merkliste reduziert Übersicht auf ein Item, Plan behält zwölf Positionen. Details und Übersicht-CSV funktionieren. |
| 06 | PASS | Refresh entfernt. Initialer 503, automatische Erholung und Folgefehler geprüft. Folgefehler hält fünf Ergebniszeilen und warnt. Keine Runtime-Warn-/Errorlogs. |
| 07 | PASS | Drei-Minuten-Intervall zeigt 182s inklusive Clientpuffer; Backoff 602s. Zehn Minuten alter Quellstand warnt bei weiterhin sichtbaren Zeilen. Beschleunigte Automatik erhält denselben Quellzeitpunkt und erhöht das Alter. Polling-/Retry-After-Tests erfolgreich. |
| 08 | PASS | Fake-Uhr-/Fetch-Tests selbst ausgeführt und Code geprüft: Start, Stundengrenze, Single-flight, Fehlererhalt, längeres Retry-After, unabhängiges Marktgate. |
| 09 | **FAIL** | Normale und fehlgeschlagene Metadatenprüfung in beiden NPC-Ansichten korrekt; initiale Markt-503-Antwort verliert vorhandenen Metadatenstatus: BUG-001. |
| 10 | PASS | Fehlende bzw. 48h alte Prüfungen ergeben in beiden NPC-Ansichten null Kandidaten. Bazaar bleibt nutzbar. Frische Prüfung bei eine Woche altem Quellstand erlaubt NPC-Flips. Exakte 48h-Grenze durch deterministische Tests bestätigt. |
| 11 | PASS | Skeleton Shard, Carrot King Shard und offizieller Name Official Skeleton Shards in Übersicht, Suche, Plan, Details und beiden heruntergeladenen CSV-Dateien geprüft. Formatcodes entfernt; API-Vorrang durch Test bestätigt. |
| 12 | PASS, Gesamtfreigabe offen | Gesamter Check erfolgreich; Orderbuch-/Netto-/Budget-/NPC-Regressionen bestehen. Keine Gesamtfreigabe wegen AC-09. |

**Ausgeführte Prüfungen**

- `node scripts/check.mjs`: **11 Syntaxprüfungen, 49/49 Tests bestanden**.
- `node --check test-support/fixture-server.mjs`: bestanden.
- `node --check test-support/setup.mjs`: bestanden.
- `git -c core.safecrlf=false diff --check`: bestanden.
- Browserprüfung ausschließlich mit Offline-Fixtures und echten Produktionsassets; keine Hypixel-Abfragen.
- Beide CSV-Inhalte selbst gelesen: Übersicht sechs Stück/600,6000 Einsatz/109,8075 Gewinn; Plan 160 Stück/16.016 Einsatz/2.928,2 Gewinn. Namen stimmen durchgängig überein.

**Vollständige geprüfte Dateiliste ohne Hauptagent-Ticket**

```text
Dockerfile
README.md
http-assets.mjs
items-cache.mjs
public/app.mjs
public/data-status.mjs
public/detail-context.mjs
public/index.html
public/market.mjs
public/profiles.mjs
public/style.css
scripts/check.mjs
server.mjs
test-support/README.md
test-support/fixture-server.mjs
test-support/setup.html
test-support/setup.mjs
test/data-status.test.mjs
test/detail-context.test.mjs
test/items-cache.test.mjs
test/profiles.test.mjs
```

Inhaltsmanifest: SHA-256 über `JSON.stringify()` des nach Pfad sortierten Arrays aus `{path,sha256}` der 21 Dateien:

`a76661a875df4e81cceb32e5d60ef03b49f343b5fc508be6c8fb22ad5928544a`

Zusätzlich vorhanden: ausschließlich das neue Hauptagent-Ticket.

Lokales Docker und externe PR-/Container-CI wurden nicht geprüft; deren Nachweis folgt separat durch Release. Keine weiteren notwendigen lokalen Prüflücken.

Offline-Server läuft weiter in Exec-Session `59349`; IAB-Tabs Setup `2` und Anwendung `3` sind für die Nachprüfung als Handoff markiert. Nächster Schritt: BUG-001 an denselben Developer, danach QA Runde 2.

### Developer-Korrektur BUG-001 / Übergabe QA Runde 2

Schreibphase beendet. Gegenüber QA1 ausschließlich public/app.mjs, public/data-status.mjs und test/data-status.test.mjs geändert. Separater itemsData-Zustand übernimmt Ressourcenfelder bereits vor HTTP-Snapshotprüfung; mergeApiData erhält alten Markt nur bei vorherigem gültigem Snapshot. Beide NPC-Ansichten nutzen itemsData; Folgefehler berechnet alten Markt mit aktuellen Ressourcen neu. Kein erfundener Markt-Snapshot.

Regression prüft initial503, erhaltenen Metadatenstatus/Backoff, Erholung und Folgefehler mit letztem Markt plus neuen Ressourcen. Developer: node scripts/check.mjs11Syntax/50Tests PASS; gezielte Statustests5/5; diff --check PASS. Die vollständige21-Datei-Liste bleibt unverändert, plus Hauptagent-Ticket. Neues Inhaltsmanifest gemäß JSON.stringify des mit .sort() nach Pfad sortierten {path,sha256}-Arrays: a0e97a1167698f603ad7922f4aed138856ddc4acf3d731c3424636f3ec97c055.

QA Runde2 prüft BUG-001 mit Originalreproduktion und betroffene Regressionen/Browsererholung erneut. Bestehende AC-Nachweise nur für unveränderten Inhalt übernehmen, aktuellen Gesamtcheck selbst ausführen.

### QA Runde 2: PASS

Separater QA-Agent bestätigt alle verbindlichen AC01–12 und schließt BUG-001. Eigener node scripts/check.mjs:11Syntax/50Tests PASS; eigener diff --check PASS. Basis/Branch unverändert, vollständige21-Datei-Liste oben. QA berechnete Manifest a0e97a1167698f603ad7922f4aed138856ddc4acf3d731c3424636f3ec97c055 unabhängig;18Dateihashes unverändert, nur die3 dokumentierten Korrekturdateien geändert. Hauptagent bestätigte dasselbe Manifest bei Fortsetzung am21.10.2026 erneut; keine fremden Änderungen.

QA2-Browserausführungsart: Direkter Browserzugang des QA-Agenten war trotz einmaligem Reset technisch nicht verfügbar. QA spezifizierte konkrete Prüfschritte/Sollwerte, Hauptagent führte ausschließlich diese UI-Aktionen als Tool-Harness aus und lieferte DOM-/AX-Rohresultate; der getrennte QA-Agent bewertete diese unabhängig. Keine Behauptung eigener direkter Browserbedienung des QA-Agenten in Runde2. Runde1-Browserprüfung erfolgte durch QA direkt.

Nachprüfungen: initialer Bazaar503 zeigt in beiden NPC-Ansichten erfolgreiche Ressourcenprüfung/nächste Prüfung/separaten Quellstand, leere Tabellen, Marktfehler und10Min-Backoff. Ressourcenfehler ohne Markt bleibt zusätzlich mit letzten Prüfzeitpunkten sichtbar. API-Erfolg führt ohne Appreload automatisch zu5Zeilen/verbundener Anzeige bei unverändertem Markt-Quellstand. Folgefehler mit fehlenden Ressourcen entfernt NPC-Kandidaten beider Ansichten; Bazaar erhält5Zeilen aus letztem Snapshot, unveränderten Quellstand und Warnung. Browserwarn-/Errorlogs leer.

Betroffene AC06/07/09/10/12 erneut bestätigt; AC01–05/08/11 aus Runde1 gelten mit identischen Dateihashes und aktuellem vollständigem Gesamtcheck weiter. Keine offenen Produktbefunde oder notwendigen lokalen Prüflücken. PO-Abnahme und externe PR-/Container-CI separat ausstehend; kein lokaler Docker-/Merge-/Deploymenterfolg behauptet.

### PO-Abnahme: ACCEPTED / LOCAL_ACCEPTED

PO hat denselben vollständigen21-Datei-Inhalt fachlich abgenommen und Manifest a0e97a1167698f603ad7922f4aed138856ddc4acf3d731c3424636f3ec97c055 selbst erneut bestätigt. Basis/HEAD und origin/main f35005ce80423e13496b57d9690131851365f151, Branch codex/market-overview. Alle AC01–12 fachlich erfüllt, BUG-001 geschlossen. Feste Referenzübersicht/Plantrennung, erhaltene Planung/Migration/Exporte, Automatik mit Quellalter, stündlicher unabhängiger Ressourcencache, Namensvorrang/Fallback und unveränderte Heuristik entsprechen dem Vertrag. QA2-Harnessverfahren nachvollziehbar und transparent; PO behauptet keine eigene erneute Test-/Browserausführung.

Lokale Freigabe gilt exakt für obiges Manifest und den dokumentierten erfolgreichen vollständigen Check11Syntax/50Tests. Release darf unverändert Commit verpacken/Featurebranch pushen/PR erstellen und aktuelle CI prüfen. Noch kein Gesamt-DONE vor externer Container-/PR-CI. Merge/main-CI/Image NICHT_BEAUFTRAGT.

## Release-Übergabe

Nach QA-PASS und PO-ACCEPTED: bazaar_release erhält Basis/Branch/Diff/Dateiliste/Nachweise. Autorisiert: Commit-Verpackung, Branch-Push, PR nach main, Anhängen, aktuelle PR-CI. Kein Merge/Image. gh und docker aktuell nicht auf PATH; Node/Git vorhanden, bestehende Git-Credentials ggf. REST nutzbar, keine Secrets ausgeben. .github/workflows/publish-image.yml und Dockerfile erneut lesen. Hauptagent alleiniger Ticket-Editor.

## Release-Bericht und Gesamtabschluss

| Phase | Status | Nachweis |
|---|---|---|
| Lokale Freigabe | PASS | QA2-PASS,PO-ACCEPTED;Manifest a0e97a1167698f603ad7922f4aed138856ddc4acf3d731c3424636f3ec97c055;11Syntax/50Tests |
| Branch-Push | ausstehend | erst nach lokaler Freigabe |
| PR/CI | ausstehend | externe CI für Build/Smoke erforderlich, kein lokales Docker |
| Merge | NICHT_BEAUFTRAGT | kein Nutzer-Mergemandat |
| main-CI/Image | NICHT_BEAUFTRAGT | kein Nutzer-Mergemandat |

Netzgrenzen:30s je Anfrage,120s Registry gesamt,10min CI-Warten je Lauf. Notwendige offene Phase verhindert Gesamt-DONE.
