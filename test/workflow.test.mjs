import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const workflow = readFileSync(new URL('../.github/workflows/publish-image.yml', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const publishCondition = "github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')";

// A contract for this small workflow's explicit layout, not a general YAML parser.
function job(source, id) {
  const start = source.indexOf(`\n  ${id}:\n`);
  assert.notEqual(start, -1, `Missing ${id} job`);
  return source.slice(start + 1).split(/\n(?=  [a-z_]+:\n)/)[0];
}

function verifyWorkflow(source) {
  source = source.replaceAll('\r\n', '\n');
  const header = source.split('\njobs:\n')[0];
  const validate = job(source, 'validate');
  const publish = job(source, 'publish');
  assert.match(header, /\n  pull_request:\n    branches: \[main\]/);
  assert.match(header, /\n  push:\n    branches: \[main\]/);
  assert.match(header, /\n  workflow_dispatch:/);
  assert.doesNotMatch(source, /pull_request_target/);
  assert.match(header, /\npermissions:\n  contents: read\n/);
  assert.doesNotMatch(header + validate, /:\s*write(?:\s|$)|write-all|secrets\.|docker\/login-action/);
  assert.doesNotMatch(validate, /\n    if:|continue-on-error:\s*true/);
  assert.match(validate, /name: Validate application and container/);
  assert.match(validate, /run: node scripts\/check\.mjs/);
  assert.match(validate, /uses: docker\/build-push-action@/);
  assert.match(validate, /load: true/);
  assert.doesNotMatch(validate, /push:\s*true/);
  assert.match(validate, /docker run .*skyblock-smoke:test/);
  assert.match(validate, /curl --fail .*http:\/\/127\.0\.0\.1:8080\/healthz/);
  assert.match(validate, /curl --fail .*http:\/\/127\.0\.0\.1:8080\/app-icon\.png/);
  assert.match(publish, /\n    needs: validate\n/);
  const condition = publish.match(/\n    if: (.+)\n/)?.[1];
  assert.equal(condition, publishCondition, 'Publish must be restricted to main push/dispatch');
  assert.match(publish, /\n    permissions:\n      contents: read\n      packages: write/);
  assert.match(publish, /platforms: linux\/amd64,linux\/arm64/);
  assert.match(publish, /push: true/);
  assert.match(publish, /:sha-\$\{\{ github\.sha \}\}/);
  return condition;
}

test('workflow validates PRs read-only and publishes only validated main commits', () => {
  const condition = verifyWorkflow(workflow);
  // Evaluate the actual, strictly checked Actions expression against independent cases.
  for (const [event, ref, expected] of [
    ['pull_request', 'refs/pull/1/merge', false],
    ['pull_request', 'refs/heads/main', false],
    ['push', 'refs/heads/main', true],
    ['push', 'refs/heads/codex/feature', false],
    ['workflow_dispatch', 'refs/heads/main', true],
    ['workflow_dispatch', 'refs/heads/codex/feature', false],
  ]) {
    assert.equal(runInNewContext(condition, { github: { event_name: event, ref } }), expected, `${event}: ${ref}`);
  }
  verifyWorkflow(workflow.replaceAll('\n', '\r\n'));
});

test('workflow contract rejects unsafe permissions, missing validation and permissive publication', () => {
  for (const [name, from, to] of [
    ['unconditional publish', `    if: ${publishCondition}\n`, ''],
    ['feature dispatch publication', publishCondition, "github.event_name == 'workflow_dispatch'"],
    ['no validation dependency', '    needs: validate\n', ''],
    ['global write permission', 'permissions:\n  contents: read\n', 'permissions:\n  contents: read\n  packages: write\n'],
    ['validation contents write', '  validate:\n', '  validate:\n    permissions:\n      contents: write\n'],
    ['validation token write', '  validate:\n', '  validate:\n    permissions:\n      id-token: write\n'],
    ['PR secret', '        run: node scripts/check.mjs', '        run: echo ${{ secrets.TOKEN }}'],
    ['missing container check', 'docker run -d', 'echo -d'],
    ['missing healthcheck', '/healthz', '/missing'],
    ['missing icon check', '/app-icon.png', '/missing'],
    ['unsafe PR event', '  pull_request:', '  pull_request_target:'],
    ['skipped validation', '  validate:\n', '  validate:\n    if: false\n'],
  ]) {
    assert.ok(workflow.includes(from), `Fixture applies: ${name}`);
    assert.throws(() => verifyWorkflow(workflow.replace(from, to)), undefined, name);
  }
});
