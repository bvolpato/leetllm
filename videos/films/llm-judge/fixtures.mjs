import { aggregateSwaps, receipt } from './arithmetic.mjs';
export const human = [
  'compact',
  'compact',
  'compact',
  'stepwise',
  'stepwise',
  'stepwise',
  'tie',
  'tie',
];
export const judge = [
  'compact',
  'compact',
  'compact',
  'stepwise',
  'stepwise',
  'compact',
  'stepwise',
  'tie',
];
export const labels = ['compact', 'stepwise', 'tie'];
export const policy = {
  version: 'DEP-27',
  actions: ['stop_rollout', 'run_rollback'],
};
export const candidates = {
  compact:
    'Stop the rollout and run the DEP-27 rollback procedure: payment-service has crossed its rollback threshold.',
  stepwise:
    'Payment-service has crossed its rollback threshold. Next: 1. Stop the rollout. 2. Run the DEP-27 rollback procedure.',
};
export const anchors = [
  {
    level: 0,
    description: 'A required action is missing',
    example: '“Stop the rollout.”',
  },
  {
    level: 1,
    description: 'Both actions; sequence unclear',
    example: '“Rollback and stop: both needed.”',
  },
  {
    level: 2,
    description: 'Both actions and order are clear',
    example: '“Stop rollout, then run rollback.”',
  },
];
export const stableSwap = [receipt('B'), receipt('A', true)];
export const conflictingSwap = [receipt('B'), receipt('B', true)];
export const restoreReplies = {
  alpha: 'Run the restore again.',
  beta: 'Check the restore job status.',
};
const restoreCase = { caseId: 'restore-41', config: 'clarity-v1/judge-fixture' };
export const restoreVotes = [
  { ...restoreCase, order: ['alpha', 'beta'], verdict: 'A' },
  { ...restoreCase, order: ['beta', 'alpha'], verdict: 'B' },
];
export const restoreTie = { ...restoreVotes[1], verdict: 'tie' };
export function buildJudgeRecords() {
  const records = judge.map((label, i) => ({
    human: human[i],
    outcome: aggregateSwaps(
      receipt(label === 'tie' ? 'tie' : label === 'compact' ? 'A' : 'B'),
      receipt(label === 'tie' ? 'tie' : label === 'compact' ? 'B' : 'A', true),
    ),
  }));
  records.push(
    {
      outcome: aggregateSwaps(...conflictingSwap),
    },
    {
      outcome: aggregateSwaps(receipt('review'), receipt('A', true)),
    },
  );
  return {
    records,
  };
}
export const { records } = buildJudgeRecords();
export const judgeRun = {
  tools: [],
  secrets: [],
  candidateTextRole: 'untrusted-data',
  outputRole: 'untrusted-evaluation',
};
