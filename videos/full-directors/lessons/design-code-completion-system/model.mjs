import assert from 'node:assert/strict';
import { fresh, route, promptParts } from '../../../films/design-code-completion-system/model.mjs';
import {
  prefillCohortWork,
  correctionDistribution,
  completeTraceQuantiles,
  sum,
} from '../../../films/design-code-completion-system/arithmetic.mjs';
import { phaseDurations } from '../../../films/design-code-completion-system/fixtures.mjs';

export { fresh, route, prefillCohortWork, completeTraceQuantiles, sum };
export const original = 'left  = eye()\nright = eye()';
export const holes = [original.indexOf(')'), original.lastIndexOf(')')];
export const word = '"shut"';
function editor(epoch, row) {
  const cursor = holes[row];
  return {
    text: original,
    live: {
      document: 'wink.py',
      version: 8,
      cursor,
      selection: { start: cursor, end: cursor },
      policy: 1,
      epoch,
    },
    ghost: null,
  };
}
function invalidate(s, cursor, policy = s.live.policy) {
  return {
    ...s,
    live: {
      ...s.live,
      epoch: s.live.epoch + 1,
      cursor,
      selection: { start: cursor, end: cursor },
      policy,
    },
    ghost: null,
  };
}
function send(s) {
  const current = invalidate(s, s.live.cursor);
  return { ...current, request: { saved: current.live } };
}
function replyTo(request) {
  return { saved: request.saved, insert: word };
}
function receive(s, reply) {
  return fresh(reply.saved, s.live) ? { ...s, ghost: reply } : s;
}
function apply(s, candidate = s.ghost) {
  if (!candidate || !fresh(candidate.saved, s.live)) return s;
  const { start, end } = candidate.saved.selection;
  const text = s.text.slice(0, start) + candidate.insert + s.text.slice(end);
  const next = invalidate(s, start + candidate.insert.length);
  return { ...next, text, live: { ...next.live, version: s.live.version + 1 } };
}

const start = editor(15, 0),
  first = send(start),
  moved = invalidate(first, holes[1]);
const firstAnswer = replyTo(first.request);
const stale = receive(moved, firstAnswer);
export const opening = { start, first, moved, stale, firstAnswer, tab: apply(stale, firstAnswer) };
const second = send(stale),
  painted = receive(second, replyTo(second.request));
const denied = invalidate(painted, painted.live.cursor, 2);
export const policy = { second, painted, denied, tab: apply(denied, painted.ghost) };
const old = send(editor(19, 1)),
  away = invalidate(old, holes[0]),
  back = invalidate(away, holes[1]);
const latest = send(back),
  answer23 = replyTo(latest.request),
  newReply = receive(latest, answer23),
  answer20 = replyTo(old.request),
  oldReply = receive(newReply, answer20);
export const practice = {
  old,
  away,
  back,
  latest,
  answer23,
  newReply,
  answer20,
  oldReply,
  applied: apply(oldReply),
};
export const rows = (s) => s.text.split('\n');
export function closed(s) {
  return rows(s).map((row) => row.endsWith('(' + word + ')'));
}
export const prefix = '    is_allowed = ',
  suffix = '\n    return is_allowed';
export const middle = 'graph.allows(request)';
export const prompt = ['PRE', prefix, 'SUF', suffix, 'MID'];
export const body = prefix + suffix;
export const signature = 'def check(request, graph):';
export const inlineClasses = {
  expression: { lines: [middle], cap: 24, p95: 200 },
  body: { lines: (prefix + middle + suffix).split('\n'), cap: 96, p95: 500 },
};
export const splice = (source, where, span) => source.slice(0, where) + span + source.slice(where);

export const symbols = 'a😀b';
export const prefixUnits = Array.from(symbols).slice(0, 2).join('');
export const units = [
  Array.from(prefixUnits).length,
  prefixUnits.length,
  Buffer.byteLength(prefixUnits),
];
export const lasts = Array.from(symbols).slice(units[0]).join('');
const parts = promptParts();
export const partsInOrder = ['framing', 'suffix', 'prefix', 'definitions'].map((id) =>
  parts.find((d) => d.id === id),
);
export const budget = 8000,
  offer = 900,
  fixed = sum(parts.map((p) => p.value)),
  slice = Math.min(offer, budget - fixed);
export const specimen = 'demo_api_token_abc123';
export function mask(source) {
  if (source.includes('<API_KEY_')) return null;
  let count = 0;
  return source.replace(/demo_api_token_[A-Za-z0-9]+/g, () => '<API_KEY_' + ++count + '>');
}
export const sourceA = 'key = "' + specimen + '"',
  sourceB = sourceA + '\nnote = "<API_KEY_7>"';
// The enterprise contract allows this masked inference copy and disables secondary use.
export const permittedUse = {
  inference: mask(sourceA),
  retainRawPrompt: false,
  exportForTraining: false,
};
export const stages = phaseDurations.map((ms, i) => ({
  ms,
  label: ['Client', 'Transport', 'Context', 'Queue + model', 'Paint'][i],
}));
export const immediate = sum(phaseDurations),
  debounce = 150,
  objective = inlineClasses.expression.p95;
export const cache = { header: 1200, delta: 80, miss: 72, hit: 11, decode: 24, extra: 70 };
export function service(warm, extra = 0) {
  return (warm ? cache.hit : cache.miss) + cache.decode + extra;
}
export const p = [0.2, 0.3, 0.5],
  q = [0.5, 0.2, 0.3],
  accepted = Math.min(1, p[0] / q[0]);
export const correction = correctionDistribution(p, q);
export const promptLengths = [
  [3072, 1024],
  [1024, 3072],
];
export const loads = promptLengths.map(([hit, miss]) => prefillCohortWork(hit, miss));
export const incomingTokens = promptLengths.map(([hit, miss]) => 400 * hit + 400 * miss);
const afterEight = {
  slots: [
    { id: 'A', decoded: 2 },
    { id: 'B', decoded: 6 },
  ],
  waiting: ['C'],
};
const afterCancel = {
  slots: afterEight.slots.map((request) => (request.id === 'A' ? null : request)),
  waiting: afterEight.waiting,
};
const [waitingId, ...remaining] = afterCancel.waiting;
const stepNine = {
  slots: afterCancel.slots.map((request) =>
    request
      ? { ...request, operation: 'decode' }
      : { id: waitingId, decoded: 0, operation: 'prefill' },
  ),
  waiting: remaining,
};
const afterNine = {
  slots: stepNine.slots.map(({ id, decoded, operation }) => ({
    id,
    decoded: decoded + Number(operation === 'decode'),
    operation: operation === 'prefill' ? 'ready' : 'decoded',
  })),
  waiting: stepNine.waiting,
};
export const batchSteps = [afterEight, afterCancel, stepNine, afterNine];
export const suggested = [
  'graph.allows(user)',
  'True',
  'graph.allows(request, policy.scopes, user)',
  'False',
];
export const symbolFiles = [
  { name: 'scope.py', symbols: ['PolicyGraph', 'ScopeRule', 'TokenClaims'] },
  { name: 'scope_rules.py', symbols: ['ScopeRule', 'TokenClaims', 'AuditEvent'] },
];
const [activeSymbols, candidateSymbols] = symbolFiles.map((f) => f.symbols);
export const shared = activeSymbols.filter((name) => candidateSymbols.includes(name));
export const union = new Set([...activeSymbols, ...candidateSymbols]);
export const cases = [
  { action: 'read', expected: true },
  { action: 'write', expected: false },
];
const allowedActions = new Set(['read']);
export function assess(constant) {
  const expression = constant ? suggested[1] : middle;
  return {
    expression,
    cases: cases.map(({ action, expected }) => {
      const actual = constant ? true : allowedActions.has(action);
      return { action, expected, actual, pass: actual === expected };
    }),
  };
}
export function ledger(phase) {
  const shown = [true, phase >= 3, phase >= 4, phase >= 6];
  const inserted = [
    phase >= 1 ? suggested[0].length : 0,
    phase >= 3 ? 4 : 0,
    phase >= 4 ? suggested[2].length : 0,
    0,
  ];
  const retained = [
    phase === 1 ? inserted[0] : 0,
    inserted[1],
    inserted[2] - (phase >= 5 ? 7 : 0),
    0,
  ];
  const text = suggested.map((s, i) => s.slice(0, retained[i]));
  return {
    shown,
    inserted,
    retained,
    text,
    ids: inserted.filter(Boolean).length,
    den: shown.filter(Boolean).length,
    insertedTotal: sum(inserted),
    kept: sum(retained),
  };
}
export function check() {
  assert.equal(holes[0], 12);
  assert.equal(holes[1], 26);
  assert.deepEqual(closed(opening.tab), [false, false]);
  assert.equal(stale.ghost, null);
  assert.equal(first.request.saved.selection.start, holes[0]);
  assert.equal(moved.live.version, first.live.version);
  assert.equal(painted.ghost.insert, word);
  assert.equal(policy.tab.text, original);
  assert.equal(policy.tab.ghost, null);
  assert.equal(denied.live.policy, 2);
  assert.equal(denied.live.epoch, 19);
  assert.deepEqual(
    [old.live.epoch, away.live.epoch, back.live.epoch, latest.live.epoch],
    [20, 21, 22, 23],
  );
  assert.equal(oldReply.ghost.saved.epoch, 23);
  assert.deepEqual(Object.keys(old.request), ['saved']);
  assert.deepEqual(Object.keys(latest.request), ['saved']);
  assert.equal(newReply.ghost, answer23);
  assert.equal(oldReply.ghost, answer23);
  assert.equal(answer20.insert, answer23.insert);
  assert.equal(receive(receive(latest, answer20), answer23).ghost, newReply.ghost);
  assert.deepEqual(old.request.saved.selection, latest.live.selection);
  assert.deepEqual(closed(practice.applied), [false, true]);
  assert.equal(practice.applied.live.cursor, holes[1] + word.length);
  assert.equal(practice.applied.live.version, 9);
  assert.equal(practice.applied.ghost, null);
  assert.equal(practice.applied.text, 'left  = eye()\nright = eye("shut")');
  assert.equal(route('.', true, false), 'LOCAL SEMANTIC');
  assert.equal(route('=', false, true), 'REMOTE FIM');
  assert.equal(route('=', false, false), 'LOCAL FALLBACK');
  assert.equal(route('\n', false, true), 'REMOTE FIM');
  assert.equal(route('\n', false, false), 'LOCAL FALLBACK');
  assert.deepEqual(inlineClasses.expression, { lines: [middle], cap: 24, p95: 200 });
  assert.deepEqual(inlineClasses.body.lines.join('\n'), splice(body, prefix.length, middle));
  assert.deepEqual([inlineClasses.body.cap, inlineClasses.body.p95], [96, 500]);
  assert.deepEqual(prompt, [
    'PRE',
    body.slice(0, prefix.length),
    'SUF',
    body.slice(prefix.length),
    'MID',
  ]);
  assert.equal(
    splice(body, prefix.length, middle),
    '    is_allowed = graph.allows(request)\n    return is_allowed',
  );
  assert.deepEqual(units, [2, 3, 5]);
  assert.equal(lasts, 'b');
  assert.equal(Array.from(symbols).slice(units[1]).join(''), '');
  assert.deepEqual(
    partsInOrder.map((d) => d.value),
    [200, 1000, 4500, 1800],
  );
  assert.equal(fixed, 7500);
  assert.equal(slice, 500);
  assert.equal(fixed + slice, budget);
  assert.equal(mask(sourceA), 'key = "<API_KEY_1>"');
  assert.equal(mask(sourceB), null);
  assert.deepEqual(permittedUse, {
    inference: 'key = "<API_KEY_1>"',
    retainRawPrompt: false,
    exportForTraining: false,
  });
  assert.equal(immediate, 183);
  assert.equal(objective - immediate, 17);
  assert.equal(immediate + debounce, 333);
  const traces = completeTraceQuantiles();
  assert.equal(traces.rank, 19);
  assert.equal(traces.complete, 101);
  assert.equal(traces.stageSum, 2);
  assert.equal(cache.header + cache.delta, 1280);
  assert.deepEqual([service(false), service(true), service(true, 70)], [96, 35, 105]);
  assert.equal(accepted, 0.4);
  assert.deepEqual(
    correction.probabilities.map((v) => Math.round(v * 3)),
    [0, 1, 2],
  );
  assert.deepEqual(
    loads.map((l) => [l.hit, l.miss, l.total, l.gpus]),
    [
      [307200, 409600, 716800, 36],
      [102400, 1228800, 1331200, 67],
    ],
  );
  assert.deepEqual(incomingTokens, [1638400, 1638400]);
  assert.deepEqual(afterCancel.slots, [null, { id: 'B', decoded: 6 }]);
  assert.deepEqual(afterCancel.waiting, ['C']);
  assert.deepEqual(stepNine, {
    slots: [
      { id: 'C', decoded: 0, operation: 'prefill' },
      { id: 'B', decoded: 6, operation: 'decode' },
    ],
    waiting: [],
  });
  assert.deepEqual(afterNine.slots, [
    { id: 'C', decoded: 0, operation: 'ready' },
    { id: 'B', decoded: 7, operation: 'decoded' },
  ]);
  assert.deepEqual(ledger(1).text, [suggested[0], '', '', '']);
  assert.equal(ledger(2).ids, 1);
  assert.equal(ledger(2).text[0], '');
  const result = ledger(6);
  assert.deepEqual(result.inserted, [18, 4, 42, 0]);
  assert.deepEqual(result.retained, [0, 4, 35, 0]);
  assert.equal(shared.length / union.size, 0.5);
  assert.deepEqual(
    assess(true).cases.map((r) => r.pass),
    [true, false],
  );
  assert.deepEqual(
    assess(false).cases.map((r) => r.actual),
    [true, false],
  );
  assert.ok(assess(false).cases.every((r) => r.pass));
  assert.deepEqual([result.ids, result.den, result.kept, result.insertedTotal], [3, 4, 39, 64]);
  assert.ok(result.text.every((v, i) => v.length === result.retained[i]));
}
