## Änderung

Problem, resultierendes Verhalten und Scope. Ticket: `docs/agents/tasks/<ID>.md`.
Betroffene ACs: <IDs>. Nichtziele und bekannte Einschränkungen:

## Prüfstand und Nachweise

- Basiscommit / aktueller Base-main-SHA:
- Featurebranch / geprüfter Feature-HEAD oder freigegebener Diff mit Dateiliste:
- Developer: `node scripts/check.mjs`, Ergebnis und relevante Regressionen:
- Unabhängige QA: PASS / CHANGES_REQUESTED / BLOCKED, Ticketabschnitt und Evidenz:
- PO: ACCEPTED / CHANGES_REQUESTED, Ticketabschnitt und geprüfter Stand:
- Externe PR-CI: URL, Feature-/Base-Stand und synthetischer Merge-SHA;
  Ergebnis von `Validate application and container` (Tests, Build, Smoke):
- Bekannte Prüflücken (z. B. lokal kein Docker; externe Evidenz ausstehend):

PR-CI prüft den synthetischen Merge-Stand. Der tatsächliche main-SHA entsteht
erst beim Merge. PRs veröffentlichen kein Image; Publish muss übersprungen sein.
Neue Featurecommits oder relevante Base-Änderungen vor Merge erneut prüfen.

## Autorisierung und Fortsetzung

- Nutzerauftrag für Feature/PR und eventuelle Einschränkungen:
- Konkreter Nutzer-Mergeauftrag: <Bezug/Wortlaut oder NICHT_BEAUFTRAGT>.

QA-/PO-Abnahme oder GitHub-Approval allein sind kein Nutzer-Mergemandat.
Bei beauftragtem Merge anschließend main-SHA, erneute CI/Publish und SHA-Image
prüfen; ansonsten endet der Auftrag am prüfbaren PR. Keine Secrets eintragen.
