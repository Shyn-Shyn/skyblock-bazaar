# Bazaar-Wissen und Quellenpflege

Stand der Repository-Prüfung: 2026-10-20. Diese Datei ist eine Arbeitsgrundlage,
kein dauerhaft aktuelles Abbild aller Hypixel-Spielregeln.

## Aus der Hypixel-API-Dokumentation

[Hypixel Public API, Bazaar](https://api.hypixel.net/#tag/SkyBlock/paths/~1v2~1skyblock~1bazaar/get)
(geprüft 2026-10-20): Summary-Felder enthalten nur die oberen 30 Orders je
Transaktionsart. `quick_status`-Preise sind volumengewichtete Werte der oberen
2 %; `movingWeek` enthält Sieben-Tage-Handel plus aktuellen offenen Bestand.
Das ist keine vollständige Orderhistorie und kein garantierter zukünftiger Flow.

Die API-Beispiele und das getestete App-Modell interpretieren `sell_summary`
als Gebote, gegen die sofort verkauft wird, und `buy_summary` als Angebote,
aus denen sofort gekauft wird. Für eigene Buy-Orders ist das höchste Gebot
relevant, für eigene Sell-Offers das niedrigste Angebot. Preisstufen sortieren;
nicht einfach das erste Arrayelement oder einen Durchschnitt übernehmen.

Item-/NPC-Daten stammen aus
[`/v2/resources/skyblock/items`](https://api.hypixel.net/v2/resources/skyblock/items).
Vor neuen Annahmen zum Schema aktuelle API-Dokumentation/Antwort prüfen.

Die frühere offizielle Bazaar-Wiki-URL `https://wiki.hypixel.net/Bazaar`
leitete am Prüftag zu einer Schließungsankündigung weiter. Diese Weiterleitung
belegt keine heutigen Steuern oder Limits. Dafür aktuelle Hypixel-Ankündigungen,
API-Dokumentation oder nachvollziehbare In-Game-Evidenz prüfen; fehlt sie,
offene Frage oder ausdrücklich gekennzeichnete Produktannahme verwenden.

## Aktuelles App-Modell, keine allgemeingültigen Spielkonstanten

`public/market.mjs` und die zugehörigen Tests sind maßgeblich für das derzeitige
Produktverhalten:

- Buy-Order = bestes Gebot + konfigurierter Tick; Sell-Offer = günstigstes
  Angebot - Tick. Aktueller Standardtick: 0.1 Coins.
- Bazaar-Netto pro Item = Verkauf * (1 - Steuer / 100) - Einkauf.
  Standardsteuer 1.25 % ist eine veränderbare App-Einstellung. Persönliche
  Boni, Eventregeln und weitere Gebühren nicht ungeprüft als abgedeckt ansehen.
- Beispiel: 100.1 Einkauf, 119.9 Verkauf, 1.25 % Steuer -> 18.30125 Netto.
  19.8 ist der Bruttospread; ROI = Netto / Einkauf * 100.
- NPC: Buy-Order-Einkauf, Verkauf zum `npc_sell_price`; im Modell keine
  Bazaar-Verkaufssteuer und kein Verkaufstick. Individuelle NPC-Limits,
  Verkaufbarkeit und Boni erfordern gesonderte Prüfung.
- Wochenfluss wird um offenen Bestand bereinigt, dann gleichmäßig auf Zeit
  verteilt. Marktanteil und Warteschlangen schätzen Kapazität/Füllzeiten.
  Bazaar modelliert Kauf und Verkauf nacheinander, NPC nur den Markteinkauf.
- Allokation ist eine Heuristik: gemeinsames Budget, ganze Mengen, Kapazität,
  Positionszahl und Item-Anteil begrenzen; Rundung darf nicht überinvestieren.
  Keine Garantie des globalen Optimums oder tatsächlicher Gewinne.
- Server pollt standardmäßig alle 60 s mit Cache/Backoff/Retry-After.
  Marktalter > max(180 s, dreifaches Intervall) warnt; Daten bleiben sichtbar.
  NPC-Empfehlungen fehlen bei fehlenden oder mindestens 48 h alten Itemdaten.
  Diese Regeln liegen auch in `server.mjs`/`public/app.mjs`, nicht nur in Tests.

## PO-Prüffragen bei neuen Marktfeatures

Welche Handelsart, Preiseinheit und Kosten? Welcher Snapshot/Zeitstempel?
Brutto/Netto, pro Item/gesamt, ROI oder Coins pro Zeit? Welche Liquidität,
Preisbewegung, Slippage und Konkurrenz? Was passiert bei leerer Seite,
NaN/negativen Werten, API-Fehlern, veralteten Daten und fehlenden NPC-Preisen?
Welche Angaben sind belegt, welche konfigurierbar und welche unbekannt?
Pro relevante Regel Quelle + Prüfdatum + Auswirkung im Ticket festhalten.
