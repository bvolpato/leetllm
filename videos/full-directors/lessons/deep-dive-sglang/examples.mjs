import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export const pinnedMatch = JSON.parse(
  readFileSync(new URL('./pinned-match.json', import.meta.url), 'utf8'),
);
import { common } from '../../../films/deep-dive-sglang/arithmetic.mjs';
import {
  a,
  z,
  other,
  draft,
  target,
  payload,
  transferMs,
} from '../../../films/deep-dive-sglang/fixtures.mjs';
import { prefixReuse, budgetStep, kvHandoff } from '../../../films/deep-dive-sglang/model.mjs';
export { common, a, z, other, draft, target, payload, transferMs, prefixReuse, budgetStep };

export const requests = [
  {
    id: 'R42',
    user: 'Add dark mode to settings',
    label: 'feature',
    explanation: 'Dark mode would add a display option.',
  },
  { id: 'R43', user: 'Login button throws 500', status: 500, label: null },
];
export function prompt(r) {
  return r.label ? 'Label: ' + r.label + '\nExplanation: ' : null;
}
export function explanationState(request, copyProgress, submit, writing) {
  const assembled = copyProgress === 1 ? prompt(request) : null;
  const started = Boolean(assembled && submit);
  return {
    assembled,
    started,
    text: started ? request.explanation.slice(0, Math.ceil(writing * request.explanation.length)) : '',
  };
}
export const ids = ['A', 'B', 'C', 'D', 'E'];
export const locations = [12, 13, 14, 15];
export const cachedPage = ids.slice(0, locations.length);
export const localQueue = [
  { id: 'R51', tokens: ['X', 'Y', 'Z', 'W'] },
  { id: requests[0].id, tokens: ids },
].map(request => ({
  ...request,
  matched: prefixReuse(cachedPage, request.tokens, 'A', 'A', cachedPage.length).reusable,
}));
export const nextLocalRequest = localQueue.reduce((first, other) =>
  other.matched > first.matched ? other : first,
);
export function tierLookup(copyProgress, kernelReading) {
  const onDevice = copyProgress === 1;
  return { onDevice, inFlight: copyProgress > 0 && !onDevice, reading: onDevice && kernelReading };
}
export function poolReplay(split) {
  const prefill = [0, 20];
  const decodeStart = split ? 0 : prefill[1];
  return { prefill, decode: [decodeStart, decodeStart + 6], kvWaitFrom: split ? prefill[1] : null };
}
export const stamps = [0, 240, 280, 350];
export const gaps = stamps.slice(1).map((v, i) => v - stamps[i]);
export const first = budgetStep({ decode: 1, unmatched: 9, budget: 6 });
export const second = budgetStep({ decode: 1, unmatched: first.remaining, budget: 6 });
export function schedule(p, g) {
  return { gpuA: [1, 5], planB: [5 - 4 * p, 6 - 4 * p], gpuB: [6 - g, 10 - g] };
}
export const vocab = ['"bug"', '"feature"', '"question"', '42'];
export const raw = [0.45, 0.35, 0.15, 0.05],
  allowed = [true, true, true, false];
export function masked(probs, legal) {
  const mass = probs.reduce((v, n, i) => v + (legal[i] ? n : 0), 0);
  return { mass, dist: mass ? probs.map((p, i) => (legal[i] ? p / mass : 0)) : null };
}
export const category = { category: 'bug' };
export const jsonPrefix = '{"category":';
export const quoted = JSON.stringify(category.category);
export const agreement = common(draft, target);
export const committed = [...draft.slice(0, agreement), target[agreement]];
export const cycleTimes = [3, 9, 1],
  ordinary = 4;
export function cost(accepted) {
  const emitted = accepted + 1,
    elapsed = cycleTimes.reduce((a, b) => a + b);
  return { accepted, emitted, elapsed, per: elapsed / emitted, baseline: ordinary * emitted };
}
export function handoff(reserved, received, current, event, layout = 'L2') {
  return kvHandoff({
    reserved,
    received,
    currentAttempt: current,
    readyAttempt: event,
    readerReady: event !== null,
    layout: layout === 'L2',
  });
}
export const trials = [
  [100, 92],
  [120, 105],
].map(([offered, qualified]) => ({
  offered,
  qualified,
  fraction: qualified / offered,
  goodput: qualified / 10,
  rate: offered / 10,
  pass: qualified / offered >= 0.9,
}));
export const pin = 'f8e62a9224815cc9c6fc56b940eb7fde791a8870';
export const schedulerReview = {
  path: 'python/sglang/srt/managers/scheduler.py',
  directoryRule: '/python/sglang/srt/managers',
  owners: ['merrymercy', 'Ying1123', 'hnyls2002', 'xiezhq-hermann'],
  reviewer: { login: 'Ying1123', name: 'Ying Sheng' },
};
export function check() {
  assert.ok(('/' + schedulerReview.path).startsWith(schedulerReview.directoryRule + '/'));
  assert.ok(schedulerReview.owners.includes(schedulerReview.reviewer.login));
  assert.equal(prompt(requests[1]), null);
  assert.equal(prompt(requests[0]), 'Label: feature\nExplanation: ');
  const [settings, signIn] = requests;
  assert.equal(signIn.status, 500);
  const waiting = { assembled: null, started: false, text: '' };
  for (const progress of [0, 0.5, 1]) {
    assert.deepEqual(explanationState(signIn, progress, true, 1), waiting);
    if (progress < 1) assert.deepEqual(explanationState(settings, progress, true, 1), waiting);
  }
  assert.deepEqual(explanationState(settings, 1, false, 0), {
    assembled: prompt(settings), started: false, text: '',
  });
  assert.equal(explanationState(settings, 1, true, 0).text, '');
  assert.equal(explanationState(settings, 1, true, 1).text, settings.explanation);
  assert.equal(pinnedMatch.revision, pin);
  assert.equal(
    pinnedMatch.aligned,
    prefixReuse(pinnedMatch.tokenIds, pinnedMatch.tokenIds, 'A', 'A', pinnedMatch.pageSize)
      .reusable,
  );
  assert.equal(pinnedMatch.mismatch, 'ValueError');
  assert.deepEqual(gaps, [240, 40, 70]);
  assert.deepEqual(
    [first.prefill, first.remaining, second.prefill, second.remaining],
    [5, 4, 4, 0],
  );
  assert.equal(common(a, z), 4);
  assert.equal(common(a, other), 1);
  assert.equal(prefixReuse(ids, ids, 'A', 'B', 4).reusable, 0);
  assert.equal(prefixReuse(ids, ids, 'A', 'A', 4).reusable, locations.length);
  assert.deepEqual(localQueue.map(r => [r.id, r.matched]), [['R51', 0], ['R42', 4]]);
  assert.equal(nextLocalRequest.id, 'R42');
  for (const progress of [0, 0.5, 1]) {
    assert.equal(tierLookup(progress, false).reading, false);
    assert.equal(tierLookup(progress, true).reading, progress === 1);
    assert.equal(tierLookup(progress, false).inFlight, progress > 0 && progress < 1);
  }
  const shared = poolReplay(false), split = poolReplay(true);
  assert.deepEqual(shared.prefill, split.prefill);
  assert.deepEqual(shared.decode, [20, 26]);
  assert.deepEqual(split.decode, [0, 6]);
  assert.equal(shared.kvWaitFrom, null);
  assert.equal(split.kvWaitFrom, split.prefill[1]);
  for (const [p, g] of [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1]]) {
    const s = schedule(p, g);
    assert.deepEqual(s.gpuA, [1, 5]);
    assert.equal(s.planB[1] - s.planB[0], 1);
    assert.equal(s.gpuB[1] - s.gpuB[0], 4);
    assert.ok(s.planB[1] <= s.gpuB[0]);
    assert.ok(s.gpuB[0] >= s.gpuA[1]);
  }
  const { mass, dist } = masked(raw, allowed);
  assert.ok(Math.abs(mass - 0.95) < 1e-9);
  assert.equal(dist[3], 0);
  assert.deepEqual(masked([0.6, 0.2, 0.1, 0.1], [true, false, false, false]).dist, [1, 0, 0, 0]);
  assert.equal(masked(raw, []).dist, null);
  assert.deepEqual(JSON.parse(jsonPrefix + quoted + '}'), category);
  assert.notEqual(category.category, requests[0].label);
  assert.equal(agreement, 5);
  assert.equal(committed[5], 'lake');
  assert.equal(cost(5).per.toFixed(2), '2.17');
  assert.equal(cost(0).per, 13);
  assert.equal(payload, 512 * 2 ** 20);
  assert.equal(transferMs.toFixed(2), '21.47');
  for (const [total, beg, attempt] of [
    [512, 384, 8],
    [96, 64, 2],
  ]) {
    for (const amount of [beg, (beg + total) / 2, total]) {
      for (const event of [null, attempt - 1, attempt]) {
        assert.equal(
          handoff(total, amount, attempt, event).canDecode,
          amount === total && event === attempt,
        );
      }
    }
    assert.equal(handoff(total, total, attempt, attempt, 'L1').canDecode, false);
  }
  assert.deepEqual(
    trials.map((t) => [t.goodput, t.pass]),
    [
      [9.2, true],
      [10.5, false],
    ],
  );
  return true;
}
