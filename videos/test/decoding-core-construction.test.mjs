import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  decodeSoftmax,
  decodeSupport,
  decodeRepetition,
  decodingFreshModel,
  STATUS_ROW,
} from '../animations/decoding.mjs';
registerLessonFonts();
const near = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
const cue = (p) => ({
  phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
  progress: p,
  strength: 0,
});
function paint(id, beat, phases = {}) {
  const circles = [],
    cues = Object.fromEntries(Object.entries(phases).map(([id, p]) => ['dec-' + id, cue(p)]));
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Selection worksheet' },
    { beat, beatP: 0.99, t: 10, duration: 60, opacity: 1, cues },
    (ctx, s, state, api) =>
      draw(ctx, s, state, {
        ...api,
        circle: (...args) => {
          circles.push(args.slice(1, 4));
          return api.circle(...args);
        },
      }),
  );
  return { labels: audit.labels.map((l) => l.text), circles };
}
test('eligible softmax remains stable and never restores a hard-masked token', () => {
  near(decodeSoftmax([1000, 999])[0], 1 / (1 + Math.exp(-1)));
  for (const T of [0, 0.01, 1, 100]) {
    const p = decodeSoftmax([-Infinity, 1, 0], T);
    assert.equal(p[0], 0);
    near(
      p.reduce((a, v) => a + v, 0),
      1,
    );
    assert.throws(() => decodeSoftmax([-Infinity, -Infinity], T), /empty/);
  }
});
test('individual-event temperature and ordered supports conserve their actual laws', () => {
  const hot = decodeSoftmax(STATUS_ROW.map(Math.log), 1.5),
    wrong = decodeSoftmax([0.45, 0.3, 0.15, 0.02, 0.08].map(Math.log), 1.5);
  near(
    hot.slice(4).reduce((a, v) => a + v, 0),
    0.210659436625771,
  );
  assert(Math.abs(wrong.at(-1) - hot.slice(4).reduce((a, v) => a + v, 0)) > 0.09);
  const row = [0.45, 0.3, 0.15, 0.1];
  assert.deepEqual(decodeSupport(decodeSupport(row, 'k', 3).values, 'p', 0.8).ids, [0, 1]);
  assert.deepEqual(decodeSupport(decodeSupport(row, 'p', 0.8).values, 'k', 3).ids, [0, 1, 2]);
});
test('sign-sensitive penalties keep token identities and the fresh mask uses the restored temperature', () => {
  assert.deepEqual(decodeRepetition([2.4, -0.5, 0.7], [0, 0, 1], 1.2), [2, -0.6, 0.7]);
  const f = decodingFreshModel();
  assert.deepEqual(f.maskedP.ids, [1, 2, 3]);
  near(f.masked[1], 0.5);
  near(f.cold[0], 0.7076167076167076);
  const coldMasked = decodeSupport([0, ...f.cold.slice(1)], 'p', 0.8);
  assert.deepEqual(coldMasked.ids, [1, 2]);
});
test('the fresh support explanation waits for its completed result clause', () => {
  const pending = paint('fresh-policy', 1, {
    'fresh-k': 0.99,
    'fresh-p': 0.99,
    'fresh-minp': 0.99,
  });
  assert(!pending.labels.some((s) => /first three 0\.88/.test(s)));
  const complete = paint('fresh-policy', 1, { 'fresh-k': 1, 'fresh-p': 1, 'fresh-minp': 1 });
  assert(complete.labels.some((s) => /first three 0\.88/.test(s)));
});
test('grammar-first holds its probability-one result until the complete clause', () => {
  for (const p of [0, 0.5, 0.999])
    assert(!paint('grammar-first', 1, { 'grammar-only': p }).labels.includes('1.000'));
  assert(paint('grammar-first', 1, { 'grammar-only': 1 }).labels.includes('1.000'));
});
test('the completed grammar intersection replaces the top-p intermediate with empty support', () => {
  for (const p of [0, 0.5, 0.999]) {
    const labels = paint('grammar-first', 0, {
      'grammar-truncation': 1,
      'grammar-empty': p,
    }).labels;
    assert(labels.includes('0.667') && labels.includes('0.333'));
    assert(!labels.includes('No eligible token: reject'));
  }
  const labels = paint('grammar-first', 0, { 'grammar-truncation': 1, 'grammar-empty': 1 }).labels;
  assert.equal(labels.filter((s) => s === 'excluded').length, 3);
  assert(!labels.includes('0.667') && !labels.includes('0.333'));
  assert(labels.includes('top-p 0.8 → grammar intersection · empty support'));
  assert(labels.includes('No eligible token: reject'));
});
test('a pending normalized score has no prematurely positioned result point', () => {
  for (const p of [0, 0.5, 0.999])
    assert.equal(paint('normalized-stop', 1, { 'normalized-improve': p }).circles.length, 1);
  assert.equal(paint('normalized-stop', 1, { 'normalized-improve': 1 }).circles.length, 2);
});
test('the shape-introduction beat contains no truncation answers', () => {
  assert(
    !paint('adaptive-support', 0, { 'adaptive-support-1': 1 }).labels.some((s) =>
      /IDs · retained mass/.test(s),
    ),
  );
});
test('completed intermediate clauses do not authorize the next distinct result', () => {
  const cases = [
    ['temperature-tail', 1, { 'tail-hot': 1, 'tail-total': 0.999 }, 'Tail display total ='],
    ['minp-relative', 2, { 'minp-uniform': 1, 'minp-top-p-six': 0.999 }, 'top-p 0.75: 6 IDs'],
    ['actual-sampler', 1, { 'sampler-probabilities': 1, 'sampler-support': 0.999 }, 'retain'],
    [
      'tie-contract',
      1,
      { 'threshold-ties': 1, 'tie-normalized': 0.999 },
      'Normalized support: [1/3',
    ],
    [
      'evaluation-protocol',
      1,
      { 'evaluation-mean': 1, 'evaluation-any': 0.999 },
      'any success = 1',
    ],
  ];
  for (const [id, beat, cues, result] of cases) {
    assert(
      !paint(id, beat, cues).labels.some((s) => s.startsWith(result)),
      id + ' showed its next result before completion',
    );
    const completed = Object.fromEntries(Object.keys(cues).map((k) => [k, 1]));
    assert(
      paint(id, beat, completed).labels.some((s) => s.startsWith(result)),
      id + ' never completed its result',
    );
  }
});
