# 2026-10-20-separated-planning: Getrennte Filter und praktikabler Investitionsplan

Status: DONE
QA-Runden: 2 / 3
Rollenmodus: native custom agents

## Nutzerziel und Scope

Alle Flips und Investitionsplan erhalten unabhängig einstellbare Filter. Der Product Owner untersucht die geringe Budgetauslastung bei Bazaar-Sell-Offers und verbessert die Planung fachlich. NPC-Pläne sollen kleinere, manuell praktikable Kaufmengen stärker gewichten. Umsetzung im bestehenden Node-/ESM-Stack; kein Push, Merge, Deployment oder In-Game-Handel.

Ausgangsstand: fremde Änderung an README.md; untracked .codex/, AGENTS.md, docs/, scripts/. Diese Inhalte bleiben erhalten. Hauptagent ist alleiniger Ticket-Editor. PO und QA arbeiten read-only; Developer erhält exklusiv die Schreibphase für Anwendung und Tests.

## PO-Vertrag v1

PO: bazaar_product_owner, READY am 2026-10-20. Grundlagen: WORKFLOW.md, TASK-TEMPLATE.md, BAZAAR.md.

### Ursachen und Produktentscheidungen

Scanner zeigt alternative Einzelpositionen, Plan verteilt gemeinsames Kapital. Bisher teilen beide appliedSettings/candidates. 1 Stunde × 1 % und sequentielle Buy-/Sell-Beine begrenzen die Kapazität stark (bestehendes Testprodukt: 6 Stück trotz 1 Mio Budget). Der Allokator maximiert Gewinn, nicht Kapitalnutzung. NPC-Stückaufwand fehlt.

Scanner behält seine bisherigen Defaults. Plan: horizon=24 Stunden, share=1 %, maxPositions=12, maxAllocation=100 %, übrige übliche Filter wie bisher. 24 Stunden sind ein expliziter Planungszeitraum, keine Füllgarantie.

Bazaar-Ziel: `budget` / „Budget ausschöpfen“ (Default: tatsächlichen Einsatz vor wirklichem Nettogewinn maximieren) oder `profit` / „Nettogewinn“ (Gewinn, dann weniger Positionen, dann Budgetnutzung). Budgetziel kann geringeren Gewinn wählen. Keine automatische Lockerung von Liquidität, Filtern oder Zeitgrenzen. Begrenzte Heuristik, kein global exakter Optimierer.

NPC (nur Plan): maxNpcItems=2048 als konfigurierbares Gesamtstücklimit über alle Positionen (positive ganze Zahl bis 1e9); npcPreference=`compact` / „Wenige Stück bevorzugen“ (Default) oder `profit` / „Nettogewinn“. compact vergleicht vollständige Varianten über utility=profit/(1+Gesamtstückzahl/64), danach weniger Stücke, dann höherer tatsächlicher Gewinn. Globales Stückbudget wird schon beim Variantenbau berücksichtigt; auch profit respektiert es. 64 ist reine Skalierung der Produktheuristik, 2048 persönliche Planungsvorgabe, keine Hypixel-/Stackregel oder Verkaufszeit. Tatsächlichen Gewinn immer unverändert anzeigen. NPC-Ziel ersetzt dort Bazaar-Ziel; Aufwand darf bewusst Restbudget erzeugen.

Migration in versioniertes Profilformat mit scanner/plan: gültiges bisheriges `bazaar-settings` vollständig für Scanner übernehmen; Plan übernimmt nur budget, tax, destination und bekommt sonst neue Plan-Defaults. Einmalig; danach neue Profile maßgeblich. Keine Legacy-Daten: jeweilige Defaults. Fehlende/fehlerhafte Profile einzeln robust normalisieren. Plan-Startwerte sichtbar erläutern. Merkliste global; Suche/Sortierung/Merkliste filtern nur Scanner.

Scope: public/market.mjs, public/app.mjs, public/index.html, bei Bedarf CSS/kleine isolierte Module, test/*.test.mjs, Funktionsdokumentation. Nichtziele: Server-/Polling-/Spielregeländerungen, Live-Orders, Preishistorie, Deployment.

### Verbindliche Akzeptanzkriterien

| ID | Soll | Prüfmethode / Beispiel |
|---|---|---|
| AC-01 | Eigener Zustand je Ansicht für budget,destination,tax,minRoi,minProfit,minDaily,horizon,share,maxQuantity,tick,maxRoi,maxQueue und planerische Parameter. Änderung in A ändert weder Einstellungen noch Ergebnisse/CSV von B. Tabwechsel stellt Zielprofil dar; Filterkopf benennt aktive Ansicht. | Browser: Scanner Budget1000/ROI10, Plan Budget2000/ROI2/NPC; mehrfach wechseln, Ergebnisse prüfen. |
| AC-02 | Beide Profile nach Reload erhalten; einmalige Migration wie oben; Reset nur aktive Ansicht, anderes Profil und Merkliste erhalten. Neue/fehlerhafte Profile und Enums validieren, ganze Limits normalisieren. | Legacy budget1234567,tax1.8,destination npc,horizon3,minRoi7: Scanner unverändert; Plan Budget/Steuer/Ziel übernommen, horizon24,minRoi2,maxPositions12. Deterministische Profiltests und Browser. |
| AC-03 | Ungültiges Budget verwendet letzten gültigen Profilwert. Anderes Profil bleibt wechselbar und gültig bearbeitbar; keine unkontrollierte Übernahme ungültiger Formwerte. | Browser: „kaputt“, wechseln, ändern, zurückwechseln und korrigieren. |
| AC-04 | Alle Kennzahlen, Preis-/Steuertexte, NPC-Status, Strategiehinweise beziehen sich auf aktive Ansicht. Scanner zeigt Einzelalternativen; Plan-Details zeigen Planmenge/Profil/Ziel und kenntlich gemachte Kapazitätsalternative ohne fremde Scannerwerte. CSVs stammen aus zugehörigem Profil, Plan mit gemeinsamen Mengen. | Browser: verschiedene Ziele, gleiches Item, beide CSV-Inhalte prüfen. |
| AC-05 | Eigene Defaults sichtbar/wirksam: Plan24h/1%/12Positionen/100%, Scanner1h/6Positionen. | TEST_ITEM bereinigte Raten1000/2000 je Stunde, Zyklus666.6667; 1%×24h=160 Stück statt6. Einkauf100.1, Verkauf119.9, Steuer1.25%: Netto18.30125/Stück, Einsatz16016, Netto2928.2 bei1M Budget, ein Item/keine Queue. |
| AC-06 | Bazaar-Ziel budget priorisiert Einsatz, profit Nettogewinn. Aktives Ziel und möglicher Zielkonflikt sichtbar; kein Höchstgewinnversprechen bei budget. | Budget1000/maxPositions1: A buy100,qty5,profit50=>Einsatz500/Gewinn250; B buy10,qty100,profit2=>1000/200. budget wählt B, profit A. |
| AC-07 | Kein Rest allein wegen fehlenden Auffüllens noch bezahlbarer zulässiger Menge bei freiem Slot. Innerhalb gewählter Grenzen ganze Mengen ausschöpfen. Gemeinsames Budget, positive ganze Mengen, IDs eindeutig, Kapazität/maxQuantity/Itemanteil/Positionslimit/positive Nettogewinne sichern; konservative Floats. Keine leeren/teuren/illiquiden Kandidaten kaufen. | 5 Kandidaten buy10,qty100,profit2; Budget1000/maxAllocation25/maxPositions4=>4×25 Stück/Einsatz1000/Gewinn200. Grenz-/Rundungstests. |
| AC-08 | Einsatz%, Restcoins und konkrete belegbare relevante Grenzen mit Werten erklären: Zeitraum/Anteil und verfügbare Kapazität, aktive Positions-/Itemlimits, ganze Stücke, NPC-Limit/Aufwandziel. Nicht pauschal Liquidität beschuldigen, wenn Gewinn-/Aufwandziel kleineren Plan wählt. Null Kandidaten: klare Filtermeldung; Kapazität: Zeitraum/Anteil bedienbar. Keine Reserve oder globale Optimalität behaupten. | Tests/Browser für Kapazität, Ziele, Limits und null Kandidaten. |
| AC-09 | Plan-only NPC-Gesamtstückfeld, Default2048. Summe Kaufmengen<=Limit auch über mehrere Items und im profit-Modus. Keine neue Begrenzung bei Bazaar/Scanner. | Limit30/Budget1000/zwei buy10,qty100/maxAllocation20=>insgesamt30 statt40. Limit1, Dezimal/kaputte Eingaben, fehlende NPC-Preise, veraltete/unverfügbare Daten prüfen. |
| AC-10 | NPC compact trifft echte Auswahl per genannter Utility vollständiger Varianten. Tatsächlicher Gewinn unverändert; Gesamtstückzahl sichtbar. | Budget1000/maxPositions1/Limit>=1000: kompakt buy100,qty10,profit20=>Einsatz1000/Gewinn200/10Stück; Masse buy1,qty1000,profit0.3=>1000/300/1000. compact wählt kompakt (172.97297>18.04511), profit Masse. Zusätzlicher Fall globales Stücklimit mit Restcoins. |
| AC-11 | Orderbuchseiten/Tick/Steuer/sequentielle Bazaar-Beine/NPC-Buy-Flow/Netto/ROI/NPC-Preisvalidierung/Datenalter korrekt erhalten. Keine NPC-Verkaufszeit erfinden; Preis-/persönlicher Limit-Hinweis erhalten. Keine neuen Laufzeitabhängigkeiten/Netzwerktests. | Vorhandene23 Tests und neue unabhängige Rechen-/Grenzfälle bestehen. |
| AC-12 | Reale Offline-Browserprüfung beider Tabs mit kontrollierten Bazaar-/NPC-Fixtures: Filtertrennung, Tastatur, Reload, Reset, ungültiges Budget, Ziele, NPC-Limit/Präferenz, Details, CSV. Finale Syntax-/Testprüfung erfolgreich. Bedien-/Methodentexte aktualisiert; fremde README-Änderungen erhalten. | Separater Fixture-HTTP-Server oder gleichwertig ohne Hypixel-Abrufe; node scripts/check.mjs. |

### Quellen, Annahmen und Risiken

PO-Klarstellung zu v1: AC-07 verlangt Auffüllen nur, soweit das aktive Planungsziel nicht verschlechtert wird. Unter NPC compact darf ein zusätzliches profitables Massenitem bei sinkender Gesamtutility entfallen; Präfixe/Teilpläne müssen als Vergleichskandidaten erhalten bleiben. Rest ist dann gemäß AC-08 zielbedingt zu erklären. Unter Bazaar budget ist Rest bei noch bezahlbarer zulässiger Menge und freiem Slot unnötig.

Geprüft 2026-10-20: public/market.mjs, public/app.mjs, public/index.html und bestehende Markt-/NPC-/Portfoliotests beschreiben das IST-App-Modell; docs/agents/BAZAAR.md enthält bestehende Quellen. Bestehende Datenquelle: https://api.hypixel.net/#tag/SkyBlock/paths/~1v2~1skyblock~1bazaar/get . Keine neuen Spielregelbehauptungen, daher keine neue Live-Regelrecherche erforderlich. Defaults/Ziele/2048/64 sind ausdrücklich Produktentscheidungen. Wochenmittel sind keine Füll-/Nachfrage-/Preisprognose. Risiken:24h erhöht Preisänderungsrisiko; budget kann weniger Gewinn, compact weniger Coins empfehlen; jeweils im UI erklären. Zwingende offene Fragen: keine.

Baseline Hauptagent: node scripts/check.mjs, Syntax erfolgreich,23/23 Tests bestanden; HEAD c208590e20a5c4fe308d95653e07d6d01ee8b958.

## Developer-Übergabe

Separater bazaar_developer hat finalen Dateistand zur QA freigegeben; keine weiteren Änderungen während QA. Geändert: public/profiles.mjs (getrennte Profile/Migration), public/app.mjs/index.html/style.css (aktive UI-Kontexte, Details/CSV, Ziele/NPC-Limit), public/market.mjs (Defaults, Allokation, Diagnose), test/profiles.test.mjs und planning.test.mjs (9 neue Tests), test-support/fixture-server.mjs und README.md (Offline-Browserumgebung), README.md (Funktionsdokumentation, fremde Team-Ergänzung erhalten).

AC-Zuordnung:01–04 Profile/UI;05–08 Planung/Diagnose;09–10 NPC-Aufwand;11 Schutzregressionen;12 Dokumentation/Offline-Setup. Developer-Prüfung: node scripts/check.mjs vollständig erfolgreich,32/32 Tests. Beispiele bestätigt: Plan160 statt6 Stück/Einsatz16016/Gewinn2928.2; Budgetziel1000/200 versus Gewinnziel500/250; NPC compact10Stück/200Gewinn versus profit1000/300; globales Limit30; kompakter Präfix bleibt erhalten.

Developer-Prüflücke: reale Browserprüfung ausstehend. Fixture-Server unter http://127.0.0.1:4183 gestartet; Shell-HTTP-Probe EACCES, eskalierter reiner Leseaufruf Functions-Zelle13 wartet noch auf Freigabe; keine weiteren Proben. Server-Session-ID versehentlich nicht ausgegeben; erneuter Start meldet EADDRINUSE. QA prüft über verfügbares Browserwerkzeug. Kein Produktserverstart/Push/Merge/Deployment.

## QA Runde 1

CHANGES_REQUESTED. Separater bazaar_qa führte node scripts/check.mjs selbst aus:32/32 PASS, Syntax erfolgreich. Stand: HEAD c208590e20a5c4fe308d95653e07d6d01ee8b958 plus Developer-Diff/neue Dateien; QA änderte nichts.

AC-Matrix:01 Code plausibel/Browser offen;02 Profiltests PASS, Browser Reload/Reset/Merkliste offen;03 Code plausibel/Browser offen;04 verletzt BUG-001, CSV-Code getrennt/Browser offen;05–07 eigene Tests/Rechnung/Code erfüllt;08 Diagnose-Code plausibel/Browser offen;09 globales Limit getestet/UI und Alter offen;10 Auswahl/Präfix geprüft;11 Schutztests PASS/UI-Alter offen;12 Browserprüfung fehlt. Kein falsches PASS.

BUG-001 | mittel | AC-04 | CHANGES_REQUESTED

Ort: public/app.mjs:178; planned in170, Aktualisierung offener Details in108. Reproduktion: Plan-Detail eines Items öffnen; bei nächster Aktualisierung wird es nicht mehr eingeplant, bleibt aber in results.plan analysierbar. activeView weiterhin plan, planned fehlt. QA führte unverändert extrahiertes showDetail() mit activeView='plan', analysierbarem TEST_ITEM, plan.positions=[] und offenem Dialog aus. Ist: „Alle Flips: alternative Einzelposition mit dem Scannerbudget. Diese Ansicht verwendet ausschließlich deine Scannerfilter.“ Außerdem erscheinen alternative volle Menge und Werte ohne passenden Planhinweis. Soll: Plan-Kontext erhalten, „nicht mehr im aktuellen Plan“ anzeigen und Zahlen ausdrücklich als Kapazitätsalternative des Planprofils kennzeichnen; alternativ Dialog schließen. Regression: offener Plan-Dialog verliert Position beim Refresh, Item bleibt analysierbar; kein Scannertext/keine scheinbar aktuelle Planempfehlung.

Browser-Prüflücke: CUA fehlt im QA-Child, native Chrome-Steuerung abgelehnt („Computer Use was not approved to use Google Chrome“), keine Eingabeaktionen. Root-IAB auf4183 timeout. Erlaubter eskalierter Offline-Server auf4184 (Session96005) ist Root-IAB tatsächlich erreichbar. Root führt anschließend nach QA-Prüfschritten Browseraktionen aus und liefert rohe Evidenz zur unabhängigen Bewertung; kein Umgehen der Chrome-Ablehnung. Testseitige Setup-Bedienelemente für Legacy-LocalStorage erforderlich, weil Browser-evaluate nur read-only DOM erlaubt.

## Developer-Antwort und QA Runde 2

BUG-001: Ursache pauschaler Scanner-Fallback bei fehlender Planposition. public/detail-context.mjs hält Ansichtskontext ausdrücklich fest; verlorene Position heißt „nicht mehr im aktuellen Investitionsplan“, Werte als Kapazitätsalternative des Planprofils / „keine aktuelle Kaufempfehlung“ gekennzeichnet. test/detail-context.test.mjs prüft den Übergang und getrennten Scannerkontext. Developer: node scripts/check.mjs34/34 PASS/Syntax erfolgreich; zusätzliche Syntaxprüfung Fixture/Setup erfolgreich. Dateistand eingefroren.

Test-only Setup unter /__setup: test-support/setup.html und setup.mjs, sichtbare Legacy-/Default-/Fixture-/Alters-/NPC-Mehrpositionslimit-Buttons. Produktiver server.mjs unverändert. Setup setzt gezielt Test-Origin-Daten, Merkliste erhalten.

Browserausführung: Hauptagent bediente auf konkreten QA-Prüfschritten den erlaubten IAB/Offline-Server4184 (Session50676). QA prüft unabhängig die unveränderten Rohdaten, tatsächliche Downloads und Screenshots. Protokoll: C:/Users/SHYN/.codex/visualizations/2026/10/20/01a159d2-4a3e-7221-97c9-f94b61df0e37/qa-browser-evidence.json . Screenshots daneben: qa-npc-plan-full.png, qa-npc-plan-panel.png, qa-refresh-detail.png. Tatsächliche CSV-Downloads unter C:/Users/SHYN/Downloads/bazaar-2026-10-20.csv und bazaar-investitionsplan-2026-10-20.csv.

Ausgeführt: Legacy-Fall/Inspect, Defaults6/160, verschiedene Budgets/ROI/Ziele, echte Details/CSV (Scanner6/Bazaar119.9/Einsatz600.6/Gewinn109.8075; Plan19/NPC120/Einsatz1901.9/Gewinn378.1), alle vier Tastaturwechsel, Reload, isolierter Reset/Stern, ungültiges Budget/Wechsel/Korrektur, Budgetziel1000/200 vs Gewinnziel500/250, NPCcompact10/200 vs profit1000/300, Limit1/Dezimal/leer/nonnumeric, Mehrpositionslimit30/beideZiele,48hNPC-Datenwarnung und wiederhergestellte Empfehlungen bei0h/Bazaar weiterhin sichtbar. BUG001 realer AutoRefresh nach61s: PositionTEST_ITEM entfällt (bleibt analysierbar), offener Dialog active=plan zeigt ausdrücklich Kapazitätsalternative/keine aktuelle Kaufempfehlung. Keine Produktänderungen während QA.

## PO-Abnahme und Abschluss (final)

QA Runde2: PASS durch separaten bazaar_qa, alle AC-01 bis AC-12 erfüllt, keine notwendigen Prüflücken. Eigene Prüfungen QA: node scripts/check.mjs34/34 PASS/Syntax, Fixture-/Setup-Syntax und git diff --check erfolgreich; BUG001 Harness und echte AutoRefresh-Evidenz; Rohbrowserdaten, beide tatsächlichen CSV-Dateien und drei Screenshots unabhängig bewertet. Erfasste Browserkonsole leer. Keine Änderungen durch QA. Browseraktionen Root als Operator nach QA-Prüfschritten transparent dokumentiert.

AC-Matrix Runde2:01 Profile/Formular/Ergebnisse/Details getrennt PASS;02 exakte Migration/Reload/Reset/Stern/Validierung PASS;03 ungültig/letztergültiger/anderesProfil/Korrektur PASS;04 aktiveKennzahlen/Details/beideCSV/BUG001 PASS;05 Defaults/Rechnung PASS;06 Ziele/Zielrest PASS;07 Mengen/Budget/Limits/IDs PASS;08 Werte/Restdiagnose/leer PASS;09 Gesamtlimit/mehrerePositionen/beideZiele/Fehleingaben PASS;10 compact/profit/Präfix PASS;11 Schutzregressionen/NPC-Datenalter/Bazaar-Abgrenzung PASS;12 realeOfflineBrowserfälle/Tastatur/visuellePrüfung/Konsole PASS.

PO-Abnahme: ACCEPTED für Vertrag v1 einschließlich AC-07/AC-10-Auslegung. PO prüfte Ticket, finalen Allokations-/Profil-/Detailcode, Ziel-/Risiko-/Methodentexte, Rechenfälle und Browser-Rohprotokoll. Alle Nutzerziele erfüllt, keine fachlich blockierenden Restpunkte. QA-PASS für alle12 Kriterien und34 bestandene Tests tragen die Abnahme.

Bewusst akzeptierte Grenzen: begrenzte Heuristik, geschätzter Durchsatz/Füllzeiten/Gewinn, höheres Preisänderungsrisiko bei24h; vollständige Budgetbindung durch Kapazität/Stückelung/Limits/gewähltesZiel begrenzt. Budgetziel kann geringeren Gewinn, compact weniger Coins/bewusst Restbudget wählen.2048/64 persönliche Produktvorgaben, keine Hypixel-Limits/Verkaufszeitprognosen. PersönlicheNPC-Limits/Boni/eigeneOrders bleiben unberücksichtigt.

Abschluss: DONE. Fremde Änderungen erhalten, kein Push/Merge/Deployment. Root prüfte git diff --check ohne Fehler. Externe Testserver-Sessions96005 und50676 beendet; temporäre IAB-Testtabs geschlossen. Ursprünglicher Sandbox-Testserver4183: Session-ID nicht rekonstruierbar; keine pauschale Prozessbeendigung. Frühere Probe-Zelle13 geschlossen (ETIMEDOUT/Exit1); die späteren tatsächlichen Browserprüfungen auf4184 sind davon unabhängig erfolgreich.
