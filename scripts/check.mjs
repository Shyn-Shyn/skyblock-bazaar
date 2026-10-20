import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { spawnSync } from 'node:child_process';

// Resolve from this file so the command also works outside the repository cwd.
const root = fileURLToPath(new URL('../', import.meta.url));
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error('Node.js 22 oder neuer wird benötigt.');
  process.exit(1);
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    if (result.signal) console.error(`Prüfung durch Signal ${result.signal} beendet.`);
    process.exit(result.status ?? 1);
  }
}

function modules(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    return entry.isDirectory() ? modules(url)
      : entry.isFile() && entry.name.endsWith('.mjs') ? [fileURLToPath(url)] : [];
  });
}

const files = [
  fileURLToPath(new URL('../server.mjs', import.meta.url)),
  fileURLToPath(new URL('../polling.mjs', import.meta.url)),
  fileURLToPath(new URL('../http-assets.mjs', import.meta.url)),
  ...modules(new URL('../public/', import.meta.url)),
  ...modules(new URL('./', import.meta.url)),
].sort();

for (const file of files) {
  console.log(`Syntax: ${relative(root, file)}`);
  run(['--check', file]);
}
console.log('Anwendungstests: node --test');
run(['--test']);
console.log('Alle Syntaxprüfungen und Anwendungstests bestanden.');
