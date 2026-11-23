import { check as checkEvidence } from './evidence.mjs';
import { opening, universe, index, bm, sparse } from './lexical.mjs';
import { dense, embeddings, invertedFile, graph, walkState } from './vectors.mjs';
import { fusion, shortlist, weights, diversity, trace } from './selection.mjs';
import { cookbook, practice, checkKitchen, finalState } from './practice.mjs';
import assert from 'node:assert/strict';

const painters = [
  opening,
  universe,
  index,
  bm,
  sparse,
  dense,
  embeddings,
  invertedFile,
  graph,
  fusion,
  shortlist,
  weights,
  diversity,
  trace,
  cookbook,
  practice,
];

function draw(c, clock) {
  c.save();
  c.scale(1.6, 1.6);
  painters[clock.beat.chapterIndex](c, clock);
  c.restore();
}

function check() {
  checkEvidence();
  checkKitchen();
  const frame = (b, said) => ({
    beat: { beatIndex: b },
    reveal: (p) => (said.includes(p) ? 1 : 0),
  });
  for (const [beatIndex, width] of [[1, 1], [2, 1], [3, 3]]) {
    const { ef, snap } = walkState(frame(beatIndex, []));
    assert.equal(ef, width);
    assert.deepEqual(snap, { current: null, expanded: [], pending: ['S'], best: ['S'] });
  }
  const narrow = walkState(frame(2, ['At distance two']));
  assert.equal(narrow.ef, 1);
  assert.deepEqual(narrow.snap.best, ['B']);
  assert.deepEqual(narrow.snap.pending, []);
  const bridge = walkState(frame(3, ['then B', 'D is still waiting']));
  assert.equal(bridge.ef, 3);
  assert.deepEqual(bridge.snap.pending, ['D']);
  assert.deepEqual(bridge.snap.best, ['B', 'A', 'D']);
  const expanding = walkState(frame(3, ['then B', 'Expand D']));
  assert.equal(expanding.snap.current, 'D');
  assert.deepEqual(expanding.snap.pending, []);
  assert.deepEqual(expanding.snap.best, ['B', 'A', 'D']);
  const c = walkState(frame(3, ['Its distance is zero']));
  assert.equal(c.snap.current, 'D');
  assert.equal(c.snap.best[0], 'C');
  assert.deepEqual(c.snap.pending, ['C']);
  const before = finalState(frame(1, [])),
    during = finalState(frame(2, ['Each third place', 'Both votes go'])),
    after = finalState(frame(2, ['Each third place', 'Both votes go', 'A bigger fused pool']));
  assert.deepEqual(before.parts, [0, 0]);
  assert.equal(before.depth, 2);
  assert.equal(before.resolved, false);
  assert.equal(during.depth, 3);
  assert.deepEqual(during.parts, [1 / 13, 1 / 13]);
  assert.equal(during.resolved, false);
  assert.equal(after.resolved, true);
  assert.equal(after.order[0].id, 'Key');
  assert.equal(after.order[0].score, 2 / 13);
}
export default { title: 'Hybrid Search: From Terms and Vectors to Retained Evidence', draw, check };
