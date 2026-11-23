import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  ADMISSION_FIXTURES,
  GENERATED_CASES,
  TAIL_DRAWS,
  PARAPHRASE,
  RESERVED_TASK,
  NOVELTY_EXAMPLE,
  SEED_METADATA,
  LOG_ANSWERS,
  RELEASE_SUITES,
  firstPageOnlyClient,
} from '../../../films/synthetic-data/fixtures.mjs';
import {
  runSearchFixture,
  screenTask,
  screenCandidates,
  checkSupportLog,
  syntheticRelease,
} from '../../../films/synthetic-data/model.mjs';
import {
  cosineSimilarity,
  orderAudit,
  tailOmission,
} from '../../../films/synthetic-data/arithmetic.mjs';

export {
  GENERATED_CASES as tasks,
  SEED_METADATA as seed,
  RELEASE_SUITES as suites,
  cosineSimilarity as cosine,
};
export const rows = ADMISSION_FIXTURES;
export const short = runSearchFixture({ run: firstPageOnlyClient });
export const full = runSearchFixture(rows[0]),
  large = runSearchFixture(rows[3]);
export const originalWords = screenTask(rows[4].text, RESERVED_TASK),
  paraphrase = screenTask(PARAPHRASE, RESERVED_TASK);
export const admitted = screenCandidates([...rows].reverse()).reverse();
export const votes = rows.map((r) => orderAudit(...r.votes));
export const judgeCalls = admitted.filter((row) => row.passedGates >= 4).length * 2;
export const allCalls = admitted.length * 2;
export const comparisons = NOVELTY_EXAMPLE;
const { references, proposals, cutoff } = comparisons;
export function replay(flip) {
  const b = flip ? { ...proposals[0], votes: rows[1].votes } : proposals[0];
  const c = proposals[1];
  const [first, second] = screenCandidates([b, c], references, cutoff);
  const pool = first.passedGates === 5 ? [...references, b.vector] : [...references];
  return {
    b: first,
    c: second,
    bScore: Math.max(...references.map((v) => cosineSimilarity(v, b.vector))),
    cScore: Math.max(...pool.map((v) => cosineSimilarity(v, c.vector))),
    pool,
  };
}
export const logs = LOG_ANSWERS.map(checkSupportLog);
export const rare = 0.05;
export const isRetry = (position, rareShare) => position >= 1 - rareShare;
function sampleAtPositions(rareShare) {
  return TAIL_DRAWS.map((d) => ({ ...d, isRare: isRetry(d.uniform, rareShare) }));
}
export const retryCount = (sample) => sample.filter((d) => d.isRare).length;
export const draws = sampleAtPositions(rare);
export const fittedRare = retryCount(draws) / draws.length;
export const fittedDraws = sampleAtPositions(fittedRare);
export const omission = tailOmission(rare, draws.length);
const batches = [
  ['H1', 'H2', 'H3'],
  ['G1', 'G2'],
  ['G3', 'G4'],
];
export const retryRow = { id: 'H3', updatesPerDraw: 1_000_000 };
export function retainedPools(round) {
  const accumulated = batches.slice(0, round + 1).flat();
  const latest = batches[round];
  return { accumulated, latest };
}
export function realCount(pool) {
  return pool.filter((id) => batches[0].includes(id)).length;
}
const digest = (bytes) => createHash('sha256').update(bytes, 'utf8').digest('hex');
// The article serializes fields in sorted order with compact separators and a final LF.
const articleRow = {
  data_slice: 'standard',
  generator: 'synth-generator-v1',
  instruction: 'Return JSON with page_size=100, retry_limit=3, and cursor=true.',
  response: '{"page_size":100,"retry_limit":3,"cursor":true}',
  row_id: 'keep',
  seed_id: 'seed-011',
  tactic: 'add_constraint',
};
export const articleShard = { row: articleRow, hash: digest(JSON.stringify(articleRow) + '\n') };
// These three article rows stop before the novelty check in both runs.
const earlyStops = ['schema', 'overlap', 'verifier'];
const noveltyRows = [
  { id: 'duplicate', vector: [0.99, 0.02], votes: ['left', 'right'] },
  { id: 'unstable', vector: [0.6, 0.8], votes: ['left', 'left'] },
  { id: 'keep', vector: [0.6, 0.8], votes: ['left', 'right'] },
];
export const articleRowIds = [...earlyStops, ...noveltyRows.map((row) => row.id)];
function articleCutoffRun(cutoff) {
  const pool = [[1, 0], [0, 1]];
  const outcomes = [...earlyStops];
  for (const row of noveltyRows) {
    if (pool.some((vector) => cosineSimilarity(vector, row.vector) >= cutoff)) {
      outcomes.push('diversity');
    } else if (row.votes[0] !== 'left' || row.votes[1] !== 'right') {
      outcomes.push('judge');
    } else {
      pool.push(row.vector);
      outcomes.push('accept');
    }
  }
  return { cutoff, outcomes };
}
export const cutoffRuns = [0.82, 0.90].map(articleCutoffRun);
export const shards = [100, 10000].map((size) => {
  const bytes = JSON.stringify({ page_size: size }) + '\n';
  return { size, bytes, hash: digest(bytes) };
});
export const release = syntheticRelease(
  Object.fromEntries(RELEASE_SUITES.map((s) => [s.id, s.count / s.total])),
  Object.fromEntries(RELEASE_SUITES.map((s) => [s.id, s.limit / s.total])),
);
export const gap = RELEASE_SUITES[1].limit - RELEASE_SUITES[1].count;
export function check() {
  assert.deepEqual(short.result.items, ['Ada', 'Grace']);
  assert.equal(short.accepted, false);
  assert.deepEqual(
    full.trace.map((t) => [
      t.request.cursor,
      t.request.limit,
      t.response.status,
      t.response.nextCursor,
    ]),
    [
      [null, 100, 429, null],
      [null, 100, 200, 'page-2'],
      ['page-2', 100, 200, null],
    ],
  );
  assert.deepEqual(full.result.items, ['Ada', 'Grace', 'Linus']);
  assert.ok(full.accepted);
  assert.equal(large.trace[0].response.status, 413);
  assert.deepEqual(large.result.items, []);
  assert.deepEqual(
    originalWords.matches.map((m) => m.start),
    [1, 2, 3],
  );
  assert.equal(paraphrase.matches.length, 0);
  assert.equal(new Set(GENERATED_CASES.map((r) => r.family)).size, 3);
  assert.deepEqual(
    admitted.map((r) => r.passedGates),
    [5, 4, 3, 2, 1, 0],
  );
  assert.deepEqual([judgeCalls, allCalls], [4, 12]);
  assert.equal(votes[1].stable, false);
  assert.equal(cosineSimilarity([0, 1], [3, 4]), 0.8);
  assert.throws(() => cosineSimilarity([0, 0], [1, 0]));
  assert.deepEqual([replay(false).b.passedGates, replay(false).c.passedGates], [5, 3]);
  assert.deepEqual([replay(true).b.passedGates, replay(true).c.passedGates], [4, 5]);
  assert.ok(replay(true).cScore < cutoff && replay(false).cScore >= cutoff);
  assert.deepEqual(
    logs.map((l) => [l.fields[0], l.allowed]),
    [
      ['request_id', true],
      ['customer_email', false],
    ],
  );
  assert.equal(draws.length, 8);
  assert.equal(retryCount(draws), 0);
  assert.equal(fittedRare, 0);
  assert.deepEqual(fittedDraws.map((d) => [d.id, d.uniform]), draws.map((d) => [d.id, d.uniform]));
  assert.equal(retryCount(fittedDraws), 0);
  assert.deepEqual([isRetry(0.99, rare), isRetry(0.99, fittedRare)], [true, false]);
  assert.equal(omission.toFixed(4), '0.6634');
  assert.deepEqual(retainedPools(0).accumulated, ['H1', 'H2', 'H3']);
  assert.deepEqual(retainedPools(1).accumulated, ['H1', 'H2', 'H3', 'G1', 'G2']);
  const { accumulated, latest } = retainedPools(2);
  assert.deepEqual(accumulated, ['H1', 'H2', 'H3', 'G1', 'G2', 'G3', 'G4']);
  assert.deepEqual(latest, ['G3', 'G4']);
  assert.deepEqual([realCount(accumulated), realCount(latest)], [3, 0]);
  assert.ok(accumulated.includes(retryRow.id) && !latest.includes(retryRow.id));
  assert.equal(1 / retryRow.updatesPerDraw, 0.000001);
  assert.equal(shards[0].hash.slice(0, 12), 'a1052512c4b5');
  assert.equal(shards[1].hash.slice(0, 12), 'dfd022ebeedd');
  assert.equal(
    articleShard.hash,
    'b5cc167360566811825a82224fbf12ba805e43ae66ba861c1c08d5288b334abb',
  );
  for (const run of cutoffRuns) {
    assert.equal(run.outcomes.length, articleRowIds.length);
    // The article writes sorted receipt fields with Python's default JSON spacing.
    const log = run.outcomes.map((outcome, i) =>
      `{"outcome": "${outcome}", "row_id": "${articleRowIds[i]}"}\n`
    ).join('');
    assert.equal(digest(log), '82b43f8b62b74650b93aeb162581dfb5a758378ebfe08364cb80ae5abe2bdb72');
  }
  assert.deepEqual(articleCutoffRun(0.75).outcomes.slice(3), ['diversity', 'diversity', 'diversity']);
  assert.deepEqual(release.passes, [true, false, true]);
  assert.equal(gap, 2);
  assert.equal(release.release, false);
}
