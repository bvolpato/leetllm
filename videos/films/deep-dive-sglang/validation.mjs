import { common, sum } from './arithmetic.mjs';
import { a, draft, payload, target, z } from './fixtures.mjs';
import {
  grammarState,
  handoffState,
  insert,
  sampleModel,
  speculativeState,
  treePaths,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const tree = {
    terminal: false,
    edges: [],
  };
  insert(tree, a);
  insert(tree, z);
  assert.deepEqual(treePaths(tree), [a, z]);
  assert.deepEqual(tree.edges[0].words, a.slice(0, 4));
  assert.equal(common(a, z), 4);
  assert.equal(
    sampleModel('radix', {
      beat: 2,
      beatP: 0,
    }).matched,
    1,
  );
  assert.equal(
    sampleModel('radix', {
      beat: 2,
      beatP: 0,
    }).compatibleMatched,
    0,
  );
  assert.equal(
    sampleModel('locks', {
      beat: 1,
      beatP: 0,
    }).evictable,
    false,
  );
  assert.equal(
    sampleModel('locks', {
      beat: 2,
      beatP: 0,
    }).evictable,
    true,
  );
  for (const beat of [0, 1, 2]) {
    const s = sampleModel('grammar', {
      beat,
      beatP: 0.8,
    });
    assert(Math.abs(sum(s.probabilities) - 1) < 1e-12);
    s.allowed.forEach((v, i) => {
      if (!v) assert.equal(s.probabilities[i], 0);
    });
  }
  assert.equal(common(draft, target), 5);
  for (const beatP of [0.02, 0.25, 0.5, 0.75, 0.98]) {
    const provisional = sampleModel('speculate', {
      beat: 0,
      beatP,
    });
    assert.equal(provisional.compared, 0);
    assert.equal(provisional.replacement, null);
    assert.equal(provisional.mismatch, null);
    assert.deepEqual(provisional.committed, []);
  }
  const agreedOnly = sampleModel('speculate', {
    beat: 1,
    beatP: 0.4,
  });
  assert.equal(agreedOnly.compared, 5);
  assert.equal(agreedOnly.accepted, 5);
  assert(agreedOnly.comparisons.every((row) => row.agrees));
  assert.equal(agreedOnly.replacement, null);
  const firstMismatch = sampleModel('speculate', {
    beat: 1,
    beatP: 0.5,
  });
  assert.equal(firstMismatch.compared, 6);
  assert.deepEqual(firstMismatch.mismatch, {
    index: 5,
    draft: 'sea',
    target: 'lake',
    agrees: false,
  });
  assert.equal(firstMismatch.replacement, 'lake');
  assert.equal(firstMismatch.accepted, 5);
  assert.deepEqual(firstMismatch.committed, []);
  assert.deepEqual(
    sampleModel('speculate', {
      beat: 2,
      beatP: 0,
    }).committed,
    target.slice(0, 6),
  );
  assert.equal(
    sampleModel('speculate', {
      beat: 2,
      beatP: 0,
    }).discarded,
    3,
  );
  assert.equal(payload, 536870912);
  assert.equal(
    sampleModel('disaggregate', {
      beat: 1,
      beatP: 0.2,
    }).ready,
    false,
  );
  assert.equal(
    sampleModel('disaggregate', {
      beat: 2,
      beatP: 0,
    }).ready,
    true,
  );
  const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
    phase,
    progress,
  });
  const raw = grammarState(0, 0, {
      'grammar-mask-number': cue('before'),
    }),
    masked = grammarState(0, 0, {
      'grammar-mask-number': cue('after'),
    });
  assert.equal(raw.mass, 1);
  assert.equal(raw.masked[3], 0.05);
  assert.equal(masked.masked[3], 0);
  assert(Math.abs(masked.mass - 0.95) < 1e-12);
  const normalized = grammarState(1, 0, {
    'grammar-beat-2-focus-1': cue('after'),
    'grammar-select-category': cue('before'),
    'grammar-close-object': cue('before'),
  });
  assert.equal(normalized.normalized, 3);
  assert(Math.abs(sum(normalized.probabilities) - 1) < 1e-12);
  assert.equal(normalized.selected, false);
  assert.equal(normalized.closing, false);
  for (const p of [0, 0.2, 0.5, 0.8, 1]) {
    const current = speculativeState(2, 0, {
      'speculate-commit-prefix': cue('during', p),
      'speculate-beat-3-focus-1': cue('before'),
    });
    assert.deepEqual(current.committed, target.slice(0, Math.ceil(6 * p)));
    assert.deepEqual(
      current.cache.map((row) => row.word),
      current.committed.slice(0, 5),
    );
    assert(!current.cache.some((row) => row.word === 'sea' || row.word === 'lake'));
    assert.equal(current.pendingForward, current.committed.length === 6 ? 'lake' : null);
    assert.equal(current.discarded, 0);
  }
  const committed = speculativeState(2, 0, {
    'speculate-commit-prefix': cue('after'),
    'speculate-beat-3-focus-1': cue('after'),
  });
  assert.deepEqual(committed.discardedWords, ['sea', 'at', 'dawn']);
  assert.equal(committed.cache.length, 5);
  assert.equal(committed.pendingForward, 'lake');
  for (const p of [0, 0.5, 1]) {
    const current = handoffState(1, 0, {
      'disaggregate-beat-2-focus-2': cue('during', p),
    });
    assert.equal(current.reserved, payload);
    assert.equal(current.transferred, payload * p);
    assert.equal(current.ready, p === 1);
    assert.equal(current.decodeActive, false);
  }
  assert.equal(
    handoffState(2, 0, {
      'disaggregate-open-decode-gate': cue('before'),
    }).decodeActive,
    false,
  );
  assert.equal(
    handoffState(2, 0, {
      'disaggregate-open-decode-gate': cue('during', 0.1),
    }).decodeActive,
    true,
  );
  const namespace = (phase) =>
    sampleModel('radix', {
      beat: 2,
      beatP: 0,
      cues: {
        'radix-beat-3-focus-2': cue(phase),
      },
    });
  assert.equal(namespace('before').compatibleMatched, 1);
  assert.equal(namespace('after').compatibleMatched, 0);
  return true;
}
