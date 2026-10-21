// Independent resource polling; importing this module performs no network requests.
export function createItemsCache(getJson, { now = Date.now, interval = 3600000 } = {}) {
  let names = {}, npcPrices = {}, itemsFetchedAt = null, itemsLastUpdated = null;
  let itemsError = null, nextItemsRefreshAt = 0, pending = null;
  return {
    snapshot() { return { names, npcPrices, itemsFetchedAt, itemsLastUpdated, itemsError, nextItemsRefreshAt }; },
    refresh() {
      if (pending) return pending;
      if (now() < nextItemsRefreshAt) return Promise.resolve();
      nextItemsRefreshAt = now() + interval;
      pending = Promise.resolve().then(async () => {
        try {
          const data = await getJson('resources/skyblock/items');
          if (!Array.isArray(data.items) || !data.items.length) throw new Error('Ungültige Itemdaten');
          names = Object.fromEntries(data.items.filter(i => typeof i.id === 'string' && typeof i.name === 'string')
            .map(i => [i.id, i.name.replace(/§./g, '').trim()]));
          npcPrices = Object.fromEntries(data.items.filter(i => typeof i.id === 'string' &&
            Number.isFinite(i.npc_sell_price) && i.npc_sell_price > 0).map(i => [i.id, i.npc_sell_price]));
          itemsFetchedAt = now();
          itemsLastUpdated = Number.isFinite(data.lastUpdated) && data.lastUpdated > 0 ? data.lastUpdated : null;
          itemsError = null;
          nextItemsRefreshAt = now() + interval;
        } catch (error) {
          itemsError = 'Itemnamen und NPC-Preise konnten nicht aktualisiert werden';
          nextItemsRefreshAt = now() + Math.max(interval, Number(error.retryAfter) || 0);
        } finally { pending = null; }
      });
      return pending;
    },
  };
}
