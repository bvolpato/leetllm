export const sceneBeatCounts = Object.freeze({
  opening: 2,
  backend: 2,
  'shared-pool': 2,
  assignment: 2,
  pooling: 2,
  score: 2,
  probabilities: 2,
  'batch-update': 2,
  fallback: 2,
  precision: 4,
  autocast: 5,
  timing: 2,
  profiling: 2,
  crossover: 2,
  'memory-budget': 2,
  allocator: 3,
  'return-ticket': 1,
  'release-prerequisites': 3,
  'device-identity': 2,
  'shape-and-step': 3,
  'fallback-accounting': 3,
  'dtype-allocation': 2,
  'measurement-receipt': 2,
  'allocator-limits': 4,
  'fresh-ticket': 5,
});
export const sceneIds = Object.keys(sceneBeatCounts);
export const dimensions = {
  tickets: 4,
  positions: 8,
  features: 16,
  classes: 3,
};
export const largerBatch = {
  batch: 32,
  positions: 128,
  features: 768,
  bytesPerValue: 4,
};
export const deterministicWeights = Array.from(
  {
    length: 16,
  },
  (_, feature) =>
    Array.from(
      {
        length: 3,
      },
      (_, category) => ((((feature + 1) * (category + 1)) % 7) - 3) * 0.05,
    ),
);
export const deterministicBiases = [0.02, -0.01, 0.015];
export const ticketTexts = Object.freeze([
  'Please refund my order.',
  'My password reset link expired.',
  'When will my parcel arrive?',
  'I was charged twice.',
]);
export const classNames = Object.freeze(['Billing', 'Delivery', 'Login']);
export const mpsExtensionIds = new Set([
  'release-prerequisites',
  'device-identity',
  'shape-and-step',
  'fallback-accounting',
  'dtype-allocation',
  'measurement-receipt',
  'allocator-limits',
  'fresh-ticket',
]);
