import assert from 'node:assert/strict';

export const current = {
  deployment: 'checkout-42',
  revision: 7,
  time: 100,
  share: 10,
  smoke: true,
  ms: 240,
};
export const maxObservationAge = 30;

export function advice(record, now) {
  if (
    !record ||
    record.deployment !== current.deployment ||
    record.revision !== 7 ||
    record.share !== 10 ||
    typeof record.smoke !== 'boolean' ||
    !Number.isInteger(record.time) ||
    !Number.isInteger(now) ||
    !Number.isFinite(record.ms) ||
    record.ms < 0
  )
    return 'Withhold';
  const age = now - record.time;
  if (age < 0 || age > maxObservationAge) return 'Withhold';
  if (!record.smoke || record.ms >= 300) return 'Roll back';
  return record.ms >= 200 ? 'Hold' : 'Continue';
}

export const routes = [
  { id: 'A', hops: ['API', 'Legacy adapter', 'Database'], score: 0.96 },
  { id: 'B', hops: ['API', 'Feature flag', 'Database'], score: 0.82 },
];
const links = new Set(['Legacy adapter/Database', 'API/Feature flag', 'Feature flag/Database']);
export const hopChecks = (r) => r.hops.slice(1).map((v, i) => links.has(r.hops[i] + '/' + v));
export const eligibleRoute = routes
  .filter((r) => hopChecks(r).every(Boolean))
  .sort((a, b) => b.score - a.score)[0];
export const coverage = (n) => -Math.expm1(n * Math.log1p(-0.3));

export const pins = [
  {
    name: 'Parser v2',
    score: 0.74,
    fail: '',
    leaves: [
      { name: 'API shim', score: 0.7, fail: '' },
      { name: 'Removed API', score: 0.18, fail: 'Incompatible' },
    ],
  },
  { name: 'Nightly', score: 0.12, fail: 'Runtime too old', leaves: [] },
  {
    name: 'Parser v1',
    score: 0.81,
    fail: '',
    leaves: [
      { name: 'Sanitizer patch', score: 0.96, fail: '' },
      { name: 'Defer fix', score: 0.39, fail: 'Advisory open' },
    ],
  },
];
const feasible = (p) => !p.fail && p.score >= 0.35;
export const frontier = pins
  .filter(feasible)
  .sort((a, b) => b.score - a.score)
  .slice(0, 2);
export const completed = frontier
  .flatMap((p) => p.leaves.filter(feasible))
  .sort((a, b) => b.score - a.score);
export const nextVisitOutcome = 1;
export function visits(backed) {
  const parent = 16 + Number(backed);
  return [
    { id: 'A', q: 0.5, p: 0.2, n: 1 },
    { id: 'B', q: 0.5, p: 0.15, n: 1 },
  ].map(({ id, q, p, n }) => {
    if (backed && id === 'A') {
      q = (q * n + nextVisitOutcome) / (n + 1);
      n++;
    }
    const bonus = (p * Math.sqrt(parent)) / (1 + n);
    return { id, q, p, n, parent, bonus, total: q + bonus };
  });
}

export const steps = [
  { name: 'Parse manifest', exact: true, score: 0.92 },
  { name: 'Pin parser v2', exact: true, score: 0.74 },
  { name: 'Call removed API', exact: false, score: 0.15 },
  { name: 'Draft advice', exact: true, score: 0.85 },
];
export function inspectSteps(items) {
  let count = 0;
  for (const step of items) {
    if (
      typeof step.exact !== 'boolean' ||
      !Number.isFinite(step.score) ||
      step.score < 0 ||
      step.score > 1
    )
      throw Error('Invalid verifier result');
    count++;
    if (!step.exact || step.score < 0.35) break;
  }
  return count;
}
export const flawSet = [1, 1, 0, 1, 1, 1, 0, 1];
export const solverSet = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1];
export const rate = (values) =>
  Math.round((100 * values.reduce((a, b) => a + b, 0)) / values.length);

// A single controller owns admission. Receipt identity survives settlement.
class Ledger {
  constructor(cap) {
    this.cap = cap;
    this.held = new Map();
    this.charged = new Map();
  }
  snapshot() {
    const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0);
    const spent = sum(this.charged),
      reserved = sum(this.held);
    return {
      cap: this.cap,
      spent,
      reserved,
      free: this.cap - spent - reserved,
      held: Object.fromEntries(this.held),
      charged: Object.fromEntries(this.charged),
    };
  }
  reserve(id, n) {
    if (!Number.isSafeInteger(n) || n < 1 || this.held.has(id) || this.charged.has(id))
      throw Error('Invalid reservation');
    if (this.snapshot().free < n) return false;
    this.held.set(id, n);
    return true;
  }
  settle(id, n) {
    if (this.charged.get(id) === n && this.charged.has(id)) return;
    if (!this.held.has(id) || !Number.isSafeInteger(n) || n < 0 || n > this.held.get(id))
      throw Error('Reconcile receipt');
    this.held.delete(id);
    this.charged.set(id, n);
  }
}
function runLedger(practice) {
  const l = new Ledger(practice ? 6000 : 4000);
  const limit = practice ? 2000 : 1500;
  if (practice) {
    l.reserve('C', 900);
    l.settle('C', 900);
  }
  l.reserve('B', limit);
  l.reserve('A', limit);
  const waiting = practice ? 'D' : 'C';
  assert.equal(l.reserve(waiting, 1500), false);
  const before = l.snapshot();
  l.settle('A', practice ? 1400 : 900);
  const receipt = l.snapshot();
  assert.equal(l.reserve(waiting, 1500), true);
  return [before, receipt, l.snapshot()];
}
export const mainLedger = runLedger(false),
  finalLedger = runLedger(true);

// Physical order leaves B in place while the unspent end of A joins free capacity.
export function cells(row, practice = false) {
  const cells = [];
  const add = (id, n, status) => {
    for (let i = 0; i < (n ?? 0) / 100; i++) cells.push({ id, status });
  };
  if (practice) add('C', row.charged.C, 'spent');
  add('B', row.held.B, 'held');
  add('A', row.held.A, 'held');
  add('A', row.charged.A, 'spent');
  const next = practice ? 'D' : 'C';
  add(next, row.held[next], 'held');
  add('', row.free, 'free');
  return cells;
}

export const kv = {
  layers: 80,
  heads: 8,
  width: 128,
  bytes: 2,
  block: 4096,
  branches: 8,
  stemBlocks: 3,
};
kv.bytesPerToken = 2 * kv.layers * kv.heads * kv.width * kv.bytes;
export function kvSize(shared) {
  const stemCount = shared ? 1 : kv.branches;
  const blocks = stemCount * kv.stemBlocks + kv.branches;
  return {
    blocks,
    slots: blocks * kv.block,
    gib: (blocks * kv.block * kv.bytesPerToken) / 2 ** 30,
  };
}
export const leases = [
  [4, 1],
  [2, 1],
  [2, 0],
  [0, 0],
].map(([refs, readers]) => ({ refs, readers, reclaim: refs === 0 && readers === 0 }));
export const history = [0.72, 0.7, 0.71, 0.69];
export const plateau = (scores) =>
  scores.length >= 4 && Math.max(...scores.slice(-3)) <= Math.max(...scores.slice(0, -3));
export const draftC = {
  id: 'C',
  score: 0.72,
  status: 'completed',
  checks: 3,
  text: 'Hold',
  record: current,
};
export const draftF = {
  id: 'F',
  score: 0.95,
  status: 'incomplete',
  checks: 2,
  text: 'Hold',
  record: current,
};
export function canSend(d, now) {
  return (
    d.status === 'completed' &&
    d.checks === 3 &&
    d.text.trim().length > 0 &&
    d.text.trim() === advice(d.record, now) &&
    d.text.trim() !== 'Withhold'
  );
}
export const evals = [
  { incident: 'Threshold', single: 'Correct', search: 'Correct' },
  { incident: 'Parser repair', single: 'Abstain', search: 'Correct' },
  { incident: 'Stale receipt', single: 'Abstain', search: 'Unsafe' },
  { incident: 'Boundary', single: 'Correct', search: 'Abstain' },
];
export const countOutcomes = (key, verdict) => evals.filter((row) => row[key] === verdict).length;
export function checkExamples() {
  for (const [ms, want] of [
    [199, 'Continue'],
    [200, 'Hold'],
    [240, 'Hold'],
    [299, 'Hold'],
    [300, 'Roll back'],
  ])
    assert.equal(advice({ ...current, ms }, 110), want);
  for (const t of [99, 131]) assert.equal(advice(current, t), 'Withhold');
  assert.equal(advice(current, 130), 'Hold');
  for (const change of [{ revision: 6 }, { smoke: 'true' }, { share: 1 }, { ms: NaN }])
    assert.equal(advice({ ...current, ...change }, 110), 'Withhold');
  assert.equal(advice({ ...current, smoke: false }, 110), 'Roll back');
  assert.deepEqual(routes.map(hopChecks), [
    [false, true],
    [true, true],
  ]);
  assert.equal(eligibleRoute.id, 'B');
  assert.ok(Math.abs(coverage(5) - 0.83193) < 1e-10);
  assert.deepEqual(
    frontier.map((p) => p.name),
    ['Parser v1', 'Parser v2'],
  );
  assert.deepEqual(
    completed.map((p) => p.name),
    ['Sanitizer patch', 'API shim'],
  );
  assert.deepEqual(
    visits(false).map((v) => v.total),
    [0.9, 0.8],
  );
  const [a, b] = visits(true);
  assert.deepEqual([a.q, a.n, b.q, b.n, a.parent, b.parent], [0.75, 2, 0.5, 1, 17, 17]);
  assert.deepEqual([a.total.toFixed(2), b.total.toFixed(2)], ['1.02', '0.81']);
  assert.equal(inspectSteps(steps), 3);
  for (const invalid of [
    { score: 0.99, exact: 'false' },
    { score: NaN, exact: true },
  ])
    assert.throws(() => inspectSteps([invalid]));
  assert.equal(rate(flawSet), 75);
  assert.equal(rate(solverSet), 90);
  for (const [practice, ledger, free] of [
    [false, mainLedger, [1000, 1600, 100]],
    [true, finalLedger, [1100, 1700, 200]],
  ]) {
    assert.deepEqual(
      ledger.map((r) => r.free),
      free,
    );
    for (const row of ledger) {
      const sockets = cells(row, practice);
      assert.equal(sockets.length * 100, row.cap);
      for (const [status, map] of [
        ['held', row.held],
        ['spent', row.charged],
      ]) {
        for (const [id, n] of Object.entries(map))
          assert.equal(sockets.filter((s) => s.id === id && s.status === status).length * 100, n);
      }
      assert.equal(sockets.filter((s) => s.status === 'free').length * 100, row.free);
    }
  }
  const l = new Ledger(5000);
  l.reserve('A', 1800);
  l.reserve('B', 1700);
  l.settle('A', 1100);
  l.settle('A', 1100);
  assert.throws(() => l.settle('A', 1110));
  assert.throws(() => l.settle('B', 1800));
  assert.equal(l.reserve('C', 2200), true);
  assert.equal(l.snapshot().free, 0);
  assert.equal(kv.bytesPerToken, 327680);
  assert.equal(kvSize(false).gib, 40);
  assert.equal(kvSize(true).gib, 13.75);
  assert.deepEqual(
    leases.map((l) => l.reclaim),
    [false, false, false, true],
  );
  assert.equal(plateau(history), true);
  assert.equal(plateau([0.5, 0.51, 0.49, 0.48]), false);
  assert.ok(canSend(draftC, 130));
  assert.ok(!canSend(draftF, 130));
  assert.ok(!canSend({ ...draftC, text: '   ' }, 130));
  assert.ok(!canSend({ ...draftC, record: { ...current, time: 99 } }, 130));
  assert.deepEqual(finalLedger[2].held, { B: 2000, D: 1500 });
  assert.deepEqual(
    ['single', 'search'].map((k) =>
      ['Correct', 'Unsafe', 'Abstain'].map((v) => countOutcomes(k, v)),
    ),
    [
      [2, 0, 2],
      [2, 1, 1],
    ],
  );
  assert.equal(validFields(responseFields(false)), false);
  assert.equal(validFields(responseFields(true)), true);
  assert.equal(validFields([['final_answer', 'Hold']]), false);
  assert.equal(validFields([...responseFields(true), ['final_answer', 'Hold']]), false);
  const frozen = queueState(130);
  assert.equal(queueState(128).underReview < frozen.underReview, true);
  assert.equal(frozen.underReview < 1, true);
  assert.deepEqual(queueState(135), frozen);
  assert.deepEqual(queueState(140, true), { ...frozen, returned: true });
  assert.equal(queueState(129, true).returned, false);
}

// These field lists represent the children of a bounded, already decoded response.
export const responseFields = (corrected) => [
  ['verification_summary', 'Check requested.'],
  [corrected ? 'final_answer' : 'final', 'Hold'],
];
export function validFields(fields) {
  const allowed = new Set(['checkpoint', 'verification_summary', 'final_answer']);
  return (
    fields.every(([name, text]) => allowed.has(name) && typeof text === 'string' && text.trim()) &&
    ['verification_summary', 'final_answer'].every(
      (name) => fields.filter(([k]) => k === name).length === 1,
    )
  );
}

export function queueState(now, returned = false) {
  const stopped = now >= 130,
    time = Math.min(130, Math.max(126, now));
  const underReview = 0.12 + (time - 126) * 0.103;
  return { time, stopped, underReview, returned: stopped && returned && canSend(draftC, time) };
}
