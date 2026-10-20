# Offline-Browserprüfung

`node test-support/fixture-server.mjs` startet nur einen lokalen HTTP-Server auf
http://127.0.0.1:4183. Keine Hypixel-Abfragen, keine npm-Abhängigkeiten.
Optional eigenen Port über `FIXTURE_PORT` wählen. Zum Beenden Ctrl+C.

Die Oberfläche und `/api/bazaar` werden ausschließlich aus lokalen Dateien und
kontrollierten Testdaten bedient. Diese Daten sind keine echten Kurse.
`/__fixture?mode=capacity`, `mode=goals`, `mode=npc` oder `mode=all` stellt den
Datensatz serverseitig um; danach in der Anwendung „Daten aktualisieren“ klicken.
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
- Verschiedene Budgets/Ziele/ROI in beiden Reitern ändern; mehrfach und per
  Pfeiltasten wechseln; Reload/Reset/ungültiges Budget/CSV und Itemdetails prüfen.
- Bei NPC-Limit30/maxAllocation20 und beiden Positionen kann das globale Limit
  über mehrere Positionen sichtbar werden; isolierte exakte Beispielprüfung
  steht zusätzlich in `test/planning.test.mjs` (zwei gleiche10-Coin-Kandidaten).

LocalStorage-Schlüssel: `bazaar-profiles` enthält version,scanner,plan;
`bazaar-settings` ist nur die einmalige Legacy-Quelle bei fehlenden neuen
Profilen. `bazaar-favorites` bleibt global. Für Migration nur im isolierten
Testbrowser neue Profile entfernen und Legacy-Daten setzen; keine produktiven
Browserdaten löschen.

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
