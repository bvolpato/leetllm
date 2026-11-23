import { erf, sigmoid } from './arithmetic.mjs';
export const CASES = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
export const activations = {
  sigmoid: {
    value: sigmoid,
    derivative: (z) => sigmoid(z) * (1 - sigmoid(z)),
  },
  tanh: {
    value: Math.tanh,
    derivative: (z) => 1 - Math.tanh(z) ** 2,
  },
  ReLU: {
    value: (z) => Math.max(0, z),
    derivative: (z) => (z > 0 ? 1 : 0),
  },
  GELU: {
    value: (z) => z * 0.5 * (1 + erf(z / Math.SQRT2)),
    derivative: (z) =>
      0.5 * (1 + erf(z / Math.SQRT2)) + (z * Math.exp((-z * z) / 2)) / Math.sqrt(2 * Math.PI),
  },
  SiLU: {
    value: (z) => z * sigmoid(z),
    derivative: (z) => sigmoid(z) + z * sigmoid(z) * (1 - sigmoid(z)),
  },
};
export const PARAMETERS = {
  w1: [
    [0.3, -0.1],
    [0.1, 0.6],
  ],
  b1: [0, 0],
  w2: [0.4, 0.1],
  b2: -0.5,
};
export const REQUESTS = [
  [2, 5],
  [6, 8],
  [1, 1],
  [8, 2],
];
export const TARGETS = [0, 1, 0, 1];
export const REQUEST_IDS = ['CA-104', 'CA-208', 'CA-311', 'CA-412'];
export const OWNER_IDS = ['w11', 'w12', 'w21', 'w22', 'b11', 'b12', 'v1', 'v2', 'c'];
