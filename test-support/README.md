# Offline-Browserprüfung

`node test-support/fixture-server.mjs` startet nur einen lokalen HTTP-Server auf
http://127.0.0.1:4183. Keine Hypixel-Abfragen, keine npm-Abhängigkeiten.
Optional eigenen Port über `FIXTURE_PORT` wählen. Zum Beenden Ctrl+C.

HTML, JavaScript-Module, CSS, Icon, Healthcheck, Sicherheitsheader und
unbekannte Routen verwenden denselben `serveStatic`-Handler aus
`http-assets.mjs` wie `server.mjs`, einschließlich expliziter Asset-Allowlist.
Es gibt keine generische Freigabe des public-Verzeichnisses mehr. Nur die API
und die Teststeuerung sind Fixture-spezifisch. Die kontrollierten Daten sind
keine echten Kurse.
`/__fixture?mode=capacity`, `mode=goals`, `mode=npc` oder `mode=all` stellt den
Datensatz serverseitig um; danach Browserseite neu laden oder Automatik abwarten.
Der Kontrollendpunkt antwortet mit der aktiven Einstellung. `itemsAge=48`
simuliert mindestens 48 Stunden alte Itemdaten, `itemsAge=0` frische.
Keinen Produktserver (`node server.mjs`) für diese Offline-Prüfung starten.

Erwartungen nach Zurücksetzen beider Profile:

- `capacity`: Scanner 6 Stück TEST_ITEM, Plan160 Stück/Einsatz16.016/Gewinn2.928,2
  bei1M Budget. Modell-Einkauf100,1/Verkauf119,9/Steuer1,25%.
- `goals`: Im Plan Budget1000, maxPositions1, maxRoi51 setzen. COMPACT ergibt
  Bazaar5 Stück/Einsatz500/Gewinn250; BUDGET100 Stück/Einsatz1000/Gewinn200.
  „Budget ausschöpfen“ wählt BUDGET; „Nettogewinn“ COMPACT. Die leicht erhöhte
  maxRoi-Grenze vermeidet einen Fließkomma-Grenzfall bei exakt50%.
- `npc`: Im Plan Verkaufsziel NPC, Budget1000, maxPositions1, Limit2048 setzen.
  COMPACT: Einkauf100/NPC120, 10 Stück/Gewinn200. MASS: Einkauf1/NPC1,3,
  1000 Stück/Gewinn300. „Wenige Stück bevorzugen“ COMPACT, „Nettogewinn“ MASS.
- Budget/Ziel/ROI im Plan ändern; Übersicht behält feste Referenzwerte.
  Mehrfach und per Pfeiltasten wechseln; Reload/Planreset/ungültiges Budget/CSV
  und Itemdetails prüfen. Die Übersicht hat ausschließlich ihre eigene Zielwahl.
- Bei NPC-Limit30/maxAllocation20 und beiden Positionen kann das globale Limit
  über mehrere Positionen sichtbar werden; isolierte exakte Beispielprüfung
  steht zusätzlich in `test/planning.test.mjs` (zwei gleiche10-Coin-Kandidaten).

LocalStorage-Schlüssel: `bazaar-profiles` enthält version,scanner,plan;
`bazaar-settings` ist nur die einmalige Legacy-Quelle bei fehlenden neuen
Profilen. `bazaar-favorites` bleibt global. Für Migration nur im isolierten
Testbrowser neue Profile entfernen und Legacy-Daten setzen; keine produktiven
Browserdaten löschen.

## Gewinnschwelle und schnelle Bazaar-Zyklen

Auf `/__setup` stehen sichtbare Buttons bereit, die vollständige gespeicherte
Version-2-Profile mit den bisherigen Zielwerten `budget`/`profit` vorbereiten.
Danach **Zur Anwendung →** und **Investitionsplan** öffnen. Keine privaten
Browserzustände müssen per Skript geändert werden; die Merkliste bleibt erhalten.
Alle Preise und Flüsse sind kontrollierte Testdaten, keine Live-Kurse.

| Setup-Button | Vorgaben | Erwarteter Plan |
|---|---|---|
| Qualität ·10M Bestandsprofil | Budget10M, maxQuantity100, maxPositions1, Zielbudget | Nur Zügiger Umlauf:100Stück,1M Einsatz,100.000 Gewinn,1h;9M frei; Schwelle5.000Coins. |
| Qualität ·40M Bestandsprofil | Wie oben, Budget40M | Gleiche Position;39M frei; Schwelle20.000Coins. |
| Tempo ·langsame Buy-Seite | 10M-Profil, FAST gegen SLOW_BUY plus Bagatelle | FAST wie oben; langsamere Alternative hätte120.000 Gewinn/1,2M Einsatz/5,5h. |
| Tempo ·langsame Sell-Seite | Entsprechend gegen SLOW_SELL | Ebenfalls FAST; langsame Verkaufsseite zählt genauso wie langsame Einkaufsseite. |
| Nur Bagatellen ·10M | 100Stück mit zusammen etwa100Coins Gewinn, weiterhin analyseseitig zulässig | Leerer Plan,10M frei, CSV deaktiviert; Leertext nennt5.000Coins/0,05 %. |
| Restbudget unter Gewinnschwelle | 10M, maxQuantity10.000, maxPositions2, Zielprofit | Nur Große Hauptposition:99Stück,9,9M Einsatz,297.000 Gewinn,24h;100.000Coins frei. Zweite Position hätte mit Restbudget100Stück/2.000 Gewinn und entfällt unter5.000. |
| Teilmenge25 ·Wartezeit2h ·Dauer4h | Budget10.000, maxAllocation25 %, horizon10, tick0, maxQuantity100 |25Stück,2.500 Einsatz,462,5 Gewinn,4h;7.500 frei; Schwelle5Coins. |

Bei den vier Tempo-/Budget-Szenarien beide Ziele umschalten: **Budget & schnelle
Füllung** und **Nettogewinn & schnelle Füllung** wählen jeweils FAST. Das
Bestandsprofil wird ohne Reset angewandt. Seite neu laden und Plan erneut öffnen:
Budget, Ziel und Filter bleiben bestehen. Die Bagatelle hätte bei maxQuantity100
etwa100Coins Nettogewinn und ist auch in der Analyse zulässig; erst die
Plan-Positionsschwelle schließt sie aus. `mode=quality`, `qualitybuy`, `qualitysell`,
`qualitytiny`, `qualityrest` und `qualitypartial` sind die entsprechenden
Fixture-Modi; der Moduswechsel allein setzt keine Profile.

Beim Teilmengenszenario Details öffnen: die geplante Menge25, Einsatz2.500,
Gewinn462,5 und Zeit4h müssen zur Planzeile passen. Die separate
Kapazitätsalternative hat100Stück/10.000Coins/10h und ist keine weitere Order.
Rechnung: Queue2h +8h×25/100 =4h; Gewicht1/(1+4/6)=0,6. Netto je Item ist
120×0,9875−100=18,5. Export **Plan als CSV**: `quantity=25.0000`,
`capital=2500.0000`, `total=462.5000`, `hours=4.0000`. Der interne Nutzengewinn
277,5 erscheint weder als Coin-Gewinn noch in den CSV-Spalten. Anschließend
NPC-Mehrpositionslimit und feste Marktübersicht als Regression prüfen.

## Sichtbare Vorbereitung im Browser

`/__setup` ist ausschließlich im Offline-Fixture-Server verfügbar. Dort können
Prüfer über sichtbare Buttons den exakten Legacy-Migrationsfall AC-02 setzen,
beide Testprofile und Fixture auf Defaults setzen, die Datensätze und das
Itemdaten-Alter0/48Stunden wechseln und anschließend zur Anwendung navigieren.
Die Profilaktionen betreffen nur LocalStorage des jeweiligen Test-Origins und
erhalten die Merkliste. Ein auslesbarer Zustandsbereich zeigt Fixture und
gespeicherte Profile. Der produktive `server.mjs` wird dafür nicht verändert.

„NPC-Mehrpositionslimit vorbereiten“ setzt einen Plan mit Budget1000,
maxAllocation20%,maxNpcItems30 und zwei gleichwertigen10-Coin-Items. Erwartet:
zwei Positionen,30Stück insgesamt,300Coins Einsatz,60Coins Gewinn. Das Szenario
ist auch als `mode=npclimit` verfügbar.

## Produktionsstart und API-Fehler prüfen

`/__setup` bietet zusätzlich sichtbare Buttons:

- **API-Erfolg**: `/api/bazaar` liefert einen gültigen kontrollierten Snapshot.
  Zur Anwendung wechseln: Scannerzeilen, Verbindung, Datenzeit und
  Automatik-Countdown müssen erscheinen. Plan öffnen, Budget ändern und
  Filtertrennung sowie Itemdetails prüfen.
- **Initialer API-Fehler ·503**: setzt API-Modus `unavailable` und verwirft den
  Test-Snapshot. Anwendung neu öffnen: Module und UI müssen starten, dann
  „Verbindung gestört“ und verständlichen Fehler mit Wiederholung nach60Sekunden
  zeigen. Anschließend API-Erfolg wählen und automatischen Versuch abwarten.
- **Aktualisierungsfehler mit Snapshot**: vorher einmal erfolgreich Daten
  laden, dann Modus `snapshot-error` aktivieren und in der Anwendung
  automatisch nachladen lassen. Der letzte Snapshot samt Zeilen bleibt erhalten und die
  Aktualisierungswarnung erscheint. Ohne bisherigen Snapshot liefert auch
  dieser Modus503.

Kontrollendpunkte: `/__fixture?apiMode=success`, `apiMode=unavailable` oder
`apiMode=snapshot-error`; optional `clearSnapshot=true`. „Beide Testprofile
und Fixture zurücksetzen“ stellt API-Erfolg wieder her. Startparameter sind
weiterhin allein `FIXTURE_PORT` (Standard4183); keine Produktions-Testmodi.

`node --test test/http-assets.test.mjs` prüft den tatsächlichen gemeinsamen
Handler mit echten Node-HTTP-Request-/Response-Objekten auf In-Memory-Transport,
ohne Listener oder Netzwerk: rekursiven Modulgraph aus HTML/Imports,
GET-/HEAD-Status, exakten Dateiinhalt, MIME-/Sicherheitsheader, CSS/Icon/healthz,
404/405 und gesperrte Repo-/Dot-/Pfadausbruch-Ziele. Damit fallen künftig
vergessene modulare Browserdateien in der Produktions-Allowlist direkt auf.

## Marktübersicht, Metadaten und schnelle Automatikprobe

Alle folgenden Szenarien sind auf `/__setup` per sichtbarem Button wählbar:

- **Alte extreme Scannerfilter vorbereiten** setzt ein Version-1-Profil mit
  Budget1, Horizont168h, Steuer20%, Mindest-ROI9999. Die Übersicht muss dennoch
  TEST_ITEM mit6Stück/Einsatz600,6/Gewinn109,8075 zeigen. Der Standardplan bleibt.
- **Shard-Namen** (`mode=names`): Skeleton Shard und Carrot King Shard ohne
  Ressourcennamen; Official Skeleton Shards mit Formatcode aus der Fixture.
  Namen in Suche, Plan, Details und CSV vergleichen.
- **Pagination ·60Items** (`mode=many`): zunächst50Zeilen, dann60; Suche,
  Sortierung und Merkliste dürfen weiterhin nur die Übersicht beeinflussen.
- **Metadatenfehler mit letzten Preisen** (`itemsMode=error`) und **Keine
  Metadaten** (`itemsMode=missing`): beide NPC-Ansichten prüfen. Ein eine Woche
  alter Quellstand bei erfolgreicher aktueller Prüfung ist normal in der Fixture.
- **Quellstand10Minuten alt**, **Konfiguriert ·3Minuten** und **Backoff
  ·10Minuten** prüfen Alter/Warnung/Countdown; Status im Setup zeigt die Werte.
- **Automatikprobe ·2Sekunden ·gleicher Quellstand** lässt die Fixture ein
  nächstes Nachladen nach2Sekunden vorgeben (Browser wartet zusätzlich1,5s).
  Diese Beschleunigung gilt nur für die Offline-Fixture. Der Produktionsserver
  bleibt bei mindestens60Sekunden. Im zweiten Tab die App offen halten und im
  Setup Erfolg/503/Folgefehler umschalten: Dadurch können Wiederholung, Erholung
  und letzter Snapshot ohne manuelles Refresh-Bedienelement geprüft werden.

**Beide Testprofile und Fixture zurücksetzen** setzt diese Vorgaben zurück und
erhält die Merkliste. Keine Produktionsdaten oder Live-Preise werden verwendet.
