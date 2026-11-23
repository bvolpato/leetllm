import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  introContextState,
  scoringConstruction,
  reorderMotion,
  draw,
  scores,
  policyScore,
  marginSelection,
  packedEvidence,
  teachingScoreKey,
} from '../animations/reranking.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();

test('the two-slot context admits the hours identity only when its transfer arrives', () => {
  assert.deepEqual(introContextState(0, 1).packed, [0, 1]);
  assert.deepEqual(introContextState(1, 0.6).packed, [1]);
  assert.deepEqual(introContextState(1, 0.7).packed, [2, 1]);
  assert.deepEqual(introContextState(2, 0).packed, [2, 1]);
});

test('scoring accumulates visible products before applying the common bias', () => {
  assert.deepEqual(
    scoringConstruction(0, 0.1).rows.map((row) => row.value),
    [0, 0, 0],
  );
  assert.deepEqual(
    scoringConstruction(0, 0.45).rows.map((row) => row.value),
    [0.2, 0.5, 2],
  );
  const partial = scoringConstruction(0, 0.56);
  assert.equal(partial.complete, false);
  partial.rows.forEach((row) =>
    assert.ok(Math.abs(row.value - (row.products.reduce((a, b) => a + b, 0) - 0.1)) < 1e-12),
  );
  const complete = scoringConstruction(1, 0.7);
  complete.rows.forEach((row, i) => {
    assert.ok(Math.abs(row.value - scores[i]) < 1e-12);
    assert.equal(row.sigmoid, 1 / (1 + Math.exp(-row.value)));
  });
  assert.deepEqual(
    complete.rows.map((row) => row.rank),
    [3, 2, 1],
  );
});

test('the useful passage reaches first place before the measured spoken arrival and stays there', () => {
  const spokenArrival = 11.03 / 16.366;
  assert.equal(reorderMotion(0, spokenArrival).progress, 1);
  assert.deepEqual(reorderMotion(0, spokenArrival), reorderMotion(1, 0));
});

test('the painted initial scorer shows three zero partial sums instead of future final logits', () => {
  const ctx = createCanvas(1920, 1080).getContext('2d'),
    frame = drawFrame(
      ctx,
      {},
      { id: 'scalar-score', title: 'Project the pair into an ordering score' },
      { t: 1, duration: 55, opacity: 1, beat: 0, beatP: 0.1 },
      draw,
    );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  assert.equal(frame.labels.filter((label) => label.text === '0.00').length, 3);
  assert(!frame.labels.some((label) => label.text === '2.30'));
});

test('the scored prefix boundary is visible between the source lines during the spoken truncation', () => {
  const ctx = createCanvas(1920, 1080).getContext('2d'),
    frame = drawFrame(
      ctx,
      {},
      { id: 'scored-span', title: 'Keep the decisive clause inside the scored text' },
      { t: 1, duration: 52, opacity: 1, beat: 0, beatP: 0.6 },
      draw,
    );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  const services = frame.labels.find((label) => label.text.startsWith('Services:'));
  const sunday = frame.labels.find((label) => label.text === 'Sunday: the library is closed.');
  assert(services && sunday);
  assert(
    frame.connectors.some(
      (line) =>
        line.from.y === line.to.y &&
        line.from.y > services.y + services.height &&
        line.from.y < sunday.y,
    ),
    'the cutoff must separate the scored prefix from the governing source clause',
  );
});

test('a more complete shortlist still fails the independent packed-token boundary', () => {
  assert.deepEqual(
    packedEvidence(4, 40).included.map((r) => r.id),
    ['member'],
  );
  const admitted = packedEvidence(5, 40);
  assert.deepEqual(
    admitted.included.map((r) => r.id),
    ['member', 'locker'],
  );
  assert.equal(admitted.total, 44);
  assert.equal(admitted.complete, false);
  assert.equal(packedEvidence(5, 43).complete, false);
  assert.equal(packedEvidence(5, 44).complete, true);
  assert.equal(policyScore(14, true), 7);
  assert.equal(policyScore(15, true), 5);
  assert.equal(policyScore(10, false), 5);
});

test('an additive score margin preserves shifts but changes under an unadjusted rescaling', () => {
  assert.deepEqual(marginSelection([4, 3.5, 1], 0.75), [0, 1]);
  assert.deepEqual(marginSelection([14, 13.5, 11], 0.75), [0, 1]);
  assert.deepEqual(marginSelection([28, 27, 22], 0.75), [0]);
});

test('cache identity distinguishes ordered full input from an unchanged passage and tenant', () => {
  const baseline = teachingScoreKey();
  assert.equal(
    baseline,
    teachingScoreKey({ tenant: 'alpha', textRevision: 'A', list: ['P', 'Q', 'R'] }),
  );
  for (const changed of [{ textRevision: 'B' }, { tenant: 'beta' }, { list: ['R', 'Q', 'P'] }])
    assert.notEqual(teachingScoreKey(changed), baseline);
});
