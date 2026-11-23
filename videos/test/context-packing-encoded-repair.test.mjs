import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import {
  draw,
  longContextModel,
  prefixReuseState,
  releaseSliceBars,
} from '../animations/context-packing.mjs';
import { drawFrame } from '../lib/scene.mjs';

const paint = (id, state) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Context construction' },
    { opacity: 1, duration: 60, t: 20, ...state },
    draw,
  );

test('the repaired cached key survives the next explanation instead of resetting to the stale basis', () => {
  for (const beatP of [0, 0.05, 0.5, 0.99, 1]) {
    const state = longContextModel('basis-consistency', { beat: 2, beatP });
    assert.equal(state.key, 0.5);
    assert.equal(state.query, 1);
    assert.equal(state.score, Math.cos(0.5));
  }
  const moving = paint('basis-consistency', {
    beat: 1,
    beatP: 0.5,
    cues: { 'basis-consistency-1': { phase: 'active', progress: 0.5 } },
  });
  assert(moving.labels.some((l) => l.text === 'repairing the cached basis'));
  assert(!moving.labels.some((l) => l.text === 'consistent intended basis'));
});

test('evaluation visibility changes without inventing intermediate measured scores or means', () => {
  for (const p of [0, 0.05, 0.67, 0.95, 1]) {
    const s = releaseSliceBars(p);
    assert.deepEqual(s.candidate, [100, 70, 100]);
    assert.deepEqual(s.baseline, [90, 90, 90]);
    const frame = paint('release-slices', {
      beat: 2,
      beatP: p,
      cues: { 'release-slices-2': { phase: 'during', progress: p } },
    });
    if (p > 0) {
      assert(frame.labels.some((l) => l.text === '90 / 100%'));
      assert(frame.labels.some((l) => l.text === '90 / 70%'));
    }
    assert.equal(s.candidate.reduce((a, v) => a + v, 0) / 3, s.candidateMean);
    assert.equal(s.candidateMean, 90);
    assert.equal(s.candidateOpacity, p);
  }
});

test('the fresh overflow answer and over-limit exchange wait for completion of the actual result clause', () => {
  for (const phase of ['before', 'active']) {
    const frame = paint('your-turn', {
      beat: 1,
      beatP: 0.99,
      cues: { 'your-turn-1': { phase, progress: phase === 'before' ? 0 : 0.99, end: 25 } },
    });
    assert(
      !frame.labels.some(
        (l) =>
          l.text === '43 would exceed 40' || l.text === 'Reject the overflow; inspect the note',
      ),
    );
    assert(!frame.labels.some((l) => l.text === '9'));
  }
  const frame = paint('your-turn', {
    beat: 1,
    beatP: 0.01,
    t: 26,
    cues: { 'your-turn-1': { phase: 'after', progress: 1, end: 25 } },
  });
  assert(frame.labels.some((l) => l.text === '43 would exceed 40'));
  assert(frame.labels.some((l) => l.text === '9'));
});

test('prefix reuse removes only repeated prefill while preserving all logical decode histories', () => {
  const initial = prefixReuseState(0),
    half = prefixReuseState(0.5),
    final = prefixReuseState(1);
  assert.equal(initial.newlyPrefillingTokens, 146600);
  assert.equal(half.newlyPrefillingTokens, 98600);
  assert.equal(final.newlyPrefillingTokens, 50600);
  const frame = paint('cache-execution', {
    beat: 1,
    beatP: 1,
    cues: {
      'cache-execution-1': { phase: 'after', progress: 1 },
      'cp-prefix-before-count': { phase: 'after', progress: 1 },
      'cp-prefix-reused-count': { phase: 'after', progress: 1 },
    },
  });
  assert.equal(
    frame.shapes.filter(
      (s) => s.kind === 'rect' && s.width > 900 && s.height >= 60 && s.height <= 65,
    ).length,
    1,
  );
  assert.deepEqual(final.prefixWork, [48000, 0, 0]);
  assert.equal(final.avoidedTokens, 96000);
  for (const state of [initial, half, final]) {
    assert.equal(state.logicalRequests, 3);
    assert.deepEqual(state.suffixes, [800, 1200, 600]);
    assert.deepEqual(state.decodePrefixReads, [48000, 48000, 48000]);
    assert.equal(state.retainedPrefixTokens, 48000);
  }
});
