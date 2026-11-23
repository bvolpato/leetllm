import { exactMatch, parseJsonLine, score } from './arithmetic.mjs';
import { confidenceFixtures, examples, freshRows } from './fixtures.mjs';
import { complete, cueProgress } from './construction.mjs';
import assert from 'node:assert/strict';

// Two possible outputs from the same starting fixture. Each run changes one thing.
const newPredictions = examples.map((row, i) =>
  i === 1 ? { ...row, prediction: 'blocked' } : row,
);
const shortenedFile = examples.filter((row) => row !== examples[1]);
export const perfectRuns = [newPredictions, shortenedFile].map((rows, i) => ({
  name: i === 0 ? 'A' : 'B',
  rows,
  result: score(rows),
}));

export const floorRuns = [5999, 6000].map((matches) => {
  const total = 9000;
  const earned = 3 * matches;
  const required = 2 * total;
  return {
    matches,
    total,
    display: (matches / total).toFixed(3),
    earned,
    required,
    pass: earned >= required,
  };
});
export function rowFrame(state) {
  const decoded = cueProgress(state, 'decode-row', 0);
  const strip = cueProgress(state, 'strip-label', 1, 0.08, 0.38);
  const lower = cueProgress(state, 'lower-label', 1, 0.48, 0.8);
  const compare = cueProgress(state, 'compare-labels', 2, 0.22, 0.55);
  const row = examples[1];
  const stripped = row.prediction.trim();
  const normalized = stripped.toLowerCase();
  return {
    decoded,
    strip,
    lower,
    compare,
    raw: row.prediction,
    rawExpected: row.expected,
    normalizedExpected: row.expected.trim().toLowerCase(),
    stripped,
    normalized,
    value: lower === 1 ? normalized : strip === 1 ? stripped : row.prediction,
    equal: compare === 1 ? exactMatch(row.expected, row.prediction) : null,
  };
}
export function batchFrame(state) {
  const parts = [
    cueProgress(state, 'append-first', 0, 0.05, 0.26),
    cueProgress(state, 'append-second', 0, 0.34, 0.58),
    cueProgress(state, 'append-third', 0, 0.67, 0.9),
  ];
  const results = examples.map((row, i) =>
    parts[i] === 1 ? exactMatch(row.expected, row.prediction) : null,
  );
  const appended = results.filter((value) => value !== null);
  const correctCount = appended.reduce((total, value) => total + Number(value), 0);
  const active = parts.findIndex((p) => p > 0 && p < 1);
  const sum = cueProgress(state, 'sum-results', 1, 0.08, 0.35),
    count = cueProgress(state, 'count-results', 1, 0.4, 0.62),
    ratio = cueProgress(state, 'divide-counts', 1, 0.7, 0.9);
  return {
    parts,
    results,
    appended,
    active,
    processed: appended.length,
    matches: sum === 1 ? correctCount : null,
    total: count === 1 ? appended.length : null,
    fraction: ratio === 1 ? correctCount / appended.length : null,
  };
}
export function copyFrame(state) {
  const b = state.beat ?? 0,
    p = state.beatP ?? 0;
  const copied =
    b === 0
      ? cueProgress(state, 'alias-list', 0, 0.08, 0.25)
      : b === 1
        ? cueProgress(state, 'copy-list', 1, 0.08, 0.25)
        : cueProgress(state, 'copy-rows', 2, 0.18, 0.28);
  const mutation = cueProgress(
    state,
    ['mutate-alias', 'mutate-shallow', 'mutate-owned'][b],
    b,
    0.55,
    0.75,
  );
  const baseline = [
    {
      expected: 'blocked',
      prediction: 'escalated',
    },
  ];
  const rowCopied = b === 2 && copied === 1;
  const trial =
    b === 0 || copied < 1
      ? baseline
      : [
          rowCopied
            ? {
                ...baseline[0],
              }
            : baseline[0],
        ];
  if (mutation === 1) trial[0].prediction = 'blocked';
  return {
    step: b,
    p,
    copied,
    mutation,
    sameList: trial === baseline,
    sameRow: trial[0] === baseline[0],
    rowCopied,
    baselinePrediction: baseline[0].prediction,
    trialPrediction: trial[0].prediction,
  };
}
export function functionFrame(state) {
  const b = state.beat ?? 0;
  const returned = cueProgress(
    state,
    b === 0 ? 'return-false' : b === 1 ? 'return-true' : 'method-error',
    b,
  );
  return {
    beat: b,
    returned,
    value: returned === 1 ? (b === 0 ? false : b === 1 ? true : 'AttributeError') : null,
  };
}
const numberLine = JSON.stringify({ ...examples[1], prediction: 7 });
const boundaryCases = [JSON.stringify(examples[1]), numberLine, numberLine.replace(/7}$/, '}')].map(
  (raw) => ({ raw, ...parseJsonLine(raw, 2) }),
);

export function boundaryFrame(state) {
  const b = state.beat ?? 0,
    parsed = cueProgress(state, b === 2 ? 'syntax-error' : 'parse-number', b === 2 ? 2 : 0);
  const checked = cueProgress(state, 'reject-number', 1, 0.32, 0.7);
  const input = boundaryCases[b === 2 ? 2 : 1];
  const diagnosis = 'line ' + input.parsed.lineNumber + ': ' + input.parsed.error;
  return {
    beat: b,
    cases: boundaryCases,
    parsed,
    checked,
    decoderSucceeded: input.decoded && parsed === 1,
    schemaRejected: b === 1 && !input.parsed.accepted && checked === 1,
    error:
      b === 2 && parsed === 1
        ? 'ValueError: ' + diagnosis
        : b === 1 && checked === 1
          ? 'TypeError: ' + diagnosis
          : null,
  };
}
export function metricFrame(state) {
  const removed = cueProgress(state, 'remove-request', 1, 0.45, 0.62),
    assertion = cueProgress(state, 'fixture-fails', 2);
  const rows = removed === 1 ? shortenedFile : examples;
  const result = score(rows);
  const baseline = score(examples);
  return {
    removed,
    assertion,
    rows,
    result,
    pending: removed > 0 && removed < 1,
    fixtureMatches: result.matches === baseline.matches && result.total === baseline.total,
  };
}
export function sampleModel(id, state) {
  if (id === 'copies') return copyFrame(state);
  if (id === 'row-values') return rowFrame(state);
  if (id === 'batch') return batchFrame(state);
  if (id === 'functions') return functionFrame(state);
  if (id === 'jsonl-boundary') return boundaryFrame(state);
  if (id === 'exact-metric') return metricFrame(state);
  if (id === 'nested-ownership') return nestedState(state);
  if (id === 'confidence-contract') return confidenceState(state);
  if (id === 'decoder-policy') return decoderState(state);
  if (id === 'fresh-input-receipt') return freshState(state);
  return {
    prediction: null,
  };
}
export function validateModel() {
  assert.equal(score(examples).fraction, 2 / 3);
  assert.deepEqual(
    perfectRuns.map(({ result }) => [result.matches, result.total]),
    [
      [3, 3],
      [2, 2],
    ],
  );
  assert.deepEqual(
    floorRuns.map((r) => [r.display, r.earned, r.required, r.pass]),
    [
      ['0.667', 17997, 18000, false],
      ['0.667', 18000, 18000, true],
    ],
  );
  assert.equal(
    rowFrame({
      beat: 2,
      beatP: 0.1,
    }).equal,
    null,
  );
  assert.equal(
    rowFrame({
      beat: 2,
      beatP: 1,
    }).equal,
    false,
  );
  assert.deepEqual(
    batchFrame({
      beat: 0,
      beatP: 1,
    }).results,
    [true, false, true],
  );
  for (const beat of [0, 1, 2]) {
    const s = copyFrame({
      beat,
      beatP: 0.8,
    });
    assert.equal(s.trialPrediction, 'blocked');
    assert.equal(s.baselinePrediction, beat === 2 ? 'escalated' : 'blocked');
  }
  assert.equal(parseJsonLine('{"prediction":7}', 2).decoded, true);
  assert.equal(parseJsonLine('{"prediction":}', 2).decoded, false);
  const deleted = metricFrame({
    beat: 2,
    beatP: 1,
  });
  assert.equal(deleted.result.fraction, 1);
  assert.equal(deleted.result.gate, true);
  assert.equal(deleted.fixtureMatches, false);
  const done = (beat, ids) => ({
    beat,
    beatP: 1,
    cues: Object.fromEntries(
      ids.map((id) => [
        id,
        {
          progress: 1,
          phase: 'after',
        },
      ]),
    ),
  });
  const shared = nestedState(done(1, ['py-nested-string', 'py-nested-tag']));
  assert.equal(shared.baseline.tags, shared.trial.tags);
  assert.equal(shared.baseline.prediction, 'escalated');
  const separate = nestedState(done(2, ['py-nested-repair', 'py-nested-append-owned']));
  assert.notEqual(separate.baseline.tags, separate.trial.tags);
  assert.deepEqual(separate.baseline.tags, []);
  assert.deepEqual(separate.trial.tags, ['review']);
  const readyToScore = freshState(
    done(2, ['py-fresh-repair', 'py-fresh-reload', 'py-fresh-score']),
  );
  assert.equal(readyToScore.rows[4].prediction, 'open');
  assert.equal(readyToScore.result, null);
  const fresh = freshState(done(3, ['py-fresh-count', 'py-fresh-floor']));
  assert.deepEqual([fresh.result.matches, fresh.result.total, fresh.result.gate], [3, 5, false]);
  assert.deepEqual(
    confidenceState(done(2, [])).map((row) => row.accepted),
    [true, true, false, false, false, false, false, false],
  );
  return true;
}
export function nestedState(state) {
  const b = state.beat ?? 0,
    copied = b > 0 || complete(state, 'py-nested-rows');
  const baseline = {
    prediction: 'escalated',
    tags: [],
  };
  const trial = copied
    ? {
        ...baseline,
      }
    : baseline;
  const copyTags = cueProgress(state, 'py-nested-repair', 2, 0.12, 0.23);
  const appendToCopy = cueProgress(state, 'py-nested-ownership-2', 2, 0.29, 0.34);
  const isolatedTags = b === 2 && copyTags === 1;
  if (isolatedTags) trial.tags = [...baseline.tags];
  if ((b === 1 && complete(state, 'py-nested-string')) || b === 2) trial.prediction = 'blocked';
  const appended =
    (b === 1 && complete(state, 'py-nested-tag')) ||
    (isolatedTags && appendToCopy === 1);
  if (appended) trial.tags.push('review');
  return {
    copied,
    copyTags,
    appendToCopy,
    isolatedTags,
    sameRow: baseline === trial,
    sameTags: baseline.tags === trial.tags,
    baseline,
    trial,
    appended,
  };
}
export function confidenceState(state) {
  const b = state.beat ?? 0,
    typed = b > 1 || (b === 1 && complete(state, 'py-confidence-type'));
  const ranged = b > 1 || (b === 1 && complete(state, 'py-confidence-range'));
  const accepted = b > 1 || (b === 1 && complete(state, 'py-confidence-valid'));
  const rejected = b > 1 || (b === 1 && complete(state, 'py-confidence-reject'));
  return confidenceFixtures.map((row) => ({
    ...row,
    stage: !typed
      ? 'pending'
      : ['bool', 'str'].includes(row.type)
        ? 'type-stop'
        : !ranged
          ? 'range-pending'
          : row.accepted
            ? accepted
              ? 'accepted'
              : 'finite-pending'
            : rejected
              ? 'range-stop'
              : 'range-pending',
  }));
}
export function freshState(state) {
  const b = state.beat ?? 0,
    decoded = b > 1 || (b === 1 && cueProgress(state, 'py-fresh-decode', 1, 0.03, 0.19) === 1);
  const repaired = cueProgress(state, 'py-fresh-repair', 2, 0.18, 0.36) === 1;
  const rows = freshRows.map((row) =>
    row.id === 505 && repaired
      ? {
          ...row,
          prediction: 'open',
        }
      : {
          ...row,
        },
  );
  const inputs = rows.map(
    (row, i) =>
      parseJsonLine(
        JSON.stringify({
          prompt: 'Access request ' + row.id + ' status?',
          expected: row.expected,
          prediction: row.prediction,
        }),
        i + 2,
      ).parsed,
  );
  const error = inputs.find((input) => !input.accepted);
  const rejected =
    b === 1 && Boolean(error) && cueProgress(state, 'py-fresh-error', 1, 0.23, 0.42) === 1;
  const noMetric = rejected && cueProgress(state, 'py-fresh-no-metric', 1, 0.55, 0.72) === 1;
  const counted = repaired && !error && cueProgress(state, 'py-fresh-count', 3, 0.18, 0.27) === 1;
  const floor = counted && cueProgress(state, 'py-fresh-floor', 3, 0.53, 0.62) === 1;
  return {
    decoded,
    rejected,
    noMetric,
    repaired,
    counted,
    floor,
    rows,
    error,
    result: counted ? score(inputs.map((input) => input.row)) : null,
  };
}
const predictionPairs = [
  ['prediction', examples[1].expected],
  ['prediction', examples[1].prediction.trim().toLowerCase()],
];

export function decoderState(state) {
  const b = state.beat ?? 0;
  const replay = b === 2;
  const firstRead = replay
    ? cueProgress(state, 'remember-name', 2, 0.35, 0.45)
    : cueProgress(state, 'first-occurrence', 1, 0.25, 0.32);
  const advance = replay
    ? cueProgress(state, 'replay-next-name', 2, 0.46, 0.54)
    : cueProgress(state, 'read-next-name', 1, 0.34, 0.48);
  const last = cueProgress(state, 'py-decoder-last', 1, 0.5, 0.58) === 1;
  const readPairs = predictionPairs.slice(0, last && !replay ? 2 : firstRead === 1 ? 1 : 0);
  const savedKey = readPairs[0]?.[0];
  const nextKey = advance === 1 ? predictionPairs[1][0] : null;
  return {
    arrayRejected: b === 0 && complete(state, 'py-decoder-array'),
    pairs: predictionPairs,
    expected: examples[1].expected,
    value: Object.fromEntries(readPairs).prediction,
    savedKey,
    nextKey,
    advance,
    last,
    compared: b === 1 && cueProgress(state, 'py-decoder-mismatch', 1, 0.72, 0.8) === 1,
    strict: replay && nextKey === savedKey && complete(state, 'py-decoder-strict'),
  };
}
