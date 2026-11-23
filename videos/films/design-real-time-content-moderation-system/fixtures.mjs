import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'first',
    snapshot: 0,
  },
  cues: [
    {
      id: 'second',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export const names = [
  'Hate speech',
  'Violence',
  'Sexual content',
  'Self harm',
  'Spam',
  'Misinformation',
];
export const thresholds = [
  [0.65, 0.98],
  [0.6, 0.95],
  [0.7, 0.97],
  [0.55, 0.92],
  [0.8, 0.99],
  [0.75, 0.97],
];
export const scores = [0.1, 0.96, 0.1, 0.1, 0.85, 0.1];
export const exampleTexts = [
  'official account private access',
  'official tutorial mirror for classroom',
];
export const trustedSensitiveIntake = Object.freeze({
  SR17: Object.freeze({
    authenticated: true,
    workflow: 'S3 sensitive-review',
    authorizedReview: true,
  }),
});
export const resolvedRates = [8000, 1500, 400, 100];
export const flowRates = resolvedRates.map(
  (_, index) => 10000 - resolvedRates.slice(0, index).reduce((sum, value) => sum + value, 0),
);
export const advancedScenes = new Set([
  'review-intake',
  'capacity-ledger',
  'judge-contract',
  'modality-contract',
  'video-evidence',
  'fusion-boundary',
  'policy-release',
  'provider-migration',
  'batch-work',
  'batch-edge',
  'regional-authority',
  'evidence-scope',
  'decision-cache',
  'commit-binding',
  'appeal-labels',
  'fresh-moderation',
]);
