# <ID>: <Titel>

Status: INTAKE
QA-Runden: 0 / 3
Rollenmodus: native custom agents / explizit geladene Rollen / nicht verfügbar

## Nutzerziel und Scope

Anforderung, Nutzerablauf, Nichtziele, betroffene Komponenten.

## Branch und Freigabestand

- Arbeitsbaum/Remote geprüft, fremde Änderungen und Umgang damit:
- Aktueller Remote-main-SHA, Basiscommit, Featurebranch `codex/<thema>`:
- Feature-HEAD oder freigegebener Inhalt: Diff und vollständige Dateiliste:
- PR nach `main`: URL, aktueller Feature-HEAD, Base-SHA:
- Nutzerauftrag: Feature-/PR-Scope, eventuelle local-only-Grenze:
- Konkretes Mergemandat: Wortlaut/Bezug oder NICHT_BEAUFTRAGT:

Kein dauerhafter develop-Branch. Neue Featurecommits oder relevante Base-
Änderungen vor Merge erneut prüfen; bisherige Freigaben nicht ungeprüft übernehmen.

## PO-Vertrag v1

Annahmen, wesentliche offene Fragen, Quellen mit Prüfdatum.

| ID | Verbindliches Soll / Given-When-Then | Prüfmethode und Beispiel |
|---|---|---|
| AC-01 | <messbares Verhalten> | <Test / Rechnung / Browser> |

## Developer-Übergabe

Dateien, AC-Zuordnung, Umsetzungsstand, Befehle + tatsächliche Ergebnisse,
bekannte Prüflücken; Basis, Branch/HEAD oder freigegebener Diff/Dateiliste.
Keine eigenen QA-Freigaben. Lokale Tests und externe PR-CI getrennt ausweisen.

## QA Runde <1..3>

PASS / CHANGES_REQUESTED / BLOCKED, geprüfte Basis/Feature-HEAD oder Inhalt/Diff,
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
- Basiscommit, aktueller Remote-main-SHA, Featurebranch/HEAD bzw. freigegebener
  Inhalt mit Diff/Dateiliste inklusive neuer Dateien, Push-Commits:
- Developer-Nachweis, unabhängige QA-Evidenz und PO-Abnahme für diesen Stand:
- Nutzerauftrag mit Feature-/PR-Scope, Einschränkungen und getrenntem
  Mergemandat; schon erteilt / NICHT_BEAUFTRAGT:
- Erlaubte Aktionen/Schreibrechte, Remote-URL, Featurebranch und PR-Basis main:
- Bekannte GitHub-/Registry-Werkzeuge und Zugänge (ohne Secrets), Image-Name
  oder fehlende Angaben:
- Relevante Dateien: .github/workflows/publish-image.yml und Dockerfile:
- Rückgabe: getrennte Status und tatsächliche Evidenz gemäß Bericht unten;
  Hauptagent alleiniger Ticket-Editor:

## Release-Bericht und Gesamtabschluss

| Phase | Status: PASS / BLOCKED / NICHT_BEAUFTRAGT | Tatsächlicher Nachweis |
|---|---|---|
| Lokale Freigabe | | QA/PO, Inhaltsstand, node scripts/check.mjs |
| Branch-Push | | geprüfte Dateiliste, Feature-HEAD, Remote/Branch und Remote-SHA |
| PR/CI | | PR-URL an Chat angehängt, Feature-/Base-SHA, synthetischer Merge-SHA, aktuelle CI-URL, Validate-Endstatus inkl. Tests/Build/Smoke; Publish skipped |
| Merge | | konkreter Nutzerauftrag, aktuelle QA/PO/PR-CI, geprüfter Feature-/Base-Stand, tatsächlicher main-SHA |
| main-CI/Image | | CI-URL/Endstatus für tatsächlichen main-SHA, erneutes Validate, Publish, SHA-Tag/Digest/Architekturen soweit belegt |

Befehle und tatsächliche Ergebnisse, offene Prüflücken, konkrete nächste Aktion.
Netzgrenzen: höchstens 30 Sekunden je Anfrage, 120 Sekunden Registry insgesamt,
zehn Minuten CI-Warten inklusive Wiederholungen je Prüflauf. Verwendete Grenzen
und bei Ablauf letzten Stand, vorhandene CI-URL und Fortsetzung dokumentieren.
Notwendige ungeprüfte Phase = BLOCKED. Release endet mit Image-Prüfung. Keine Secrets.
Ohne Nutzer-Mergemandat: prüfbaren PR liefern; Merge und Image NICHT_BEAUFTRAGT.
Lokales Docker fehlt / passende externe CI liefert Container-Nachweis / offen:
Branchschutz/Required Checks nur als aktiv melden, wenn tatsächlich nachgewiesen.
Gesamtstatus DONE / BLOCKED; lokale Abnahme und offene Release-Schritte getrennt
ausweisen. Inhaltsänderungen zurück an Developer/QA/PO, keine Release-Eigenkorrektur.
