import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import {
  validEpsilon,
  tolerance,
  warpSectors,
  cacheLineReads,
  scoreFastP,
  freshPromotion,
  sampleModel,
  draw,
} from '../animations/ai-generated-kernel-engineering.mjs';
registerLessonFonts();
const cue = (p) => ({
    progress: p,
    strength: 0,
    phase: p === 1 ? 'after' : p ? 'during' : 'before',
  }),
  close = (x, y) => assert(Math.abs(x - y) < 1e-12);
test('epsilon must remain positive and finite in the actual float32 contract', () => {
  assert(validEpsilon(1e-5));
  for (const x of [0, -1, true, false, 1e-50, 1e40, NaN, Infinity])
    assert.equal(validEpsilon(x), false, String(x));
});
test('reference-relative tolerance and tiny expected values keep their declared policy', () => {
  assert(tolerance(1e-8, 0, 1e-6, 0).pass);
  assert(!tolerance(1e-8, 0, 1e-10, 0).pass);
  assert(tolerance(10, 11, 0, 0.1).pass);
  assert(!tolerance(11, 10, 0, 0.09).pass);
});
test('sector counting includes all four bytes of each active lane load', () => {
  assert.equal(warpSectors(1).sectors.length, 4);
  assert.equal(warpSectors(8).sectors.length, 32);
  assert.equal(warpSectors(1, 1).sectors.length, 5);
  assert.equal(warpSectors(8, 31).sectors.length, 33);
  assert.deepEqual(warpSectors(8).addresses.slice(0, 4), [0, 32, 64, 96]);
});
test('cache worksheet separates requested bytes from the one physical fill', () => {
  assert.deepEqual(cacheLineReads(4), { reads: 4, logicalBytes: 256, fillBytes: 64, hits: 3 });
  assert.deepEqual(cacheLineReads(0), { reads: 0, logicalBytes: 0, fillBytes: 0, hits: 0 });
});
test('an incorrect fast kernel contributes zero and the threshold is strict', () => {
  assert.deepEqual(
    scoreFastP(
      [
        { correct: false, speedup: 20 },
        { correct: true, speedup: 1 },
        { correct: true, speedup: 1.5 },
      ],
      1,
    ),
    { eligible: 1, total: 3, fraction: 1 / 3 },
  );
});
test('negative coupled scale reverses sign while zero exits the epsilon domain', () => {
  const base = {
    beat: 2,
    beatP: 1,
    cues: { 'kg-epsilon-negative': cue(1), 'kg-epsilon-zero': cue(0) },
  };
  const neg = sampleModel('epsilon', base);
  assert.equal(neg.a, -4);
  close(neg.value, -neg.reference);
  const zero = sampleModel('epsilon', {
    ...base,
    cues: { ...base.cues, 'kg-epsilon-zero': cue(1) },
  });
  assert.equal(zero.eps, 0);
  assert.equal(zero.value, null);
  assert.equal(zero.invalid, true);
});
test('new request uses a fresh correct fallback,with output hidden until its own completed clause', () => {
  const r = freshPromotion();
  assert.equal(r.route, 'REFERENCE');
  assert.equal(r.mean, 84.5);
  close(r.outputs[0], 5 / Math.sqrt(84.50001));
  close(r.outputs[1], 24 / Math.sqrt(84.50001));
  const paint = (beat, progress) => {
    const state = {
      beat,
      beatP: 0.9,
      t: 40,
      duration: 90,
      opacity: 1,
      cues: {
        ['kg-fresh-promotion-voice-' + beat]: cue(0.8),
        'kg-fresh-promotion-route': cue(progress),
        'kg-fresh-promotion-mean': cue(progress),
        'kg-fresh-promotion-outputs': cue(progress),
      },
    };
    return drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'fresh-promotion', title: 'New request' },
      state,
      draw,
    );
  };
  const before = paint(0, 0),
    during = paint(1, 0.99),
    after = paint(1, 1);
  for (const a of [before, during, after]) assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  for (const a of [before, during])
    assert(!a.labels.some((l) => l.text === '0.544' || l.text === '2.611'));
  assert(after.labels.some((l) => l.text === '0.544'));
  assert(after.labels.some((l) => l.text === '2.611'));
});

test('completed mean and scale results follow their own cues instead of a fixed scene clock', () => {
  const cues = {
      'kg-intro-square': cue(1),
      'kg-intro-mean': cue(0.999),
      'kg-intro-epsilon': cue(0),
      'kg-intro-scale': cue(0),
      'kg-intro-normalize': cue(0),
      'kg-intro-weight': cue(0),
    },
    state = { beat: 1, beatP: 0.95, cues };
  assert.equal(sampleModel('intro', state).stage, 1);
  const completed = sampleModel('intro', { ...state, cues: { ...cues, 'kg-intro-mean': cue(1) } });
  assert.equal(completed.stage, 2);
  assert.equal(completed.mean, 12.5);
  const during = sampleModel('intro', {
    ...state,
    cues: {
      ...cues,
      'kg-intro-mean': cue(1),
      'kg-intro-epsilon': cue(1),
      'kg-intro-scale': cue(1),
      'kg-intro-normalize': cue(0.5),
    },
  });
  assert.equal(during.stage, 5);
  assert.equal(during.normalizedProgress, 0.5);
  assert.equal(during.outputCount, 0);
});

test('epsilon worksheet calculations use the same rounded scale and epsilon shown to the viewer', () => {
  for (const beat of [0, 1, 2])
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.95]) {
      const state = {
          beat,
          beatP: p,
          cues:
            beat === 1
              ? { 'epsilon-beat-2-focus-1': cue(p) }
              : beat === 2
                ? { 'kg-epsilon-negative': cue(p), 'kg-epsilon-zero': cue(0) }
                : undefined,
        },
        r = sampleModel('epsilon', state);
      assert.equal(r.a, Number(r.a.toFixed(1)));
      assert.equal(r.eps, Number(r.eps.toExponential(6)));
      if (!r.invalid) close(r.value, (0.001 * r.a) / Math.sqrt((0.001 * r.a) ** 2 + r.eps));
    }
});

test('one invalid reduction lane changes the numerator before the same lane is repaired', () => {
  const wrong = sampleModel('tail', { beat: 0, beatP: 0.5, cues: { 'kg-tail-wrong': cue(0.5) } });
  assert.deepEqual(wrong.terms.slice(5), [1, 0, 0]);
  assert.equal(wrong.numerator, 56);
  assert.equal(wrong.mean, 11.2);
  const repair = sampleModel('tail', {
    beat: 1,
    beatP: 0.5,
    cues: { 'kg-tail-wrong': cue(1), 'kg-tail-repair': cue(0.5) },
  });
  assert.deepEqual(repair.terms.slice(5), [0, 1, 1]);
  assert.equal(repair.numerator, 57);
  assert.equal(repair.mean, 11.4);
});
