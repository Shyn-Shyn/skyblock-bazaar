export function npcDataAvailable(data, now = Date.now()) {
  return Number.isFinite(data?.itemsFetchedAt) && data.itemsFetchedAt > 0 &&
    now - data.itemsFetchedAt >= 0 && now - data.itemsFetchedAt < 48 * 3600000;
}

// Resource checks can succeed even when the market endpoint has no snapshot.
export function mergeApiData(previous, result, ok) {
  const fields = ['names', 'npcPrices', 'itemsFetchedAt', 'itemsLastUpdated', 'nextItemsRefreshAt', 'itemsError'];
  const received = result && typeof result === 'object'
    ? Object.fromEntries(fields.filter(key => Object.hasOwn(result, key)).map(key => [key, result[key]])) : {};
  return {
    market: ok && result?.products ? result : previous.market,
    items: Object.keys(received).length ? { ...previous.items, ...received } : previous.items,
  };
}

export function nextLoadDelay(status, now = Date.now()) {
  return status?.nextRefreshAt > now ? Math.max(2000, status.nextRefreshAt - now + 1500)
    : Math.max(60000, (status?.refreshSeconds || 60) * 1000);
}

export function metadataStatus(data, now = Date.now()) {
  const checked = data?.itemsFetchedAt ? `Letzte erfolgreiche Prüfung: ${new Date(data.itemsFetchedAt).toLocaleString('de-DE')}. `
    : 'Noch keine erfolgreiche Prüfung. ';
  const next = data?.nextItemsRefreshAt > now
    ? `Nächste Prüfung: ${new Date(data.nextItemsRefreshAt).toLocaleString('de-DE')} (in ${Math.ceil((data.nextItemsRefreshAt - now) / 60000)} Min.). `
    : 'Nächste Prüfung läuft oder steht aus. ';
  const source = data?.itemsLastUpdated ? `Hypixel-Quellstand: ${new Date(data.itemsLastUpdated).toLocaleString('de-DE')}. ` : '';
  const error = data?.itemsError ? `${data.itemsError}. ${npcDataAvailable(data, now) ? 'Letzte bekannte Preise werden verwendet. ' : ''}` : '';
  return `${error}${checked}${next}${source}${npcDataAvailable(data, now)
    ? 'Stündliche Prüfung kann denselben Hypixel-Quellstand liefern. Individuelle Verkaufslimits werden nicht automatisch abgezogen.'
    : 'NPC-Preise fehlen oder sind veraltet. NPC-Flips bleiben bis zur nächsten erfolgreichen Prüfung deaktiviert.'}`;
}
