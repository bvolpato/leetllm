import test from 'node:test';
import assert from 'node:assert/strict';
import {
  availableHeartbeat,
  applyLatestState,
  publishWindow,
  applyUpdate,
  sourceFreshness,
  typedParity,
} from '../animations/streaming-features.mjs';

test('publication eligibility preserves the earlier request while a later state advances', () => {
  const records = [
    { id: 'H7', event: 660, available: 662 },
    { id: 'H8', event: 830, available: 843 },
  ];
  assert.deepEqual(availableHeartbeat(records, 840), { id: 'H7', event: 660, ageHours: 3 });
  assert.deepEqual(availableHeartbeat(records, 850), { id: 'H8', event: 830, ageHours: 1 / 3 });
  assert.equal(availableHeartbeat(records, 661), null);
});

test('source revisions dominate arrival and equal-key conflicts persist in either order', () => {
  const first = { id: 'H5-A', job: 'J', event: 630, available: 631, version: 7, phase: 'scaled' },
    conflict = { ...first, id: 'H5-B', available: 634, phase: 'failed' };
  for (const input of [
    [first, conflict],
    [conflict, first],
  ]) {
    const store = new Map();
    for (const row of input) applyLatestState(store, row);
    assert(store.get('J').quarantined);
    assert.equal(applyLatestState(store, { ...first, available: 636 }), 'quarantine persists');
    assert.equal(
      applyLatestState(store, { ...first, version: 6, available: 637 }),
      'stale ignored',
    );
    applyLatestState(store, { ...first, version: 8, available: 638 });
    assert.equal(store.get('J').quarantined, false);
  }
});

test('a repeated rejected delta keeps its recorded decision even after a separate addition', () => {
  const state = { seen: new Map(), backlog: 0 };
  for (const u of [
    { id: 'Q1', delta: 3 },
    { id: 'Q2', delta: -1 },
    { id: 'Q3', delta: -5 },
    { id: 'Q4', delta: 10 },
  ])
    applyUpdate(state, u);
  assert.equal(state.backlog, 12);
  assert.equal(applyUpdate(state, { id: 'Q3', delta: -5 }), 'blocked negative backlog');
  assert.equal(state.backlog, 12);
  assert.throws(() => applyUpdate(state, { id: 'Q1', delta: 4 }), /different payload/);
  assert.equal(state.backlog, 12);
});

test('a whole-window revision replaces rather than adds and cannot be rolled back by retry', () => {
  let total = publishWindow(null, { key: 'J/11–12', revision: 1, count: 2 });
  total = publishWindow(total, { key: 'J/11–12', revision: 2, count: 3 });
  total = publishWindow(total, { key: 'J/11–12', revision: 1, count: 2 });
  assert.equal(total.count, 3);
  assert.equal(total.revision, 2);
  assert.throws(
    () => publishWindow(total, { key: 'J/11–12', revision: 2, count: 4 }),
    /conflicting whole total/,
  );
});

test('source lag checks exact boundaries before formatting clocks', () => {
  assert.deepEqual(
    [900, 901, 2700, 2701].map((seconds) => sourceFreshness(0, seconds).mode),
    ['normal', 'degraded', 'degraded', 'abstain'],
  );
  assert.equal(sourceFreshness(21, 20).mode, 'invalid clock');
  assert.equal(sourceFreshness(null, 20).mode, 'unknown / abstain');
  assert.throws(() => sourceFreshness(NaN, 20));
});

test('paired scalar parity distinguishes Boolean types,missing fields and bounded float differences', () => {
  assert.deepEqual(typedParity({ flag: 0 }, { flag: false }), ['flag']);
  assert.deepEqual(typedParity({ value: null }, {}), ['value']);
  assert.deepEqual(typedParity({ ratio: 0.5 }, { ratio: 0.5008 }, { absolute: 0.001 }), []);
  assert.deepEqual(typedParity({ A: 5, B: 18 }, { A: 18, B: 5 }), ['A', 'B']);
  assert.deepEqual(typedParity({ value: NaN }, { value: NaN }), ['value']);
});

const painted = async (id, beat, cues) => {
  const { createCanvas } = await import('@napi-rs/canvas'),
    { drawFrame } = await import('../lib/scene.mjs'),
    { draw } = await import('../animations/streaming-features.mjs');
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Streaming state worksheet' },
    { beat, beatP: 0.5, t: 1, duration: 80, opacity: 1, cues },
    draw,
  );
};
const phase = (value) => ({ phase: value, progress: value === 'after' ? 1 : 0.99 });
const labels = (frame) => frame.labels.map((x) => x.text);

test('the committed SQLite result waits for the observed reopen clause', async () => {
  const cues = {
    'sf-atomic-crash-both': phase('after'),
    'sf-atomic-crash-uncommitted': phase('after'),
    'sf-atomic-crash-commit': phase('after'),
    'sf-atomic-crash-durable': phase('during'),
  };
  let frame = await painted('atomic-crash', 1, cues);
  assert(!labels(frame).includes('backlog 3'));
  assert(labels(frame).includes('COMMIT completed · acknowledgment lost'));
  frame = await painted('atomic-crash', 1, { ...cues, 'sf-atomic-crash-durable': phase('after') });
  assert(labels(frame).includes('backlog 3'));
  assert(labels(frame).includes('ledger Q1: +3 / applied'));
  assert(!labels(frame).includes('backlog 0'));
});

test('a repaired current source state persists while an old request keeps its captured row', async () => {
  const frame = await painted('quarantine-state', 2, {}),
    text = labels(frame);
  assert.equal(text.filter((t) => t === 'validated v8 replaces state').length, 2);
  assert(!text.includes('QUARANTINED'));
  assert(text.includes('Captured 09:00 H1 age remains 8 h after later quarantine or repair'));
});
