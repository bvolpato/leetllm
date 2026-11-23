import assert from 'node:assert/strict';
import {
  examples,
  confidenceFixtures,
  freshRows,
} from '../../../films/python-for-ai-engineering/fixtures.mjs';
import { exactMatch, parseJsonLine } from '../../../films/python-for-ai-engineering/arithmetic.mjs';

export const rows = examples.map((row) => ({ ...row, id: Number(row.prompt.match(/\d+/)[0]) }));
export const corrected = rows.map((row) =>
  row.id === 102 ? { ...row, prediction: row.expected } : row,
);
export const omitted = rows.filter((row) => row.id !== 102);
export const decisions = (list) => list.map((row) => exactMatch(row.expected, row.prediction));
export const bool = (value) => (value ? 'True' : 'False');
export const quoted = (value) => JSON.stringify(value);

export function counts(matches, total, a = 2, b = 3) {
  if (
    !Number.isInteger(matches) ||
    !Number.isInteger(total) ||
    total <= 0 ||
    matches < 0 ||
    matches > total ||
    b <= 0
  )
    throw new RangeError('Expected valid counts and a positive denominator');
  const earned = b * matches,
    required = a * total;
  return {
    matches,
    total,
    earned,
    required,
    pass: earned >= required,
    display: (matches / total).toFixed(3),
    ratio: matches + '/' + total,
  };
}
export function score(list) {
  return counts(decisions(list).filter(Boolean).length, list.length);
}
export const closeRuns = [5999, 6000].map((m) => counts(m, 9000));

export function owners(mode, edit, tag) {
  const baseline = [
    { expected: rows[1].expected, prediction: rows[1].prediction.trim().toLowerCase(), tags: [] },
  ];
  const trial =
    mode === 'alias' ? baseline : mode === 'list' ? [...baseline] : baseline.map((r) => ({ ...r }));
  if (mode === 'tags') trial[0].tags = [...trial[0].tags];
  if (edit) trial[0].prediction = 'blocked';
  if (tag) trial[0].tags.push('review');
  return {
    baseline,
    trial,
    sameList: baseline === trial,
    sameRow: baseline[0] === trial[0],
    sameTags: baseline[0].tags === trial[0].tags,
  };
}
const raw = (row) => JSON.stringify(row);
export const lineCases = [
  raw(examples[1]),
  raw({ ...examples[1], prediction: 7 }),
  raw({ ...examples[1], prediction: 7 }).replace(/7}$/, '}'),
];
export function parse(line, number) {
  const { decoded, parsed } = parseJsonLine(line, number);
  if (parsed.accepted) return { decoded, row: parsed.row };
  const reason = parsed.error;
  const type =
    !decoded || reason.includes('empty')
      ? 'ValueError'
      : reason.startsWith('missing')
        ? 'KeyError'
        : 'TypeError';
  return { decoded, type, message: 'line ' + number + ': ' + reason, line: number };
}
export function readLines(lines) {
  const accepted = [];
  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    const result = parse(line, i + 1);
    if (result.type) return { accepted, error: result };
    accepted.push(result.row);
  }
  if (!accepted.length)
    return { accepted, error: { type: 'ValueError', message: 'input file has no examples' } };
  return { accepted, returned: accepted };
}
export const validLines = examples.map(raw);
export const validLoad = readLines(validLines);
export const fileB = readLines(omitted.map(raw)).returned;
export const countTestBaseline = score(rows);
export const countTestFileB = score(fileB);
export const fourLines = [
  '',
  raw(examples[0]),
  '',
  raw({ prompt: examples[1].prompt, expected: 'blocked' }),
];
export const fiveLines = [...fourLines.slice(0, 3), '[]', fourLines[3]];
export const practice = freshRows.map((row) => ({
  ...row,
  prompt: 'Access request ' + row.id + ' status?',
}));
export const repaired = practice.map((r) => (r.id === 505 ? { ...r, prediction: 'open' } : r));
export const practiceLoad = (list) => readLines(['', ...list.map(raw)]);
export const quarantineInput = [
  ...rows,
  { id: 104, prompt: 'Access request 104 status?', expected: 'open', prediction: 7 },
];
export const audit = quarantineInput.map((row, i) => ({
  id: row.id,
  prediction: row.prediction,
  result: parse(raw(row), i + 1),
}));
export const subset = score(audit.filter((x) => x.result.row).map((x) => x.result.row));
export const coverage = counts(subset.total, audit.length, 95, 100);

export function decodePairs(pairs, strict = false) {
  const dict = Object.create(null);
  for (const [key, value] of pairs) {
    if (strict && Object.hasOwn(dict, key)) return { duplicate: key };
    dict[key] = value;
  }
  return { dict };
}
export const paired = [
  ['prompt', 'Q'],
  ['expected', 'hold'],
  ['expected', ' SENT '],
  ['prediction', 'sent'],
  ['confidence', true],
];
export const unique = paired.filter((_, i) => i !== 1);
export const probability = confidenceFixtures.map((f) => {
  const numeric = ['int', 'float'].includes(f.type);
  const n = f.decoded === 'inf' ? Infinity : Number(f.decoded);
  const inRange = n >= 0 && n <= 1;
  return {
    ...f,
    verdict: !numeric ? 'TypeError' : !inRange || !Number.isFinite(n) ? 'ValueError' : 'accept',
  };
});
export const decimalInputs = ['1.0000000000000000', '1.0000000000000001'];
export const linePattern = /^line 2:/;
export const testReport = (examples) =>
  examples.map((v) => parse(raw({ ...rows[1], prediction: v }), 2));

export function check() {
  assert.deepEqual(decisions(rows), [true, false, true]);
  assert.equal(score(rows).ratio, '2/3');
  assert.deepEqual([score(corrected).ratio, score(omitted).ratio], ['3/3', '2/2']);
  assert.deepEqual(
    omitted.map((r) => r.id),
    [101, 103],
  );
  assert.equal(exactMatch(' BLOCK ED ', 'blocked'), false);
  assert.equal(exactMatch('open', ' OPEN '), true);
  assert.deepEqual(
    ['alias', 'list', 'rows'].map((m) => owners(m, true, false).baseline[0].prediction),
    ['blocked', 'blocked', 'escalated'],
  );
  for (const [mode, shared] of [
    ['rows', true],
    ['tags', false],
  ]) {
    const state = owners(mode, true, true);
    assert.equal(state.sameTags, shared);
    assert.deepEqual(state.baseline[0].tags, shared ? ['review'] : []);
    assert.deepEqual(state.trial[0].tags, ['review']);
  }
  assert.deepEqual(
    lineCases.map((s) => parse(s, 2).type ?? 'ok'),
    ['ok', 'TypeError', 'ValueError'],
  );
  assert.equal(readLines(fourLines).error.message, 'line 4: missing prediction');
  assert.equal(readLines(fiveLines).error.message, 'line 4: expected a JSON object');
  assert.equal(readLines(fiveLines).accepted.length, 1);
  assert.equal(readLines(fiveLines).returned, undefined);
  assert.deepEqual(validLoad.returned, examples);
  assert.deepEqual(Object.keys(validLoad.returned[1]), ['prompt', 'expected', 'prediction']);
  assert.deepEqual(fileB, [examples[0], examples[2]]);
  assert.deepEqual([countTestBaseline.ratio, countTestFileB.ratio], ['2/3', '2/2']);
  assert.deepEqual(
    audit.map(({ result }) => (result.row ? decisions([result.row])[0] : result.type)),
    [true, false, true, 'TypeError'],
  );
  assert.equal(audit[3].prediction, 7);
  assert.equal(audit[3].result.message, 'line 4: prediction must be a string');
  assert.deepEqual(
    [subset.ratio, subset.pass, coverage.ratio, coverage.pass],
    ['2/3', true, '3/4', false],
  );
  assert.equal(decodePairs(paired, true).duplicate, 'expected');
  for (const [pairs, strict] of [
    [paired, false],
    [unique, false],
    [unique, true],
  ]) {
    const { dict } = decodePairs(pairs, strict);
    assert.equal(exactMatch(dict.expected, dict.prediction), true);
    assert.equal(Object.hasOwn(parse(raw(dict), 1).row, 'confidence'), false);
  }
  assert.deepEqual(
    probability.map((r) => r.verdict),
    confidenceFixtures.map((r) => r.error ?? 'accept'),
  );
  assert.deepEqual(decimalInputs.map(Number), [1, 1]);
  assert.deepEqual(
    closeRuns.map((r) => [r.display, r.earned, r.pass]),
    [
      ['0.667', 17997, false],
      ['0.667', 18000, true],
    ],
  );
  assert.throws(() => score([]), RangeError);
  assert.deepEqual(
    testReport([7, true, null, [], {}]).map((r) => [r.type, linePattern.test(r.message)]),
    Array(5).fill(['TypeError', true]),
  );
  assert.equal(linePattern.test(parse(lineCases[1], 20).message), false);
  assert.equal(practiceLoad(practice).error.message, 'line 6: prediction must be a string');
  const result = score(practiceLoad(repaired).returned);
  assert.deepEqual(
    [result.ratio, result.display, result.earned, result.required, result.pass],
    ['3/5', '0.600', 9, 10, false],
  );
  assert.deepEqual(
    repaired.filter((_, i) => !decisions(repaired)[i]).map((r) => r.id),
    [502, 505],
  );
  return true;
}
