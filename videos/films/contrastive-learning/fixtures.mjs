export const ANGLES = [0.1, 1.4, 2.6];
export const TAU = 0.2;
export const START = 0.7;
export const NESTED_Q = [
  [1, 0, 0.9, 0.1, 0.5, 0.2],
  [0, 1, 0.1, 0.9, 0.2, 0.5],
];
export const NESTED_D = [
  [0.95, 0.05, 0.85, 0.15, 0.45, 0.25],
  [0.05, 0.95, 0.15, 0.85, 0.25, 0.45],
];
export const MINING_FIXTURE = Object.freeze([
  {
    id: 'replacement',
    text: 'Where can I replace an old API token?',
    relevant: true,
    teacher: 0.92,
  },
  {
    id: 'service account',
    text: 'How do I rotate a service account signing key?',
    relevant: false,
    teacher: 0.76,
  },
  {
    id: 'KMS intent',
    text: 'Rotate KMS encryption key material',
    relevant: false,
    teacher: 0.68,
  },
  {
    id: 'GPU guide',
    text: 'GPU driver compatibility matrix',
    relevant: false,
    teacher: 0.05,
  },
]);
