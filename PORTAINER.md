# Skyblock Exchange 1.0 auf deinem Heimserver

Für den empfohlenen Weg über GitHub Actions und die GitHub Container Registry siehe [GITHUB-PORTAINER.md](GITHUB-PORTAINER.md). Die folgende Anleitung ist die Alternative mit einem lokalen Image-Build auf dem Server. Die beiden Stack-Dateien nicht vermischen: `portainer-ghcr.yaml` lädt von GitHub; `portainer-stack.yaml` verwendet ein lokal gebautes Image.

Die Anleitung gilt für einen einzelnen Linux-Docker-Host in Portainer (Docker Standalone, nicht Swarm). Falls du mit „TIMA OS“ ZimaOS meinst: Verwende dessen vorhandene Docker Engine; Docker Desktop ist nicht nötig.

## 1. Image einmalig auf dem Server bauen

Entpacke `skyblock-bazaar.zip` auf deinem PC und kopiere den entpackten Projektordner über deine Server-Dateifreigabe auf den Server. Öffne dann das Terminal des Servers oder eine SSH-Verbindung. Wechsle in den tatsächlich verwendeten Ordner:

```sh
cd /DEIN/PFAD/skyblock-bazaar
docker build --pull -t skyblock-exchange:1.0.0 .
docker image inspect skyblock-exchange:1.0.0
```

Der Pfad ist ein Platzhalter. Das Image muss auf genau der Docker Engine gebaut werden, die du anschließend in Portainer auswählst. Falls dein Benutzer keine Docker-Berechtigung hat, verwende `sudo docker ...`. Der erste Build braucht Internetzugang zum offiziellen Node-Basisimage. Der Build auf deinem Server wählt dessen Architektur automatisch.

Alternativ mit GitHub: Lade den entpackten Quellcode in dein Repository, klone es auf den Server und führe dort denselben Build aus. Es wird kein Image automatisch auf Docker Hub oder GitHub veröffentlicht.

## 2. In Portainer installieren

1. Öffne Portainer und wähle die lokale Docker-Umgebung deines Servers.
2. Öffne **Stacks → Add stack** und vergib `skyblock-exchange` als Namen.
3. Wähle **Web editor** und füge den vollständigen Inhalt von `portainer-stack.yaml` ein.
4. Standard ist `8080:3000`. Falls Port 8080 schon belegt ist, ändere nur die linke Zahl, zum Beispiel auf `8090:3000`.
5. Klicke **Deploy the stack**. Kein erzwungenes Image-Pull aktivieren: Das Image wurde lokal gebaut, und `pull_policy: never` verhindert Registry-Downloads.
6. Prüfe unter **Containers**, dass der Container läuft und nach kurzer Zeit `healthy` ist.
7. Öffne `http://DEINE-SERVER-IP:8080` (oder deinen gewählten Port).

Für diesen Weg nicht zusätzlich `docker compose up` ausführen, sonst würdest du eine zweite Installation starten. `compose.yaml` ist die Alternative für eine Installation direkt per Terminal.

## 3. App-Icon auf dem Server-Dashboard

- Name: **Skyblock Exchange**
- Web-Adresse: `http://DEINE-SERVER-IP:8080`
- Icon-URL: `http://DEINE-SERVER-IP:8080/app-icon.png`
- Für einen Datei-Upload: `public/app-icon.png`.

Ersetze IP und Port in beiden URLs. Das Icon wird von der App selbst ausgeliefert und benötigt keinen externen Bildhost. Falls dein Dashboard eine URL verlangt, trage die Icon-URL im Feld für das App-Symbol ein. Eine Portainer-Installation erzeugt nicht zwingend automatisch eine Kachel im Betriebssystem-Dashboard; füge dort gegebenenfalls einen Web-Link hinzu.

## Betrieb und spätere Updates

Kein API-Key und kein Volume erforderlich. Einstellungen und Favoriten liegen im jeweiligen Browser, Marktdaten nur im Arbeitsspeicher. Die neue Server-Adresse hat einen eigenen Browserspeicher: Lokale Einstellungen werden nicht automatisch übernommen. API-Abfragen laufen standardmäßig alle 60 Sekunden, bei Fehlern mit längerer Wartezeit. Ausgehendes HTTPS zu `api.hypixel.net` muss erlaubt sein.

Für ein Update den Quellcode auf dem Server ersetzen, das Image mit demselben Build-Befehl erneut bauen und den Stack in Portainer neu bereitstellen bzw. den Container neu erstellen, ohne Image-Pull. Ein bloßer Container-Neustart übernimmt ein neu gebautes Image nicht. Für eine klar versionierte Aktualisierung kannst du stattdessen einen neuen Tag bauen und denselben Tag im Stack eintragen.

Die App hat keinen Login. Die Portfreigabe ist für den Zugriff im Heimnetz gedacht; für Fernzugriff eignet sich dein bestehender VPN-Zugang.

## Fehlerbehebung

- **Image nicht gefunden:** Build auf der falschen Docker Engine oder abweichender Tag. `docker image inspect skyblock-exchange:1.0.0` auf dem Zielhost prüfen.
- **Port already allocated:** Linke Portnummer im Stack ändern.
- **Keine Marktdaten:** Container-Logs, Internetzugang und DNS prüfen. Der Healthcheck prüft die Erreichbarkeit der App, nicht die Verfügbarkeit von Hypixel.
- **Icon fehlt:** Icon-URL direkt im Browser öffnen; Server-IP statt `localhost` verwenden.

## Validierung dieses Pakets

Die Anwendungstests werden lokal mit `node --test` ausgeführt. Auf dem Entwicklungsrechner ist Docker nicht installiert; ein echter Image-Build und Containerstart konnten dort deshalb nicht geprüft werden. Der erste reale Docker-Build erfolgt mit Schritt 1 auf deinem Server.

Quellen: [Portainer: Images bauen](https://docs.portainer.io/user/docker/images/build), [Portainer: Stack anlegen](https://docs.portainer.io/user/docker/stacks/add).
