import test from 'node:test';
import assert from 'node:assert/strict';
import { draw, systemExtensionFrame } from '../animations/ai-lab-system-design-interview.mjs';

const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
const names = ['capacity', 'acl', 'release', 'repair-inputs', 'repair-result'];
function cues(changed = {}) {
  return Object.fromEntries(names.map((n) => ['sd-fresh-' + n, changed[n] ?? before]));
}
function paint(state) {
  const cards = [],
    texts = [];
  draw({}, { id: 'fresh-boundary' }, state, {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    focus: { target: (_, fn) => fn() },
    components: {
      card: (o) => {
        cards.push(o.label);
        return o;
      },
    },
    text: (_, v) => texts.push(String(v)),
    rect() {},
    line() {},
    circle() {},
    path() {},
  });
  return { cards, texts };
}
test('question and prediction hold disclose none of the three verdicts', () => {
  for (const beatP of [0, 0.4, 0.99, 1])
    assert.deepEqual(paint({ beat: 0, beatP, cues: cues() }).cards, [
      'Predict',
      'Predict',
      'Predict',
    ]);
});
test('late paragraph progress cannot reveal unspoken verdict clauses', () => {
  assert.deepEqual(paint({ beat: 1, beatP: 0.99, cues: cues() }).cards, [
    'Predict',
    'Predict',
    'Predict',
  ]);
});
test('capacity, freshness and release reveal independently at their completed clauses', () => {
  assert.deepEqual(paint({ beat: 1, beatP: 0.9, cues: cues({ capacity: after }) }).cards, [
    'accept · 0.2 s',
    'Predict',
    'Predict',
  ]);
  assert.deepEqual(
    paint({ beat: 1, beatP: 0.9, cues: cues({ capacity: after, acl: after }) }).cards,
    ['accept · 0.2 s', 'fail', 'Predict'],
  );
  assert.deepEqual(
    paint({ beat: 1, beatP: 0.9, cues: cues({ capacity: after, acl: after, release: after }) })
      .cards,
    ['accept · 0.2 s', 'fail', 'hold'],
  );
});
test('repair inputs change before repaired verdicts and do not add a finance grant', () => {
  const state = { beat: 2, beatP: 0.99, cues: cues({ 'repair-inputs': after }) },
    picture = paint(state);
  assert(picture.texts.includes('10 s / 60 s'));
  assert(picture.texts.includes('0.96 / 0.92'));
  assert(picture.texts.includes('0.97 / 0.95'));
  assert(picture.texts.includes('integer 0'));
  assert.deepEqual(picture.cards, ['accept · 0.2 s', 'fail', 'hold']);
  assert.equal(systemExtensionFrame('fresh-boundary', state).financeGranted, false);
  const completed = paint({
    ...state,
    cues: cues({ 'repair-inputs': after, 'repair-result': after }),
  });
  assert.deepEqual(completed.cards, ['accept · 0.2 s', 'pass', 'pass local checks']);
});
test('reservation and refund preserve the ledger balance until each atomic completion', () => {
  const state = (changed) => ({
    beat: 0,
    beatP: 0.99,
    cues: { 'sd-quota-reserved': before, 'sd-quota-refunded': before, ...changed },
  });
  const pending = systemExtensionFrame(
    'quota-reservation',
    state({ 'sd-quota-reserved': { phase: 'during', progress: 0.5 } }),
  );
  assert.equal(pending.balance, 10000);
  assert.equal(pending.reserved, 0);
  const reserved = state({
    'sd-quota-reserved': after,
    'sd-quota-refunded': { phase: 'during', progress: 0.5 },
  });
  assert.equal(systemExtensionFrame('quota-reservation', reserved).balance, 8200);
  assert.equal(systemExtensionFrame('quota-reservation', reserved).refunded, 0);
  const settled = state({ 'sd-quota-reserved': after, 'sd-quota-refunded': after });
  assert.equal(systemExtensionFrame('quota-reservation', settled).balance, 8480);
  assert.deepEqual(
    systemExtensionFrame('quota-reservation', settled),
    systemExtensionFrame('quota-reservation', settled),
  );
});

test('inclusive canary boundary retains its eligible-to-expand payoff', () => {
  const id = 'canary-controller',
    key = 'sd-canary-controller-1-result';
  const pending = systemExtensionFrame(id, { beat: 1, beatP: 0.99, cues: { [key]: before } });
  assert.equal(pending.index, 2);
  assert.equal(pending.done, false);
  const completed = systemExtensionFrame(id, { beat: 1, beatP: 0.99, cues: { [key]: after } });
  assert.equal(completed.index, 1);
  assert.equal(completed.decision, 'expand');
  assert.deepEqual(completed.cases[completed.index], { error: 0.01, latency: 900, leaks: 0 });
});
