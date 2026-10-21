# <ID>: <Titel>

Status: INTAKE
QA-Runden: 0 / 3
Rollenmodus: native custom agents / explizit geladene Rollen / nicht verfügbar

## Nutzerziel und Scope

Anforderung, Nutzerablauf, Nichtziele, betroffene Komponenten.

## PO-Vertrag v1

Annahmen, wesentliche offene Fragen, Quellen mit Prüfdatum.

| ID | Verbindliches Soll / Given-When-Then | Prüfmethode und Beispiel |
|---|---|---|
| AC-01 | <messbares Verhalten> | <Test / Rechnung / Browser> |

## Developer-Übergabe

Dateien, AC-Zuordnung, Umsetzungsstand, Befehle + tatsächliche Ergebnisse,
bekannte Prüflücken. Keine eigenen QA-Freigaben.

## QA Runde <1..3>

PASS / CHANGES_REQUESTED / BLOCKED, geprüfter Dateistand (Commit + Diff),
AC-Matrix (erfüllt / verletzt / ungeprüft), Methode/Evidenz und Befehle.

BUG-ID, Schweregrad, AC-ID, Datei/Zeile, Schritte/Fixture, Soll/Ist,
Regression. Developer-Antwort je BUG und Ergebnis der erneuten QA festhalten.

## PO-Abnahme und Abschluss

ACCEPTED / CHANGES_REQUESTED, Begründung. DONE erst nach QA-PASS + ACCEPTED.
Ergebnis, Prüfungen, Grenzen, Bedienung; bei BLOCKED nächste nötige Aktion.
Lokale Abnahme: LOCAL_ACCEPTED / ausstehend; freigegebener Basiscommit + Diff
und vollständige Dateiliste inklusive neuer Dateien oder freigegebene SHA.
Gesamt-DONE zusätzlich erst nach allen beauftragten Release-Nachweisen.

## Release-Übergabe

Rollenmodus: native bazaar_release / Standard-Agent mit vollständigen
developer_instructions aus .codex/agents/bazaar_release.toml (Fallback benennen).
Modus: read-only Vorprüfung / mutierender Release nach QA-PASS + PO-ACCEPTED.

- Repo-Pfad, Ticket und vollständiger PO-Vertrag:
- Freigegebener Inhaltsstand (Basiscommit + Diff/Dateiliste inklusive neuer
  Dateien oder SHA), tatsächlich zu pushende Commits:
- Developer-Nachweis, unabhängige QA-Evidenz und PO-Abnahme für diesen Stand:
- Nutzerautorisierung mit Wortlaut/Bezug und Umfang; schon erteilt / fehlend:
- Erlaubte Aktionen/Schreibrechte, Remote-URL und Zielbranch:
- Bekannte Werkzeuge/Zugänge (ohne Secrets), konkretes Live-Ziel/Stack und
  gewünschtes Image oder fehlende Angaben:
- Relevante Dateien: publish-image.yml, Dockerfile, README.md,
  GITHUB-PORTAINER.md, PORTAINER.md, portainer-ghcr.yaml:
- Rückgabe: getrennte Status und tatsächliche Evidenz gemäß Bericht unten;
  Hauptagent alleiniger Ticket-Editor:

## Release-Bericht und Gesamtabschluss

| Phase | Status: PASS / BLOCKED / NICHT_BEAUFTRAGT | Tatsächlicher Nachweis |
|---|---|---|
| Lokale Freigabe | | QA/PO, Inhaltsstand, node scripts/check.mjs |
| GitHub-Push | | geprüfte Dateiliste, Commit, Remote/Branch, Remote-SHA |
| CI/Image | | CI-URL/Endstatus für SHA, Publish, Image-sha-Tag/Digest und Architekturen soweit belegt |
| Live-Deployment | | beauftragter Zielhost/Stack, tatsächlich laufendes Image, Container-/HTTP-Prüfung |

Befehle und tatsächliche Ergebnisse, offene Prüflücken, konkrete nächste Aktion.
Notwendige ungeprüfte Phase = BLOCKED. Image-Publish beweist kein Portainer-Update;
/healthz beweist App-Erreichbarkeit, keine frischen Marktdaten. Keine Secrets.
Gesamtstatus DONE / BLOCKED; lokale Abnahme und offene Release-Schritte getrennt
ausweisen. Inhaltsänderungen zurück an Developer/QA/PO, keine Release-Eigenkorrektur.
