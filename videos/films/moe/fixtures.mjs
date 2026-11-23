import { route } from './arithmetic.mjs';
export const ROUTER_LOGITS = Object.freeze([-0.65, -1.77, -1.35, -3]);
export const ROUTING = route(ROUTER_LOGITS);
export const EXPERT_OUTPUTS = Object.freeze([
  [2, 0],
  [0, 4],
  [0, 3],
  [5, 0],
]);
export const BLENDED_OUTPUT = [0, 1].map((coordinate) =>
  ROUTING.selected.reduce(
    (sum, expert, index) => sum + ROUTING.weights[index] * EXPERT_OUTPUTS[expert][coordinate],
    0,
  ),
);
export const BATCH_ROUTES = Object.freeze([
  [0, 2],
  [1, 2],
  [0, 3],
  [1, 3],
  [0, 1],
  [2, 3],
]);
export const CAPACITY_ROUTES = Object.freeze([
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 1],
  [0, 2],
]);
export const REMOTE_ASSIGNMENTS = Object.freeze([
  {
    token: 0,
    source: 0,
    expert: 0,
  },
  {
    token: 1,
    source: 0,
    expert: 2,
  },
  {
    token: 2,
    source: 1,
    expert: 2,
  },
  {
    token: 3,
    source: 1,
    expert: 1,
  },
  {
    token: 4,
    source: 0,
    expert: 3,
  },
]);
export const SKEW_COUNTS = Object.freeze([12, 4, 3, 1]);
// One example router probability per expert (row) for each token (column).
export const CHOICE_SCORES = [
  [0.52, 0.48, 0.04, 0.16, 0.34],
  [0.43, 0.24, 0.38, 0.3, 0.32],
  [0.05, 0.28, 0.58, 0.54, 0.34],
];
export const MOE_INPUTS = [
  [1, 2],
  [3, 4],
  [5, 6],
];
export const MOE_ASSIGNMENTS = [
  {
    token: 0,
    expert: 2,
    gate: 0.25,
  },
  {
    token: 1,
    expert: 0,
    gate: 1,
  },
  {
    token: 2,
    expert: 2,
    gate: 0.6,
  },
  {
    token: 0,
    expert: 1,
    gate: 0.75,
  },
  {
    token: 2,
    expert: 0,
    gate: 0.4,
  },
];
export const MOE_FRESH_ROUTES = [
  [0, 1],
  [0, 1],
  [0, 2],
  [0, 2],
  [0, 3],
  [1, 3],
];
