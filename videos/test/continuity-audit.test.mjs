import test from 'node:test';
import assert from 'node:assert/strict';
import { continuityReplayCandidate } from '../audit-continuity.mjs';

const label = (text, x = 100, alpha = 1) => ({
  text,
  x,
  y: 300,
  width: 100,
  height: 30,
  alpha,
  fillAlpha: 1,
});
const frame = (labels) => ({ labels, shapes: [] });

test('completed objects clearing and rebuilding across the next paragraph become review candidates', () => {
  const completed = frame(['A', 'B', 'C', 'D'].map((text) => label(text)));
  const result = continuityReplayCandidate(completed, [frame([]), frame([])], completed);
  assert.equal(result.candidate, true);
  assert.equal(result.missingLabels, 4);
});

test('moving retained identities and admitting another object preserves continuity', () => {
  const before = frame(['A', 'B', 'C'].map((text) => label(text)));
  const moving = frame(['A', 'B', 'C', 'D'].map((text, index) => label(text, 100 + index * 80)));
  assert.equal(continuityReplayCandidate(before, [moving, moving], moving).candidate, false);
});

test('a brief boundary fade that recovers by the second early probe is ignored', () => {
  const completed = frame(['A', 'B', 'C'].map((text) => label(text)));
  const faded = frame(['A', 'B', 'C'].map((text) => label(text, 100, 0.1)));
  assert.equal(
    continuityReplayCandidate(completed, [faded, completed], completed).candidate,
    false,
  );
});

test('narration focus keeps dimmed context present across paragraph boundaries', () => {
  const completed = frame(['A', 'B', 'C', 'D'].map((text) => label(text)));
  const context = frame(['A', 'B', 'C', 'D'].map((text) => label(text, 100, 0.26)));
  assert.equal(
    continuityReplayCandidate(completed, [context, context], completed).candidate,
    false,
  );
});

test('a sustained near-invisible replay still requires review', () => {
  const completed = frame(['A', 'B', 'C', 'D'].map((text) => label(text)));
  const cleared = frame(['A', 'B', 'C', 'D'].map((text) => label(text, 100, 0.02)));
  assert.equal(continuityReplayCandidate(completed, [cleared, cleared], completed).candidate, true);
});

test('repeated labels are counted separately while small travelling particles are ignored', () => {
  const completed = frame([label('receipt', 100), label('receipt', 300), label('receipt', 500)]);
  const early = frame([label('receipt', 100)]);
  completed.shapes = [
    { kind: 'circle', x: 200, y: 400, width: 16, height: 16, alpha: 1, fillAlpha: 1 },
  ];
  const result = continuityReplayCandidate(completed, [early, early], completed);
  assert.equal(result.missingLabels, 2);
  assert.equal(result.missingObjects, 2);
  assert.equal(result.candidate, false);
});
