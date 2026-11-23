import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTokenHistoryTransition } from 'vizmatic';
import {
  fittedPrediction,
  FITTED_NGRAM,
  CACHE_PARITY_FIXTURE,
  generationWork,
  lifecycleSnapshot,
  extendedLanguageState,
  rawKvBytes,
  localGradientCredit,
} from '../animations/language-modeling.mjs';
import * as language from '../animations/language-modeling.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';

const near = (a, b, tolerance = 1e-10) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const completed = (id) => ({ [id]: { progress: 1, phase: 'after' } });
test('the reproduced fit uses all positions and vocabulary alternatives', () => {
  assert.equal(
    FITTED_NGRAM.embeddings.flat().length +
      FITTED_NGRAM.weights.flat().length +
      FITTED_NGRAM.bias.length,
    152,
  );
  const one = fittedPrediction(),
    two = fittedPrediction(['test', 'returns']);
  near(one.logits[7], 7.904140496851712);
  near(
    one.probabilities.reduce((a, b) => a + b, 0),
    1,
  );
  assert.equal(
    FITTED_NGRAM.vocab[one.probabilities.indexOf(Math.max(...one.probabilities))],
    'value',
  );
  assert.equal(
    FITTED_NGRAM.vocab[two.probabilities.indexOf(Math.max(...two.probabilities))],
    'result',
  );
  assert(one.valueTerms.some((x) => x < 0));
  near(
    one.valueTerms.reduce((a, b) => a + b, one.valueBias),
    one.logits[7],
  );
});
test('recorded CPU cached outputs preserve every full-pass coordinate', () => {
  const f = CACHE_PARITY_FIXTURE;
  assert.deepEqual(f.lengths, [3, 4, 5]);
  f.cached.forEach((row, i) => row.forEach((value, j) => near(value, f.full[i][j], 1e-6)));
  assert(f.allowedOutput.some((v, i) => Math.abs(v - f.wrongUpperLeftOutput[i]) > 1e-3));
});
test('signed outer-product credit agrees with an independent finite difference', () => {
  const m = localGradientCredit(),
    bias = m.probabilities.map(
      (p, j) => Math.log(p) - m.input.reduce((n, x, i) => n + x * m.weights[i][j], 0),
    );
  const loss = (w) => {
    const z = bias.map((v, j) => m.input.reduce((n, x, i) => n + x * w[i][j], v)),
      e = z.map(Math.exp);
    return -Math.log(e[2] / e.reduce((a, b) => a + b, 0));
  };
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 3; j++) {
      const plus = structuredClone(m.weights),
        minus = structuredClone(m.weights),
        h = 1e-5;
      plus[i][j] += h;
      minus[i][j] -= h;
      near((loss(plus) - loss(minus)) / (2 * h), m.weightGradients[i][j], 1e-8);
    }
  near(m.inputGradient[0], -0.39);
  near(m.inputGradient[1], 0.36);
});
test('selected, processed and replayed occurrences keep their different prefixes', () => {
  const selected = lifecycleSnapshot({ processed: 2, accepted: 1 });
  assert.equal(selected.kv.length, 2);
  assert.equal(selected.pendingAccepted[0].token, 'slept');
  const stopped = lifecycleSnapshot({ processed: 3, accepted: 2 });
  assert.equal(stopped.kv.length, 3);
  assert.deepEqual(
    stopped.emitted.map((v) => v.token),
    ['slept'],
  );
  assert.deepEqual(
    stopped.pendingAccepted.map((v) => v.token),
    ['end'],
  );
  for (const p of [0, 0.01, 0.333333, 0.5, 0.999999, 1]) {
    const replay = lifecycleSnapshot({
      processed: 3,
      accepted: 2,
      phase: 'replay',
      replayProgress: p,
    });
    assertTokenHistoryTransition(stopped, replay);
    assert.deepEqual(replay.accepted, stopped.accepted);
    assert.deepEqual(replay.emitted, stopped.emitted);
    assert.deepEqual(replay.kv, replay.processed.slice(0, Math.floor(3 * p)));
  }
});
test('dense work includes prefill cells but omits an unconsumed final output', () => {
  assert.deepEqual(generationWork(3, 3), {
    lengths: [3, 4, 5],
    uncachedPositions: 12,
    uncachedCells: 50,
    cachedPositions: 5,
    cachedCells: 18,
  });
  assert.deepEqual(generationWork(2, 3), {
    lengths: [2, 3, 4],
    uncachedPositions: 9,
    uncachedCells: 29,
    cachedPositions: 4,
    cachedCells: 11,
  });
  assert.equal(generationWork(9, 1).cachedPositions, 9);
});
test('fresh prediction withholds its final counts and score until complete result anchors', () => {
  const before = extendedLanguageState('fresh-budgeted-rollout', { beat: 0, cues: {} });
  assert.equal(before.cacheResult, false);
  assert.equal(before.lossResult, false);
  const partial = extendedLanguageState('fresh-budgeted-rollout', {
    beat: 1,
    cues: { 'fresh-budgeted-rollout-step-1-1': { progress: 0.999, phase: 'active' } },
  });
  assert.equal(partial.cacheResult, false);
  assert.equal(partial.history.processed.length, 3);
  const cached = extendedLanguageState('fresh-budgeted-rollout', {
    beat: 1,
    cues: completed('fresh-budgeted-rollout-step-1-1'),
  });
  assert.equal(cached.history.processed.length, 4);
  assert.equal(cached.outputResult, false);
  const final = extendedLanguageState('fresh-budgeted-rollout', { beat: 2, cues: {} });
  assert.equal(final.history.kv.length, 4);
  assert.equal(final.history.accepted.length, 2);
  near(final.probability, 1 / 8);
  near(final.perplexity, Math.sqrt(8));
});
test('head, length and request dimensions produce the stated raw payloads', () => {
  const base = { layers: 32, heads: 8, width: 128, positions: 2048 * 4, bytes: 2 };
  assert.equal(rawKvBytes(base), 1024 ** 3);
  assert.equal(rawKvBytes({ ...base, positions: 32768 * 4 }), 16 * 1024 ** 3);
  assert.equal(rawKvBytes({ ...base, heads: 4, positions: 32768 * 4 }), 8 * 1024 ** 3);
});

function repairedFrame(id, beat, cues) {
  registerLessonFonts();
  const canvas = createCanvas(1920, 1080),
    state = {
      beat,
      beatP: 0.5,
      t: 1,
      duration: 20,
      opacity: 1,
      cues,
      cueTiming: 'explicit-test-cues',
    };
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { id, title: 'Language modeling' },
    state,
    language.draw,
  );
  assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
  return audit.labels.map((label) => label.text);
}

test('masked conditioning removes the original target while retaining it separately', () => {
  const causal = repairedFrame('objective-boundary', 0, {});
  assert(causal.includes('The'));
  assert(!causal.includes('cat'));
  assert(!causal.includes('sat'));
  assert(causal.includes('target: cat'));
  for (const p of [0.001, 0.5, 1]) {
    const labels = repairedFrame('objective-boundary', 0, {
      'objective-boundary-step-0-2': { progress: p },
    });
    assert(labels.includes('[MASK]'));
    assert(labels.includes('sat'));
    assert(!labels.includes('cat'));
    assert(labels.includes('target: cat'));
  }
});

test('every head-transition payload comes from the same displayed integer head count', () => {
  for (let i = 0; i <= 1000; i++) {
    const s = language.architectureMemoryState(i / 1000);
    assert(Number.isInteger(s.heads));
    assert.equal(s.gib, 2 * s.heads);
    assert.equal(
      s.bytes,
      rawKvBytes({ layers: 32, heads: s.heads, width: 128, positions: 4 * 32768, bytes: 2 }),
    );
  }
  for (const p of [0, 0.125, 0.495, 0.5, 0.875, 1]) {
    const labels = repairedFrame('architecture-memory', 2, {
        'architecture-memory-b3': { progress: p },
      }),
      s = language.architectureMemoryState(p);
    assert(labels.includes(s.heads + ' stored K/V heads'));
    const payload = labels.find((label) => /^\d+(?:\.\d+)? GiB raw KV$/.test(label));
    assert.equal(Number.parseFloat(payload), 2 * s.heads);
  }
});
