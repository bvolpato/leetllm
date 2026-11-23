import assert from 'node:assert/strict';
import {
  chain,
  commonPrefix,
  fullBlockPrefix,
  guideWork,
  hash,
  longestLookup,
  ownershipAfter,
  priceInput,
  reusableTokens,
} from '../../../films/prefix-reuse/arithmetic.mjs';
import {
  generated,
  requestTokens,
  sections,
  storedTokens,
  tails,
} from '../../../films/prefix-reuse/fixtures.mjs';

export { chain, commonPrefix, guideWork, longestLookup, requestTokens, sections, storedTokens };
export const parts = [600, 4200, 800, 400];
export const guide = parts.reduce((a, b) => a + b, 0);
export const questions = [
  'Why does the test fail?',
  'Which lint rule fired?',
  'How do I build it?',
];
export const guideEnding = [418, 72, 316, 91, 24, 53];
export function workRows(evicted = false) {
  return tails.map((tail, i) => {
    const read = i === 0 || (evicted && i === 2) ? 0 : guide;
    return { tail, read, fresh: guide + tail - read, output: generated[i], total: guide + tail };
  });
}
// A toy causal layer averages earlier embeddings. Projecting its output gives
// a distinct deeper-layer key and value at the same token after an early edit.
export function columns(ids) {
  let sin = 0,
    cos = 0,
    sine2 = 0;
  return ids.map((id, i) => {
    const s = Math.sin(id),
      v = Math.cos(id);
    sin += s;
    cos += v;
    sine2 += Math.sin(2 * id);
    const a = s + sin / (i + 1),
      b = v + cos / (i + 1),
      d = sine2 / (i + 1);
    return { K: [a, b, d], V: [b - a, d + b, a + d] };
  });
}
export function blockCase(edit) {
  const ids = requestTokens.map((n, i) => (edit && i === 2 ? 20 : n));
  const reused = reusableTokens(storedTokens, ids, 4);
  return {
    ids,
    values: columns(ids),
    exact: commonPrefix(storedTokens, ids),
    reused,
    fresh: ids.length - reused,
  };
}
export const oldBlocks = ['instructions', 'guide 1', 'tools'];
export const newBlocks = ['instructions', 'guide 2', 'tools'];
const scopes = { 'session A': 'A', 'session B': 'B' };
export function lookupKey(session, adapter = 'base', guideVersion = 7, model = 7) {
  const owner = scopes[session];
  if (!owner) throw new Error('Unknown session');
  return { owner, key: hash([owner, model, adapter, guideVersion, storedTokens]) };
}
const entry = lookupKey('session A');
export function readPrivate(session, clientLabel, adapter = 'base', timestamp = 0) {
  const candidate = lookupKey(session, adapter);
  return { ...candidate, clientLabel, adapter, timestamp, hit: entry.key === candidate.key };
}
export const storedPrivate = entry;
const template = Array.from({ length: guide }, (_, i) => i % 127);
template.splice(-guideEnding.length, guideEnding.length, ...guideEnding);
const firstInput = [...template, ...Array(tails[0]).fill(201)];
const nextInput = [...template, ...Array(tails[1]).fill(202)];
export function endpointRead(written, candidates, input = nextInput) {
  const entries = new Set(written.map((end) => hash(firstInput.slice(0, end))));
  return Math.max(
    0,
    ...candidates.filter((end) => end <= input.length && entries.has(hash(input.slice(0, end)))),
  );
}
export const lookupRuns = {
  cold: endpointRead([], [guide]),
  wholeOnly: endpointRead([firstInput.length], [nextInput.length, guide]),
  guideWritten: endpointRead([firstInput.length, guide], [nextInput.length, guide]),
};
export function policyTrace(id, replay = false) {
  const original = id === 'A' ? 90 : 30;
  return {
    repository: 30,
    original,
    rendered: replay ? 30 : original,
    previousAnswer: 90,
    model: 'M7',
    prefixReads: id === 'B' ? 0 : null,
    bypassAnswerCache: id === 'B' && replay,
  };
}
export function eligibleMarked(mark, minimum) {
  return mark >= minimum;
}
export const order = [17, 18, 19, 9, 10];
export function pool(n) {
  const cells = Array.from({ length: 20 }, (_, id) => {
    const prior = id < 9 ? 'live' : id < 17 ? 'cached' : 'free';
    const state = order.slice(0, n).includes(id) ? 'claimed' : prior;
    return {
      id,
      state,
      content:
        state === 'claimed'
          ? 'R4'
          : prior === 'free'
            ? 'empty'
            : prior === 'live'
              ? 'live'
              : id === 9
                ? 'guide G'
                : id === 10
                  ? 'guide H'
                  : 'cached',
    };
  });
  const count = (state) => cells.filter((x) => x.state === state).length;
  return {
    cells,
    live: count('live') + count('claimed'),
    cached: count('cached'),
    free: count('free'),
    available: count('free') + count('cached'),
    hasG: cells.some((x) => x.content === 'guide G'),
  };
}
export const minimum = 1536;
export const windows = { entries: [15, 40], initial: [34, 60], added: [34, 60, 40], width: 20 };
export const usage = {
  inclusive: { total: 2600, read: 2000, write: 400 },
  separate: { ordinary: 200, read: 2000, write: 400 },
};
export function normalize({ total, read, write, ordinary }) {
  return {
    total: total ?? ordinary + read + write,
    ordinary: ordinary ?? total - read - write,
    read,
    write,
  };
}
export const rates = { ordinary: 1, write: 1.25, read: 0.1 };
export function bill(mode) {
  const n = 6000,
    front = mode === 'full' ? n : 1024,
    tail = n - front;
  const count = mode === 'full' ? 2 : 4;
  const rows = Array.from({ length: count }, (_, i) => {
    const read = i ? front : 0;
    const write = (i ? 0 : front) + (mode === 'mark' ? 0 : tail);
    const ordinary = n - read - write;
    return { read, write, ordinary };
  });
  return {
    row: rows.map((r) => ({ ...r, charge: priceInput([r], rates) })),
    charge: priceInput(rows, rates),
    baseline: count * n,
  };
}
export function worker(warm, loaded) {
  const queue = warm && loaded ? 1200 : 20,
    compute = warm ? 170 : 1220,
    decode = 880;
  return { queue, compute, decode, first: queue + compute, end: queue + compute + decode };
}
export function admission(edit) {
  const w = guideWork(4800, 64, 16, edit);
  return {
    ...w,
    match: edit - 1,
    blocks: w.reused / 16,
    suffix: w.guide - w.reused,
    limit: 700,
    fits: w.fresh <= 700,
  };
}
export function check() {
  assert.equal(guide, 6000);
  assert.deepEqual(
    workRows().map((r) => [r.fresh, r.read, r.output]),
    [
      [6048, 0, 80],
      [37, 6000, 64],
      [51, 6000, 96],
    ],
  );
  assert.deepEqual(
    workRows(true).map((r) => r.fresh),
    [6048, 37, 6051],
  );
  const old = chain(oldBlocks),
    next = chain(newBlocks);
  assert.deepEqual(
    old.map((v, i) => v === next[i]),
    [true, false, false],
  );
  for (const [edit, exact, reused, fresh] of [
    [false, 9, 8, 4],
    [true, 2, 0, 12],
  ]) {
    const r = blockCase(edit);
    assert.deepEqual([r.exact, r.reused, r.fresh], [exact, reused, fresh]);
    assert.equal(fullBlockPrefix(exact, 4), reused);
  }
  assert.deepEqual(blockCase(false).ids.slice(8), [9, 13, 14, 15]);
  assert.deepEqual(blockCase(false).values.slice(0, 9), columns(storedTokens).slice(0, 9));
  assert.notDeepEqual(blockCase(true).values[4].K, columns(storedTokens)[4].K);
  assert.notDeepEqual(blockCase(true).values[4].V, columns(storedTokens)[4].V);
  for (const stable of [false, true]) {
    const layout = (id) => (stable ? [...sections, id] : [id, ...sections]);
    assert.equal(commonPrefix(layout('A'), layout('B')), stable ? 3 : 0);
  }
  assert.deepEqual(
    [[], [6048], [6048, 6000]].map((entries) => endpointRead(entries, [6037, 6000])),
    [0, 0, 6000],
  );
  assert.equal(
    endpointRead([firstInput.length], [firstInput.length], nextInput.concat(Array(11).fill(202))),
    0,
  );
  assert.deepEqual(lookupRuns, { cold: 0, wholeOnly: 0, guideWritten: 6000 });
  assert.deepEqual(policyTrace('A', true), {
    repository: 30,
    original: 90,
    rendered: 30,
    previousAnswer: 90,
    model: 'M7',
    prefixReads: null,
    bypassAnswerCache: false,
  });
  assert.deepEqual({ ...policyTrace('B', false), bypassAnswerCache: true }, policyTrace('B', true));
  assert.equal(eligibleMarked(1400, minimum), false);
  assert.equal(eligibleMarked(1600, minimum), true);
  assert.deepEqual(
    [windows.initial, windows.added].map((markers) => longestLookup(windows.entries, markers, 20)),
    [15, 40],
  );
  assert.deepEqual(
    [
      readPrivate('session B', 'A').hit,
      readPrivate('session A', 'A', 'base', 1).hit,
      readPrivate('session A', 'A', 'alternate', 1).hit,
    ],
    [false, true, false],
  );
  assert.throws(() => lookupKey('unknown'));
  assert.notEqual(lookupKey('session A', 'base', 8).key, entry.key);
  assert.notEqual(lookupKey('session A', 'base', 7, 8).key, entry.key);
  for (let n = 0; n <= 5; n++) {
    const s = pool(n),
      a = ownershipAfter({ total: 20, referenced: 9, cached: 8, free: 3 }, n);
    assert.deepEqual(
      [s.live, s.cached, s.free, s.available, s.hasG],
      [a.referenced, a.cached, a.free, a.available, n < 4],
    );
    assert.deepEqual(
      s.cells.filter((x) => x.state === 'claimed').map((x) => x.id),
      order.slice(0, n).sort((i, j) => i - j),
    );
    assert(s.cells.slice(0, 9).every((x) => x.state === 'live'));
  }
  assert.deepEqual(normalize(usage.inclusive), normalize(usage.separate));
  assert.equal(normalize(usage.inclusive).ordinary, 200);
  for (const [mode, charges, total] of [
    ['full', [7500, 600], 8100],
    ['tails', [7500, 6322.4, 6322.4, 6322.4], 26467.2],
    ['mark', [6256, 5078.4, 5078.4, 5078.4], 21491.2],
  ]) {
    const b = bill(mode);
    assert.deepEqual(
      b.row.map((r) => r.charge),
      charges,
    );
    assert(Math.abs(b.charge - total) < 0.000001);
    assert(b.row.every((r) => r.read + r.write + r.ordinary === 6000));
  }
  assert.deepEqual(
    [
      worker(true, false).first,
      worker(true, true).first,
      worker(false, true).first,
      worker(false, true).end,
    ],
    [190, 1370, 1240, 2120],
  );
  assert.deepEqual(
    [4176, 4177].map((n) => {
      const a = admission(n);
      return [a.reused, a.suffix, a.fresh, a.fits];
    }),
    [
      [4160, 640, 704, false],
      [4176, 624, 688, true],
    ],
  );
}
