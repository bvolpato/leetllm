import test from 'node:test';
import assert from 'node:assert/strict';
import { freshResumeSnapshot, hybridCacheBytes } from '../animations/deep-dive-transformers.mjs';

test('a stopped selection and its later forward have separate sequence/cache outcomes', () => {
  const cue = (phase, progress = phase === 'after' ? 1 : 0) => ({ phase, progress });
  const base = { 'hf-fresh-sequence': cue('before'), 'hf-fresh-cache': cue('before') };
  const waiting = freshResumeSnapshot({ beat: 1, beatP: 1, cues: base });
  assert.equal(waiting.sequence, null);
  assert.equal(waiting.cache, null);
  const returned = freshResumeSnapshot({
    beat: 1,
    beatP: 1,
    cues: { ...base, 'hf-fresh-sequence': cue('after') },
  });
  assert.equal(returned.sequence, 11);
  assert.equal(returned.cache, null);
  const stopped = freshResumeSnapshot({
    beat: 1,
    beatP: 1,
    cues: { ...base, 'hf-fresh-sequence': cue('after'), 'hf-fresh-cache': cue('after') },
  });
  assert.equal(stopped.sequence, 11);
  assert.equal(stopped.cache, 10);
  assert.equal(stopped.pending, 'N4');
  for (const progress of [0.001, 0.5, 0.999]) {
    const during = freshResumeSnapshot({
      beat: 2,
      beatP: 1,
      cues: { 'hf-fresh-forward': cue('during', progress) },
    });
    assert.equal(during.sequence, 11);
    assert.equal(during.cache, 10);
  }
  const resumed = freshResumeSnapshot({
    beat: 2,
    beatP: 1,
    cues: { 'hf-fresh-forward': cue('after') },
  });
  assert.equal(resumed.sequence, 11);
  assert.equal(resumed.cache, 11);
  assert.equal(resumed.pending, null);
});

test('hybrid payload charges each layer retention and active sequence independently', () => {
  assert.equal(hybridCacheBytes([100, 100, 20, 20]), 15360);
  assert.equal(hybridCacheBytes([100, 100, 20, 20], 2, 8, 2, 3), 46080);
  assert.equal(hybridCacheBytes([100, 100, 0, 0]), 12800);
});
