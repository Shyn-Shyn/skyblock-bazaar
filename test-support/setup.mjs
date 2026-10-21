import { restoreProfiles, saveProfiles } from '/profiles.mjs';

const status = document.querySelector('#status');
async function fixture(values = {}) {
  const response = await fetch('/__fixture?' + new URLSearchParams(values));
  if (!response.ok) throw new Error(`Fixture HTTP ${response.status}`);
  return response.json();
}
function stored(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return 'Ungültiges JSON'; }
}
async function inspect(message = 'Testzustand geladen.') {
  const activeFixture = await fixture();
  document.querySelector('#state').textContent = JSON.stringify({ fixture: activeFixture,
    profiles: stored('bazaar-profiles'), legacy: stored('bazaar-settings'), favorites: stored('bazaar-favorites') }, null, 2);
  status.textContent = message;
}
async function run(action, message) {
  try { await action(); await inspect(message); } catch (error) { status.textContent = error.message; }
}
document.querySelector('#legacy').addEventListener('click', () => run(async () => {
  localStorage.setItem('bazaar-settings', JSON.stringify({ budget: 1234567, tax: 1.8,
    destination: 'npc', horizon: 3, minRoi: 7 }));
  localStorage.removeItem('bazaar-profiles');
  await fixture({ mode: 'capacity', itemsAge: 0 });
}, 'Legacy vorbereitet. Zur Anwendung wechseln, um die Migration auszuführen.'));
document.querySelector('#defaults').addEventListener('click', () => run(async () => {
  localStorage.setItem('bazaar-profiles', JSON.stringify(saveProfiles(restoreProfiles(null, null))));
  localStorage.removeItem('bazaar-settings');
  await fixture({ mode: 'all', itemsAge: 0, itemsMode: 'success', apiMode: 'success',
    marketAge: 0, refreshSeconds: 60, nextSeconds: 60, freeze: false, clearSnapshot: true });
}, 'Beide Testprofile und Fixture zurückgesetzt. Merkliste erhalten.'));

document.querySelector('#old-scanner').addEventListener('click', () => run(async () => {
  const profiles = restoreProfiles(null, null);
  profiles.scanner = { budget: 1, horizon: 168, tax: 20, minRoi: 9999, share: 100, destination: 'bazaar' };
  localStorage.setItem('bazaar-profiles', JSON.stringify({ version: 1, ...profiles }));
  await fixture({ mode: 'capacity', itemsAge: 0, itemsMode: 'success', apiMode: 'success' });
}, 'Extremes altes Scannerprofil vorbereitet. Erwartung Übersicht:6Stück/Einsatz600,6/Gewinn109,8075; Plan bleibt Standard.'));
document.querySelector('#npc-limit').addEventListener('click', () => run(async () => {
  const profiles = restoreProfiles(null, null);
  Object.assign(profiles.plan, { destination: 'npc', budget: 1000, maxNpcItems: 30,
    maxAllocation: 20, npcPreference: 'compact' });
  localStorage.setItem('bazaar-profiles', JSON.stringify(saveProfiles(profiles)));
  await fixture({ mode: 'npclimit', itemsAge: 0 });
}, 'NPC-Mehrpositionslimit vorbereitet. Erwartung:30Stück,300Coins Einsatz,60Coins Gewinn.'));
for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => run(
  () => fixture({ mode: button.dataset.mode }), `Datensatz ${button.dataset.mode} aktiv.`));
for (const button of document.querySelectorAll('[data-age]')) button.addEventListener('click', () => run(
  () => fixture({ itemsAge: button.dataset.age }), `Itemdaten-Alter ${button.dataset.age} Stunden aktiv.`));
for (const button of document.querySelectorAll('[data-api]')) button.addEventListener('click', () => run(
  () => fixture({ apiMode: button.dataset.api, ...(button.dataset.api === 'unavailable' ? { clearSnapshot: true } : {}) }),
  `API-Zustand ${button.dataset.api} aktiv.`));
for (const button of document.querySelectorAll('[data-items]')) button.addEventListener('click', () => run(
  () => fixture({ itemsMode: button.dataset.items }), `Metadaten-Zustand ${button.dataset.items} aktiv.`));
for (const button of document.querySelectorAll('[data-market]')) button.addEventListener('click', () => run(
  () => fixture({ marketAge: button.dataset.market }), `Quellalter ${button.dataset.market} Sekunden aktiv.`));
for (const button of document.querySelectorAll('[data-timing]')) button.addEventListener('click', () => run(
  () => fixture(JSON.parse(button.dataset.timing)), 'Prüfzeitpunkte angepasst.'));
document.querySelector('#inspect').addEventListener('click', () => run(() => {}, 'Testzustand aktualisiert.'));
void run(() => {}, 'Testzustand geladen.');
