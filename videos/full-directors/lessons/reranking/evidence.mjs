import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  scores,
  passageIds,
  states,
  weights,
  bias,
  equipmentPassages,
  budgetCandidates,
} from '../../../films/reranking/fixtures.mjs';
import { libraryText } from '../../../films/reranking/library-shelf.mjs';
import {
  rerank,
  packedEvidence,
  marginSelection,
  maxSimMatrix,
} from '../../../films/reranking/model.mjs';
export {
  scores,
  passageIds,
  states,
  weights,
  bias,
  equipmentPassages,
  budgetCandidates,
  libraryText,
  rerank,
  packedEvidence,
  marginSelection,
  maxSimMatrix,
};
export const notices = ['Story time', 'Holiday hours', 'Opening hours'];
export const rule =
  'Rule AUTH-14. Service accounts may use the legacy token endpoint within 14 days of deprecation if audit logging is active.';
export const referenceRule = rule.replace(
  'if audit logging is active.',
  'when audit logging is enabled.',
);
export const tokens = (s) => s.toLowerCase().split(/\s+/);
export const prefix = rule.split(' ').slice(0, 16).join(' ');
export const query = 'May service accounts use the legacy token endpoint on day 10?';
export const doc =
  'Background: migration tooling and temporary endpoints are under review. Operational notes discuss log shipping and dashboard ownership. ' +
  referenceRule;
export const docRoom = 24 - 3 - tokens(query).length;
export const docTokens = tokens(doc);
export const digest = (obj) => createHash('sha256').update(JSON.stringify(obj)).digest('hex');
export const names = ['Troubleshooting', 'Password reset', 'AUTH-14', 'Audit export'];
export const ids = [
  'api-token-troubleshooting-v1',
  'api-password-reset-v1',
  'api-token-legacy-v2-rule',
  'api-audit-export-v1',
];
export const parent = 'api-auth-v2',
  revision = 'api-auth/2026-04-01';
export const snapshot = { id: ids[2], document: 'api-auth', parent, revision, text: referenceRule };
export const sameRecord = (a, b) =>
  Object.keys(a).every((k) => a[k] === b[k]) && Object.keys(a).length === Object.keys(b).length;
const referenceTexts = [
  'Legacy token endpoint errors can be inspected during migration. This note does not authorize temporary access.',
  'Password reset tokens expire after 30 minutes.',
  referenceRule,
  'Audit logs can be exported within 14 days.',
];
export function policy(day, logging) {
  const window = day >= 0 && day <= 14;
  const features = [
    ['legacy token endpoint', 2, true],
    ['temporary access', 3, true],
    ['service accounts', 1, true],
    ['within 14 days', 2, window],
    ['audit logging is enabled', 2, logging],
    ['does not authorize', -6, true],
  ];
  const terms = referenceTexts.map((text) =>
    features
      .filter(([phrase, , enabled]) => enabled && text.toLowerCase().includes(phrase))
      .map(([, points]) => points),
  );
  const points = terms.map((row) => row.reduce((a, b) => a + b, 0));
  const order = [0, 1, 2, 3].sort((a, b) => points[b] - points[a] || a - b);
  return {
    terms,
    points,
    order,
    admitted: order.filter((id) => points[id] >= 5),
    permit: window && logging,
  };
}
export const learnedScores = [
  [-5.52, -7.8, 9.13, -6.08],
  [-4.98, -7.45, 8.56, -6.33],
];
export const logits = [2, 1, 3],
  masses = logits.map(Math.exp),
  pairLogits = [
    [2, 1],
    [3, 4],
  ];
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const loss = (gap) => Math.log1p(Math.exp(-gap));
export function preferenceExample(swap) {
  const transfer = Math.round(100 * swap);
  const hours = 120 - transfer;
  const story = 20 + transfer;
  const gap = (hours - story) / 100;
  return { hours: hours / 100, story: story / 100, gap, exponent: Math.exp(-gap), value: loss(gap) };
}
export const gain = (grade, rank) => (2 ** grade - 1) / Math.log2(rank + 1);
export const dcg = (grades) => sum(grades.slice(0, 2).map((g, i) => gain(g, i + 1)));
export const observedGrades = [0, 2, 1],
  idealGrades = [...observedGrades].sort((a, b) => b - a);
export const perms = (sent, out) =>
  sent.length === out.length &&
  new Set(out).size === sent.length &&
  out.every((v) => sent.includes(v));
export const serve = (k) => 4 + 7.5 * k,
  lockerMs = (k) => 5 + 4 * k;
export const batch = [64, 256],
  unpadded = sum(batch.map((l) => l * l)),
  padded = batch.length * Math.max(...batch) ** 2;
export function releaseReceipt() {
  const input = [0, 1, 2],
    scores = policy(10, true).points;
  const sources = [
    { id: ids[0], parent: ids[0], revision: 'api-token-troubleshooting/2026-04-20' },
    { id: ids[1], parent: ids[1], revision: 'api-password-reset/2026-01-03' },
    { id: snapshot.id, parent: snapshot.parent, revision: snapshot.revision },
  ];
  const result = [...input].sort((a, b) => scores[b] - scores[a] || a - b);
  const selected = result.filter((i) => scores[i] >= 5);
  const binaryDcg = (list) => dcg(list.map((i) => Number(i === 2)));
  return {
    input,
    result,
    selected,
    selectedSources: selected.map((i) => sources[i]),
    scores,
    oldGain: binaryDcg(input),
    newGain: binaryDcg(result),
    latency: serve(input.length),
  };
}
export function cacheKey({
  text = 'revision A',
  tenant = 'alpha',
  grant = 7,
  list = ['P', 'Q', 'R'],
} = {}) {
  return digest({
    query,
    orderedInput: list,
    sourceText: text,
    tenant,
    scope: 'library-read',
    grant,
    model: 'm1',
    tokenizer: 't1',
    template: 'v1',
    pairLimit: 24,
  });
}
export function check() {
  assert.deepEqual(
    scores.map((s) => s.toFixed(2)),
    ['0.05', '0.40', '2.30'],
  );
  assert.deepEqual(rerank([0, 1, 2]), [2, 1, 0]);
  assert.deepEqual(rerank([0, 1]), [1, 0]);
  assert.equal(libraryText[2], 'Sunday: the library is closed.');
  assert.deepEqual(
    states.map((row) => sum(row.map((v, i) => v * weights[i])) + bias),
    scores,
  );
  assert.deepEqual(policy(10, true).points, [-1, 0, 7, 2]);
  const receipt = releaseReceipt();
  assert.deepEqual(receipt.result, [2, 1, 0]);
  assert.deepEqual(receipt.selected, [2]);
  assert.deepEqual(receipt.selectedSources, [
    { id: 'api-token-legacy-v2-rule', parent: 'api-auth-v2', revision: 'api-auth/2026-04-01' },
  ]);
  assert(referenceTexts.every((text) => !JSON.stringify(receipt).includes(text)));
  assert.deepEqual([receipt.oldGain, receipt.newGain, receipt.latency], [0, 1, 26.5]);
  for (const [day, audit] of [
    [15, true],
    [10, false],
  ]) {
    const s = policy(day, audit);
    assert.equal(s.points[2], 5);
    assert.deepEqual(s.admitted, [2]);
    assert.equal(s.permit, false);
  }
  assert(sameRecord(snapshot, { ...snapshot }));
  assert(!sameRecord(snapshot, { ...snapshot, parent: 'other' }));
  assert(!sameRecord(snapshot, { ...snapshot, text: prefix }));
  assert(prefix.endsWith(' if'));
  assert.equal(rule.split(' ').length, 20);
  assert.equal(docRoom, 10);
  assert(!prefix.includes('audit logging'));
  assert(rule.includes('audit logging'));
  assert.equal(docTokens.slice(0, 10).at(-1), 'operational');
  assert(learnedScores.every((row) => row.indexOf(Math.max(...row)) === 2));
  assert.equal(((loss(1.2) + loss(-0.2)) / 2).toFixed(3), '0.531');
  for (const [swap, hours, story, gap, exponent, value] of [
    [0, 1.2, 0.2, 1, '0.368', '0.313'],
    [0.5, 0.7, 0.7, 0, '1.000', '0.693'],
    [1, 0.2, 1.2, -1, '2.718', '1.313'],
  ]) {
    const pair = preferenceExample(swap);
    assert.deepEqual([pair.hours, pair.story, pair.gap], [hours, story, gap]);
    assert.deepEqual([pair.exponent.toFixed(3), pair.value.toFixed(3)], [exponent, value]);
  }
  assert.equal(loss(0.8 - (-0.4)).toFixed(3), '0.263');
  assert.equal((masses[0] / sum(masses.slice(0, 2))).toFixed(3), '0.731');
  assert.equal((masses[0] / sum(masses)).toFixed(3), '0.245');
  assert.deepEqual(
    pairLogits.map(([y, n]) => y - n),
    [1, -1],
  );
  assert(perms(['P', 'Q', 'R'], ['Q', 'P', 'R']));
  assert(!perms(['P', 'Q', 'R'], ['Q', 'P', 'X']));
  assert.equal(
    new Set([
      cacheKey(),
      cacheKey({ text: 'revision B' }),
      cacheKey({ tenant: 'beta' }),
      cacheKey({ grant: 8 }),
      cacheKey({ list: ['R', 'Q', 'P'] }),
    ]).size,
    5,
  );
  const matrix = maxSimMatrix();
  for (let j = 0; j < 3; j++) assert(Math.abs(matrix[0][j] ** 2 + matrix[1][j] ** 2 - 1) < 1e-8);
  assert.equal(sum(matrix.map((row) => Math.max(...row))).toFixed(1), '1.7');
  assert.deepEqual(
    matrix.map((r) => Math.max(...r.slice(0, 2))),
    matrix.map((r) => Math.max(...r)),
  );
  for (const [v, sel] of [
    [
      [4, 3.5, 1],
      [0, 1],
    ],
    [
      [14, 13.5, 11],
      [0, 1],
    ],
    [[8, 7, 2], [0]],
  ])
    assert.deepEqual(marginSelection(v, 0.75), sel);
  assert.equal((dcg(observedGrades) / dcg(idealGrades)).toFixed(3), '0.521');
  assert.deepEqual([serve(3), serve(4), unpadded, padded], [26.5, 34, 69632, 131072]);
  assert.deepEqual(
    equipmentPassages.filter((r) => r.required).map((r) => r.tokens),
    [18, 26],
  );
  assert.equal(packedEvidence(4, 44).included.length, 1);
  assert.equal(lockerMs(5), 25);
  for (let budget = 40; budget <= 44; budget++) {
    const packed = packedEvidence(5, budget);
    assert.equal(packed.used, budget < 44 ? 18 : 44);
    assert.equal(packed.complete, budget === 44);
  }
  assert.deepEqual(
    packedEvidence(5, 40).packed.map((r) => r.id),
    ['member'],
  );
  assert.deepEqual(
    packedEvidence(5, 44).packed.map((r) => r.id),
    ['member', 'locker'],
  );
  assert(equipmentPassages[4].text.endsWith('Remove the battery first.'));
}
