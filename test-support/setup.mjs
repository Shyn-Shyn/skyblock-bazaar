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
  await fixture({ mode: 'all', itemsAge: 0, apiMode: 'success', clearSnapshot: true });
}, 'Beide Testprofile und Fixture zurückgesetzt. Merkliste erhalten.'));
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
document.querySelector('#inspect').addEventListener('click', () => run(() => {}, 'Testzustand aktualisiert.'));
void run(() => {}, 'Testzustand geladen.');
