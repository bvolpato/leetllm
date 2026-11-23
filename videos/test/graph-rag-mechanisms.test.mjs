import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blockedDescendants,
  modularityTerms,
  packContext,
  dynamicTree,
} from '../animations/graph-rag.mjs';

test('old-version withdrawal closes transitive dependencies regardless of storage order', () => {
  const dependencies = {
    parent: ['child'],
    child: ['edge'],
    edge: ['S2-v1'],
    current: ['S2-v2'],
    independent: ['T-v1'],
  };
  const blocked = new Set(blockedDescendants(['S2-v1'], dependencies));
  assert.deepEqual(blocked, new Set(['S2-v1', 'edge', 'child', 'parent']));
  assert.equal(blocked.has('current'), false);
  assert.equal(blocked.has('independent'), false);
});

test('degree-null arithmetic, packing continuation and inclusive parent gates preserve the worked mechanisms', () => {
  const edges = [
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'a'],
    ['d', 'e'],
    ['e', 'f'],
    ['f', 'd'],
  ];
  const terms = modularityTerms(
    [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
    edges,
  );
  assert.deepEqual(
    terms.map((t) => t.contribution),
    [0.25, 0.25],
  );
  assert.deepEqual(
    packContext(
      [
        { id: 'large', tokens: 80 },
        { id: 'skip', tokens: 55 },
        { id: 'fits', tokens: 10 },
      ],
      90,
    ),
    { accepted: ['large', 'fits'], rejected: ['skip'], used: 90, remaining: 0 },
  );
  assert.deepEqual(dynamicTree(0.5).selected, ['Cache', 'Queue']);
  assert.deepEqual(dynamicTree(0.499).visited, ['Serving', 'Eval']);
});
