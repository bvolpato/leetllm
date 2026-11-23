import assert from 'node:assert/strict';
import {
  opening,
  integration,
  integrationState,
  boundaries,
  correlation,
  capabilities,
  roles,
} from './connections.mjs';
import {
  process,
  layers,
  contract,
  rollback,
  binding,
  slotState,
  rollbackState,
  argCases,
  statusReceipt,
  flagVerdict,
} from './exchanges.mjs';
import {
  eras,
  http,
  identity,
  catalogs,
  cache,
  mirrorCase,
  cached,
  rowLookup,
} from './transport.mjs';
import { report, reportState } from './report.mjs';
import {
  clockTime,
  openingRead,
  readWindowMinutes,
} from '../../../films/tool-protocol/fixtures.mjs';
import {
  catalogFixture,
  continuationCase,
  discoveryFixture,
  eraDecision,
  evaluateShift,
  issuerMatches,
  shiftRuns,
} from '../../../films/tool-protocol/model.mjs';

const chapters = [
  opening,
  integration,
  boundaries,
  correlation,
  capabilities,
  roles,
  process,
  layers,
  contract,
  rollback,
  binding,
  eras,
  http,
  identity,
  catalogs,
  cache,
  report,
];

function preparePicture(schedule) {
  const { words } = schedule.find(({ beat }) => beat.id === 'c01-b01');
  // Read the existing word times without adding cuts to the recorded sentence's captions.
  const startOf = (word) => words.find(({ text }) => text.replace(/[.,]$/u, '') === word).start;
  return { lift: startOf('one'), filed: startOf('recorded'), status: startOf('processing') };
}

function draw(c, t) {
  c.save();
  try {
    c.scale(1.2, 1.2);
    chapters[t.beat.chapterIndex](c, t);
  } finally {
    c.restore();
  }
}
const at = (beat, ...heard) => ({
  beat: { beatIndex: beat - 1 },
  reveal: (phrase) => Number(heard.includes(phrase)),
});
function check() {
  assert.equal(clockTime(openingRead.now - readWindowMinutes), '01:55');
  assert.equal(openingRead.now - openingRead.savedAt, 18);
  assert.deepEqual(integrationState(at(3, 'permission to shift traffic away')), {
    n: 12,
    shared: true,
    denied: true,
    implementations: 7,
  });
  assert.deepEqual(
    discoveryFixture().checks.map((r) => r.admitted),
    [true, false],
  );
  const typed = slotState(at(5));
  assert.deepEqual(
    typed.matched.map((m) => m.id),
    [3, '1', 1],
  );
  assert.deepEqual(typed.invalid, [1]);
  assert.deepEqual(
    argCases.map((s) => [s.out.layer, s.out.ok]),
    [
      ['protocol', false],
      ['tool', false],
      ['tool', false],
    ],
  );
  assert.equal(flagVerdict({ isError: 'false' }), 'Invalid flag type');
  assert.equal(flagVerdict({ isError: true }), 'Tool failure');
  assert.equal(flagVerdict({ resultType: 'input_required' }), 'Continue workflow');
  const wrong = statusReceipt('reranker-v16');
  assert(wrong.checks.schemaValid);
  assert(!wrong.checks.identityMatches);
  assert(statusReceipt('reranker-v17').checks.admitted);
  const waiting = rollbackState(
    at(
      3,
      'Reply twenty comes back',
      'The operator enters the reason',
      'prepares request twenty-one',
    ),
  );
  assert(waiting.form && waiting.answered && waiting.prepared);
  assert.equal(waiting.effects, 0);
  assert.equal(waiting.showEffects, false);
  assert.equal(rollbackState(at(4, 'Zero')).showEffects, true);
  const checks = [
    'checks the operator',
    'then sends request',
    'rechecks current permission',
    'applies the rollback',
  ];
  for (let i = 0; i <= checks.length; i++)
    assert.equal(rollbackState(at(4, ...checks.slice(0, i))).effects, Number(i === 4));
  assert.equal(continuationCase({ target: 'reranker-v18' }).outcome, 'reject: state binding');
  assert.equal(continuationCase({ serverAllowed: false }).outcome, 'hold: permission');
  assert.equal(continuationCase({ consumed: true }).outcome, 'reject: consumed');
  assert.equal(eraDecision({ transport: 'http', status: 400, kind: 'header' }), 'modern');
  assert.equal(
    eraDecision({ transport: 'http', status: 400, kind: 'empty', permitsLegacy: false }),
    'stop: legacy unavailable',
  );
  for (const resource of [true, false]) {
    assert(mirrorCase(resource, false).outcome.admitted);
    const mismatch = mirrorCase(resource, true);
    assert.notEqual(mismatch.headers['Mcp-Name'], mismatch.target);
    const missing = mirrorCase(resource, false, true);
    assert.equal(missing.headers['Mcp-Name'], undefined);
    for (const item of [missing, mismatch])
      assert.deepEqual(item.outcome, { admitted: false, http: 400, code: -32020, field: 'mcp-name' });
  }
  assert(!issuerMatches('issuer', 'Issuer', true));
  assert(!issuerMatches('issuer', undefined, true));
  assert(issuerMatches('issuer', undefined, false));
  assert(!catalogFixture().adsTools.includes('promote_model'));
  assert.deepEqual(
    [
      cached(),
      cached({ auth: 'token-B' }),
      cached({ cursor: 'page-2' }),
      cached({ changed: true }),
      cached({ retry: true }),
      cached({ ttlMs: 0, now: 0 }),
    ],
    [
      'hit',
      'miss: scope/parameters',
      'miss: scope/parameters',
      'invalidate',
      'bypass: MRTR',
      'stale',
    ],
  );
  assert.equal(rowLookup('ads', 'reranker-v17'), rowLookup('search', 'missing'));
  const mismatch = reportState(at(2, 'Read the release field'));
  assert(mismatch.read.checks.idMatches && mismatch.read.checks.schemaValid);
  assert(!mismatch.read.checks.identityMatches && !mismatch.accepted);
  const next = reportState(at(3, 'Reject the reading', 'Request seventy-two'));
  assert.equal(next.read.id, 72);
  assert(next.retained && !next.arrived && !next.accepted);
  const complete = reportState(at(5));
  assert(complete.accepted && complete.retained && complete.policyMissing);
  assert.equal(complete.read.payload.release_id, 'reranker-v18');
  assert.deepEqual(
    shiftRuns.map(evaluateShift).map((r) => [r.sent, r.effects, r.passes]),
    [
      [0, 0, true],
      [1, 0, false],
    ],
  );
}
export default { title: 'How a Model Discovers and Calls a Tool', preparePicture, draw, check };
