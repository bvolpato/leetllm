import { human, judge, records, labels } from '../../../films/llm-judge/fixtures.mjs';
import { judgeReport } from '../../../films/llm-judge/model.mjs';

export { human, judge, records, labels };
export {
  candidates,
  policy,
  anchors,
  stableSwap,
  conflictingSwap,
  judgeRun,
  restoreVotes,
  restoreTie,
  restoreReplies,
} from '../../../films/llm-judge/fixtures.mjs';
export {
  receipt,
  aggregateSwaps,
  identity,
  upperAfterZero,
  belowOnePercent,
} from '../../../films/llm-judge/arithmetic.mjs';
export const structured = ['Run the rollback.', 'Do not run the rollback.'].map((prose) => ({
  version: 'DEP-27',
  action: 'run_rollback',
  prose,
}));
export const fieldMatches = (r) => r.version === 'DEP-27' && r.action === 'run_rollback';
export const searchMatches = (r) => r.prose.includes('rollback');
export const edges = Array.from({ length: 6 }, (_, i) =>
  Array.from({ length: i }, (_, j) => [j, i]),
).flat();
export const votes = [
  ['compact', 'compact'],
  ['stepwise', 'compact'],
  ['tie', 'tie'],
];
export const cleanPairs = [
  ['verdict', 'B'],
  ['evidence', ['B leads with the action.']],
];
export const duplicatePairs = [['verdict', 'A'], ...cleanPairs];
export const escapedPairs = [['verdict', 'A'], ['\\u0076erdict', 'B'], cleanPairs[1]];
// The teaching specimen is an ordered list of JSON members, before dictionary construction.
export function decodedPairs(pairs) {
  return pairs.map(([raw, val]) => [JSON.parse('"' + raw + '"'), val]);
}
export function readMembers(pairs) {
  const decoded = decodedPairs(pairs);
  const obj = Object.fromEntries(decoded);
  if (new Set(decoded.map(([key]) => key)).size !== decoded.length) return 'duplicate field';
  if (
    decoded.length !== 2 ||
    !['A', 'B', 'tie', 'review'].includes(obj.verdict) ||
    !Array.isArray(obj.evidence) ||
    !obj.evidence.length ||
    !obj.evidence.every((v) => typeof v === 'string' && v.trim())
  )
    return 'invalid shape';
  return obj.verdict;
}
export const claims = [
  ['Commander permission required', 'supported', 'supported'],
  ['Linked rollback plan required', 'supported', 'supported'],
  ['Deploy without a linked plan', 'contradicted', 'contradicted'],
  ['Commander approval optional', 'contradicted', 'supported'],
  ['Security review required', 'review', 'supported'],
  ['On-call approval required', 'review', 'supported'],
  ['Candidate requests a verdict', 'review', 'review'],
];
export const revise = judge.map((v, i) => (i === 5 ? 'stepwise' : i === 7 ? 'compact' : v));
export const countMatches = (a, b) => a.filter((v, i) => v === b[i]).length;
export const counts = (a) => labels.map((v) => a.filter((x) => x === v).length);
const groupByLabel = (ballot) => labels.flatMap((label) => ballot.filter((v) => v === label));
export const humanByLabel = groupByLabel(human);
export const judgeByLabel = groupByLabel(judge);
export const cross = humanByLabel.flatMap((h, row) =>
  judgeByLabel.map((j, col) => ({ row, col, h, j, match: h === j })),
);
const pairedMatches = countMatches(human, judge);
export const agreement = {
  pairedMatches,
  expected: cross.filter((c) => c.match).length,
  observed: pairedMatches * judge.length,
  total: cross.length,
};
export const binary = (bothAll) =>
  Array.from({ length: 100 }, (_, i) => ({ human: Boolean(bothAll) || i < 90, judge: true }));
export const isResolved = (row) => labels.includes(row.outcome);
export const matchesHuman = (row) => isResolved(row) && row.human === row.outcome;
export function reportFor(items) {
  const resolved = items.filter(isResolved);
  const comparable = resolved.filter((row) => labels.includes(row.human));
  return judgeReport({
    attempted: items.length,
    resolved: resolved.length,
    comparable: comparable.length,
    matches: comparable.filter(matchesHuman).length,
  });
}
export const extra = { outcome: 'parse failure' };
export const practice = Array.from({ length: 20 }, (_, i) =>
  i < 14
    ? { outcome: 'compact', human: i < 10 ? 'compact' : 'stepwise' }
    : { outcome: 'unresolved' },
);
export const fileCheck = {
  name: 'manifest.txt',
  expected: 'batch=41\nrows=128',
  restored: 'batch=41\nrows=128',
};
export const fileMatches = (f) => f.expected === f.restored;
