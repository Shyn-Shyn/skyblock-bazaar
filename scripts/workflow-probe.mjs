import { analyze } from '../public/market.mjs';

const args = process.argv.slice(2);
const usage = 'Aufruf: node scripts/workflow-probe.mjs [--expected-profit ZAHL]';
if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
  process.exit(0);
}
let expectedProfit = 18.30125;
if (args.length) {
  if (args.length !== 2 || args[0] !== '--expected-profit' ||
      !args[1].trim() || !Number.isFinite(Number(args[1]))) {
    console.error(usage);
    console.error('ZAHL muss eine endliche Zahl sein, zum Beispiel 18.30125.');
    process.exit(2);
  }
  expectedProfit = Number(args[1]);
}

// Same unsorted market as test/market.test.mjs. No network or production edits.
const fixture = {
  product_id: 'TEST_ITEM',
  sell_summary: [
    { pricePerUnit: 99, amount: 100, orders: 3 },
    { pricePerUnit: 100, amount: 200, orders: 2 },
  ],
  buy_summary: [
    { pricePerUnit: 125, amount: 100, orders: 3 },
    { pricePerUnit: 120, amount: 300, orders: 2 },
  ],
  quick_status: {
    sellVolume: 300, buyVolume: 400, sellMovingWeek: 168300,
    buyMovingWeek: 336400, sellOrders: 5, buyOrders: 5,
  },
};
const result = analyze(fixture, { destination: 'bazaar', tick: 0.1, tax: 1.25 });
const checks = [
  ['AC-01 Kaufpreis', 100.1, result?.buy],
  ['AC-01 Verkaufspreis', 119.9, result?.sell],
  ['AC-02 Nettogewinn pro Item', expectedProfit, result?.profit],
];
let failed = false;
for (const [criterion, expected, actual] of checks) {
  const pass = Number.isFinite(actual) && Math.abs(actual - expected) < 1e-8;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${criterion}: Soll=${expected}; Ist=${actual}`);
  failed ||= !pass;
}
console.log(failed ? 'CHANGES_REQUESTED' : 'PASS');
console.log('Workflow-Probe des aktuellen App-Modells; keine Aussage über zukünftige Trades.');
process.exitCode = failed ? 1 : 0;
