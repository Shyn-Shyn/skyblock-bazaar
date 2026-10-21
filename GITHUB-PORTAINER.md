# GitHub → Container Registry → Portainer

## 1. Repository erstellen

Bei GitHub anmelden, https://github.com/new öffnen. Als Repository-Namen `skyblock-bazaar` verwenden. Für den einfachsten Weg Public auswählen (Quellcode ist dann öffentlich). README, .gitignore und Lizenz nicht automatisch hinzufügen. Auf Create repository klicken. Die HTTPS-Adresse des neuen Repositorys kopieren.

## 2. Projekt hochladen

Dieser Abschnitt gilt ausschließlich für die erstmalige Befüllung eines neuen,
leeren Repositorys. Das bestehende Projekt hat bereits Commits und `origin`;
hier keine Initialisierung oder Direktpush-Ersteinrichtung wiederholen.
Laufende Entwicklung verwendet Featurebranches und Pull Requests gemäß
[Teamablauf](docs/agents/README.md). Ein frisch entpacktes ZIP zunächst mit `git init` initialisieren.

```powershell
cd "C:\Users\SHYN\Documents\ChatGPT\Minecraft Skyblock"
git add .
git commit -m "Release Skyblock Exchange"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/skyblock-bazaar.git
git push -u origin main
```

DEIN-NAME ersetzen. Falls Git beim Commit nach Identität fragt:

```powershell
git config user.name "Dein Name"
git config user.email "DEINE-GITHUB-COMMIT-EMAIL"
```

Danach ab `git commit` fortfahren. Als E-Mail kann die GitHub-Noreply-Adresse aus Settings → Emails verwendet werden. Bei `git push` die GitHub-Anmeldung im Browser abschließen. Falls origin schon existiert, erst `git remote -v` prüfen; nicht blind ein zweites Remote hinzufügen.

Das Repository muss Dockerfile, server.mjs, polling.mjs, package.json, public/, test/ und insbesondere `.github/workflows/publish-image.yml` enthalten. Keine ZIP-Datei als Ersatz für die entpackten Quellen hochladen. `.env`, Vorschau und ZIP sind ausgeschlossen.

## 3. Automatischer Image-Build

Im Repository auf Actions klicken. Der Workflow „Build and publish Docker image“
validiert Pull Requests nach main ohne Image-Veröffentlichung. Nach Push auf main
oder manuellem Start auf main veröffentlicht er erst nach erfolgreicher Validierung.
Ein manueller Start auf einem Featurebranch validiert nur.

Er führt die Anwendungstests aus, startet einen Testcontainer und veröffentlicht anschließend Linux-Images für amd64 und arm64:

```text
ghcr.io/dein-name/skyblock-bazaar:latest
ghcr.io/dein-name/skyblock-bazaar:sha-VOLLSTAENDIGE-COMMIT-ID
```

Benutzername und Repository werden automatisch kleingeschrieben. Warte auf einen grünen Workflow. Der Workflow nutzt den automatisch bereitgestellten GITHUB_TOKEN; du musst kein eigenes Token als Secret anlegen. Bei Organisationskonten können deren Actions- oder Paket-Richtlinien den Build verhindern; die Fehlermeldung im roten Schritt zeigt die Ursache.

## 4. Image öffentlich lesbar machen

Ein öffentliches Repository macht ein neues Container-Paket nicht automatisch öffentlich.

Nach dem erfolgreichen Build über dein GitHub-Profil → Packages oder die Packages-Sektion des Repositorys das Paket skyblock-bazaar öffnen. In Package settings → Danger Zone → Change visibility auf Public stellen und bestätigen. Dadurch kann jeder das Image herunterladen. Für diesen einfachen Installationsweg braucht Portainer danach keine GitHub-Anmeldedaten.

Wenn das Image privat bleiben soll: einen Personal Access Token (classic) mit read:packages für einen Benutzer mit Paketzugriff erstellen und in Portainer als Zugang zu einer benutzerdefinierten Registry ghcr.io hinterlegen. Den Token nur im Registry-Zugang speichern, nicht in der Stack-Datei. Bei Organisationen kann eine SSO-Freigabe erforderlich sein.

## 5. Portainer-Stack

Die Docker-Standalone-Umgebung des Servers auswählen. Unter Stacks → Add stack den Namen skyblock-exchange wählen. Den Inhalt von portainer-ghcr.yaml in den Web editor kopieren.

Die Image-Zeile anpassen:

```yaml
image: ghcr.io/dein-name/skyblock-bazaar:latest
```

Den tatsächlichen GitHub-Namen in Kleinbuchstaben einsetzen. Bei anderem Repo-Namen auch skyblock-bazaar ersetzen.

Port 8080 ist der Server-Port. Ist dieser belegt, `8080:3000` beispielsweise durch `8090:3000` ersetzen. Die rechte Zahl 3000 bleibt unverändert. Deploy the stack anklicken und warten. Es ist kein Build auf deinem Server und keine Git-Installation dort nötig.

Falls eine frühere Installation bereits läuft, deren Stack bearbeiten/ersetzen oder erst stoppen, damit der Port frei ist.

## 6. Öffnen und Icon setzen

App: `http://DEINE-SERVER-IP:8080`

Icon: `http://DEINE-SERVER-IP:8080/app-icon.png`

Die tatsächliche Server-IP und gegebenenfalls den anderen Port einsetzen. Nicht localhost verwenden, wenn du von einem anderen Gerät zugreifst. Im Dashboard einen Web-Link mit Namen Skyblock Exchange und der Icon-URL anlegen, sofern Portainer dort keine Kachel automatisch erzeugt.

## 7. Updates

Quellcodeänderungen erfolgen auf einem kurzlebigen `codex/<thema>`-Branch von
aktuellem `main`, nicht durch routinemäßige Direktpushes nach main. Nach
unabhängiger QA und PO-Abnahme veröffentlicht der Release-Agent den Branch als
Pull Request und prüft dessen CI. Ein Merge benötigt konkreten Nutzerauftrag
und aktuelle Freigaben/Prüfungen. Der tatsächliche main-Commit wird anschließend
erneut geprüft; erst dann entsteht das Image. Details und Zuständigkeiten:
[Teamablauf](docs/agents/README.md). Es gibt keinen dauerhaften develop-Branch.

Den grünen GitHub-Workflow abwarten. Dann in Portainer den Stack öffnen → Editor → Update the stack; falls angeboten „Re-pull image“ aktivieren. Ein einfacher Neustart des alten Containers lädt kein neues Image. Updates werden nicht ohne deine Portainer-Aktion installiert.

Für eine feste Version oder ein Rollback statt latest den zugehörigen sha-Tag aus GitHub Packages verwenden. GitHub Actions publiziert beide Tags.

## Fehler und Prüfung

- denied / unauthorized beim Pull: Paket noch privat oder Registry-Anmeldung fehlt.
- manifest unknown: Build noch nicht fertig oder Image-Pfad/Tag falsch.
- address already in use: Server-Port bereits belegt.
- Container healthy, aber keine Marktdaten: ausgehendes HTTPS/DNS oder Hypixel prüfen. Der Healthcheck prüft nur die App.

Maßgeblich ist der tatsächliche grüne CI-/Publish-Lauf des gewünschten main-SHA
und dessen SHA-Image. Eine lokale Prüfung oder ein grüner PR-Lauf allein belegt
noch keine Image-Veröffentlichung für den späteren main-Commit.

Offizielle Referenzen:
- https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images
- https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility
- https://docs.portainer.io/user/docker/stacks/add
