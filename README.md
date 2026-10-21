# Skyblock Exchange

## Entwicklung mit dem Codex-Team

PO, Developer, unabhängige QA und ein Release-Agent sind im Repository eingerichtet. Öffne das
Projekt in Codex und nenne deine Anforderung; `AGENTS.md` steuert die Übergaben
und die Rückgabe von QA-Fehlern an den Developer. Bei beauftragtem Push oder
Deployment übernimmt der Release-Agent nach QA-PASS und PO-Abnahme und prüft
GitHub-Push, Image-Veröffentlichung und Live-Status getrennt.
[Bedienung, Rollen und Ablauf](docs/agents/README.md).
Lokale Prüfung ohne Installation: `node scripts/check.mjs`.

Skyblock Exchange ist eine selbst gehostete Web-App für **Hypixel SkyBlock**, die Bazaar-Flips findet und aus einem vorgegebenen Budget einen Investitionsplan erstellt. Sie berücksichtigt Preisspreads, Verkaufssteuer, offene Ordermengen und den geschätzten Handelsdurchsatz.

Die App bietet eine deutschsprachige Weboberfläche im Minecraft-inspirierten Design. Sie empfiehlt Trades; Käufe und Verkäufe führst du selbst im Spiel aus.

## Funktionen

### Alle Flips

Der Scanner zeigt passende Items mit Kauf- und Verkaufspreisen, Nettogewinn, Rendite, modellierter Kaufmenge und geschätzter Dauer. Suche, Sortierung und Merkliste helfen beim Vergleichen. Ein Klick auf ein Item öffnet Details zum Orderbuch und zur Berechnung. Die gefilterten Ergebnisse lassen sich als CSV exportieren.

Zwei Verkaufsziele stehen zur Auswahl:

- **Bazaar:** Einkauf per Buy-Order und Verkauf per Sell-Offer. Die eingestellte Verkaufssteuer wird vom Erlös abgezogen.
- **NPC:** Einkauf per Buy-Order und Verkauf zum NPC-Basispreis aus der Hypixel-API. Es fällt im Modell keine Bazaar-Verkaufssteuer an.

Der Einkauf erfolgt in beiden Fällen per Buy-Order, nicht als Sofortkauf.

### Investitionsplan

Budget eingeben, Verkaufsziel auswählen und die vorgeschlagene Aufteilung prüfen. Eingaben wie `1M`, `10M`, `1,5M` oder `500K` werden automatisch als Coins interpretiert.

- Eigene Filter und eigenes Budget, unabhängig vom Reiter **Alle Flips**.
- Standardmäßig höchstens **zwölf verschiedene Items** und **24 Stunden** Planungszeitraum.
- Bis zu **100 % des Budgets in einem Item**, sofern die Modellgrenzen das erlauben.
- Keine eingeplante Reserve. Ganze Stückzahlen, Durchsatz und Positionslimits können Restbeträge verursachen.
- Bazaar-Ziel **Budget ausschöpfen** priorisiert eingesetzte Coins; alternativ **Nettogewinn**. Mehr Budgetnutzung kann weniger Gewinn bedeuten.
- NPC-Ziel **Wenige Stück bevorzugen** berücksichtigt den manuellen Stückaufwand. Das persönliche **Gesamtstücklimit** startet bei **2.048** über alle Positionen; alternativ lässt sich Nettogewinn unter demselben Limit priorisieren.
- Anzeige von Kaufmengen, Einsatz, Budgetanteilen, Nettogewinn und geschätzter Dauer.
- Eigener CSV-Export für den Plan.

Unter **Strategie anpassen** lassen sich unter anderem Itemanzahl, Budgetanteil je Item, Renditefilter, Steuer, Zeithorizont und Liquiditätsannahmen ändern. Die Startwerte sind:

| Einstellung | Alle Flips | Investitionsplan |
|---|---:|---:|
| Maximal verschiedene Items im Plan | — | 12 |
| Maximaler Budgetanteil je Item im Plan | — | 100 % |
| Zeithorizont | 1 Stunde | 24 Stunden |
| Angenommener Anteil am Durchsatz | 1 % | 1 % |
| Mindest-Tagesdurchsatz je benötigter Handelsseite | 1.000 Items | 1.000 Items |
| Netto-ROI | 2–50 % | 2–50 % |
| Maximaler Orderdruck | 6 Stunden | 6 Stunden |
| Bazaar-Verkaufssteuer | 1,25 % | 1,25 % |

Die Filter werden je Reiter getrennt gespeichert; **Zurücksetzen** betrifft nur die aktive Ansicht. Verteilungslimits gelten nur für den Investitionsplan. Suche, Merkliste und Sortierung im Scanner ändern den Plan nicht. Die Merkliste bleibt gemeinsam gespeichert. Bei der einmaligen Übernahme älterer Einstellungen behält der Scanner sämtliche Filter; der Plan übernimmt nur Budget, Steuer und Verkaufsziel und startet ansonsten mit seinen eigenen Vorgaben.

Freies Budget wird mit den relevanten Modellgrenzen erläutert: Zeit/Marktanteil und Einzelkapazitäten, Item-/Positionslimits, ganze Stücke sowie NPC-Stücklimit oder Zielabwägung. Ein höherer Zeithorizont kann mehr Menge ermöglichen, erhöht aber das Preisänderungsrisiko. Keine Einstellung garantiert vollständige Budgetnutzung oder Ausführung.

## Datenquellen und API

Die App verwendet die öffentlichen Endpunkte der [Hypixel-API](https://api.hypixel.net/):

| Endpunkt | Verwendung |
|---|---|
| [`GET /v2/skyblock/bazaar`](https://api.hypixel.net/v2/skyblock/bazaar) | Preise, Orderbuch, offene Mengen und Handelsvolumen |
| [`GET /v2/resources/skyblock/items`](https://api.hypixel.net/v2/resources/skyblock/items) | Itemnamen und NPC-Basisverkaufspreise (`npc_sell_price`) |

Für diese App ist kein Hypixel-API-Key erforderlich. Die Abrufe erfolgen zentral über den App-Server; mehrere Browser teilen sich dessen Cache.

- Bazaar-Daten werden standardmäßig alle **60 Sekunden** abgefragt. Das Intervall lässt sich erhöhen.
- Itemnamen und NPC-Preise werden nach erfolgreichem Abruf täglich aktualisiert.
- Bei API-Fehlern verlängert sich die Wartezeit automatisch; ein `Retry-After` wird berücksichtigt.
- Die Oberfläche zeigt Datenstand, Aktualisierungs-Countdown und Warnungen bei veralteten Daten.
- Der manuelle Aktualisieren-Button umgeht das serverseitige Abfrageintervall nicht.

Das gewählte Intervall ist eine Einstellung der App, keine von Hypixel garantierte Abfragerate.

Die App stellt außerdem folgende HTTP-Endpunkte bereit:

| Pfad | Zweck |
|---|---|
| `/` | Weboberfläche |
| `/api/bazaar` | Zwischengespeicherte Marktdaten und Statusinformationen |
| `/healthz` | Erreichbarkeitsprüfung für den Docker-Healthcheck |
| `/app-icon.png` | App-Icon für Server-Dashboards |

Der Healthcheck prüft die App, nicht die Verfügbarkeit oder Aktualität der Hypixel-Daten. Ohne erfolgreichen Markt-Snapshot antwortet `/api/bazaar` mit HTTP 503.

## Berechnungsmodell

Für Bazaar-Flips setzt das Modell ein Kaufgebot knapp über das beste bestehende Gebot und ein Verkaufsangebot knapp unter das günstigste Angebot. Der Nettogewinn berücksichtigt die konfigurierte Verkaufssteuer. Bei NPC-Flips ersetzt der feste NPC-Basispreis das Verkaufsangebot.

Die Kaufmenge wird durch Budget, Orderbuch, geschätzten Durchsatz und Zeithorizont begrenzt. Der Durchsatz wird aus den Wochenvolumen abzüglich offener Ordermengen geschätzt. Bei Bazaar-Flips werden Einkauf und Verkauf zeitlich nacheinander modelliert; bei NPC-Flips wird nur die Einkaufsseite für den Marktdurchsatz berücksichtigt.

Der Investitionsplan vergleicht mehrere mögliche Verteilungen nach dem gewählten Ziel. Er ist eine begrenzte Näherung und garantiert weder die mathematisch optimale Verteilung noch die tatsächliche Ausführung der Orders. Bei NPC-Ziel **Wenige Stück bevorzugen** werden vollständige Varianten einschließlich kürzerer Teilpläne nach Nettogewinn / (1 + Gesamtstückzahl / 64) gewichtet. 64 ist lediglich eine Heuristik-Skalierung, keine Stack-/Spielregel; 2.048 ist eine konfigurierbare persönliche Planungsvorgabe, keine NPC-Verkaufsgrenze. Angezeigte Gewinne bleiben tatsächliche Modellgewinne in Coins. Weniger Stücke können weniger Gewinn und freie Coins bedeuten.

Für die Entwicklung steht eine [Offline-Browserumgebung mit kontrollierten Testdaten](test-support/README.md) zur Verfügung.

Eigene laufende Orders, individuelle NPC-Limits und Boni, manuelle Verkaufszeit sowie zukünftige Preisänderungen werden nicht automatisch erfasst. Bereits gebundene Coins sollten deshalb vor der Budgeteingabe abgezogen werden. Items ohne gültige NPC-Preise werden für NPC-Flips ausgeschlossen; fehlende oder mindestens 48 Stunden alte NPC-Daten deaktivieren diese Empfehlungen.

## Installation mit Docker Compose

Voraussetzungen sind Docker Engine mit Docker Compose v2, ein freier Server-Port und ausgehender HTTPS-Zugriff auf die Hypixel-API. Eine Datenbank oder ein persistentes Volume ist nicht nötig.

Erstelle einen Ordner für die App und darin eine Datei `compose.yaml` mit folgendem Inhalt:

```yaml
services:
  bazaar:
    image: ghcr.io/shyn-shyn/skyblock-bazaar:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: "3000"
      REFRESH_SECONDS: "60"
    restart: unless-stopped
    init: true
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

Führe im Ordner mit dieser Datei aus:

```sh
docker compose pull
docker compose up -d
```

Die App ist anschließend unter **`http://DEINE-SERVER-IP:3000`** erreichbar. Das Image wird für Linux mit AMD64 und ARM64 bereitgestellt.

Bei einem belegten Port ändere nur die linke Zahl, beispielsweise auf `"8090:3000"`. Die Browser-Adresse lautet dann `http://DEINE-SERVER-IP:8090`.

### Installation über Portainer

Wähle deine Docker-Standalone-Umgebung und öffne **Stacks → Add stack**. Vergib einen Namen wie `skyblock-exchange`, füge die obige Compose-Konfiguration im **Web editor** ein und klicke auf **Deploy the stack**.

Das Image muss öffentlich lesbar sein oder Portainer muss über passende Registry-Zugangsdaten für `ghcr.io` verfügen. Ein lokaler Image-Build auf dem Server ist für diese Installation nicht erforderlich.

### Installation mit Docker ohne Compose

```sh
docker run -d \
  --name skyblock-exchange \
  --restart unless-stopped \
  --init \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 3000:3000 \
  -e REFRESH_SECONDS=60 \
  ghcr.io/shyn-shyn/skyblock-bazaar:latest
```

Compose, Portainer und `docker run` sind alternative Installationswege. Für dieselbe Instanz nur einen davon verwenden.

### Optional: Image aus dem Quellcode bauen

Im Projektverzeichnis mit dem Dockerfile:

```sh
docker build -t skyblock-exchange:local .
```

Verwende anschließend `skyblock-exchange:local` statt des GHCR-Images in deiner Konfiguration. Die im Repository enthaltene `compose.yaml` ist eine Alternative mit lokalem Build; sie startet mit `docker compose up -d --build` und verwendet standardmäßig Server-Port 8080.

## Konfiguration und Betrieb

| Variable | Standard | Bedeutung |
|---|---|---|
| `REFRESH_SECONDS` | `60` | Bazaar-Abfrageintervall in Sekunden; mindestens 60 |
| `PORT` | `3000` | Interner HTTP-Port; bei Änderung auch Portzuordnung und Healthcheck anpassen |
| `HOST` | `0.0.0.0` | Adresse, auf der der Server im Container lauscht |

Marktdaten liegen im Arbeitsspeicher und werden nach einem Neustart neu geladen. Es gibt keine gespeicherte Preishistorie. Filter und Merkliste liegen im Browserspeicher und werden nicht zwischen Geräten oder unterschiedlichen App-Adressen synchronisiert.

Für eine Installation mit dem obigen Compose-Beispiel:

```sh
# Status und Logs
docker compose ps
docker compose logs --tail=100 -f

# Neue Image-Version herunterladen und Container aktualisieren
docker compose pull
docker compose up -d

# Installation stoppen und Container entfernen
docker compose down
```

Bei Portainer den Stack aktualisieren und das erneute Herunterladen des Images aktivieren. Ein einfacher Container-Neustart übernimmt kein neues Image. Neben `latest` stehen die vom Build veröffentlichten `sha-<Commit-ID>`-Tags zur Auswahl einer bestimmten Version bereit.

Für eine Dashboard-Kachel kann `http://DEINE-SERVER-IP:3000/app-icon.png` als Icon-URL verwendet werden.

Die App selbst stellt HTTP bereit und besitzt keinen eigenen Login. HTTPS und gegebenenfalls Zugriffsschutz können über einen Reverse Proxy oder Cloudflare Tunnel mit Access vorgeschaltet werden.

## Fehlerbehebung

- **Port bereits belegt:** Linke Portnummer der Zuordnung ändern und den Container neu bereitstellen.
- **Image kann nicht geladen werden:** Image-Pfad, Tag und Registry-Zugriff prüfen.
- **Keine Marktdaten:** Container-Logs sowie ausgehendes HTTPS und DNS prüfen. Bei Hypixel-Störungen werden vorhandene Daten mit Warnung weiter angezeigt.
- **Keine passenden Flips:** Filter, Suchbegriff und Merkliste prüfen; gegebenenfalls Budget oder Zeithorizont anpassen.

Skyblock Exchange ist ein unabhängiges Community-Projekt und nicht mit Mojang oder Hypixel verbunden.
