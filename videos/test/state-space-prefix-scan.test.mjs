import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import * as stateSpace from '../animations/state-space-models.mjs';

registerLessonFonts();
const before = { phase: 'before', progress: 0, strength: 0 };
const after = { phase: 'after', progress: 1, strength: 0 };
const paint = (beat, overrides = {}) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'scan', title: 'Compose updates without changing their order' },
    {
      t: 32.6,
      duration: 61.4,
      opacity: 1,
      beat,
      beatP: 0.88,
      cues: {
        'compose-two': after,
        'ordered-tree': after,
        'all-prefix-states': before,
        ...overrides,
      },
    },
    stateSpace.draw,
  );

test('every recovered prefix is drawn below its own persistent input column', () => {
  const frame = paint(1, { 'all-prefix-states': after });
  const columns = [345, 755, 1165, 1575];
  const values = [0.6, 0.74, 1.466, 1.7194];
  for (let i = 0; i < values.length; i++) {
    const label = frame.labels.find(
      (label) => label.text === `h${i + 1} = ${values[i].toFixed(4)}`,
    );
    assert(label, `prefix ${i + 1} must be a visible state, not only part of a footer list`);
    assert(label.x <= columns[i] && label.x + label.width >= columns[i]);
    assert(label.y > 850);
    assert(label.alpha > 0.5);
  }
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('parallel levels preserve affine order and recover every prefix for nonzero initial states', () => {
  for (const updates of [
    [],
    [[2, 1]],
    [
      [2, 1],
      [3, -4],
    ],
    [
      [2, 1],
      [3, -4],
      [0.5, 2],
    ],
    [
      [0.9, 0.6],
      [0.9, 0.2],
      [0.9, 0.8],
      [0.9, 0.4],
      [0.7, -0.3],
      [1.2, 0.5],
      [0.1, 3],
    ],
  ]) {
    const original = structuredClone(updates);
    const levels = stateSpace.affineScanLevels(updates);
    assert.equal(levels.length, updates.length ? Math.ceil(Math.log2(updates.length)) + 1 : 0);
    for (const [level, row] of levels.entries()) {
      row.forEach((pair, index) => {
        const first = Math.max(0, index - 2 ** level + 1);
        for (const initial of [-2, 0, 3]) {
          const expected = updates
            .slice(first, index + 1)
            .reduce((state, [carry, write]) => carry * state + write, initial);
          assert(
            Math.abs(pair[0] * initial + pair[1] - expected) < 1e-10,
            `level ${level}, column ${index} must compose its ordered input span`,
          );
        }
      });
    }
    assert.deepEqual(updates, original);
  }
});

test('prefix outputs wait for their narrated recovery, then remain during the implementation limits', () => {
  for (const progress of [0, 0.1, 0.25, 0.5, 0.75]) {
    const frame = paint(1, { 'all-prefix-states': { phase: 'during', progress, strength: 0 } });
    assert(!frame.labels.some((label) => /^h\d = /.test(label.text)));
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
  for (const progress of [0.85, 1]) {
    const frame = paint(1, {
      'all-prefix-states': { phase: progress === 1 ? 'after' : 'during', progress, strength: 0 },
    });
    assert.equal(frame.labels.filter((label) => /^h\d = /.test(label.text)).length, 4);
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
  const later = paint(2);
  assert.equal(later.labels.filter((label) => /^h\d = /.test(label.text)).length, 4);
  assert.deepEqual([...later.issues, ...layoutIssues(later)], []);
});
