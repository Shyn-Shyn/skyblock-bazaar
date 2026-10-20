# SETUP-SMOKE-001: Codex-Team einrichten und prüfen

Status: DONE
QA-Runden: 2 / 3
Datum: 2026-10-20
Basis: c208590, zuvor sauberer Git-Arbeitsstand

## Ziel und Scope

Repository-spezifische PO-, Developer- und QA-Rollen mit nachvollziehbarer
Fehlerrückgabe, Bedienung und Offline-Prüfung. Keine Änderung an Produktlogik,
UI, vorhandenen Tests oder Deployment. README um Einstieg ergänzt.

## PO-Vertrag und Evidenz

| ID | Akzeptanzkriterium | Prüfung / Ergebnis |
|---|---|---|
| AC-01 | Unsor­tiertes Orderbuch: bestes Gebot 100, Angebot 120, Tick .1 -> Einkauf 100.1, Verkauf 119.9 | Vorhandener Test + Workflow-Probe PASS |
| AC-02 | Steuer 1.25 % -> Nettogewinn 18.30125 mit Toleranz 1e-8 | Unabhängige Formelrechnung + Probe PASS |
| AC-03 | NPC nutzt Basispreis, keine Bazaar-Steuer oder Verkaufstick; ungültige Preise ausgeschlossen | Vorhandene NPC-Tests PASS |
| AC-04 | Gemeinsames Budget, ganze Mengen, Kapazität/Positionslimits und eindeutige Produkt-IDs | Vorhandene Portfolio-Tests PASS |
| AC-05 | Hypixel-Regeln und App-Annahmen getrennt, keine Garantie von Gewinn/Füllzeit/Optimum | PO- und QA-Dokumentprüfung PASS |
| AC-06 | Marktalter-Warnung und NPC-Altersgrenze korrekt dokumentiert | Codeprüfung server.mjs/public/app.mjs; kein Browsertest, unverändertes Produkt |
| AC-07 | Bewusst falsche Gewinnerwartung -> QA-Rückgabe -> Developer-Korrektur -> erneute QA | Zwei Runden mit getrennten Agenten PASS |
| AC-08 | Drei native TOML-Rollen tatsächlich startbar | Normale native Codex-Session, alle drei agent_type-Starts erfolgreich |

Fachquellen: `docs/agents/BAZAAR.md` mit Prüfdatum und Hypixel-API-Link.
Tick/Steuer/Marktanteil/Durchsatz und sequenzielle Handelsseiten sind aktuelles
App-Modell; der Smoke-Test behauptet keine heutigen garantierten Spielregeln.

## Developer-Übergabe

Rollen unter `.codex/agents/`, Projektkonfiguration, AGENTS.md, Workflow,
Fachgrundlage, Ticketvorlage, Bedienung und zwei Node-Prüfskripte erstellt.
Keine neuen npm-Abhängigkeiten. `node scripts/check.mjs` prüft Syntax und Tests.

## QA Runde 1: CHANGES_REQUESTED

BUG-001 | hoch | AC-02 | bewusst falscher Sollwert im Probe-Aufruf

```text
node scripts/workflow-probe.mjs --expected-profit 19.8
Exit: 1 / CHANGES_REQUESTED
Kauf: Soll=100.1; Ist=100.1
Verkauf: Soll=119.9; Ist=119.9
Gewinn: Soll=19.8; Ist=18.30125000000001
```

QA berechnet unabhängig `119.9 * 0.9875 - 100.1 = 18.30125`. 19.8 ist
Bruttospread. Vollständigen Befund an denselben Developer zurückgegeben.
Dies war eine absichtlich fehlerhafte Test-Erwartung, kein gefundener Produktbug.

## Developer-Korrektur und QA Runde 2: PASS

Developer korrigiert ausschließlich den Aufruf auf:

```text
node scripts/workflow-probe.mjs --expected-profit 18.30125
Exit: 0 / PASS
```

Developer und danach separater QA-Agent führen den korrigierten Aufruf aus.
BUG-001 geschlossen. Unabhängige QA: sechs Syntaxprüfungen und 23 Tests
bestanden, null Fehler. Keine weiteren blockierenden Setup-Befunde.
Anschließend derselbe Prüfbefehl im installierten Original-Repository:
sechs Syntaxprüfungen + 23 Tests bestanden.

## Native Konfigurationsprüfung

Codex CLI `0.163.0-alpha.10.2`, Node `24.19.0`.
Vier TOML-Dateien zusätzlich mit einem TOML-Parser erfolgreich gelesen.
`codex debug prompt-input` bestätigt das Einlesen der Repository-AGENTS.md.
Eine normale `codex exec --strict-config -s read-only`-Session startet danach
je einen Subagenten mit den echten Typen `bazaar_product_owner`,
`bazaar_developer`, `bazaar_qa`; alle drei bestätigen ihre Rolle, kein Fallback.
Projektvertrauen wurde für diese Diagnose per Aufrufparameter gesetzt,
keine globale Trust- oder Sandbox-Konfiguration geändert.

Diagnosegrenzen: `--strict-config` wird von `codex debug` nicht unterstützt;
die strenge Prüfung erfolgte mit `codex exec`. Ein erster `--ephemeral`-Lauf
konnte wegen `no rollout found for thread id` keine Subagenten laden. Derselbe
Test in einer normalen Session funktioniert. Für Team-Läufe normale App-/CLI-
Sessions verwenden. Die vollständige Fach-/QA-Rückgabe wurde mit separaten
Standard-Subagenten und expliziten Rollenaufträgen in diesem Einrichtungs-Chat
geprüft; der separate native Test bestätigt die automatische Rollen-Erkennung.

## PO-Abnahme: ACCEPTED

Product Owner hat Rollen, Übergaben, Kriterien, Rückgabeprobe, Fachgrundlage
und Bedienung fachlich abgenommen. Der anschließend erfolgreiche native
Rollentest schließt den verbleibenden Einrichtungsnachweis ab.
Keine notwendige Browserprüfung offen, da keine Produkt-/UI-Änderung.
Kein Commit, Push, Merge oder Deployment ausgeführt.
