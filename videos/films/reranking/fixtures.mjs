import { dotProduct } from 'vizmatic';
export const labels = ['Weekend events', 'Holiday notice', 'Opening hours'];
export const states = [
  [0.2, 0.1],
  [0.5, 0.2],
  [2, 1],
];
export const weights = [1, 0.5];
export const bias = -0.2;
export const scores = states.map((v) => dotProduct(v, weights) + bias);
export const passageIds = ['events-v2', 'holiday-v3', 'hours-v7'];
export const equipmentPassages = [
  { id: 'hours', label: 'Hours notice', score: 3, text: 'The library closes at six.' },
  {
    id: 'member',
    label: 'Member rule',
    required: true,
    score: 8,
    text: 'Members may return borrowed cameras after closing if they use the equipment locker beside the main library entrance.',
  },
  { id: 'events', label: 'Events', score: 2, text: 'The photography club meets on Thursday.' },
  {
    id: 'returns',
    label: 'Returns guide',
    score: 4,
    text: 'Return books at the circulation desk.',
  },
  {
    id: 'locker',
    label: 'Locker instructions',
    required: true,
    score: 6,
    text: 'Use the padded tray when returning a camera to the locker. Leave its strap attached and the lens cap on the camera. Remove the battery first.',
  },
].map((p, i) => ({ ...p, rank: i + 1, tokens: p.text.split(/\s+/).length }));
export const budgetCandidates = Object.freeze(
  [
    {
      id: 'borrowing',
      label: 'Borrowing',
      state: [0.3, 0.1],
    },
    {
      id: 'fines',
      label: 'Fines',
      state: [0.6, 0.1],
    },
    {
      id: 'return-box',
      label: 'Return box',
      state: [1.8, 1.4],
    },
  ].map((row) =>
    Object.freeze({
      ...row,
      score: dotProduct(row.state, weights) + bias,
    }),
  ),
);
export const coreScenes = new Set([
  'transfer',
  'ranking-losses',
  'token-score-contracts',
  'list-input-contract',
  'policy-snapshot',
  'phrase-scorer',
  'scored-token-ledger',
  'calibration-gates',
  'metrics-construction',
  'serving-batches',
  'late-maxsim',
  'cache-input-identity',
  'trace-and-reject',
  'learned-policy-check',
  'fresh-release',
]);
