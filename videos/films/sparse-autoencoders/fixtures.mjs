import { dotProduct, normalizeVector } from 'vizmatic';
export const dictionary = [
  [1, 0],
  [0.8, 0.6],
  [-0.6, 0.8],
  [-1, 0],
  [0, -1],
].map(normalizeVector);
export const code = [1.5, 1, 0, 0, 0];
export const target = [0, 1].map((i) =>
  dotProduct(
    code,
    dictionary.map((v) => v[i]),
  ),
);
export const candidates = [0.1, 2.4, 0.3, 1.7, 0.05];
export const OBSERVATION_CONTEXTS = [
  {
    id: 'C1',
    text: 'The cat sat.',
    pre: candidates,
  },
  {
    id: 'C2',
    text: 'The dog ran.',
    pre: [0.2, 2.2, 0.1, 1.6, 0.1],
  },
  {
    id: 'C3',
    text: 'The birds sang.',
    pre: [0.15, 2.3, 0.2, 1.9, 0.1],
  },
  {
    id: 'C4',
    text: 'The windmill turned.',
    pre: [0.1, 0.3, 0.2, 0.1, 3.1],
  },
];
export const steeringBaseline = [0.2, 0.1];
export const steeringDirection = [0, 1];
export const steeringReadouts = [
  [0, 1],
  [1, 0],
  [0.6, 0.8],
];
export const steeringBeats = [
  {
    start: 0.4,
    span: 19.728,
    from: 7.375,
    to: 18.7625,
  },
  {
    start: 20.128,
    span: 20.378,
    from: 0.1625,
    to: 6.175,
  },
];
