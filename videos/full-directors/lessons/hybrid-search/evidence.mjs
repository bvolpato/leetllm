import assert from 'node:assert/strict';
import {
  bm25Term,
  coordinateGeneration,
  fuse,
  graphDistances,
  lowerLayerSearch,
} from '../../../films/hybrid-search/model.mjs';

export { bm25Term, coordinateGeneration, graphDistances, lowerLayerSearch };
export const code = 'KROT-14';
export const rotationLimits = { staleDays: 14, signalHours: 48 };
export const query = 'refresh expired machine credential';
export const asOf = '2026-05-27';
export const records = [
  {
    id: 'Key',
    code,
    since: '2026-04-01',
    grant: 'support:eu',
    text: `Rule ${code}. Stale service-account keys qualify for automated rotation up to ${rotationLimits.staleDays} days after becoming stale, provided the risk signal is at most ${rotationLimits.signalHours} hours old.`,
  },
  {
    id: 'Session',
    since: '2026-01-03',
    grant: 'support:eu',
    text: 'Idle browser sessions expire after 30 days of inactivity.',
  },
  {
    id: 'Audit',
    since: '2026-02-10',
    grant: 'support:eu',
    text: 'Rule AUD-7. Missing audit-log shards after ingestion failure qualify for replay rebuild.',
  },
  {
    id: 'Key v1',
    code,
    since: '2025-02-01',
    until: '2026-03-31',
    grant: 'support:eu',
    text: 'Rule KROT-14. Stale service-account keys require manual rotation within 30 days.',
  },
  {
    id: 'Admin',
    since: '2026-05-01',
    grant: 'security:admins',
    text: 'ADMIN-KROT-1. Security admins may run emergency key rotation.',
  },
];
export function access(r, grant = 'support:eu', date = asOf) {
  if (r.grant !== grant) return 'Grant required';
  if (date < r.since || (r.until && date > r.until)) return 'Out of date';
  return 'Current';
}
export const eligible = records.filter((r) => access(r) === 'Current');
const stop = new Set('the a an of up at to for is'.split(' '));
export function terms(text) {
  return (text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []).filter((t) => !stop.has(t));
}
export function postings(t) {
  return eligible.filter((r) => terms(r.text).includes(t)).map((r) => r.id);
}
export const idf = Math.log1p(
  (eligible.length - postings('krot-14').length + 0.5) / (postings('krot-14').length + 0.5),
);
export function expansion(first) {
  const logits = [first, 3],
    positive = logits.map((x) => Math.max(0, x)),
    weights = positive.map(Math.log1p);
  return { logits, positive, weights, sum: weights[0] + weights[1], max: Math.max(...weights) };
}
export const raw = [0.98, 0.05, 0],
  norm = Math.hypot(...raw),
  unit = raw.map((x) => x / norm);
export const mini = [
  ['KROT-14', 0.43, 0.36],
  ['Session', 0.33, -0.03],
  ['Audit', 0.27, 0.03],
  ['CERT-14', 0.55, 0.14],
  ['KROT-41', 0.52, 0.25],
  ['KROT-13', 0.31, 0.39],
];
export const miniRun = (count, column) =>
  mini
    .slice(0, count)
    .map((row) => [row[0], row[column]])
    .sort((a, b) => b[1] - a[1]);
export const ivf = { centers: [0, 10], q: 4.9, records: [4, 5.1] };
export const probe = (n) =>
  ivf.records
    .slice(0, n)
    .map((value) => ({ value, d: Math.abs(ivf.q - value) }))
    .sort((a, b) => a.d - b.d)[0];
export const work = (n) => 1000 + 1000 * n;
export const narrow = lowerLayerSearch(1),
  wide = lowerLayerSearch(3);
export const agrees = [
  ['Key', 'Session'],
  ['Key', 'Session'],
];
export const stress = [
  ['Key', 'Session'],
  ['Audit', 'Session'],
];
export const transfer = [
  ['FAQ', 'Index', 'Key'],
  ['Audit', 'Session', 'Key'],
];
export const books = [
  ['Basics', 'Soup'],
  ['Slow Bread', 'Basics'],
];
export function result(lanes, k, depth = Infinity) {
  return fuse(
    lanes.map((l) => l.slice(0, depth)),
    k,
  );
}
export function votes(lanes, k, id, depth = Infinity) {
  return lanes.map((lane) => {
    const rank = lane.slice(0, depth).indexOf(id) + 1;
    return rank ? 1 / (k + rank) : 0;
  });
}
export const weighted = (dense, lex, w) => [w * dense, (1 - w) * lex];
export const minmax = (score, lo, hi) => (lo === hi ? 0 : (score - lo) / (hi - lo));
export const mmrInput = [
  ['Near-copy', 0.89, 0.97],
  ['Session', 0.65, 0.2],
];
export const mmr = mmrInput.map(([id, r, d]) => ({ id, r, d, score: 0.5 * r - 0.5 * d }));
export const ms = { auth: 10, lex: 12, dense: 40, fuse: 8, budget: 50 };
export const join = ms.auth + Math.max(ms.lex, ms.dense),
  finish = join + ms.fuse;

export function check() {
  assert.deepEqual(
    eligible.map((r) => r.id),
    ['Key', 'Session', 'Audit'],
  );
  assert.equal(access(records[3]), 'Out of date');
  assert.equal(access(records[4]), 'Grant required');
  assert.equal(access(records[0], 'revoked'), 'Grant required');
  assert.deepEqual(terms(query).flatMap(postings), []);
  assert.deepEqual(postings(terms(code)[0]), ['Key']);
  assert.deepEqual(postings('krot'), []);
  assert.deepEqual(postings('14'), ['Key']);
  assert.deepEqual(postings('rule'), ['Key', 'Audit']);
  assert.equal(idf.toFixed(3), '0.981');
  assert.deepEqual(
    [1, 2, 4].map((n) => bm25Term(n).toFixed(3)),
    ['1.000', '1.375', '1.692'],
  );
  assert.deepEqual(
    [0.5, 2].map((r) => bm25Term(1, r).toFixed(2)),
    ['1.26', '0.71'],
  );
  assert.equal(bm25Term(1, 2, 1.2, 0), 1);
  assert.equal(expansion(-2).sum, Math.log(4));
  assert.equal(expansion(3).sum, 2 * expansion(3).max);
  assert.deepEqual(
    unit.map((n) => n.toFixed(4)),
    ['0.9987', '0.0510', '0.0000'],
  );
  assert.equal(miniRun(3, 1)[0][0], 'KROT-14');
  assert.equal(miniRun(6, 1)[2][0], 'KROT-14');
  assert.equal(miniRun(6, 2)[0][0], 'KROT-13');
  assert.deepEqual(
    [
      [0, 0],
      [90, 0],
      [90, 90],
    ].map((a) => coordinateGeneration(...a).winner),
    [0, 1, 0],
  );
  assert.deepEqual(
    [1, 2].map((n) => probe(n).d.toFixed(1)),
    ['0.9', '0.2'],
  );
  assert.equal(work(20), 21000);
  assert.deepEqual(narrow.expanded, ['S', 'A', 'B']);
  assert.deepEqual(wide.expanded, ['S', 'A', 'B', 'D', 'C']);
  assert.deepEqual(wide.snapshots[2].pending, ['D']);
  assert.deepEqual(wide.best, ['C', 'B', 'A']);
  for (const [lanes, k, order] of [
    [agrees, 60, ['Key', 'Session']],
    [stress, 60, ['Session', 'Audit', 'Key']],
    [books, 60, ['Basics', 'Slow Bread', 'Soup']],
    [transfer, 10, ['Key', 'Audit', 'FAQ', 'Index', 'Session']],
  ]) {
    const rows = result(lanes, k);
    assert.deepEqual(
      rows.map((r) => r.id),
      order,
    );
    for (const row of rows)
      assert.equal(
        row.score,
        votes(lanes, k, row.id).reduce((a, b) => a + b, 0),
      );
  }
  assert.equal(
    result(transfer, 10, 2).some((r) => r.id === 'Key'),
    false,
  );
  assert.deepEqual(votes(transfer, 10, 'Key', 3), [1 / 13, 1 / 13]);
  assert.deepEqual(
    weighted(0.8, 0.2, 0.7).map((n) => n.toFixed(2)),
    ['0.56', '0.06'],
  );
  assert.equal(minmax(5, 5, 5), 0);
  assert.equal(minmax(5, 0, 100), 0.05);
  assert.deepEqual(
    mmr.map((r) => r.score.toFixed(3)),
    ['-0.040', '0.225'],
  );
  assert.equal(join, 50);
  assert.equal(finish, 58);
}
