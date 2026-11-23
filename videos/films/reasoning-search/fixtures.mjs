import { branchFixture, stateKey, stateLabel, successorStates } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export const LINEAR_STATES = [
  {
    label: '4 · 5 · 6 · 7',
    move: 'Choose 6 − 4',
    remaining: [4, 5, 6, 7],
  },
  {
    label: '2 · 5 · 7',
    move: 'Then 5 + 7',
    remaining: [2, 5, 7],
  },
  {
    label: '2 · 12',
    move: 'Then 2 × 12',
    remaining: [2, 12],
  },
  {
    label: '24',
    move: 'Goal reached',
    remaining: [24],
  },
];
export function buildPruningEvidence() {
  const PRUNING_BRANCHES = branchFixture();
  const DEAD_END_TRACE = (() => {
    const pending = [PRUNING_BRANCHES.branchA.items],
      discovered = new Set([stateKey(pending[0])]),
      trace = [];
    while (pending.length) {
      const items = pending.shift();
      for (const next of successorStates(items)) {
        const key = stateKey(next);
        if (!discovered.has(key)) {
          discovered.add(key);
          pending.push(next);
        }
      }
      trace.push({
        state: stateLabel(items),
        queued: pending.length,
        checked: trace.length + 1,
      });
    }
    assert.equal(trace.length, PRUNING_BRANCHES.deadEnd.visited);
    return trace;
  })();
  return {
    PRUNING_BRANCHES,
    DEAD_END_TRACE,
  };
}
export const { PRUNING_BRANCHES, DEAD_END_TRACE } = buildPruningEvidence();
export const COMPLETE_B_TREE = {
  op: '×',
  left: {
    op: '-',
    left: {
      leaf: 6,
    },
    right: {
      leaf: 4,
    },
  },
  right: {
    op: '+',
    left: {
      leaf: 5,
    },
    right: {
      leaf: 7,
    },
  },
};
export const ANSWER_ALIASES = Object.freeze({
  'merge release': 'merge_release',
  merge_release: 'merge_release',
  'auto merge approved change': 'merge_release',
  'manual review': 'manual_review',
  manual_review: 'manual_review',
});
export const VOTING_CASES = Object.freeze([
  {
    id: 'approved_clean_release',
    expected: 'merge_release',
    samples: ['manual_review', 'merge_release', 'merge_release', 'merge_release', 'force'],
  },
  {
    id: 'scan_failed',
    expected: 'manual_review',
    samples: ['manual_review', 'manual_review', 'force', 'manual_review', 'hold'],
  },
  {
    id: 'review_missing',
    expected: 'manual_review',
    samples: ['merge_release', 'manual_review', 'manual_review', 'manual_review', 'merge_release'],
  },
  {
    id: 'shared_wrong_assumption',
    expected: 'manual_review',
    samples: Array(5).fill('merge_release'),
  },
  {
    id: 'weak_support',
    expected: 'manual_review',
    samples: ['manual_review', 'force', 'hold', 'merge_release', 'unknown'],
  },
]);
export const STRATEGY_RECEIPTS = Object.freeze([
  {
    strategy: 'direct',
    accuracy: 0.76,
    p95_ms: 190,
    calls: 1,
  },
  {
    strategy: 'single_trace',
    accuracy: 0.84,
    p95_ms: 360,
    calls: 1,
  },
  {
    strategy: 'vote_5',
    accuracy: 0.94,
    p95_ms: 740,
    calls: 5,
  },
  {
    strategy: 'tree_search',
    accuracy: 0.96,
    p95_ms: 1840,
    calls: 14,
  },
]);
export function buildFreshOccurrenceTrees() {
  const occurrenceLeaf = (id, value) => ({
    leaf: value,
    occurrence: id,
  });
  const FRESH_LEAVES = Object.freeze([
    occurrenceLeaf('3a', 3),
    occurrenceLeaf('3b', 3),
    occurrenceLeaf('8a', 8),
    occurrenceLeaf('8b', 8),
  ]);
  const opTree = (op, left, right) => ({
    op,
    left,
    right,
  });
  const FRESH_FRACTION_TREE = opTree(
    '÷',
    FRESH_LEAVES[3],
    opTree('-', FRESH_LEAVES[1], opTree('÷', FRESH_LEAVES[2], FRESH_LEAVES[0])),
  );
  const FRESH_WRONG_TREE = opTree(
    '×',
    opTree('-', FRESH_LEAVES[2], FRESH_LEAVES[0]),
    opTree('-', FRESH_LEAVES[3], FRESH_LEAVES[1]),
  );
  return {
    FRESH_LEAVES,
    opTree,
    FRESH_FRACTION_TREE,
    FRESH_WRONG_TREE,
  };
}
export const { FRESH_LEAVES, opTree, FRESH_FRACTION_TREE, FRESH_WRONG_TREE } =
  buildFreshOccurrenceTrees();
