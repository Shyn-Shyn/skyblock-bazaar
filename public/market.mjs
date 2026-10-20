export const defaults = {
  budget: 1000000, tax: 1.25, minRoi: 2, minProfit: 0.1,
  minDaily: 1000, horizon: 1, share: 1, maxQuantity: 71680,
  tick: 0.1, maxRoi: 50, maxQueue: 6,
  maxAllocation: 100, maxPositions: 6,
  destination: 'bazaar',
  allocationGoal: 'profit', maxNpcItems: 2048, npcPreference: 'compact',
};

export const planDefaults = { ...defaults, horizon: 24, maxPositions: 12, allocationGoal: 'budget' };

export function parseBudget(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  let text = String(value ?? '').trim().replace(/\s/g, '');
  const suffix = text.match(/([kmb])$/i)?.[1]?.toLowerCase();
  if (suffix) text = text.slice(0, -1);
  // German grouping in full numbers; suffix inputs accept 1,5M and 1.5M.
  if (!suffix && /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(text)) text = text.replaceAll('.', '');
  if (!/^\d+(?:[.,]\d+)?$/.test(text)) return NaN;
  return Number(text.replace(',', '.')) * ({ k: 1e3, m: 1e6, b: 1e9 }[suffix] || 1);
}

export function settings(input = {}, fallbackSettings = defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const bounds = {
    budget: [1, 1e12], tax: [0, 20], minRoi: [0, 100000],
    minProfit: [0, 1e12], minDaily: [0, 1e12], horizon: [0.1, 168],
    share: [0.01, 100], maxQuantity: [1, 1e9], tick: [0, 100000],
    maxRoi: [0, 100000], maxQueue: [0, 100000],
    maxAllocation: [1, 100], maxPositions: [1, 20],
    maxNpcItems: [1, 1e9],
  };
  return Object.fromEntries(Object.entries(fallbackSettings).map(([key, fallback]) => {
    if (key === 'destination') return [key, input[key] === 'npc' ? 'npc' : 'bazaar'];
    if (key === 'allocationGoal') return [key, ['profit', 'budget'].includes(input[key]) ? input[key] : fallback];
    if (key === 'npcPreference') return [key, input[key] === 'profit' ? 'profit' : 'compact'];
    const n = key === 'budget' ? parseBudget(input[key] ?? fallback) : input[key] === '' ? NaN : Number(input[key] ?? fallback);
    const value = Number.isFinite(n) ? Math.min(bounds[key][1], Math.max(bounds[key][0], n)) : fallback;
    return [key, ['maxQuantity', 'maxPositions', 'maxNpcItems'].includes(key) ? Math.floor(value) : value];
  }));
}

// Compare multiple bounded allocations by total modeled NET profit.
// This is a multi-start heuristic, not proof of a global optimum.
// Round purchase costs UP to hundredths so floating-point error cannot overspend.
export function allocate(candidates, input = {}) {
  const s = settings(input);
  const budgetUnits = Math.floor(s.budget * 100);
  const availableUnits = budgetUnits;
  const itemCapUnits = Math.floor(budgetUnits * s.maxAllocation / 100);
  const npc = s.destination === 'npc';
  const compactNpc = npc && s.npcPreference === 'compact';
  const totalOf = (rows, key) => rows.reduce((sum, r) => sum + r[key], 0);
  const seenIds = new Set();
  const ranked = candidates.filter(r => r.eligible && r.quantity >= 1 && Number.isFinite(r.quantity) && r.buy > 0 &&
    Number.isFinite(r.buy) && Number.isFinite(r.profit) && r.profit > 0 &&
    Number.isFinite(r.pressure) && r.pressure >= 0 && r.pressure <= s.maxQueue &&
    !seenIds.has(r.id) && seenIds.add(r.id))
    .map(r => ({ ...r, allocationScore: (r.profit / r.buy) / (1 + Math.log1p(r.pressure)) / (r.roi > 100 ? 3 : 1) }))
    ;
  const optionsFor = (remaining, seen, itemsLeft = npc ? s.maxNpcItems : Infinity) => ranked.filter(r => !seen.has(r.id)).map(r => {
      const unitCost = Math.ceil(r.buy * 100);
      const quantity = Math.floor(Math.min(r.quantity, s.maxQuantity, itemsLeft,
        Math.min(remaining, itemCapUnits) / unitCost));
      return { r, quantity, cost: quantity * unitCost, gain: quantity * r.profit, rate: r.profit / r.buy,
        capital: quantity * r.buy, compact: quantity * r.profit / (1 + quantity / 64) };
    }).filter(o => o.quantity > 0);
  const compare = mode => (a, b) => b[mode] - a[mode] ||
    b.r.allocationScore - a.r.allocationScore || a.r.id.localeCompare(b.r.id);
  const trials = [];
  function build(mode, seed) {
    let remaining = availableUnits;
    const seen = new Set();
    const positions = [];
    let itemsLeft = npc ? s.maxNpcItems : Infinity;
    while (positions.length < Math.floor(s.maxPositions) && remaining > 0) {
      const options = optionsFor(remaining, seen, itemsLeft).sort(compare(mode));
      if (!options.length) break;
      const option = positions.length === 0 && seed ? options.find(o => o.r.id === seed) || options[0] : options[0];
      const { r, quantity, cost } = option;
      seen.add(r.id);
      remaining -= cost;
      itemsLeft -= quantity;
      const hours = r.hours == null ? null : r.queueHours + (r.hours - r.queueHours) * quantity / r.quantity;
      positions.push({ ...r, quantity, hours, capital: quantity * r.buy,
        total: quantity * r.profit, allocationPercent: quantity * r.buy / s.budget * 100,
        capacity: r.quantity });
      // A later low-margin bulk position can reduce the NPC effort utility.
      if (compactNpc) trials.push([...positions]);
    }
    return positions;
  }
  const initial = optionsFor(availableUnits, new Set());
  const modes = compactNpc ? ['gain', 'rate', 'capital', 'compact'] : ['gain', 'rate', 'capital'];
  const seeds = new Set(modes.flatMap(mode => [...initial].sort(compare(mode)).slice(0, 8).map(o => o.r.id)));
  for (const mode of modes) trials.push(build(mode));
  for (const seed of seeds) trials.push(build('gain', seed), build('rate', seed));
  const utility = rows => totalOf(rows, 'total') / (1 + totalOf(rows, 'quantity') / 64);
  trials.sort((a, b) => compactNpc
    ? utility(b) - utility(a) || totalOf(a, 'quantity') - totalOf(b, 'quantity') || totalOf(b, 'total') - totalOf(a, 'total')
    : !npc && s.allocationGoal === 'budget'
      ? totalOf(b, 'capital') - totalOf(a, 'capital') || totalOf(b, 'total') - totalOf(a, 'total') || a.length - b.length
      : totalOf(b, 'total') - totalOf(a, 'total') || a.length - b.length || totalOf(b, 'capital') - totalOf(a, 'capital'));
  const positions = (trials[0] || []).sort((a, b) => b.total - a.total);
  const invested = positions.reduce((sum, r) => sum + r.capital, 0);
  const profit = positions.reduce((sum, r) => sum + r.total, 0);
  const maxTrialCapital = Math.max(0, ...trials.map(rows => totalOf(rows, 'capital')));
  return { positions, invested, profit, remaining: Math.max(0, s.budget - invested),
    unused: Math.max(0, s.budget - invested),
    quantity: totalOf(positions, 'quantity'), eligibleCount: ranked.length,
    modelCapital: ranked.reduce((sum, r) => sum + Math.min(r.quantity, s.maxQuantity) * r.buy, 0),
    objectiveLeavesCapital: maxTrialCapital > invested + .01,
    itemCapActive: ranked.some(r => Math.min(r.quantity, s.maxQuantity) * Math.ceil(r.buy * 100) > itemCapUnits),
    positionCapActive: positions.length >= s.maxPositions && ranked.some(r => !positions.some(p => p.id === r.id)),
    roi: invested > 0 ? profit / invested * 100 : 0 };
}

const positive = n => Number.isFinite(n) && n >= 0;
function levels(data, direction) {
  return (Array.isArray(data) ? data : [])
    .filter(x => positive(x.pricePerUnit) && x.pricePerUnit > 0 && positive(x.amount) && x.amount > 0 && positive(x.orders))
    .map(x => ({ price: x.pricePerUnit, amount: x.amount, orders: x.orders }))
    .sort((a, b) => direction * (a.price - b.price));
}

export function analyze(product, input = defaults, name, npcPrice) {
  const s = settings(input);
  const npc = s.destination === 'npc';
  // Hypixel names refer to instant transactions: sell_summary contains bids.
  const bids = levels(product.sell_summary, -1);
  const asks = levels(product.buy_summary, 1);
  const q = product.quick_status;
  const required = npc ? ['sellVolume', 'sellMovingWeek', 'sellOrders']
    : ['sellVolume', 'buyVolume', 'sellMovingWeek', 'buyMovingWeek', 'sellOrders', 'buyOrders'];
  if (!bids.length || (!npc && !asks.length) || !q || !required.every(k => positive(q[k])) ||
      (npc && (!Number.isFinite(npcPrice) || npcPrice <= 0))) return null;
  const buy = Math.round((bids[0].price + s.tick) * 1e8) / 1e8;
  const sell = npc ? npcPrice : Math.round((asks[0].price - s.tick) * 1e8) / 1e8;
  if (buy >= sell || buy <= 0) return null;
  const spread = sell - buy;
  const profit = sell * (1 - (npc ? 0 : s.tax) / 100) - buy;
  const roi = profit / buy * 100;
  const buyWeekly = Math.max(0, q.sellMovingWeek - q.sellVolume);
  const sellWeekly = npc ? 0 : Math.max(0, q.buyMovingWeek - q.buyVolume);
  const buyHourly = buyWeekly / 168;
  const sellHourly = sellWeekly / 168;
  const daily = (npc ? buyWeekly : Math.min(buyWeekly, sellWeekly)) / 7;
  const bidQueue = bids.filter(x => x.price >= buy).reduce((sum, x) => sum + x.amount, 0);
  const askQueue = npc ? 0 : asks.filter(x => x.price <= sell).reduce((sum, x) => sum + x.amount, 0);
  const queueHours = buyHourly && (npc || sellHourly) ? bidQueue / buyHourly + (npc ? 0 : askQueue / sellHourly) : Infinity;
  // Both legs consume time. Cap a position by its hypothetical share of flow.
  const cycleRate = npc ? buyHourly : buyHourly && sellHourly ? 1 / (1 / buyHourly + 1 / sellHourly) : 0;
  const flowCapacity = cycleRate * (s.share / 100) * Math.max(0, s.horizon - queueHours);
  const quantity = Math.floor(Math.min(s.budget / buy, s.maxQuantity, flowCapacity));
  const hours = quantity > 0 && cycleRate > 0 ? queueHours + quantity / (cycleRate * s.share / 100) : null;
  const total = profit * quantity;
  const bidPressure = buyHourly ? bids[0].amount / buyHourly : Infinity;
  const askPressure = npc ? 0 : sellHourly ? asks[0].amount / sellHourly : Infinity;
  const pressure = bidPressure + askPressure;
  const warnings = [];
  if (roi > 50) warnings.push('Hohe Marge – Preis und Nachfrage im Spiel prüfen');
  if (daily < 1000) warnings.push('Geringer geschätzter Durchsatz');
  if (pressure > 24) warnings.push('Große Orders an den besten Preisen');
  if (Math.min(bids[0].orders, npc ? Infinity : asks[0].orders) <= 1) warnings.push('Mindestens eine Preisspitze hängt an einer einzigen Order');
  if (npc) warnings.push('NPC-Basispreis aus Itemdaten. Verkaufbarkeit und persönliche Verkaufslimits im Spiel prüfen; keine individuellen Boni eingerechnet.');
  const score = Math.max(0, total) / (1 + Math.log1p(pressure)) / (roi > 100 ? 3 : 1);
  return {
    id: product.product_id, name: name || product.product_id.replaceAll('_', ' '), destination: s.destination,
    buy, sell, spread, profit, roi, quantity, total, capital: buy * quantity,
    daily, buyWeekly, sellWeekly, buyHourly, sellHourly, hours,
    bidQueue, askQueue, queueHours, pressure, score, warnings, bids, asks,
    buyOpen: q.sellVolume, sellOpen: q.buyVolume ?? 0,
    buyOrders: q.sellOrders, sellOrders: q.buyOrders ?? 0,
    eligible: profit > 0 && profit >= s.minProfit && roi >= s.minRoi &&
      roi <= s.maxRoi && daily >= s.minDaily && quantity > 0 && pressure <= s.maxQueue,
  };
}
