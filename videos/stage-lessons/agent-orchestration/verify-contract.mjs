// Reproduce the contract audit against the unchanged film and article implementations.
// This runs local fixtures. It does not call a release service or render a film.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { digest } from '../../films/agent-orchestration/arithmetic.mjs';
import { RECEIPTS, REQUEST, values } from '../../films/agent-orchestration/fixtures.mjs';
import {
  canWrite,
  freshPacket,
  merge,
  operationTarget,
  proposal,
  validateModel,
} from '../../films/agent-orchestration/model.mjs';

validateModel();
const packet = proposal();
assert.deepEqual(
  Object.keys(packet).sort(),
  ['tenant', 'request', 'release', 'version', 'traffic', 'evidenceDigest'].sort(),
);
assert.deepEqual(proposal([...RECEIPTS].reverse()), packet);
for (const field of ['tenant', 'request', 'release', 'version']) {
  const rows = structuredClone(RECEIPTS);
  rows[0][field] = 'mismatched';
  assert.throws(() => merge(rows));
}
for (const now of [989, 1051]) assert.throws(() => merge(RECEIPTS, now));
for (const traffic of [-1, 101, 1.5, true, '25', NaN])
  assert.equal(merge(RECEIPTS, 1000, { ...REQUEST, traffic }), false);
const changedSource = structuredClone(RECEIPTS);
changedSource[0].value.failures = 1;
changedSource[0].digest = digest(changedSource[0].value);
assert.throws(() => merge(changedSource));
const priorSource = values.eval;
try {
  values.eval = { ...priorSource, failures: 1 };
  assert.throws(() => merge(RECEIPTS));
  assert(merge(changedSource));
  assert.notEqual(proposal(changedSource).evidenceDigest, packet.evidenceDigest);
} finally {
  values.eval = priorSource;
}
// This acceptance is a documented limit: the registry has no scoped source records.
const relabeled = RECEIPTS.map((receipt) => ({
  ...receipt,
  tenant: 'supplied-tenant',
  version: 999,
}));
assert(merge(relabeled, 1000, { ...REQUEST, tenant: 'supplied-tenant', version: 999 }));
assert.deepEqual(
  freshPacket,
  proposal(
    RECEIPTS.map((receipt) => ({ ...receipt, version: 4 })),
    { ...REQUEST, version: 4 },
  ),
);
for (const field of Object.keys(packet)) {
  assert.equal(canWrite({ ...packet, [field]: 'mismatched', approved: true }, 3, packet), false);
}
const target = operationTarget();
assert.throws(() => target.apply('op', packet, { ...packet, approved: false }, 3));
assert.throws(() => target.apply('op', packet, { ...packet, approved: true }, 4));
assert.equal(target.effects, 0);
const result = target.apply('op', packet, { ...packet, approved: true }, 3);
assert.deepEqual(target.apply('op', packet, { approved: false }, 999), result);
assert.equal(target.effects, 1);
assert.throws(() =>
  target.apply('op', { ...packet, traffic: 50 }, { ...packet, approved: true }, 3),
);
assert.equal(target.effects, 1);
assert.equal(operationTarget().effects, 0);
console.log(
  'Film contracts passed: scoped-input mismatch rejection, freshness, policy, source changes, digest-only packet, supplied v4 inputs, and replay-before-new-write checks.',
);
console.log(
  'Film limit reproduced: consistently relabeled tenant/revision inputs pass against the unscoped value registry. A new target has no retained ledger.',
);

const article = fileURLToPath(
  new URL(
    '../../../web/src/content/agents/multi-agent-dags-langgraph-orchestration/content.md',
    import.meta.url,
  ),
);
const capstone = fileURLToPath(
  new URL(
    '../../../web/src/content/foundations/capstone-production-llm-agent/assets/production_agent.py',
    import.meta.url,
  ),
);
const python = String.raw`#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
import ast
from copy import deepcopy
from pathlib import Path
import re
import sys

article = Path(sys.argv[1]).read_text()
def block(title):
    return re.search(r'\x60\x60\x60python title="' + re.escape(title) + r'"\n(.*?)\n\x60\x60\x60', article, re.S).group(1)
tree = ast.parse(block('release-read-dag.py').split('def build_read_graph():')[0])
tree.body = [node for node in tree.body if not (isinstance(node, ast.ImportFrom) and node.module.startswith('langgraph'))]
scope = {}
exec(compile(tree, 'article-pure-read-contract', 'exec'), scope)
initial, refs = scope['initial'], scope['REFS']
receipt, merge = scope['receipt'], scope['merge_receipts']
good = [receipt(initial, branch, refs[branch]) for branch in ('eval', 'health', 'policy')]
packet = merge({**initial, 'receipts': good})['proposal']
assert [entry['ref'] for entry in packet['evidence']] == ['evals/run-91', 'metrics/window-1h', 'policy/rollout-v4']
def rejects(call):
    try:
        call()
    except (ValueError, PermissionError):
        return
    raise AssertionError('expected rejection')
for traffic in (-1, 101, 1.5, True, '25', float('nan')):
    rejects(lambda: merge({**initial, 'requested_traffic': traffic, 'receipts': good}))
rejects(lambda: scope['checked_update']('eval', {'receipts': [good[0]], 'requested_traffic': 100}))
rejects(lambda: scope['checked_update']('eval', {'receipts': [good[1]]}))
for rows in (good[:2], good + [good[2]]):
    rejects(lambda: merge({**initial, 'receipts': rows}))
relabeled = [{**row, 'release_version': 999} for row in good]
rejects(lambda: merge({**initial, 'release_version': 999, 'receipts': relabeled}))
scope['SOURCES'][refs['eval']]['regressions'] = 1
rejects(lambda: merge({**initial, 'receipts': good}))
fresh = [receipt(initial, branch, refs[branch]) for branch in ('eval', 'health', 'policy')]
assert merge({**initial, 'receipts': fresh})['proposal']['digest'] != packet['digest']
print('Article pure read contracts passed: output ownership, exact branches, scoped sources, traffic bounds, explicit refs and changed-content packet binding.')
print('The pure-function probe excludes LangGraph scheduling. Use --langgraph to execute the pinned framework examples too.')
# Execute the separate writer example, including its own rejection and replay assertions.
writer = {}
exec(compile(block('replay-safe-writer.py'), 'article-replay-safe-writer', 'exec'), writer)
action = writer['action']
assert writer['execute'](action, 'writer-service', writer['key'], 1000).startswith('reused:')
rejects(lambda: writer['execute'](action, 'health-agent', writer['key'], 1000))
print('Article writer: authorized same-action lookup survives expiry in memory; worker scope is checked before lookup. No transaction or crash durability was exercised.')
from tempfile import TemporaryDirectory
capstone = {'__name__': 'capstone_contract_probe'}
exec(compile(Path(sys.argv[2]).read_text(), sys.argv[2], 'exec'), capstone)
with TemporaryDirectory(prefix='leetllm-orchestration-contract-') as folder:
    db = Path(folder) / 'probe.sqlite'
    result = capstone['run_agent']()
    operation = capstone['stage_restore'](db, 'r-104', result, 'manager-1', 1000)
    execute = capstone['execute_approved_restore']
    assert execute(db, operation, 'A300', 'prod-api', 1001) == 'blocked:not_approved'
    assert capstone['record_approval'](db, operation, 'manager-1', True) == 'approval_recorded'
    try:
        execute(db, operation, 'A300', 'prod-api', 1001, fail_before_commit=True)
    except RuntimeError:
        pass
    else:
        raise AssertionError('expected pre-commit failure')
    assert capstone['effect_count'](db) == 0
    assert execute(db, operation, 'A300', 'prod-api', 1002) == 'simulated_restore_created'
    assert execute(db, operation, 'A300', 'prod-api', 1003) == 'duplicate_ignored'
    assert execute(db, operation, 'A300', 'prod-api', 1300) == 'blocked:expired'
    assert capstone['effect_count'](db) == 1
print('Separate capstone contracts passed in a temporary SQLite database: exact review packet, rollback, simulated local effect, duplicate detection, and expiry before duplicate lookup.')
`;
process.stdout.write(
  execFileSync('uv', ['--no-config', 'run', '--no-project', '--script', '-', article, capstone], {
    input: python,
    encoding: 'utf8',
  }),
);

if (process.argv.includes('--langgraph')) {
  const framework = String.raw`#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["langgraph==1.2.12"]
# ///
from importlib.metadata import version
from pathlib import Path
import re
import sys
article = Path(sys.argv[1]).read_text()
print('LangGraph', version('langgraph'))
for title in ('release-read-dag.py', 'unequal-depth-join.py', 'approval-node.py', 'bounded-node-retries.py', 'a-read-only-mapping-is-shallow.py'):
    code = re.search(r'\x60\x60\x60python title="' + re.escape(title) + r'"\n(.*?)\n\x60\x60\x60', article, re.S).group(1)
    print('Executing', title)
    exec(compile(code, title, 'exec'), {'__name__': 'contract_probe'})
`;
  process.stdout.write(
    execFileSync('uv', ['--no-config', 'run', '--no-project', '--script', '-', article], {
      input: framework,
      encoding: 'utf8',
    }),
  );
}
