# 2026-10-21-investment-quality: Relevante Gewinne und zügige Orders

Status: DONE
QA-Runden: 1 / 3
Rollenmodus: native custom agents

## Nutzerziel und Scope

Investitionsplan auf aktuellem main verfeinern: Gewinne von etwa 100 Coins bei
10 oder 40 Millionen Budget vermeiden; sinnvolle budgetrelative Positionsschwelle.
Hoher Durchsatz und kurze modellierte Füllzeiten für Kauf UND Verkauf sollen
stärker zählen. Einfaches Modell passend zur bestehenden App, keine Ausführung
von In-Game-Orders, keine garantierten Füllungen oder automatisches Nachstellen.

## Branch und Freigabestand

- Arbeitsbaum vor Änderungen sauber; origin ist https://github.com/Shyn-Shyn/skyblock-bazaar.git.
- Voriger Branch codex/market-overview, HEAD dea00549270a5127bda1c61afabbbe083363c759,
  bereits vollständig in Remote-main enthalten (0 lokale, 1 Remote-Commit Differenz).
  Keine fremden Änderungen; bisheriger Branch bleibt erhalten.
- Remote-main per ls-remote und fetch am 2026-10-21 bestätigt:
  5292d298b40776e527ef1452d6d89f7a0cfd92ad.
- Basiscommit: 5292d298b40776e527ef1452d6d89f7a0cfd92ad.
- Featurebranch: codex/investment-quality, direkt von origin/main erstellt.
- Nutzerauftrag umfasst Umsetzung und gemäß AGENTS.md Branch-Push/PR nach main.
- Merge und main-CI/Image: NICHT_BEAUFTRAGT.
- Netzwerkzugriff benötigt hier Sandbox-Eskalation; Git-Remote-Lesezugriffe erfolgreich.

## PO-Vertrag v1

PO: READY, native bazaar_product_owner, read-only. Hauptagent alleiniger Ticket-Editor.

### Scope, Annahmen und Quellen

Nur Bazaar-Investitionsplan in allocate: Bagatellfilter und Tempo bei der
Variantenwahl. NPC-Allokation, feste Marktübersicht, Steuer-/Preisrechnung,
Datenalter und gespeicherte Strategieparameter bleiben erhalten. Keine neuen
Abhängigkeiten, keine Orderausführung, keine Füll-/Nachstellgarantie.

Die vorhandenen Wochenfluss-, Warteschlangen- und Marktanteilsschätzungen bleiben.
PO prüfte am 21.10.2026 die offizielle Primärquelle
https://api.hypixel.net/#tag/SkyBlock/paths/~1v2~1skyblock~1bazaar/get:
obere 30 Orders, movingWeek = Sieben-Tage-Transaktionen + Livebestand.
Keine neuen Spielregeln/Steuern/Limits. 0,05 % und 6 Stunden sind ausdrücklich
Produktheuristiken. Tatsächliche Konkurrenz/Preisänderungen sind unbekannt.

### Verbindliches Rechenmodell

1. Nur destination=bazaar innerhalb allocate: minimumPositionProfit = budget *
   0.0005 (0,05 % des gesamten eingegebenen Budgets, unabhängig von Restbudget
   und Positionszahl). Keine Rundung, Unter-/Obergrenze oder feste Coin-Untergrenze.
   quantity * profit >= Schwelle; Gleichheit zulässig. Anzeige wie bisher formatieren.
2. Erst alle bisherigen Mengengrenzen anwenden, dann bei JEDER optionsFor-Berechnung
   mit tatsächlicher Teil-/Restmenge Schwelle prüfen. Keine Lockerung bei leerem Plan.
3. T = queueHours + (hours - queueHours) * allocatedQuantity / originalQuantity.
   Wartezeit bleibt ungekürzt. Bazaar-Kandidaten mit fehlenden/nicht endlichen/
   negativen hours oder queueHours sowie hours < queueHours ausschließen.
   T=0 zulässig. Kein neues hartes Zeitlimit.
4. w(T) = 1 / (1 + T / 6), absolut in Stunden und unabhängig vom Horizont.
   weightedProfit = tatsächlicher Nettogewinn * w; weightedCapital = Kapital * w.
   Diese Werte sind ausschließlich interne Nutzenwerte, keine ausgewiesenen Coins.
5. Ziel profit: Summe weightedProfit absteigend, dann tatsächlicher Nettogewinn,
   dann weniger Positionen, dann tatsächliches Kapital absteigend.
   Ziel budget: Summe weightedCapital, dann Summe weightedProfit, dann tatsächliches
   Kapital, dann tatsächlicher Nettogewinn (je absteigend), dann weniger Positionen.
   Letzte Auflösung deterministisch wie bisher. Summe einzeln gewichteter Positionen,
   weder Plan-Maximalzeit noch Zeitmittelwert als Nenner.
6. Bestehende Mehrfachsuche beibehalten; weightedProfit und weightedCapital zusätzlich
   als Konstruktions-/Startkriterien mit jeweils bis zu acht Startkandidaten aufnehmen.
   Nutzenwerte stets für aktuell mögliche Menge berechnen. Tempo ist kein bloßer Tie-breaker.
7. Ausgabe von Gewinn, Kapital, ROI, Stückzahl und Zeit bleibt tatsächlicher Modellwert.
   Schwellenwert an UI zurückgeben. Restbudgetdiagnosen müssen Tempowahl korrekt erklären.
8. Alte allocationGoal-Werte budget/profit und Profile behalten; Labels entsprechend
   ehrlich anpassen. Keine zusätzliche Einstellung nötig. NPC bleibt vollständig unverändert.

| ID | Verbindliches Soll | Nachweis |
|---|---|---|
| AC-01 | 10M: Schwelle 5.000; 40M: 20.000. 100 Coins Gesamtgewinn entfällt. Unter/exakt/über Grenze korrekt für beide Ziele. | Deterministische Tests, unabhängige Rechnung. |
| AC-02 | Schwelle nach tatsächlicher Teilallokation/Restbudget und allen Mengenlimits. Beispiel 10M: erste Position 99 Stück à100.000 Einkauf/3.000 Gewinn =9,9M/297.000. Zweite allein 10.000 Stück à1.000/20; verbleibende 100 Stück/2.000 Gewinn werden ausgeschlossen. Ziel profit, gleiche ursprüngliche Modellzeit. | Allokationstest. |
| AC-03 | Budget1→0,0005; 1.000→0,5; 1M→500. Keine fixe Coin-Untergrenze. Leere/Bagatellkandidaten: leerer Plan, volles Restbudget, keine NaN/Infinity-Ausgaben. | Grenztests inkl. Gleichheit. |
| AC-04 | FAST Kapital1M/Gewinn100.000/T1h schlägt SLOW 1,2M/120.000/T12h bei beiden Zielen/maxPositions1. Nutzengewinn85.714,285714 vs40.000; Nutzenkapital857.142,857142 vs400.000. Ausgabe FAST100.000/1M/1h. | Unabhängig gerechneter Test, ausreichendes Budget. |
| AC-05 | Menge100, Anteil1 %, Queue0: Buy-/Sell-Flüsse20.000/20.000 ergeben1h; 2.000/20.000 und20.000/2.000 jeweils5,5h. Beide langsamen Seiten verschlechtern Auswahl. Nullfluss/fehlende Seite/nicht endliche Zeiten ausschließen. | Echte analyze-Produkte→allocate, maxQuantity100. |
| AC-06 | Original100 Stück/hours10/queue2, Teil25→T4/w0,6. Nur Füllzeit skaliert. Horizontänderung bei gleichen Kandidaten ändert Nutzen nicht. Positionsweise Nutzensummen bestimmen Mehrpositionswahl. | Teilmengen-/Horizont-/Mehrpositionstest. |
| AC-07 | Ganze Mengen, gemeinsames Budget, Centkosten aufgerundet, Item-/Positions-/Kapazitätsgrenzen, positiver Gewinn, Orderdruck bleiben. 100,1/119,9/1,25 % ergibt18,30125 netto. | Bestehende fachliche Tests; alte Erwartungen nur wegen explizit geänderter Bazaar-Zielwertung ändern. |
| AC-08 | Marktübersicht und NPC fachlich unverändert. Gespeicherte budget/profit/Budget/Steuer/Filter ohne Reset weiter gültig, neue Bazaar-Wertung automatisch. | Profil-/NPC-/Markttests, Browser mit Bestandsprofil/Reload. |
| AC-09 | Deutsche Ziellabels z.B. Budget & schnelle Füllung / Nettogewinn & schnelle Füllung. Dynamisch0,05 % und Coin-Schwelle, Tempo beider Schritte erklären; Rest-/Leertexte nennen Schwelle/Tempo. Keine Ausführungs-/Nachstellgarantie; NPC-Texte unverändert. | Browser, README, sichtbare Rechenhilfe. |
| AC-10 | Planzeile/Details/CSV stimmen bei tatsächlicher Teilmenge/Kapital/Nettogewinn/Zeit überein, interne Nutzenwerte nie als Gewinne. | Offline-Browser mit Teilallokation und CSV. |
| AC-11 | Offline-Szenarien für10M/40M Bagatellen, sinnvolle Positionen, jeweils Buy-/Sell-seitig langsame Orders und Bagatellrest. Anleitung mit Eingaben/Sollwerten; QA führt Browserprüfung aus. node scripts/check.mjs vollständig grün; kein Produktserver für Tests. | Offline-Fixtures/Browser/Volltest. |

Betroffene Komponenten: public/market.mjs, public/app.mjs, public/index.html,
README.md, fachliche Tests, Offline-Fixtures und Anleitung. Keine offene Produktentscheidung.

## Developer-Übergabe

Native Rolle bazaar_developer setzt den vollständigen Vertrag um; alleiniger
Produkt-/Test-Schreiber. Kein Commit/Push während Umsetzung. Baseline vor
Umsetzung: node scripts/check.mjs PASS (50/50 Tests).

Umsetzung beendet; Developer meldet node scripts/check.mjs PASS58/58 und
git diff --check PASS. Schreibphase beendet. Basis unverändert5292d298b40776e527ef1452d6d89f7a0cfd92ad,
HEAD weiterhin Basis; freizugebender Inhalt ist Arbeitsbaum-Diff plus neue Dateien.
Vollständige Produkt-/Test-Dateiliste:

- README.md (SHA2564E3FCE6D4A568D4ADC75A589D3329F5E671482F022C13C38CBC8F500147A93BF)
- public/app.mjs (2980D81825AFBBFA6C3BDFE64B18E65CEE04001321B59D2AFDBC40486C6A455F)
- public/index.html (0DBE82F67E4F6DF563E1C9570910227CF3CD77BEDDD4B9FCBE869815CCC648E1)
- public/market.mjs (E9CC9938DD8AFA38110D8F3F14EBA3E33C055B37535FCAF957B65BD3CA46D1C0)
- test-support/README.md (604A2081FEB523FD72E07631AAFB51C5CC398ACD96EC41003C882BFF814CA998)
- test-support/fixture-server.mjs (77727684A983B2275DF7BA6EEC80C14A6B715BF45878E3A5BF29F4DCD97AB794)
- test-support/setup.html (F3C1416B43341C308DACDB0B3AED4BFFB14418EBDCD803D980E4A20E56E82802)
- test-support/setup.mjs (C2A5053701D37A43BCF713B85A50C620EB1B61DAB37F124AD5FA914751552BC4)
- test/planning.test.mjs (C844B957B32C17027E343CC565292644FBFD6E16C53E545034480A6B8AD1DF08)
- neu test/investment-quality.test.mjs (FA447FBB589CBE11F8CDAE55D9EF62B54E09C05E60963C5BB3666DB4530036CB)

Zusätzlich dieses Ticket (nur Hauptagent). Keine weiteren Push-Inhalte.
Marktmodell:0,05%-Schwelle nach tatsächlicher Menge, positionsweises Zeitgewicht,
zusätzliche gewichtete Suchkriterien. UI/README erklären Restbudget und Tempo.
NPC-Limit-Regressionsfall verwendet nun explizit Budget1000 statt implizit1M,
weil dessen200Coins-Gewinn sonst unter der neuen500Coins-Bazaar-Schwelle liegt.
Offline-Server läuft unter http://127.0.0.1:4183 (exec-session3056), kein Produktserver.
Sichtbare Setup-Buttons für10M/40M/Buy-Sell-langsam/Bagatellen/Rest/Teilmenge.
Fixture-Soll:10M/40M FAST100Stück/1M/100k/1h; Rest99Stück/9,9M/297k/24h,
100k frei; Teil25Stück/2.500/462,5/4h, Original100Stück/10h/Queue2h.

## QA

Runde1: unabhängige native bazaar_qa prüft den oben dokumentierten Diff samt
neuen Dateien gegen vollständigen PO-Vertrag. Anwendungscode bleibt schreibfrei.

Ergebnis Runde1: PASS für AC01-11. Eigener node scripts/check.mjs58/58PASS,
git diff --checkPASS; alle zehn Produkt-/Test-SHA256 mit Ticket abgeglichen.
Unabhängige Rechen-/Grenzprüfungen für0,05%, FAST/SLOW, beide Handelsseiten,
Teilmenge/Queue/Horizont/Mehrpositionsnutzen und Constraints bestanden.
Acht zusätzliche NPC-Allokationen (beide Ziele, Budgets1/1000/1M/40M) exakt
gegen git-show-Baseline verglichen:PASS; analyze/Steuer18,30125 unverändert.

| AC | Ergebnis und unabhängige Evidenz |
|---|---|
|01-03|PASS: Grenzen/Gleichheit,10M→5.000/40M→20.000, Bagatellen und Restmenge.|
|04-06|PASS: FAST bei beiden Zielen;85.714,285714vs40.000, beide langsamen Seiten5,5h vs1h; Teilmenge4h inkl.Queue2h, Summe einzelner Nutzenwerte.|
|07|PASS: Budget/Centkosten/ganzzahlige Mengen/Orderdruck/18,30125 Netto.|
|08|PASS: Browser Bestandsprofil/Reload/feste Übersicht; zusätzlicher exakter NPC-Baselinevergleich.|
|09|PASS: Browser deutsche Labels, dynamische Schwelle, Rest-/Leertexte; README/Rechenhilfe konsistent.|
|10|PASS: Plan/Details25Stück/2.500Kapital/462,5Gewinn/4h; tatsächlicher Browser-CSV-Export unabhängig gelesen und neun Sollfelder exakt geprüft.|
|11|PASS: Offline-Browser10M/40M/Buy-langsam/Sell-langsam/Bagatellen/Rest/Teil25. Volltest58/58.|

Browserbelege: FAST100Stück/1M/100k/1h bei10M/40M; beide Ziele bei10M und
beiden einseitig langsamen Fällen; profit-Ziel nach Reload erhalten. Nur
Bagatellen: leer/10M frei/Export deaktiviert. Rest99/9,9M/297k/24h/100k frei.

CSV-Werkzeuglücke zunächst BLOCKED ohne Produktbug: Browseraufruf hing; nach
Statusunterbrechung verlor QA Browserinventar. Hauptagent führte isoliert das
sichtbare Teilmengen-Setup und Plan-CSV-Export aus. Trotz expliziten25s Tool-
und10s Download-Deadlines kehrte das Werkzeug erst nach417s mit Download zurück.
QA setzte dieselbe Runde1 ohne Produktänderungen fort und las selbst die
unveränderte Datei C:\Users\SHYN\Downloads\bazaar-investitionsplan-2026-10-21 (1).csv
per Get-Content/Import-Csv: genau1 QUALITY_PARTIAL/bazaar,25/100/120/2500/
25%/462,5/4h, keine Nutzenfelder. Prüflücke aufgehoben. Keine Produktfehler.

## PO-Abnahme und Abschluss

Native bazaar_product_owner: ACCEPTED, PO-Vertrag v1 vollständig erfüllt.
Abnahme für Basis5292d298b40776e527ef1452d6d89f7a0cfd92ad, Branch
codex/investment-quality, unveränderten dokumentierten Diff und alle zehn
Produkt-/Testdatei-SHA256. Prüfung bestätigt tatsächliche Positionsschwelle,
beidseitige Zeitgewichtung/6h-Skala, unveränderte echte Coin-Ausgaben und
Erhalt von Profilen/Übersicht/NPC. QA-PASSAC01-11 inkl.CSV liegt vor.
Lokale Abnahme: LOCAL_ACCEPTED. Keine notwendige lokale Prüflücke offen.
Freigegebener Inhalt darf unverändert als Commit verpackt, auf Featurebranch
gepusht und als PR nach main veröffentlicht werden. Aktuelle PR-CI erforderlich.
Merge und main-CI/Image NICHT_BEAUFTRAGT; Gesamt-DONE nach PR-/CI-Nachweis.

## Release

Read-only Vorprüfung durch native bazaar_release abgeschlossen: Git Credential
Manager und GitHub-REST über PowerShell mit Sandbox-Eskalation funktionieren;
Repo/default main sowie push/pull-Rechte bestätigt. Keine Credentials ausgegeben
oder in Dateien gespeichert. gh und lokales Docker fehlen. Git push und
REST /pulls sowie /actions/runs und /jobs stehen für Release zur Verfügung.
Pipeline und Dockerfile gelesen: PR-Validate prüft Tests, Dockerbuild und
healthz/Icon-Smoke; Publish muss übersprungen sein. Externe PR-CI muss den
Container-Nachweis liefern. Keine GitHub-/Produktmutation in der Vorprüfung.
Main-Kontextlauf https://github.com/Shyn-Shyn/skyblock-bazaar/actions/runs/39597932477
erfolgreich für 5292d298b40776e527ef1452d6d89f7a0cfd92ad; kein Feature-Nachweis.

Mutierender Release ausstehend nach QA-PASS und PO-ACCEPTED. PR/CI erforderlich; kein Mergemandat.
Netzgrenzen: 30 Sekunden je Anfrage, zehn Minuten CI-Warten je Prüflauf.

## Release-Übergabe

Modus: mutierender Release nach QA-PASS/PO-ACCEPTED; native bazaar_release.
Basis/letzter bestätigter Remote-main5292d298b40776e527ef1452d6d89f7a0cfd92ad,
Branch codex/investment-quality. Freigegebener Diff und zehn Produktdatei-Hashes
oben vollständig dokumentiert; zusätzlich nur dieses Hauptagent-Ticket.
Keine vorhandenen Featurecommits, HEAD steht noch auf Basis. Inhalt unverändert
committen; benannte Dateien stagen; kein blindes git add ., kein Force-Push.
Nutzerauftrag umfasst genau dieses Feature und PR nach main gemäß AGENTS.md.
Kein Mergemandat: Merge/Image NICHT_BEAUFTRAGT.
Remote https://github.com/Shyn-Shyn/skyblock-bazaar.git; Git Credential Manager,
Git und PowerShell-REST verfügbar; keine Credentials ausgeben/speichern.
Release prüft Status/Staging/Remote-main/alle Pushcommits gegen Freigabe,
publiziert Branch und PR, hängt PR mit attach_artifact an Chat und prüft aktuelle
PR-CI für Feature-/Base-SHA inkl.synthetischem Merge-SHA. Validate Tests/Build/
healthz/Icon-Smoke muss erfolgreich, Publish übersprungen sein. Kein lokales Docker;
Container-Nachweis muss aus passender externer CI kommen. Keine Produktänderung.
Ticket bleibt ausschließlich Hauptagent; Release liefert getrennten Bericht.

## Release-Bericht und Gesamtabschluss

Native bazaar_release veröffentlichte genau die zehn freigegebenen Produkt-/
Testdateien und dieses Ticket als Commit9117fdad51fdb40dc9e6a4f30b5f1497cb7c0fc0.
Vorher alle Produkt-SHA256, benanntes Staging, Stage-/Arbeitsbaum-Blobgleichheit,
Diffcheck und Push-Commits geprüft. Keine fremden Änderungen. Branch-Push
erfolgreich, Remote-HEAD exakt bestätigt; Arbeitsbaum anschließend sauber.

PR: https://github.com/Shyn-Shyn/skyblock-bazaar/pull/3 (an Chat angehängt).
Base5292d298b40776e527ef1452d6d89f7a0cfd92ad unverändert; Feature9117fdad51fdb40dc9e6a4f30b5f1497cb7c0fc0.
Synthetischer PR-Merge1584658ef792698ee5e0d83f73a212b23dde2a32:
Eltern per GitHub-API exakt Base/Feature bestätigt, CI-Checkout aus
refs/pull/3/merge mit genau diesem SHA im Joblog bestätigt.

| Phase | Status | Nachweis |
|---|---|---|
|Lokale Freigabe|PASS|QA Runde1 AC01-11PASS; POACCEPTED;58/58Tests; dokumentierter Produkt-Diff/Hashes.|
|Branch-Push|PASS|origin/codex/investment-quality Remote-HEAD9117fdad51fdb40dc9e6a4f30b5f1497cb7c0fc0 exakt bestätigt.|
|PR/CI|PASS|PR#3; https://github.com/Shyn-Shyn/skyblock-bazaar/actions/runs/39642120324 completed/success. ValidateJob119368075992: Syntax/Tests, Dockerbuild, Containerstartup, healthz/Icon erfolgreich. PublishJob119368328876 skipped.|
|Merge|NICHT_BEAUFTRAGT|Kein konkretes Nutzer-Mergemandat, main unverändert.|
|main-CI/Image|NICHT_BEAUFTRAGT|Kein Merge/Push auf main beauftragt.|

Die passende externe PR-CI schließt die lokale Docker-Prüflücke. Netzgrenzen
30s je Anfrage und10min pro CI-Prüflauf eingehalten, erster Lauf nach ca.2min
abgeschlossen. Kein Branchschutz als aktiviert behauptet. Kein Force-Push,
Merge oder Deployment. Temporärer Offline-Server ist beendet (Port4183 frei).

Dieses abschließende Hauptagent-Audit verändert ausschließlich das Ticket.
Es darf als separater Audit-Commit auf denselben PR gepusht werden; Produkt-/
Testinhalte bleiben exakt freigegeben. Der neu ausgelöste aktuelle PR-CI-Lauf
wird vor dem Nutzerabschluss erneut vom Release-Agenten geprüft; finaler
Audit-HEAD und aktueller CI-Link werden im Release-/Chatabschluss ausgewiesen.

Gesamtergebnis: Feature lokal abgenommen und prüfbarer PR veröffentlicht.
Bedienung: vorhandene Planprofile funktionieren automatisch; dynamische
0,05%-Positionsschwelle und neue Ziellabels erklären Auswahl und Restbudget.
Kürzere modellierte Kauf-/Verkaufszeit zählt stärker; tatsächliche Füllungen,
Gewinne und selteneres Nachstellen bleiben ungarantiert.
