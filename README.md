# Skyblock Exchange – Bazaar Flipper

Eine selbst gehostete Web-App für **Hypixel SkyBlock**. Sie sucht Kandidaten für **Buy-Order → Sell-Offer** und berücksichtigt Nettomarge, Budget, offene Ordermengen und geschätzten Durchsatz. Die App zeigt Vorschläge; Trades führst du selbst im Spiel aus.

Version 1.0: lokal mit `npm start` oder als Docker-Container. Für die Installation über Portainer siehe [PORTAINER.md](PORTAINER.md). Das App-Icon liegt unter `public/app-icon.png` und ist nach dem Start über `/app-icon.png` erreichbar.

Die Oberfläche hat zwei Reiter: **Alle Flips** (Scanner, standardmäßig geöffnet) und **Investitionsplan** (gemeinsame Budgetverteilung). Die Strategie gilt für beide Reiter, Verteilungslimits werden nur im Plan angezeigt.

**Verkaufsziel:** Wähle Bazaar-Sell-Offer oder NPC. Der Einkauf erfolgt in beiden Fällen per Bazaar-Buy-Order, nicht per Sofortkauf. NPC-Flips nutzen `npc_sell_price` aus den offiziellen Itemdaten, ohne Bazaar-Verkaufssteuer. Nur der Einkaufsdurchsatz und die Kauf-Warteschlange begrenzen ihre Modellmenge und Modellzeit. Manuelle Verkaufszeit, individuelle Boni und persönliche NPC-Verkaufslimits werden nicht modelliert. Items ohne gültigen NPC-Preis werden ausgeschlossen. Die NPC-Preise werden täglich aktualisiert; fehlt ein Snapshot oder ist er mindestens 48 Stunden alt, werden NPC-Flips ausgeblendet. Beide CSV-Exporte enthalten das Verkaufsziel.

## Schnellstart auf deinem Heimserver

Voraussetzungen: Docker Engine mit Docker Compose v2 und Internetzugriff. Keine Datenbank, keine npm-Pakete und kein Hypixel-API-Key erforderlich. Falls Docker noch fehlt, nutze die [offizielle Installation für dein Betriebssystem](https://docs.docker.com/engine/install/).

1. Kopiere diesen gesamten Projektordner auf den Server, beispielsweise nach `~/skyblock-bazaar`. Alternativ verwende die GitHub-Anleitung weiter unten.
2. Öffne dort ein Terminal:

   ```sh
   cd ~/skyblock-bazaar
   cp .env.example .env
   ```

   Unter Windows PowerShell lautet der Kopierbefehl `Copy-Item .env.example .env`.

3. Öffne `.env` in einem Texteditor und wähle den gewünschten freien Server-Port:

   ```dotenv
   APP_PORT=8080
   BIND_ADDRESS=0.0.0.0
   REFRESH_SECONDS=60
   ```

   `APP_PORT` ist der von außen erreichbare Port. Intern lauscht der Container auf Port 3000. `BIND_ADDRESS=0.0.0.0` macht die App über alle IPv4-Netzwerkschnittstellen erreichbar. Für ausschließlich lokalen Zugriff auf dem Server wähle `127.0.0.1`.

4. Baue und starte den Container:

   ```sh
   docker compose up -d --build
   docker compose ps
   ```

5. Öffne im Browser `http://DEINE-SERVER-IP:8080`, beispielsweise `http://192.168.178.50:8080`. Die IP ersetzt du durch die Adresse deines Heimservers. Erlaube den gewählten TCP-Port in dessen Firewall für dein Heimnetz, falls erforderlich.
6. Setze in der Oberfläche dein Budget und deine tatsächliche Verkaufssteuer. Klicke einen Itemnamen an, um beide Orderbücher und die Berechnung anzusehen.

`restart: unless-stopped` startet den Container nach einem Neustart des Docker-Dienstes wieder. Ein Docker-Volume ist nicht nötig: Filter und Merkliste liegen im jeweiligen Browser; der aktuelle Markt-Snapshot liegt im Arbeitsspeicher des Servers. Es gibt keine gespeicherte Preishistorie.

Die App hat keinen Login. Für Zugriff von außerhalb deines Heimnetzes kannst du einen vorhandenen VPN-Zugang verwenden. Öffentliches Hosting erfordert eine eigene Zugriffsregelung und HTTPS am Reverse Proxy. GitHub Pages kann diesen Node-Server nicht ausführen.

## Code auf GitHub ablegen

1. Erstelle auf GitHub ein neues leeres Repository, zum Beispiel `skyblock-bazaar`. Lass automatische README-, Lizenz- und `.gitignore`-Erstellung abgewählt, weil der Projektordner schon Dateien enthält.
2. Öffne PowerShell in diesem Projektordner. Der ursprüngliche Arbeitsordner ist bereits ein Git-Repository. Nach dem Entpacken des ZIP-Archivs führe zuerst `git init` aus. Prüfe dann `git status`:

   ```sh
   git add .
   git commit -m "Add self-hosted SkyBlock Bazaar flipper"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/skyblock-bazaar.git
   git push -u origin main
   ```

   Ersetze `DEIN-NAME` durch deinen GitHub-Namen. Falls `origin` bereits existiert, prüfe `git remote -v` und verwende das passende Repository, statt erneut `remote add` auszuführen. GitHub kann eine Anmeldung verlangen. `.env` wird durch `.gitignore` ausgeschlossen.

3. Auf dem Heimserver:

   ```sh
   git clone https://github.com/DEIN-NAME/skyblock-bazaar.git
   cd skyblock-bazaar
   cp .env.example .env
   docker compose up -d --build
   ```

   Bei einem privaten Repository benötigt auch der Server eine passende GitHub-Anmeldung.

4. Nach späteren Codeänderungen und einem Push:

   ```sh
   git pull --ff-only
   docker compose up -d --build
   ```

## Lokal ohne Docker

Mit Node.js 22 oder neuer, empfohlen Node.js 24:

```sh
npm test
npm start
```

Anschließend `http://localhost:3000` öffnen. `npm install` ist nicht notwendig: Die Anwendung verwendet nur Node-Standardmodule. `npm run dev` startet mit automatischem Neustart bei Dateiänderungen.

## Bedienung

- **Gesamtbudget:** Der Investitionsplan verteilt dieses Budget gemeinsam auf mehrere Items, ohne Reserve. Eingaben wie `1M`, `10M`, `1,5M`, `1.5M` oder `500K` werden unterstützt und beim Verlassen des Feldes ausgeschrieben. Die Scanner-Tabelle zeigt weiterhin alternative Einzelpositionen mit dem vollen Budget.
- **Investitionsplan:** Das gesamte Budget steht zur Verteilung bereit. Standardmäßig sind bis zu 100 % je Item und maximal sechs verschiedene Items erlaubt; engere Limits sind einstellbar. Alte Reserve-Einstellungen werden entfernt und die bisherigen Verteilungsgrenzen einmalig auf diese neuen Standardwerte gesetzt. Ganze Stückzahlen, Durchsatz und Limits können trotzdem Restbeträge verursachen; diese werden ausdrücklich als nicht zugeteilt angezeigt. Der Plan enthält Kaufmengen, Preise, Einsatz, Budgetanteil, Modellgewinn und Modellzeit sowie einen eigenen CSV-Export.
- **Verteilung:** Mehrere greedy berechnete Varianten nach Positionsgewinn, Rendite und Budgetnutzung werden verglichen, zusätzlich alternative Startpositionen aus den jeweils acht besten Gewinn- und Renditekandidaten. Gewählt wird der höchste modellierte Nettogewinn, bei Gleichstand die Variante mit weniger Items. Durchsatz, Orderdruck und Mengenlimits gelten für alle Varianten. Das ist eine begrenzte Suche, keine Garantie für ein globales Optimum oder tatsächliche Gewinne.
- **Einfache Bedienung:** Budget und Verkaufsziel sind direkt sichtbar. Alle weiteren veränderbaren Parameter liegen unter „Strategie anpassen“. Neue Startwerte: maximal sechs Items, bis zu 100 % je Item, 1 Stunde, 1 % geschätzter Marktanteil, mindestens 1.000 Items Tagesdurchsatz pro benötigter Seite, 2–50 % Netto-ROI, höchstens 6 Stunden Orderdruck. Bei der einmaligen Umstellung bleiben Budget, Verkaufsziel und persönliche Steuer erhalten. Diese Voreinstellung ist nicht empirisch als optimal validiert.
- **Plan verwenden:** Buy-Orders mit den vorgeschlagenen Mengen setzen; gefüllte Mengen anschließend per Sell-Offer verkaufen. Vor neuen Plänen bereits gebundene Coins vom Budget abziehen. Eigene laufende Orders werden nicht automatisch erkannt. Die Planpositionen werden als parallel betreut angenommen.
- **Planaktualisierung:** Live-Daten und Strategiefilter berechnen den Plan neu. Suche, Merkliste und Sortierung beeinflussen nur den Scanner. Bei veralteten Daten gilt die Warnung oben auch für den Plan.
- **Netto-ROI / Profit je Item:** Nach der eingestellten Verkaufssteuer. 1,25 % ist nur der Startwert; individuelle Boni oder Events musst du berücksichtigen.
- **Tagesdurchsatz:** Mindestwert auf beiden Seiten. Dieser Filter schließt große Spreads mit wenig Handel aus.
- **Zeithorizont und Marktanteil:** Modellannahmen zur sinnvollen Menge. Standard: eine Stunde und 1 % des geschätzten Durchsatzes.
- **Preisverbesserung:** Standardmäßig Kaufgebot +0,1 und Verkaufsangebot −0,1 Coins. Dieser technische Wert ist fest vorbelegt und nicht mehr Teil der sichtbaren Filter.
- **Max. Orderdruck:** Filter für große vorhandene Mengen an den beiden besten Preisen, gemessen relativ zum stündlichen Durchsatz.
- **Max. Netto-ROI:** Standardmäßig 50 %, um extreme Spreads auszufiltern.
- **Empfehlung:** Positionsgewinn, abgewertet um Orderdruck. Andere Sortierungen sind wählbar.
- **Merkliste:** Stern anklicken und „Merkliste“ aktivieren. Gespeicherte Items erscheinen weiterhin nur, wenn sie die aktuellen Filter erfüllen.
- **CSV:** Exportiert alle aktuell gefilterten Treffer, einschließlich noch nicht eingeblendeter Zeilen. Semikolon als Trennzeichen, UTF-8 mit BOM, Zahlen mit Dezimalpunkt.

## Berechnungsmodell

Die Preisstufen werden nach Preis sortiert; ungültige oder leere Seiten werden verworfen. API-Feldnamen beziehen sich auf Soforttransaktionen: `sell_summary` enthält die Kaufgebote, `buy_summary` die Verkaufsangebote.

```text
Einkauf = höchstes Kaufgebot + Preisverbesserung
Verkauf = niedrigstes Verkaufsangebot − Preisverbesserung
Netto je Item = Verkauf × (1 − Steuer/100) − Einkauf
ROI (%) = Netto je Item / Einkauf × 100

Einkaufsfluss/Stunde = max(0, sellMovingWeek − sellVolume) / 168
Verkaufsfluss/Stunde = max(0, buyMovingWeek − buyVolume) / 168
Zyklusrate = 1 / (1/Einkaufsfluss + 1/Verkaufsfluss)

Wartezeit = sichtbare Menge vor Kaufpreis / Einkaufsfluss
          + sichtbare Menge vor Verkaufspreis / Verkaufsfluss
Flusslimit = Zyklusrate × Marktanteil/100 × max(0, Zeithorizont − Wartezeit)
Menge = floor(min(Budget/Einkauf, Mengenlimit, Flusslimit))
Positionsgewinn = Menge × Netto je Item

Orderdruck = Menge am besten Gebot / Einkaufsfluss
           + Menge am besten Angebot / Verkaufsfluss
Score = max(0, Positionsgewinn) / (1 + ln(1 + Orderdruck))
Bei ROI > 100 %: Score zusätzlich / 3
```

Bei fehlendem Durchsatz ist die Positionsgröße null. Die beiden Handelsschritte werden zeitlich nacheinander modelliert. Das Budget wird nicht innerhalb des Zeithorizonts mehrfach wiederverwendet.

**Grenzen:** Die Volumenfelder und die begrenzte Orderbuchansicht liefern keine individuellen Ausführungszeiten. Gleichmäßiger Durchsatz und Marktanteil sind Annahmen. Neue konkurrierende Orders, Kursschwankungen, eventuelle Zusatzkosten und Stornierungen können das Ergebnis verschlechtern. Das Ranking ist eine transparente Heuristik, keine nachgewiesen optimale Handelsstrategie. Es gibt keine automatische Trade-Ausführung.

## Daten und Betrieb

Quellen:

- [Offizielle Hypixel-API-Dokumentation](https://api.hypixel.net/)
- [Bazaar-Endpunkt](https://api.hypixel.net/v2/skyblock/bazaar)
- [Itemnamen](https://api.hypixel.net/v2/resources/skyblock/items)

Der Server fragt den Bazaar automatisch im Abstand von mindestens 60 Sekunden ab. Gleichzeitige Abrufe werden zusammengefasst. Der Aktualisieren-Button ruft den Server-Cache ab und umgeht dessen Abfrageintervall nicht. Nach Fehlern verdoppelt sich die Wartezeit bis maximal 15 Minuten; ein längeres `Retry-After` wird ebenfalls respektiert. Nach erfolgreichem Abruf gilt wieder das normale Intervall. Die Oberfläche orientiert sich am nächsten Serverabruf und zeigt einen Countdown. Das ist ein gewähltes vorsichtiges Intervall, keine von Hypixel zugesicherte Abfragerate. Itemnamen und NPC-Preise werden einmal täglich aktualisiert.

Anfragen an Hypixel laufen nach 15 Sekunden ab. Bei Fehlern bleibt der letzte Snapshot mit Warnung erhalten. Ohne Snapshot liefert `/api/bazaar` HTTP 503. Daten werden nach mehr als drei Abrufintervallen, mindestens jedoch 180 Sekunden, als veraltet markiert. `/healthz` prüft die Erreichbarkeit der App, nicht die Aktualität der externen API.

```sh
docker compose logs --tail=100 -f
docker compose restart
docker compose down
```

**Fehlerbehebung:**

- Port belegt: `APP_PORT` ändern und `docker compose up -d` ausführen.
- App nur am Server erreichbar: Server-IP, `BIND_ADDRESS` und Firewall prüfen.
- Keine Marktdaten: Container-Logs prüfen; der Server benötigt ausgehenden HTTPS-Zugriff auf `api.hypixel.net`. Bei Hypixel-Störungen warten.
- Keine Kandidaten: Suche leeren, Merkliste deaktivieren, Filter zurücksetzen oder Budget/Zeithorizont erhöhen.

## Projektstruktur

```text
server.mjs           HTTP-Server, Hypixel-Abrufe, Cache
public/market.mjs    Berechnung und Filter
public/app.mjs       UI, Merkliste und CSV
public/index.html   Oberfläche
public/style.css    Responsive Gestaltung
test/market.test.mjs Berechnungstests
Dockerfile          Node-24-Container ohne Root-Benutzer
compose.yaml        Port, Neustart, Healthcheck und Betriebsoptionen
```

Validiert: Berechnungs- und Verteilungstests, Budget-Kurzschreibweise, Abfragepausen, JavaScript-Syntaxprüfung, erfolgreicher Live-Abruf und lokale Browser-Prüfung. Die Verteilungstests prüfen vollständigen Budgeteinsatz ohne Reserve, Budget- und Itemlimits, Durchsatzgrenzen, ganze Mengen und Rundung. Docker-Dateien und ZIP sind weiterhin ältere, nicht aktualisierte Bereitstellungsstände; für den aktuellen Stand `npm start` verwenden.
