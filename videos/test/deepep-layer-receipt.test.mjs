import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import * as deepEP from '../animations/deep-dive-deepep.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { aggregateOcclusion } from '../lib/aggregate-occlusion.mjs';

test('the final resources paragraph paints the promised layer receipt and restored result', () => {
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { id: 'resources', title: 'Resource planning starts from the route distribution' },
    { beat: 2, beatP: 0.5, t: 5, duration: 10, opacity: 1 },
    deepEP.draw,
  );
  const receipt = audit.targets.find((target) => target.id === 'resources-layer-receipt');
  const result = audit.targets.find((target) => target.id === 'resources-restored-results');
  assert(
    receipt && receipt.width > 1400 && receipt.height > 500,
    'The narrated receipt must paint actual content',
  );
  assert(
    result && result.markCounts.labels >= 3,
    'The receipt must show computed restored source rows',
  );
  assert.deepEqual(layoutIssues(audit), []);
  assert.deepEqual(aggregateOcclusion(audit), []);
});

test('the receipt reconstructs reversed expert arrivals using source identities and one gate application', () => {
  const receipt = deepEP.completeLayerReceipt();
  assert.deepEqual(receipt.counts, [2, 2, 2, 2]);
  assert.equal(receipt.returnedRows, 8);
  assert.equal(receipt.uniqueReturnedSlots, 8);
  assert.deepEqual(
    receipt.mapping.a.map((row) => [row.expert, row.slot, row.sourceRank]),
    [
      [0, 0, 0],
      [3, 0, 0],
    ],
  );
  assert.deepEqual(
    receipt.mapping.a.map((row) => row.weighted[0]),
    [0.7, 1.2],
  );
  assert(Math.abs(receipt.restored.a[0] - 1.9) < 1e-12);
  assert(Math.abs(receipt.restored.b[1] - 2.4) < 1e-12);
  assert.deepEqual(receipt.restored.d, [5, -2.5]);
  assert.equal(receipt.referenceMatches, true);
  assert.equal(receipt.deviceMeasurement, 'pending');
});

test('a masked expert selection changes the receipt counts, mapping and restored row together', () => {
  const receipt = deepEP.completeLayerReceipt({
    a: [
      [2, 0.7],
      [-1, 0.3],
    ],
    b: [
      [2, 0.4],
      [1, 0.6],
    ],
    c: [
      [1, 0.55],
      [3, 0.45],
    ],
    d: [
      [0, 0.25],
      [2, 0.75],
    ],
  });
  assert.deepEqual(receipt.counts, [1, 2, 3, 1]);
  assert.equal(receipt.returnedRows, 7);
  assert.equal(receipt.uniqueReturnedSlots, 7);
  assert.equal(receipt.mapping.a.length, 1);
  assert.equal(receipt.mapping.a[0].expert, 2);
  assert(Math.abs(receipt.restored.a[0] - 2.1) < 1e-12);
  assert.equal(receipt.referenceMatches, true);
});
