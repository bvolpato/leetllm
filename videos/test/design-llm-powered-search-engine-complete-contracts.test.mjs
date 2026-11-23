import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'yaml';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import * as m from '../animations/design-llm-powered-search-engine.mjs';
registerLessonFonts();
const lesson = parse(
  fs.readFileSync(
    new URL('../lessons/design-llm-powered-search-engine.lesson.yaml', import.meta.url),
    'utf8',
  ),
);
const event = (patch = {}) => ({
  id: 1,
  revision: 2,
  request: 'request-a',
  draft: 'draft-2',
  kind: 'check',
  accepted: true,
  ...patch,
});
const paint = (id, beat, changes = {}) => {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  scene.beats.forEach((b, i) =>
    (b.visual_cues ?? []).forEach((c) => {
      const phase = changes[c.id] ?? (i < beat ? 'after' : 'before');
      cues[c.id] = {
        ...c,
        phase,
        progress: phase === 'after' ? 1 : 0,
        reveal: phase === 'after' ? 1 : 0,
        active: false,
        strength: 0,
      };
    }),
  );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.8, t: 1, duration: 60, opacity: 1, cues, cueTiming: 'provider-words' },
    m.draw,
  );
};

test('an exact shortened quotation and a changed registry cannot publish the full-source contract', () => {
  const text = m.SEARCH_TEXT.fresh,
    end = text.indexOf(' recorded');
  assert.equal(m.quoteReceipt(text, 2).valid, true);
  const short = m.quoteReceipt(text, 2, { end });
  assert.equal(short.exact, true);
  assert.equal(short.complete, false);
  assert.equal(short.valid, false);
  assert.equal(m.quoteReceipt(text, 2, { current: 3 }).valid, false);
  assert.equal(m.quoteReceipt(text, 2, { quote: 'different text' }).valid, false);
  assert.equal(m.quoteReceipt(text, 2, { authorized: false }).valid, false);
});
test('RRF deduplicates within a branch and counts the same identity in another branch', () => {
  const rows = m.rrfContributions([['A', 'A', 'B'], ['B']], 10);
  assert.deepEqual(
    rows.map((x) => [x.id, x.branch, x.rank]),
    [
      ['A', 0, 1],
      ['B', 0, 2],
      ['B', 1, 1],
    ],
  );
  assert(
    rows.filter((x) => x.id === 'B').reduce((n, x) => n + x.value, 0) >
      rows.find((x) => x.id === 'A').value,
  );
});
test('malformed, stale and non-check events leave pending while one matching terminal event emits once', () => {
  for (const e of [
    event({ id: true }),
    event({ revision: 2.5 }),
    event({ accepted: 1 }),
    event({ accepted: 'false' }),
    event({ draft: 'draft-1' }),
    event({ kind: 'progress' }),
  ])
    assert.equal(m.strictPublication([e]).emitted, 0);
  assert.deepEqual(
    m
      .strictPublication([event(), event(), event({ id: 2, accepted: false })])
      .decisions.map((x) => x.reason),
    ['checked', 'duplicate', 'inert'],
  );
  const rejected = m.strictPublication([event({ accepted: false }), event({ id: 2 })]);
  assert.equal(rejected.status, 'blocked');
  assert.equal(rejected.emitted, 0);
});
test('dependency clocks distinguish independent overlap from a finished rewrite', () => {
  const values = {
    plan: 55,
    retrieve: 210,
    rerank: 70,
    pack: 30,
    first: 360,
    claim: 90,
    check: 60,
  };
  assert.equal(m.checkedClocks(values).checked, 820);
  assert.equal(m.checkedClocks({ ...values, dependent: true }).checked, 875);
});
test('resident memory and output work are separate bounds on the same population', () => {
  const v = m.searchCapacity();
  assert.equal(v.inflight, 1500);
  assert.equal(v.resident, 1158);
  assert.equal(v.bytesPerPosition, 131072);
  assert.equal(v.memory, 19);
  assert.equal(v.decode, 12);
  assert(Math.abs(v.gib - 220.517578125) < 1e-10);
});
test('retrieval metrics deduplicate identities before truncation and leave empty gold unscored', () => {
  const v = m.searchMetrics(['C', 'C', 'A', 'irrelevant'], ['A', 'B', 'C'], 3);
  assert.equal(v.recall, 2 / 3);
  assert.equal(v.ndcg.toFixed(4), '0.7654');
  assert.equal(m.searchMetrics([], [], 3).recall, null);
  assert.throws(() => m.searchMetrics([], ['A'], 0));
});
test('the fresh prediction and fetched source do not reveal the publication verdict early', () => {
  const held = paint('fresh-search', 0);
  assert(
    !held.labels.some(
      (x) =>
        x.text.includes('Neither') || x.text.includes('Both complete current quotations released'),
    ),
  );
  const fetched = paint('fresh-search', 2, { 'se-fresh-search-fetch': 'after' });
  assert(fetched.labels.some((x) => x.text.includes('[0,100)')));
  assert(!fetched.labels.some((x) => x.text.includes('Both complete current quotations released')));
  const complete = paint('fresh-search', 2, {
    'se-fresh-search-fetch': 'after',
    'se-fresh-search-2': 'after',
    'se-fresh-search-recheck': 'after',
    'se-fresh-search-result': 'after',
  });
  assert(complete.labels.some((x) => x.text.includes('Both complete current quotations released')));
});
test('the resident tensor result waits for its own completed numerical clause', () => {
  const partial = paint('resident-tensor', 2, { 'se-resident-tensor-bytes': 'after' });
  assert(!partial.labels.some((x) => x.text.includes('220.52')));
  const complete = paint('resident-tensor', 2, {
    'se-resident-tensor-bytes': 'after',
    'se-resident-tensor-gib': 'after',
  });
  assert(complete.labels.some((x) => x.text.includes('220.52')));
});
test('RRF totals and identity tie-break have separate completed-result gates', () => {
  const pending = paint('rrf-rule', 1);
  assert(!pending.labels.some((x) => x.text.includes('0.0325225')));
  assert(!pending.labels.some((x) => x.text.includes('identity order')));
  const sums = paint('rrf-rule', 1, { 'se-rrf-rule-sum': 'after' });
  assert(sums.labels.some((x) => x.text.includes('0.0325225')));
  assert(!sums.labels.some((x) => x.text.includes('identity order')));
  const final = paint('rrf-rule', 1, { 'se-rrf-rule-sum': 'after', 'se-rrf-rule-tie': 'after' });
  assert(final.labels.some((x) => x.text.includes('identity order')));
});
test('adding the rewrite dependency propagates to the checked endpoint in the main picture', () => {
  assert.equal(m.checkedClocks({ dependent: true }).checked, 1020);
  const frame = paint('clock-arithmetic', 2);
  assert(frame.labels.some((x) => x.text === 'Checked claim: 1020 ms'));
  assert(!frame.labels.some((x) => x.text === 'Checked claim: 980 ms'));
});
test('an irrelevant second-ranked FAQ contributes zero observed gain', () => {
  const frame = paint('labeled-metrics', 1, { 'se-labeled-metrics-formula': 'after' });
  assert(frame.labels.some((x) => x.text === '0 / log₂(3) = 0.0000'));
  assert(frame.labels.some((x) => x.text === 'DCG = 1.0000'));
});
test('output roles converge onto the same nineteen physical workers', () => {
  for (const q of [0, 0.25, 0.5, 0.75, 1]) {
    const f = m.sharedFleet(q);
    assert.equal(f.physicalCount, 19);
    assert.equal(f.roles.length, 12);
    assert.equal(new Set(f.workers.map((x) => x.id)).size, 19);
    if (q === 1)
      for (const r of f.roles) {
        const worker = f.workers[r.worker];
        assert.equal(r.x, worker.x);
        assert.equal(r.y, worker.y);
      }
  }
});
test('fresh evidence repair updates quote boundaries and digest without granting a new source', () => {
  const old = m.freshSearchState(0),
    short = m.freshSearchState(1),
    fixed = m.freshSearchState(2);
  assert.equal(old.valid, false);
  assert.equal(short.valid, false);
  assert.equal(short.quotes[1].exact, true);
  assert.equal(fixed.valid, true);
  assert.equal(fixed.quotes[1].end, 124);
  assert.notEqual(old.quotes[1].digest, fixed.quotes[1].digest);
  assert.equal(short.quotes[1].digest, fixed.quotes[1].digest);
  assert.deepEqual(old.current, fixed.current);
});
test('the actual string router retains both source branches and freshness independently', () => {
  assert.deepEqual(m.searchRoutePlan('quota remaining and current exception'), {
    routes: ['authorized live API', 'authorized hybrid search'],
    current: true,
  });
  assert.deepEqual(m.searchRoutePlan('job status'), {
    routes: ['authorized live API'],
    current: false,
  });
  assert.deepEqual(m.searchRoutePlan('reference spelling'), {
    routes: ['authorized hybrid search'],
    current: false,
  });
  assert.equal(m.searchCosine([0.5, 1], [0.5, 1]), 1);
  assert.equal(m.searchCosine([0.5, 1], [1, 0.5]), 0.8);
});
