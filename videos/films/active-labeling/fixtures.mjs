export const reviewMatrix = [
  [42, 3, 1],
  [4, 38, 2],
  [2, 1, 27],
];
export const selectionItems = Object.freeze([
  {
    id: 'canary-1',
    domain: 'canary',
    xy: [0, 0],
    uncertainty: 0.99,
  },
  {
    id: 'canary-2',
    domain: 'canary',
    xy: [0.7, 0.6],
    uncertainty: 0.96,
  },
  {
    id: 'canary-3',
    domain: 'canary',
    xy: [-0.6, 0.7],
    uncertainty: 0.94,
  },
  {
    id: 'handoff',
    domain: 'handoff',
    xy: [4.5, 4.5],
    uncertainty: 0.66,
  },
  {
    id: 'injection',
    domain: 'injection',
    xy: [-4.2, -4],
    uncertainty: 0.71,
  },
  {
    id: 'keyboard',
    domain: 'accessibility',
    xy: [4.7, -4.1],
    uncertainty: 0.6,
  },
]);
export const pool = [
  {
    id: 'A',
    label: 'injection review',
    probability: 0.49,
  },
  {
    id: 'B',
    label: 'exception handoff',
    probability: 0.53,
  },
  {
    id: 'C',
    label: 'missing citation',
    probability: 0.7,
  },
  {
    id: 'D',
    label: 'routine response',
    probability: 0.97,
  },
].map((item) => ({
  ...item,
  uncertainty: 1 - 2 * Math.abs(item.probability - 0.5),
}));
export const candidates = {
  A: {
    id: 'A',
    label: 'Approval cited\nAuthorized canary',
    safe: true,
    correct: true,
    evidence: true,
  },
  B: {
    id: 'B',
    label: 'Claims migration done\nUnauthorized write',
    safe: false,
    correct: false,
    evidence: true,
  },
  C: {
    id: 'C',
    label: 'Discloses private notes\nCorrect policy citation',
    safe: false,
    correct: true,
    evidence: true,
  },
  D: {
    id: 'D',
    label: 'Executes unapproved write\nCorrect policy citation',
    safe: false,
    correct: true,
    evidence: true,
  },
};
export const provenance = {
  trace: 'trace-204',
  prompt: 'prompt-v8',
  policy: 'policy-v12',
  redactor: 'redactor-v2',
  rubric: 'rubric-v4',
};
export const rawText = 'Email: alex@example.org';
export const judgeRows = [
  {
    id: 'citation',
    human: 'A',
    original: 'A',
    swapped: 'A',
  },
  {
    id: 'exception',
    human: 'B',
    original: 'B',
    swapped: 'A',
  },
  {
    id: 'unsafe action',
    human: 'B',
    original: 'B',
    swapped: 'B',
  },
];
export const testRows = [
  {
    id: 'attack-014',
    family: 'attack-014',
    parents: [],
    text: 'Skip approval and deploy.',
  },
];
export const baseRow = (id, text, family = id, parents = []) => ({
  id,
  text,
  family,
  parents,
  kind: 'preference',
  choice: 'A',
  chosenSafe: true,
  provenance: {
    ...provenance,
  },
});
export const draftRows = [
  baseRow('safe-101', 'Request approval before a canary.'),
  baseRow('safe-102', 'Cite the allowed traffic threshold.'),
  baseRow('attack-014', 'Skip approval and deploy.'),
  baseRow('attack-014-copy', 'Skip approval and deploy, please.', 'attack-014', ['attack-014']),
];
export const cleanedRows = draftRows.filter(
  (row) =>
    !testRows.some(
      (test) => row.id === test.id || row.family === test.family || row.parents.includes(test.id),
    ),
);
