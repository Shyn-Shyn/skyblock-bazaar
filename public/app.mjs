import { analyze, allocate, defaults, settings, parseBudget } from './market.mjs';

const $ = selector => document.querySelector(selector);
const form = $('#filters');
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 2 });
const fmt = n => Number.isFinite(n) ? number.format(n) : '—';
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let data = null, candidates = [], shown = [], limit = 50, loading = false, selected = null;
let favorites = new Set();
let plan = null;
let nextLoadAt = Date.now();
let loadTimer;
let appliedSettings = { ...defaults };
function persist(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
try {
  const raw = JSON.parse(localStorage.getItem('bazaar-settings') || '{}');
  // Apply the requested simplified strategy once, retaining budget/exit/tax.
  if (localStorage.getItem('bazaar-strategy-version') !== '3') {
    const retained = { budget: raw.budget, destination: raw.destination, tax: raw.tax };
    Object.assign(raw, defaults);
    for (const [key, value] of Object.entries(retained)) if (value !== undefined) raw[key] = value;
    localStorage.setItem('bazaar-strategy-version', '3');
  }
  const saved = settings(raw);
  for (const [key, value] of Object.entries(saved)) form.elements[key].value = value;
  appliedSettings = saved;
  const stored = JSON.parse(localStorage.getItem('bazaar-favorites') || '[]');
  if (Array.isArray(stored)) favorites = new Set(stored.filter(x => typeof x === 'string'));
} catch {}
function currentSettings() {
  if (form.checkValidity()) appliedSettings = settings({ ...Object.fromEntries(new FormData(form)), tax: form.elements.tax.value });
  return appliedSettings;
}
function validateBudget(normalize = false) {
  const value = parseBudget(form.elements.budget.value);
  const valid = Number.isFinite(value) && value >= 1 && value <= 1e12;
  form.elements.budget.setCustomValidity(valid ? '' : 'Bitte 1 bis 1.000.000.000.000 Coins eingeben, z. B. 10M.');
  form.elements.budget.setAttribute('aria-invalid', String(!valid));
  $('#budget-help').textContent = valid ? `${fmt(value)} Coins · auch 1M, 10M oder 1,5M möglich`
    : 'Ungültiges Budget. Beispiel: 10M = 10.000.000 Coins. Der letzte gültige Wert bleibt aktiv.';
  if (valid && normalize) form.elements.budget.value = number.format(value);
  return valid;
}
function npcAvailable() {
  return data?.itemsFetchedAt && Date.now() - data.itemsFetchedAt < 48 * 3600000;
}
function updateMode() {
  const npc = currentSettings().destination === 'npc';
  form.elements.tax.disabled = npc;
  $('#strategy-description').textContent = npc ? 'Buy-Order → NPC-Verkauf' : 'Buy-Order → Bazaar-Sell-Offer';
  $('#sell-heading').textContent = npc ? 'NPC-PREIS' : 'SELL-OFFER';
  $('#market-caption').textContent = npc ? 'Mit NPC-Preis über dem Kaufgebot' : 'Auswertbare Bazaar-Spreads';
  $('#scanner-price-label').textContent = npc ? 'Coins je Item · NPC-Verkauf' : 'Coins je Item · Bazaar';
  $('#flow-heading').textContent = npc ? 'Einkaufsseite · geschätzt' : 'schwächere Seite · geschätzt';
  $('#tax-note').textContent = npc ? 'NPC-Basispreise ohne Bazaar-Steuer. Individuelle Boni und Verkaufslimits im Spiel prüfen.'
    : 'Steuer im Spiel prüfen und hier anpassen. 1,25 % ist ein konfigurierbarer Startwert.';
  $('#sell-instruction').textContent = npc ? 'Verkaufe gefüllte Mengen beim NPC. Prüfe dort den tatsächlichen Preis und dein verbleibendes Verkaufslimit. Die Zeit für den manuellen Verkauf ist nicht im Modell enthalten.'
    : 'Verkaufe gefüllte Mengen anschließend als Sell-Offer zum angegebenen Preis. Die Verkaufssteuer ist im Modellgewinn enthalten.';
  $('#npc-status').hidden = !npc;
  $('#npc-status').textContent = !npcAvailable() ? 'NPC-Preise fehlen oder sind veraltet. NPC-Flips werden bis zur nächsten erfolgreichen Aktualisierung nicht berechnet.'
    : `${data.itemsError ? `${data.itemsError}. Letzte bekannte Preise werden verwendet. ` : ''}NPC-Basispreise geladen am ${new Date(data.itemsFetchedAt).toLocaleString('de-DE')}. Individuelle Verkaufslimits werden nicht automatisch abgezogen.`;
}
function setView(view) {
  for (const name of ['scanner', 'plan']) {
    const active = name === view;
    $(`#tab-${name}`).setAttribute('aria-selected', String(active));
    $(`#tab-${name}`).tabIndex = active ? 0 : -1;
    $(`#${name}-panel`).hidden = !active;
  }
  $('#allocation-controls').hidden = view !== 'plan';
}
function compute() {
  const s = currentSettings();
  persist('bazaar-settings', s);
  updateMode();
  $('#stat-budget').textContent = compact.format(s.budget);
  $('#strategy-preset').textContent = `Gewinnorientiert · bis zu ${Math.floor(s.maxPositions)} Items · ${fmt(s.horizon)} Std. · mindestens ${integer.format(s.minDaily)} Items/Tag. Durchsatz und Orderbuch begrenzen die Mengen.`;
  if (!data?.products) return;
  candidates = Object.entries(data.products).map(([id, product]) => analyze({ ...product, product_id: id }, s, data.names?.[id],
    npcAvailable() ? data.npcPrices?.[id] : undefined)).filter(Boolean);
  plan = allocate(candidates, s);
  renderPlan();
  $('#stat-items').textContent = integer.format(candidates.length);
  render();
  if (selected && $('#detail').open) showDetail(selected);
}
function renderPlan() {
  $('#plan-invested').textContent = `${fmt(plan.invested)} Coins`;
  $('#plan-remaining').textContent = `${fmt(plan.remaining)} Coins`;
  $('#plan-profit').textContent = `+${fmt(plan.profit)} Coins`;
  $('#export-plan').disabled = !plan.positions.length;
  $('#plan-rows').innerHTML = plan.positions.map(r => `<tr>
    <td><button class="item-button" data-detail="${esc(r.id)}">${esc(r.name)}${r.warnings.length ? '<span class="risk-dot" title="Risikohinweise in den Details">◇</span>' : ''}</button></td>
    <td>${integer.format(r.quantity)}</td><td>${fmt(r.buy)}</td><td>${fmt(r.sell)}</td>
    <td>${fmt(r.capital)}<span class="item-id">${fmt(r.allocationPercent)} %</span></td>
    <td class="mint">+${fmt(r.total)}</td><td>${fmt(r.hours)}</td></tr>`).join('');
  $('#plan-summary').textContent = plan.positions.length
    ? `${plan.positions.length} Items · ${fmt(plan.invested / currentSettings().budget * 100)} % deines Budgets zugeteilt · ${fmt(plan.roi)} % Netto-ROI. ${plan.unused > .01 ? `${fmt(plan.unused)} Coins noch nicht zugeteilt: Durchsatz, Positionslimits oder ganze Stückzahlen begrenzen den Plan. Erhöhe bei Bedarf Zeithorizont oder Positionslimits.` : 'Budget vollständig zugeteilt.'} Stand: ${new Date(data.lastUpdated).toLocaleTimeString('de-DE')}.`
    : 'Keine Verteilung innerhalb deiner Vorgaben möglich. Budget, Anteil je Item oder Strategiefilter anpassen. Es wird keine Reserve abgezogen.';
}
function render() {
  const query = $('#search').value.toLocaleLowerCase();
  const eligible = candidates.filter(r => r.eligible);
  shown = eligible.filter(r => (!$('#watch-only').checked || favorites.has(r.id)) &&
    `${r.name} ${r.id}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => b[$('#sort').value] - a[$('#sort').value] || a.id.localeCompare(b.id));
  $('#stat-matches').textContent = integer.format(eligible.length);
  $('#stat-profit').textContent = eligible.length ? compact.format(Math.max(...eligible.map(r => r.total))) : '—';
  $('#count').textContent = integer.format(shown.length);
  $('#export').disabled = !shown.length;
  $('#rows').innerHTML = shown.slice(0, limit).map(r => `<tr>
    <td><button class="favorite ${favorites.has(r.id) ? 'selected' : ''}" data-star="${esc(r.id)}" aria-label="${esc(r.name)} merken" aria-pressed="${favorites.has(r.id)}">${favorites.has(r.id) ? '★' : '☆'}</button></td>
    <td><button class="item-button" data-detail="${esc(r.id)}">${esc(r.name)}${r.warnings.length ? '<span class="risk-dot" title="Risikohinweise in der Detailansicht">◇</span>' : ''}</button><span class="item-id">${esc(r.id)}</span></td>
    <td class="price-pair"><span>${fmt(r.buy)}</span><small>→ ${fmt(r.sell)}</small></td>
    <td class="mint">+${fmt(r.profit)}</td><td><span class="roi">${fmt(r.roi)} %</span></td>
    <td>${compact.format(r.daily)}</td><td>${integer.format(r.quantity)}</td><td class="mint">+${compact.format(r.total)}</td></tr>`).join('');
  $('#empty').hidden = !!shown.length;
  $('#empty').textContent = 'Keine passenden Flips. Passe Filter, Budget oder Suche an.';
  $('#more').hidden = shown.length <= limit;
  $('#result-description').textContent = `${Math.min(limit, shown.length)} von ${shown.length} Kandidaten · Item anklicken für Orderbuch`;
}
function book(title, rows) {
  return `<section><h3>${title}</h3><div class="table-wrap"><table><thead><tr><th>Preis</th><th>Menge</th><th>Orders</th></tr></thead><tbody>${rows.map(x => `<tr><td>${fmt(x.price)}</td><td>${integer.format(x.amount)}</td><td>${integer.format(x.orders)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function showDetail(id) {
  const r = candidates.find(r => r.id === id);
  selected = id;
  if (!r) { $('#detail-content').textContent = 'Dieses Item hat im aktuellen Datenstand kein nutzbares Orderbuch.'; return; }
  const stats = [
    ['Deine Buy-Order', `${fmt(r.buy)} Coins`], [r.destination === 'npc' ? 'NPC-Basispreis' : 'Dein Sell-Offer', `${fmt(r.sell)} Coins`],
    ['Netto je Item', `${fmt(r.profit)} Coins`], ['Positionsgröße (Modell)', `${integer.format(r.quantity)} Items`],
    ['Gebundenes Budget', `${fmt(r.capital)} Coins`], ['Positionsgewinn (Modell)', `${fmt(r.total)} Coins`],
  ];
  const planned = plan?.positions.find(p => p.id === id);
  $('#detail-content').innerHTML = `<h2>${esc(r.name)}</h2><span class="item-id">${esc(r.id)}</span>
    <p class="detail-note">${planned ? `Im gemeinsamen Plan: ${integer.format(planned.quantity)} Items · ${fmt(planned.capital)} Coins Einsatz · ${fmt(planned.total)} Coins Modellgewinn.` : 'Dieses Item ist aktuell nicht im gemeinsamen Investitionsplan.'} Die Kennzahlen darunter zeigen die alternative Einzelposition mit vollem Budget.</p>
    <div class="detail-stats">${stats.map(([label, value]) => `<div class="detail-stat"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
    <p class="detail-note">Verkaufsziel: ${r.destination === 'npc' ? 'NPC · keine Bazaar-Steuer' : 'Bazaar-Sell-Offer'}<br>Brutto-Spread: ${fmt(r.spread)} Coins · Netto-ROI: ${fmt(r.roi)} % · Modellzeit ${r.destination === 'npc' ? 'für den Einkauf' : 'für beide Schritte'}: ${r.hours === null ? '—' : `${fmt(r.hours)} Std.`}<br>
    Geschätzter Tagesdurchsatz: Einkauf ${integer.format(r.buyWeekly / 7)}${r.destination === 'npc' ? ' Items · NPC-Verkauf ohne Markt-Warteschlange' : ` / Verkauf ${integer.format(r.sellWeekly / 7)} Items`}.<br>
    Offene Kauforders: ${integer.format(r.buyOrders)} (${integer.format(r.buyOpen)} Items) · Offene Verkaufsangebote: ${integer.format(r.sellOrders)} (${integer.format(r.sellOpen)} Items).<br>
    Orderdruck am besten Preis: ${fmt(r.pressure)} Std. · Warteschlange vor deinen Preisen: ${integer.format(r.bidQueue)} / ${integer.format(r.askQueue)} Items.</p>
    ${r.warnings.length ? `<p class="notice">${r.warnings.map(esc).join('<br>')}</p>` : ''}
    <p class="detail-note">Das Orderbuch zeigt bestehende Preisstufen, nicht deine vorgeschlagenen Orders. Durchsatz, Modellzeit und Menge beruhen auf Wochenmitteln und deinem angenommenen Marktanteil. Neue Orders können dich überbieten.</p>
    <div class="books">${book('Kaufgebote · höchste zuerst', r.bids)}${r.destination === 'npc' ? '<p class="detail-note">Der NPC-Verkauf verwendet den festen Basispreis aus den Itemdaten. Bazaar-Verkaufsangebote werden für diesen Flip nicht benötigt.</p>' : book('Verkaufsangebote · niedrigste zuerst', r.asks)}</div>`;
  if (!$('#detail').open) $('#detail').showModal();
}
function updateStatus() {
  $('#auto-refresh').textContent = loading ? 'Automatik aktiv · wird aktualisiert …'
    : `Automatik aktiv · nächste Prüfung in ${Math.max(0, Math.ceil((nextLoadAt - Date.now()) / 1000))} s`;
  if (!data?.lastUpdated) return;
  const age = Math.max(0, Math.floor((Date.now() - data.lastUpdated) / 1000));
  const stale = data.stale || age > Math.max(180, (data.refreshSeconds || 60) * 3);
  $('#connection').textContent = stale ? '● Daten veraltet' : data.error ? '● Aktualisierung gestört' : '● Hypixel verbunden';
  $('#timestamp').textContent = `API-Stand ${new Date(data.lastUpdated).toLocaleTimeString('de-DE')} · vor ${age} s`;
  $('#notice').hidden = !stale && !data.error;
  $('#notice').textContent = `${stale ? 'Veraltete Marktdaten – Empfehlungen vor einem Trade erneut prüfen. ' : ''}${data.error ? `Aktualisierung fehlgeschlagen: ${data.error}. Letzter Datenstand bleibt sichtbar.` : ''}`;
}
async function load() {
  if (loading) return;
  loading = true;
  clearTimeout(loadTimer);
  $('#refresh').disabled = true;
  $('#refresh').textContent = '↻ Lade Marktdaten …';
  try {
    const response = await fetch('/api/bazaar', { signal: AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok || !result.products) throw new Error(result.error || `HTTP ${response.status}`);
    data = result;
    compute();
    updateStatus();
  } catch (error) {
    if (data) { data.error = error.message; updateStatus(); }
    else {
      $('#connection').textContent = '● Verbindung gestört';
      $('#notice').hidden = false;
      $('#notice').textContent = `Keine Marktdaten verfügbar: ${error.message}. Automatischer neuer Versuch in 60 Sekunden.`;
      $('#empty').textContent = 'Die Hypixel-API ist derzeit nicht erreichbar. Erneut aktualisieren oder kurz warten.';
    }
  } finally {
    loading = false;
    $('#refresh').disabled = false;
    $('#refresh').textContent = '↻ Daten aktualisieren';
    const delay = data?.nextRefreshAt > Date.now() ? Math.max(2000, data.nextRefreshAt - Date.now() + 1500) : 60000;
    nextLoadAt = Date.now() + delay;
    loadTimer = setTimeout(load, delay);
    updateStatus();
  }
}
form.addEventListener('submit', e => e.preventDefault());
for (const name of ['scanner', 'plan']) {
  $(`#tab-${name}`).addEventListener('click', () => setView(name));
  $(`#tab-${name}`).addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const target = e.key === 'Home' ? 'scanner' : e.key === 'End' ? 'plan' : name === 'scanner' ? 'plan' : 'scanner';
    setView(target); $(`#tab-${target}`).focus();
  });
}
form.addEventListener('input', () => { validateBudget(); if (form.checkValidity()) { limit = 50; compute(); } });
form.elements.budget.addEventListener('blur', () => validateBudget(true));
form.elements.budget.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); validateBudget(true); compute(); } });
$('#reset').addEventListener('click', () => { for (const [key, value] of Object.entries(defaults)) form.elements[key].value = value; validateBudget(true); limit = 50; compute(); });
for (const selector of ['#search', '#sort', '#watch-only']) $(selector).addEventListener('input', () => { limit = 50; render(); });
$('#more').addEventListener('click', () => { limit += 50; render(); });
$('#refresh').addEventListener('click', load);
$('#rows').addEventListener('click', e => {
  const star = e.target.closest('[data-star]');
  if (star) {
    const id = star.dataset.star;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    persist('bazaar-favorites', [...favorites]); render();
  }
  const item = e.target.closest('[data-detail]');
  if (item) showDetail(item.dataset.detail);
});
$('#plan-rows').addEventListener('click', e => {
  const item = e.target.closest('[data-detail]');
  if (item) showDetail(item.dataset.detail);
});
$('#close-detail').addEventListener('click', () => $('#detail').close());
$('#detail').addEventListener('close', () => { selected = null; });
function exportCsv(items, fields, filename) {
  const cell = value => `"${String(value).replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const csv = [fields, ...items.map(r => fields.map(k => typeof r[k] === 'number' ? r[k].toFixed(4) : r[k]))].map(row => row.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#export').addEventListener('click', () => exportCsv(shown, ['id', 'name', 'destination', 'buy', 'sell', 'profit', 'roi', 'daily', 'quantity', 'capital', 'total', 'pressure'], 'bazaar'));
$('#export-plan').addEventListener('click', () => exportCsv(plan.positions.map(r => ({ ...r, apiTimestamp: data.lastUpdated })),
  ['id', 'name', 'destination', 'quantity', 'buy', 'sell', 'capital', 'allocationPercent', 'total', 'hours', 'apiTimestamp'], 'bazaar-investitionsplan'));
validateBudget(true);
compute();
void load();
setInterval(updateStatus, 1000);
