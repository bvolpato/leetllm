import {
  CLAIMS,
  POLICY_ID,
  BYPASS_TEXT,
  SLICE_OUTCOMES,
} from '../../../films/rag-evaluation/fixtures.mjs';
import {
  policyFixture,
  policyEvaluation,
  policyVariants,
  recordDigest,
  admissiblePolicy,
  abstentionOutcome,
  sliceGate,
} from '../../../films/rag-evaluation/model.mjs';
export {
  POLICY_ID,
  BYPASS_TEXT,
  SLICE_OUTCOMES,
  recordDigest,
  admissiblePolicy,
  policyEvaluation,
  abstentionOutcome,
  sliceGate,
};
export const june = policyFixture(),
  july = policyFixture(true),
  variants = policyVariants();
export const drill = june.trace.candidates[0],
  docs = june.trace.candidates[1];
export const sourceNames = {
  [POLICY_ID]: 'DEPLOY-17',
  [drill]: 'Rollback drill',
  [docs]: 'Frontend docs',
};
export const pointNames = {
  'freeze-scope': 'Freeze scope',
  approval: 'Commander approval',
  'rollback-plan': 'Linked rollback plan',
  'maintenance-window': 'Maintenance-window ID',
};
export const notices = {
  A: {
    name: 'Sunday returns',
    lines: ['Closed on Sunday.', 'Use the return box.'],
    color: '#316c63',
  },
  B: {
    name: 'Return receipts',
    lines: ['Return-box receipts are', 'emailed the next day.'],
    color: '#98563e',
  },
  C: { name: 'Friday event', lines: ['Meet the author', 'on Friday.'], color: '#657888' },
};
export const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const returnDay = 0,
  receiptDelay = 1,
  receiptDay = (returnDay + receiptDelay) % dayNames.length;
export const claim = (id) => CLAIMS.find((c) => c.id === id);
export const libraryPoints = ['closed', 'box', 'receipt'];
export function libraryScore(ids, attachments = ids.map((id) => claim(id).source)) {
  const rows = ids.map((id, i) => ({ ...claim(id), attachment: attachments[i] }));
  const supported = rows.filter((r) => r.source);
  return {
    rows,
    supported: supported.length,
    emitted: rows.length,
    present: attachments.filter(Boolean).length,
    cited: rows.filter((r) => r.source && r.source === r.attachment).length,
    points: new Set(supported.map((r) => r.point)),
  };
}
export function sourceCount(ids, required) {
  return {
    hits: required.filter((id) => ids.includes(id)).length,
    needed: required.length,
    selected: ids.length,
  };
}
export const reviewedAnswers = [Array(9).fill(true), [false]];
export function average(answers) {
  const all = answers.flat(),
    count = all.filter(Boolean).length;
  if (!answers.length || answers.some((rows) => !rows.length))
    throw Error('Separate empty answers before averaging');
  const rates = answers.map((rows) => rows.filter(Boolean).length / rows.length);
  return {
    count,
    n: all.length,
    rates,
    pooled: count / all.length,
    mean: rates.reduce((s, v) => s + v, 0) / rates.length,
  };
}
const duplicate = { ...june.complete[2], text: june.complete[1].text };
export const answers = {
  unsafe: variants[1].answer,
  partial: june.complete.slice(0, 2),
  duplicate: [...june.complete.slice(0, 2), duplicate],
  complete: june.complete,
  miscited: variants[2].answer,
  blank: variants[2].answer.map((v, i) => (i === 2 ? { ...v, citation: '' } : v)),
};
export const paraphrases = [
  june.complete[1].text,
  'Sign-off from the incident commander is mandatory.',
  'Incident commander approval is unnecessary.',
];
export const classify = (text) => june.labels.find((v) => v.text === text)?.point ?? null;
export const grades = [
  { text: 'The commander must sign off.', supported: true, verdict: true },
  { text: 'We can link the plan after rollout starts.', supported: false, verdict: true },
  { text: 'A rollback plan must be linked.', supported: true, verdict: false },
];
export function compareJudge(row) {
  if (typeof row.verdict !== 'boolean') return 'Format failure';
  if (row.verdict === row.supported) return 'Agrees';
  return row.verdict ? 'False accept' : 'False reject';
}
export const altered = structuredClone(june);
altered.records[POLICY_ID].text = altered.records[POLICY_ID].text.replace(
  'approval and',
  'approval or',
);
export const exposed = {
  ...june.trace,
  candidates: [...june.trace.candidates, 'restricted-breakglass-note'],
};
export const report = sliceGate();
export const abstentions = [
  [true, true, 'complete-supported', 'Complete answer'],
  [false, false, 'bounded-abstention', 'Bounded refusal'],
  [true, false, 'bounded-abstention', 'Bounded refusal'],
  [true, true, 'bounded-abstention', 'Bounded refusal'],
];
export function evaluated(f, rows) {
  const result = policyEvaluation(f.trace, rows, f);
  const mapped = rows.map(
    (row) => f.labels.find((label) => label.text === row.text)?.point ?? null,
  );
  const n = rows.length;
  return {
    result,
    mapped,
    rows,
    counts: [
      Math.round(result.faithfulness * n) + '/' + n,
      Math.round(result.citationSupport * n) + '/' + n,
      result.points.length + '/' + f.required.length,
    ],
  };
}
export const readerSource = 'payment-service-freeze-v2-rule';
export const readerKey = [
  'The release-freeze rule applies.',
  'Incident-commander approval is required before deployment.',
  'A linked rollback plan is required before deployment.',
];
export function readerCall(length, wrongCitation = false) {
  const rows = readerKey
    .slice(0, length)
    .map((text) => ({ text, citation: wrongCitation ? drill : readerSource }));
  const matches = rows.filter((row) => readerKey.includes(row.text));
  const cited = matches.filter((row) => row.citation === readerSource).length / rows.length;
  const covered = new Set(matches.map((row) => row.text)).size / readerKey.length;
  const outputs = [
    'faithfulness ' + (matches.length / rows.length).toFixed(2),
    'citations ' + cited.toFixed(2),
  ];
  if (cited === 1) outputs.push('completeness ' + covered.toFixed(2));
  return {
    rows,
    out: outputs.join(', ') + ': ' + (cited === 1 && covered === 1 ? 'pass' : 'stop'),
  };
}
const trial = (slice, n, k) =>
  Array.from({ length: n }, (_, i) => ({ slice, id: slice + '-' + (i + 1), correct: i < k }));
export const missingWorkflow = sliceGate([...trial('freeze', 20, 19), ...trial('hotfix', 40, 39)]);
