import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustedFamily,
  agreementReadout,
  assignmentResidual,
  binaryPowerTerms,
  draftClicks,
  draftConstruction,
  experimentRequirements,
  freshExperimentSnapshot,
  guardrailSequence,
  mixtureReadout,
  PersistedExperiment,
  posteriorCounts,
  tokenClocks,
  zeroFailureUpper,
  draw,
} from '../animations/ab-testing-online-evaluation-llms.mjs';

test('a fresh detectable effect uses the declared null and alternative variances, with upward rounding', () => {
  const s = binaryPowerTerms(0.4, 0.04);
  assert.equal(s.total, 4778);
  assert(s.perArm >= s.raw && s.perArm - 1 < s.raw);
  for (const [baseline, effect] of [
    [true, 0.05],
    [0.4, Infinity],
    [0.99, 0.04],
    [0.4, Number.EPSILON / 10],
  ])
    assert.throws(() => binaryPowerTerms(baseline, effect), RangeError);
});
test('the assignment diagnostic uses planned fractions rather than a hardcoded fifty-fifty split', () => {
  assert.equal(assignmentResidual(800, 1200, 0.4).chi, 0);
  assert.equal(assignmentResidual(5250, 4750).chi, 25);
  assert.throws(() => assignmentResidual(2, 3), /Small expected/);
});
test('BH restores original metric identities after sorting and applying the reverse minimum', () => {
  const s = adjustedFamily([0.03, 0.001, 0.021, 0.04]);
  assert.deepEqual(
    s.sorted.map((r) => r.id),
    [1, 2, 0, 3],
  );
  assert.deepEqual(s.bh, [0.04, 0.004, 0.04, 0.04]);
  assert.deepEqual(s.bonferroni, [0.12, 0.004, 0.084, 0.16]);
});
test('a new enrollment threshold cannot replace an existing exact conversation key', () => {
  const r = new PersistedExperiment(),
    first = r.assign('docs-prompt-v1', 'thread-7', 0.1);
  assert.equal(first.assigned, 'C');
  assert.equal(r.assign('docs-prompt-v1', 'thread-7', 0.5).assigned, 'C');
  assert.equal(r.assign('docs-prompt-v1', 'thread-8', 1).assigned, 'T');
  assert.equal(r.assignments.size, 2);
});
test('interleaving keeps seen IDs unique and shared-prefix clicks neutral during exhaustion', () => {
  const d = draftConstruction(['shared'], ['shared', 'b-only-1', 'b-only-2'], 3, ['A']);
  assert.deepEqual(d.rows, [
    { id: 'shared', owner: null, reason: 'shared prefix' },
    { id: 'b-only-1', owner: 'B', reason: 'next unseen result' },
    { id: 'b-only-2', owner: 'B', reason: 'next unseen result' },
  ]);
  assert.deepEqual(draftClicks(d, ['shared', 'b-only-2']), { A: 0, B: 1, neutral: 1 });
});
test('a mean token interval preserves the long stall and remains undefined for a single token', () => {
  const s = tokenClocks([250, 290, 330, 450], 500);
  assert.equal(s.tpot, 200 / 3);
  assert.equal(s.largestGap, 120);
  assert.equal(s.closure, 500);
  assert.equal(tokenClocks([250]).tpot, null);
});
test('unavailable telemetry resets the streak and equality passes without repeating an old action', () => {
  const s = guardrailSequence([4, 4, 4, null, 4, 3, 4, 4], { limit: 3, windows: 2 });
  assert.deepEqual(
    s.map((r) => r.streak),
    [1, 2, 3, 0, 1, 0, 1, 2],
  );
  assert.deepEqual(
    s.filter((r) => r.recommendation).map((r) => r.index),
    [1, 3, 7],
  );
});
test('reweighting changes mixtures while retaining each segment rate and its own denominator', () => {
  const s = mixtureReadout();
  assert.equal(s.a, 0.73);
  assert.equal(s.b, 0.77);
  assert(Math.abs(s.standardA - 0.775) < 1e-12);
  assert(Math.abs(s.standardB - 0.725) < 1e-12);
  assert.deepEqual(s.ratesA, [0.85, 0.7]);
  assert.deepEqual(s.ratesB, [0.8, 0.65]);
});
test('selected observed rewards update only their own Beta posterior, including the prior', () => {
  assert.deepEqual(
    posteriorCounts([
      { arm: 1, reward: 1 },
      { arm: 1, reward: 0 },
    ]),
    [
      { alpha: 1, beta: 1, pulls: 0, mean: 0.5, observedSuccesses: 0, observedFailures: 0 },
      { alpha: 2, beta: 2, pulls: 2, mean: 0.5, observedSuccesses: 1, observedFailures: 1 },
    ],
  );
  assert.throws(() => posteriorCounts([{ arm: 0, reward: null }]), /malformed/);
});
test('the actual eight corresponding human/judge labels yield six matches and fail the local threshold', () => {
  const s = agreementReadout();
  assert.deepEqual(s.human, ['A', 'B', 'A', 'TIE', 'B', 'A', 'B', 'B']);
  assert.equal(s.count, 6);
  assert.equal(s.agreement, 0.75);
  assert.equal(s.pass, false);
  assert(Math.abs(zeroFailureUpper(100) - 0.02951304960704) < 1e-12);
});

const before = { phase: 'before', progress: 0 },
  after = { phase: 'after', progress: 1 };
const freshCueNames = [
  'counts',
  'safety',
  'clock',
  'hold',
  'difference',
  'interval',
  'safety-pass',
  'repair',
  'eligible',
];
const freshState = (beat, patch = {}) => ({
  beat,
  beatP: 0.5,
  cues: Object.fromEntries(freshCueNames.map((k) => ['oa-fresh-release-' + k, patch[k] ?? before])),
});
function labels(state) {
  const words = [],
    rects = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => key }),
    focus: { target: (_, fn) => fn() },
    text: (_, v) => words.push(String(v)),
    rect: (_, x, y, w, h, fill) => rects.push({ x, y, w, h, fill }),
    line() {},
    path() {},
    arrow() {},
  };
  draw({}, { id: 'fresh-release' }, state, api);
  return { words, rects };
}
test('the held fresh question paints supplied premises without the answer or release verdict', () => {
  const q = labels(freshState(0, { counts: after, safety: after, clock: after })).words.join('|');
  assert(q.includes('600 / 1,000') && q.includes('650 / 1,000'));
  for (const v of ['5 pp', '0.762', '9.238', 'HOLD:', 'eligible']) assert(!q.includes(v));
});
test('completed answer clauses are independent and the actual repair conserves all earlier evidence', () => {
  const all = {
    counts: after,
    safety: after,
    clock: after,
    hold: after,
    difference: after,
    interval: after,
    'safety-pass': after,
  };
  const failed = freshExperimentSnapshot(freshState(1, all)),
    middle = freshExperimentSnapshot(
      freshState(2, { ...all, repair: { phase: 'during', progress: 0.5 } }),
    ),
    fixed = freshExperimentSnapshot(freshState(2, { ...all, repair: after, eligible: after }));
  assert(!failed.eligible && fixed.eligible);
  assert.equal(middle.times[0], 3);
  for (const k of [
    'aSuccess',
    'aN',
    'bSuccess',
    'bN',
    'd',
    'low',
    'high',
    'safetyLow',
    'safetyMargin',
  ])
    assert.equal(failed[k], fixed[k]);
  const p = labels(freshState(1, { ...all, interval: before })).words.join('|');
  assert(p.includes('5 pp') && !p.includes('0.762') && !p.includes('9.238'));
  const moving = labels(freshState(2, { ...all, repair: { phase: 'during', progress: 0.5 } }));
  assert(moving.words.includes('adjusting'));
  assert(!moving.words.some((v) => v.includes('eligible')));
  const oldBars = labels(freshState(1, all)).rects.filter((r) => r.h === 22),
    newBars = labels(freshState(2, { ...all, repair: after, eligible: after })).rects.filter(
      (r) => r.h === 22,
    );
  assert.equal(oldBars.length, 2);
  assert.equal(newBars.length, 2);
  for (let i = 0; i < 2; i++) assert(oldBars[i].w > newBars[i].w);
});

test('an illustrative selected reward cannot announce its completed posterior update while parameters remain at the prior', () => {
  const state = {
      beat: 1,
      beatP: 0.2,
      cues: new Proxy(
        { 'oa-posterior-routing-update': { phase: 'during', progress: 0.5 } },
        { get: (value, key) => value[key] ?? before },
      ),
    },
    words = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => key }),
    focus: { target: (_, fn) => fn() },
    text: (_, v) => words.push(String(v)),
    rect() {},
    line() {},
    path() {},
    arrow() {},
  };
  draw({}, { id: 'posterior-routing' }, state, api);
  assert(words.some((v) => v.includes('Beta(1, 1)')));
  assert(!words.some((v) => v.includes('α: 1 → 2')));
  assert(words.some((v) => v.includes('pending')));
});

function originalLabels(id, beat, cues) {
  const painted = [];
  const state = { beat, beatP: 0.5, cues };
  const api = {
    C: new Proxy({}, { get: (_, key) => key }),
    components: { card() {} },
    teaching: {},
    focus: {
      target: (_, fn) => fn(),
      progress: (id, fallback = 0) => state.cues[id]?.progress ?? fallback,
    },
    text: (_, value, x, y, size, color) => painted.push({ text: String(value), color }),
    math: (_, value, x, y, size, color) => painted.push({ text: String(value), color }),
  };
  draw({}, { id }, state, api);
  return painted;
}
test('the second receipt stays an operand until its ordinary crossing completes', () => {
  const cues = {
    'looks-second-receipt': after,
    'looks-third-receipt': before,
    'looks-second-crossing': { phase: 'during', progress: 0.9 },
    'looks-third-crossing': before,
  };
  const pending = originalLabels('looks', 1, cues);
  assert(pending.some((v) => v.text === 'p = 0.036'));
  assert(!pending.some((v) => v.text === 'ordinary .05: crosses'));
  const done = originalLabels('looks', 1, { ...cues, 'looks-second-crossing': after });
  assert(done.some((v) => v.text === 'ordinary .05: crosses'));
});
test('a supplied third p-value remains neutral until the registered crossing and STOP complete', () => {
  const cues = {
    'looks-second-receipt': after,
    'looks-third-receipt': { phase: 'during', progress: 0.5 },
    'looks-second-crossing': after,
    'looks-third-crossing': { phase: 'during', progress: 0.9 },
  };
  const pending = originalLabels('looks', 1, cues);
  assert.equal(pending.find((v) => v.text === 'p = 0.008').color, 'blue');
  assert(!pending.some((v) => v.text.startsWith('STOP at look')));
  const done = originalLabels('looks', 1, { ...cues, 'looks-third-crossing': after });
  assert.equal(done.find((v) => v.text === 'p = 0.008').color, 'green');
  assert(done.some((v) => v.text.startsWith('STOP at look 3')));
  assert(!done.some((v) => v.text.includes('0.020')));
});
test('the supplied interval precedes its completed harmful-interval implication', () => {
  const cues = { 'ship-beat-1-focus-1': { phase: 'during', progress: 0.9 } };
  const pending = originalLabels('ship', 0, cues);
  assert(!pending.some((v) => v.text === 'HOLD PROMOTION'));
  assert(!pending.some((v) => v.text === 'Interval permits harm beyond the registered margin'));
  const done = originalLabels('ship', 0, { 'ship-beat-1-focus-1': after });
  assert(done.some((v) => v.text === 'HOLD PROMOTION'));
});
test('missing telemetry is introduced before its completed inconclusive decision', () => {
  const cue = 'ship-beat-2-focus-1';
  const initial = originalLabels('ship', 1, { [cue]: before });
  assert(
    !initial.some((v) => v.text === 'Window remains inconclusive' || v.text === 'HOLD PROMOTION'),
  );
  const during = originalLabels('ship', 1, { [cue]: { phase: 'during', progress: 0.5 } });
  assert(
    !during.some((v) => v.text === 'Window remains inconclusive' || v.text === 'HOLD PROMOTION'),
  );
  const done = originalLabels('ship', 1, { [cue]: after });
  assert(done.some((v) => v.text === 'Window remains inconclusive'));
  assert(done.some((v) => v.text === 'HOLD PROMOTION'));
});
