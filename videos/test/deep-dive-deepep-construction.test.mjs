import test from 'node:test';
import assert from 'node:assert/strict';
import {
  expertReturnReceipt,
  weightedExpertRow,
  freshDeepEPState,
  destinationExpectation,
  communicationBudget,
  redundantGradient,
  deferredWaitTrace,
  draw,
} from '../animations/deep-dive-deepep.mjs';

const near = (a, b) => assert(Math.abs(a - b) < 1e-12);
const cue = (progress) => ({
  progress,
  phase: progress === 1 ? 'after' : progress === 0 ? 'before' : 'during',
});

test('saved expert-slot identities restore reversed fresh-token contributions exactly once', () => {
  const receipt = expertReturnReceipt([2, -1], [1, 2], [0.2, 0.8]);
  assert.deepEqual(
    receipt.trace.map((r) => [r.key, r.source]),
    [
      ['2:0', 'z'],
      ['1:0', 'z'],
    ],
  );
  receipt.output.forEach((v, i) => near(v, [5.6, -2.8][i]));
  receipt.trace[0].accumulator.forEach((v, i) => near(v, [4.8, -2.4][i]));
  const forward = expertReturnReceipt([2, -1], [1, 2], [0.2, 0.8], receipt.slots);
  assert.deepEqual(forward.output, receipt.output);
  const stale = expertReturnReceipt([2, -1], [0, 3], [0.2, 0.8]);
  stale.output.forEach((v, i) => near(v, [6.8, -3.4][i]));
});

test('return mapping rejects absent, duplicate, padding and malformed result vectors', () => {
  const { slots } = expertReturnReceipt([3, 2], [0, 2], [0.3, 0.7]);
  assert.throws(
    () => expertReturnReceipt([3, 2], [0, 2], [0.3, 0.7], slots.slice(1)),
    /Missing return slot/,
  );
  assert.throws(
    () => expertReturnReceipt([3, 2], [0, 2], [0.3, 0.7], [slots[0], slots[0]]),
    /Duplicate return slot/,
  );
  assert.throws(
    () =>
      expertReturnReceipt(
        [3, 2],
        [0, 2],
        [0.3, 0.7],
        [...slots, { key: 'padding:0', value: [0, 0] }],
      ),
    /no source identity/,
  );
  for (const value of [[1], [1, NaN], [true, 1]])
    assert.throws(
      () => expertReturnReceipt([3, 2], [0, 2], [0.3, 0.7], [{ ...slots[0], value }, slots[1]]),
      /Invalid returned vector/,
    );
  assert.throws(() => weightedExpertRow([1, 2], [1, 1], [0.5, 0.5]));
});

test('fresh prediction keeps output pending and changes readiness only on its own completed clause', () => {
  const question = freshDeepEPState({ beat: 0, beatP: 0.99, cues: {} });
  assert.deepEqual(question.choices, [0, 3]);
  assert.equal(question.outputVisible, false);
  const answer = {
    beat: 1,
    beatP: 0.99,
    cues: { 'de-fresh-route': cue(1), 'de-fresh-result': cue(0.999) },
  };
  assert.deepEqual(freshDeepEPState(answer).choices, [1, 2]);
  assert.equal(freshDeepEPState(answer).outputVisible, false);
  answer.cues['de-fresh-result'] = cue(1);
  assert.equal(freshDeepEPState(answer).outputVisible, true);
  const waiting = { beat: 3, beatP: 0.99, cues: { 'de-fresh-remove-wait': cue(0.999) } };
  assert.equal(freshDeepEPState(waiting).waitPresent, true);
  waiting.cues['de-fresh-remove-wait'] = cue(1);
  assert.equal(freshDeepEPState(waiting).waitPresent, false);
  assert.equal(
    freshDeepEPState({ beat: 4, cues: { 'de-fresh-wait': cue(0.999) } }).dependencyVerdict,
    false,
  );
  assert.equal(
    freshDeepEPState({ beat: 4, cues: { 'de-fresh-wait': cue(1) } }).dependencyVerdict,
    true,
  );
  assert.deepEqual(freshDeepEPState(waiting), freshDeepEPState(waiting));
});

test('painted question and partial result clauses withhold the final vector and dependency verdict', () => {
  function labels(state) {
    const out = [],
      noop = () => {},
      api = {
        C: {
          ink: 'white',
          muted: 'gray',
          panel: 'black',
          blue: 'blue',
          cyan: 'cyan',
          green: 'green',
          pink: 'pink',
          yellow: 'yellow',
        },
        text: (_, s) => out.push(String(s)),
        line: noop,
        rect: noop,
        arrow: noop,
        circle: noop,
        components: { card: (o) => out.push(o.label) },
        teaching: { grid: (o) => out.push(...o.labels.flat().map(String)) },
        focus: { target: (_, paint) => paint() },
      };
    draw({}, { id: 'earned-return' }, state, api);
    return out;
  }
  assert(
    !labels({ beat: 0, beatP: 0.99, cues: {} }).some(
      (s) => s.includes('5.60') || s.includes('6.80'),
    ),
  );
  assert(
    labels({ beat: 1, beatP: 0.99, cues: { 'de-fresh-result': cue(0.99) } }).includes(
      'Source z return: [?, ?]',
    ),
  );
  assert(
    labels({
      beat: 1,
      beatP: 0.99,
      cues: { 'de-fresh-route': cue(1), 'de-fresh-result': cue(1) },
    }).includes('Source z return: [5.60, -2.80]'),
  );
  assert(
    !labels({ beat: 3, beatP: 0.99, cues: { 'de-fresh-remove-wait': cue(1) } }).some((s) =>
      s.startsWith('Restore the consumer'),
    ),
  );
});

test('balanced destination expectation matches explicit group occupancy and edge cases', () => {
  const pairs = [];
  for (let a = 0; a < 6; a++)
    for (let b = a + 1; b < 6; b++)
      pairs.push(new Set([Math.floor(a / 2), Math.floor(b / 2)]).size);
  near(destinationExpectation(6, 3, 2), pairs.reduce((a, b) => a + b, 0) / pairs.length);
  assert.equal(destinationExpectation(6, 3, 0), 0);
  assert.equal(destinationExpectation(6, 3, 6), 3);
  assert.throws(() => destinationExpectation(5, 2, 2));
});

test('resource sizing distinguishes requested limits, allocated capacity and complete participants', () => {
  const overlap = communicationBudget(15.2),
    floor = communicationBudget(15.2, { preferOverlap: false }),
    capped = communicationBudget(15.2, { preferOverlap: false, deviceSMs: 40, pool: 5 });
  assert.deepEqual(
    [overlap.margin, overlap.aligned, overlap.sms, overlap.hybridRequest, overlap.hybrid],
    [19, 20, 20, 321, 128],
  );
  assert.equal(floor.sms, 64);
  assert.deepEqual([capped.sms, capped.direct, capped.hybrid], [40, 5, 5]);
  assert.deepEqual(redundantGradient([2, 4], [1, 3], [0, 1, 2, 3], [0, 1, 2, 3]), [3, 7]);
  assert.throws(
    () => redundantGradient([2, 4], [1, 3], [0, 1, 2], [0, 1, 2, 3]),
    /Every local participant/,
  );
  assert.deepEqual(deferredWaitTrace(3), {
    dependencyCalls: 3,
    hookCalls: 1,
    results: [['rows', 'indices', 'gates', 'handle'], null, null],
  });
});
