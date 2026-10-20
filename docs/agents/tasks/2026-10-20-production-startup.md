# 2026-10-20-production-startup: Produktionsstart lädt Marktdaten nicht

Status: DONE
QA-Runden: 1 / 3
Rollenmodus: native custom agents (PO, Developer und unabhängige QA getrennt)

## Nutzerziel und Scope

Nach Push/Deployment bleibt die Oberfläche bei „Verbinde …“ / „Marktdaten werden geladen …“ stehen. Appstart und Marktdatenanzeige reparieren und Produktionsauslieferung wirksam absichern. Ausgangsstand sauber, HEAD6a18a45 („Separate Filter und verbesserter Investitionsplan“). Kein eigenständiger Push/Merge/Deployment in diesem Fehlerbehebungsschritt.

Koordinator-Befund: app.mjs importiert profiles.mjs und detail-context.mjs, server.mjs liefert beide im assets-Allowlist-Routing nicht aus (404 JSON mit nosniff). Der bisherige generische Fixture-Server lieferte beliebige public-Dateien und verdeckte diesen Produktionsunterschied. Screenshot passt zum nicht gestarteten Modulgraphen. Keine Hypixel-Störung behauptet.

## PO-Vertrag v1

READY durch bazaar_product_owner, geprüft am 2026-10-20. Hauptagent alleiniger Ticket-Editor; PO/QA read-only, Developer mit exklusiver Produkt-/Testschreibphase.

Ziel: Browserstart und Marktdatenanzeige reparieren und mit einer Regression auf der echten Produktionsauslieferung absichern. Ursache: Fehlende Allowlist-Routen für profiles.mjs und detail-context.mjs liefern 404 mit application/json und nosniff; der Modulgraph startet nicht. Die generische Fixture-Auslieferung kaschierte dies.

Produktentscheidung/Scope: Fehlende produktive Module mit JS-MIME ausliefern. Produktionsrouting nebenwirkungsfrei testbar machen, gegebenenfalls mit einem kleinen separaten HTTP-/Handlermodul und injizierten Daten-/Refresh-Abhängigkeiten. Explizites Assetschema erhalten, keine generische Verzeichnisfreigabe. Browser-Fixture verwendet die echte Produktionsroute für HTML/Assets; nur Daten, Upstream oder Teststeuerung injizieren. Kein separater generischer Public-Dateiserver als Nachweis. Betroffen: server.mjs, gegebenenfalls kleines HTTP-Modul, Serverregression, Fixture und kurze Testdokumentation. Anwendungscode nur bei tatsächlichem Bedarf ändern.

Nichtziele: Änderungen an Markt, Plan, Profilen, Filtern, Design, Hypixel-Polling, Cache, Steuern oder Spielregeln; neue Abhängigkeiten, Live-Abfragen, Push, Merge oder Deployment.

| ID | Verbindliches Soll | Prüfung |
|---|---|---|
| AC-01 | Produktions-GET / und alle transitiv aus HTML/app.mjs referenzierten lokalen JS-Module liefern 200, richtigen Dateiinhalt und JS-MIME. Insbesondere app.mjs, market.mjs, profiles.mjs, detail-context.mjs. | Automatischer HTTP-Test verfolgt lokale Imports rekursiv oder gleichwertiger Vollständigkeitsnachweis; nicht nur zufällige Dateinamen. Browser ohne Modul-404 oder MIME-Abbruch. |
| AC-02 | HEAD derselben Module liefert 200, korrekten Content-Type und leeren Body. nosniff, CSP, Referrer- und Cache-Header bleiben erhalten. HTML/CSS/Icon/healthz funktionieren, unbekannte Pfade bleiben 404 statt HTML-Fallback. Kein Zugriff auf server.mjs, Repo-/Test-/Dotdateien oder außerhalb public. | HTTP-Tests der echten produktiven Dispatchfunktion: unbekannte Datei, Nicht-GET/HEAD ergibt 405, repräsentativer Pfadausbruchsversuch. |
| AC-03 | HTTP-Regression und Browser benutzen denselben Produktionshandler und dieselbe Assetauflösung wie server.mjs. Stubs ersetzen nur externe Daten/Refresh oder kontrollierte Serverzustände. Testimport/-start erzeugt keine Hypixel-Abfragen. Listener/Timer sauber schließbar, keine neuen Abhängigkeiten. | Injizierte Naht und Produktionshandler im Nachweis nennen; kein generischer Static-Server als Ersatz. |
| AC-04 | Über produktive Offline-Auslieferung mit gültiger Fixture lädt der Browser nach initialer Ladeanzeige Scannerzeilen, Verbindung/Datenstand und Automatik/Countdown. Planwechsel und Berechnung funktionieren; Budget-/Filteränderung wirkt isoliert, anderer Reiter bleibt erhalten; Detail öffnet sich. | Echte Browserprüfung. Root-IAB darf nach QA-Schritten Operator sein; rohe DOM-/HTTP-/Screenshotbelege an unabhängige QA. |
| AC-05 | Produktive Assetauslieferung plus kontrollierter API-503 ohne Snapshot startet die UI trotzdem: verständliche Fehler-/Verbindungsanzeige und Wiederholungsversuch statt stummem Dauerladen. Nach gültiger Fixture per Aktualisieren erfolgreich Daten anzeigen. Bei vorhandenem Snapshot bleiben Daten und Warnung korrekt erhalten. | Offline-Browser initial 503, danach Erfolg sowie Snapshotfehlerfall; bestehender Retryablauf, keine Hypixel-Abfragen. |
| AC-06 | Keine fachlichen, UI-, Polling- oder Persistenzänderungen; 34 vorhandene und neue Server-/Modulgraph-Tests final mit node scripts/check.mjs erfolgreich. Testsupport syntaktisch gültig. Produktionsrouten-Browserprüfung dokumentiert, keine Prüflücke als PASS. Testdokumentation korrigiert. | Vollständiger Check, Diff, unabhängige QA und PO-Abnahme. Kein Push/Merge/Deployment. |

Testplan: Fehlende Produktionsrouten mit 404 offline reproduzieren (kein Live-Produktserverstart). Minimaler Fix und Dispatchnaht. HTTP-Modulgraph mit GET/HEAD/MIME/nosniff/404/405/Sicherheit und alle Tests. QA-geführte echte IAB-Prüfung für Erfolg, Filter, Reiter, Details und 503 mit anschließender Wiederherstellung über Produktionsassets. QA bewertet Rohbelege, danach PO-Abnahme.

PO-Auslegung v1: Eine gemeinsame, von server.mjs und Fixture tatsächlich aufgerufene statische Produktionsauslieferung mit Allowlist genügt als Naht; kein Komplettrefaktor von API/Polling. QA prüft die echte Einbindung in server.mjs. Die vorhandene Fixture-API darf kontrollierte Daten liefern; HTML/Assets müssen durch dieselbe Produktionsroute mit ihren Status-/MIME-/Headerregeln gehen. Keine produktiven Testmodi, Backdoors oder Livepolling-Stubs erforderlich.

Quellen/Annahmen: server.mjs, app.mjs, profiles.mjs und bisheriger Fixture-Server lokal geprüft am 2026-10-20. Screenshot passt zum Modulgraphabbruch; keine Hypixel-Störung behaupten, keine neuen Spielregeln oder externen Regelquellen. Risiko: Bereits deployte Instanz und Proxycache ändern sich durch den lokalen Fix nicht; neues Image separat ausliefern. Zwingende offene Fragen: keine.

## Developer-Übergabe

Dateistand eingefroren. Baseline offline bestätigt: /profiles.mjs und /detail-context.mjs liefern im unveränderten Produktionscallback 404 JSON mit nosniff, /app.mjs dagegen 200 JavaScript. Neues nebenwirkungsfreies http-assets.mjs bietet explizite Allowlist einschließlich beider Module. server.mjs und Fixture verwenden denselben serveStatic-Handler für HTML, Module, CSS, Icon, healthz, Methodenprüfung und Sicherheitsheader. Generische Fixture-Dateiauslieferung entfernt. Dockerfile COPY und scripts/check.mjs nehmen das neue Modul auf. API/Polling/Markt/Profil/UI unverändert.

Developer-Prüfung: node scripts/check.mjs mit 38/38 Tests erfolgreich (34 vorhandene plus 4 HTTP-Tests), alle Syntaxprüfungen erfolgreich. Fixture/Setup zusätzlich syntaktisch geprüft. Neue HTTP-Tests verwenden echte Node-HTTP-Objekte auf In-Memory-Transport ohne Netzwerk; sie prüfen rekursiven Modulgraph, GET/HEAD, exakten Inhalt, MIME/Sicherheitsheader, 404/405 und Pfadausbrüche.

Dateien: server.mjs, Dockerfile, scripts/check.mjs, http-assets.mjs, test/http-assets.test.mjs, test-support/fixture-server.mjs, setup.html, setup.mjs, README.md. AC-01–03 umgesetzt, AC-06 geprüft; echte Browserprüfung AC-04–05 noch offen. /__setup steuert „API-Erfolg“, „Initialer API-Fehler ·503“ und „Aktualisierungsfehler mit Snapshot“. Kein Produktserverstart, keine Hypixel-Abfragen, kein Push/Deployment.

## QA

Runde 1: PASS durch unabhängigen bazaar_qa auf eingefrorenem Developer-Stand. QA hat node scripts/check.mjs selbst ausgeführt: 38/38 PASS. Zusätzlich Testsupport-Syntax und git diff --check erfolgreich. Gemeinsame Handler-Einbindung in server.mjs und Fixture sowie Docker COPY geprüft; keine generische Fixture-Dateifreigabe, kein Side Effect beim Handlerimport, keine Änderung an public/Markt/Polling/Profilen.

Root als Browseroperator nach konkreten QA-Schritten: erlaubter IAB mit Offline-Server 4184 (Session44112), alle HTML-/Assetantworten durch serveStatic. Rohe Evidenz unter C:/Users/SHYN/.codex/visualizations/2026/10/20/01a159d2-4a3e-7221-97c9-f94b61df0e37/qa-startup-browser-evidence.json; Bilder daneben qa-startup-success-full.png, qa-startup-success-scanner.png, qa-startup-error-full.png, qa-startup-recovered-full.png. QA bewertet diese unabhängig.

Browser ausgeführt: Defaults/capacity Scanner 6 Stück, Plan 160 Stück/Einsatz16016/Gewinn2928.2; Planbudget2000 ergibt19/Einsatz1901.9/Gewinn347.72, Detail öffnet, Scanner bleibt1M/6. Initial503 nach Reload: verständliche Notice, Verbindung gestört, Refresh verfügbar, Countdown60 auf43 Sekunden. Nach Erfolg per Refresh wieder Scanner/Plan gefüllt. Fehler mit vorhandenem Snapshot: Zeilen/Datenstand bleiben, Warnung und Aktualisierung gestört, danach erfolgreiche Erholung. Erfolgsconsole vor absichtlichem503 leer; vollständige Console im Protokoll. Keine Hypixel-Abfragen.

## PO-Abnahme und Abschluss

QA-Matrix: AC-01 PASS (rekursiver Modulgraph, Inhalt, MIME, Browserstart); AC-02 PASS (GET/HEAD/Header/404/405/Sicherheit); AC-03 PASS (gemeinsamer Handler, keine Liveabfragen, Docker); AC-04 PASS (echter Browserstart, Plan, isolierte Eingaben, Details); AC-05 PASS (initialer Fehler, Countdown, Snapshot und Erholung); AC-06 PASS (38 Tests, unveränderter fachlicher Umfang, Dokumentation). Keine notwendigen Prüflücken. QA bewertete Rohprotokoll und vier Screenshots selbst; dort keine erfassten Konsolenmeldungen. Keine Dateien durch QA geändert.

PO-Abnahme: ACCEPTED für Vertrag v1 und AC-01 bis AC-06. PO prüfte Ticket, gemeinsamen Handler, tatsächliche Server-/Fixture-Einbindung, rekursive HTTP-/Sicherheitsregressionen, Docker COPY und Syntaxcheck. Kleine gemeinsame HTTP-Naht löst den Produktionsfehler ohne fachliche Markt-/Profil-/Pollingänderungen. QA-PASS, 38 bestandene Tests und produktionsnaher Browsernachweis tragen die Abnahme. Keine blockierenden Restpunkte.

Abschluss: DONE für den lokalen reparierten Dateistand. Kein Commit/Push/Merge/Deployment ausgeführt. Die bereits deployte Instanz erhält den Fix erst nach neuem Image-Build und Portainer-Update. Keine Behauptung einer bereits reparierten laufenden Instanz. Offline-Testserver Session44112 beendet, beide temporären IAB-Tabs geschlossen. Keine Hypixel-Abfragen während der Prüfung.
