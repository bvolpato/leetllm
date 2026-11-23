export const EXAMPLE = Object.freeze({
  chosen: {
    policy: -3.4,
    reference: -4.0,
  },
  rejected: {
    policy: -3.4,
    reference: -3.0,
  },
  beta: 0.5,
});
export const ROUTE_FIXTURE = Object.freeze({
  request: 'How do I reach the station?',
  chosen: ['At the north entrance, turn left.', 'At the café, turn right.'],
  rejected: ['Walk past the park and river,', 'then return to the north entrance.'],
  clear: [
    [0, 0],
    [-2, 0],
    [-2, 2],
  ],
  detour: [
    [0, 0],
    [3, 0],
    [3, 3],
    [0, 3],
    [0, 0],
  ],
});
export const SHORTCUT_PAIRS = Object.freeze([
  {
    id: 'C1',
    chosen: ROUTE_FIXTURE.chosen.join(' '),
    other: ROUTE_FIXTURE.rejected.join(' '),
  },
  {
    id: 'C2',
    chosen: 'Cats are animals.',
    other: 'Cats are animals, and many people keep them as pets.',
  },
  {
    id: 'C3',
    chosen: 'Hello.',
    other: 'Hello there, I hope you are doing well today.',
  },
]);
export const CONTROLLED_CASES = Object.freeze([
  {
    id: 'H1',
    request: ROUTE_FIXTURE.request,
    good: 'Turn left, then right beside the small cafe.',
    bad: 'Turn right, then right beside the small cafe.',
    preferred: 1,
  },
  {
    id: 'H2',
    request: 'What is two plus three?',
    good: 'Adding two and three gives the answer five.',
    bad: 'Adding two and three gives the answer six.',
    preferred: 0,
  },
]);
export const ALIGNMENT_TOKEN_FIXTURE = Object.freeze({
  chosenIds: [0, 2, 1, 2, 4, 0],
  rejectedIds: [0, 2, 3, 0, 4, 0],
  mask: [1, 1, 1, 1, 1, 0],
  prompt: 2,
  chosenPolicy: [
    [0, 0, 0, 0, 0],
    [0, 2.4, 0.1, -0.8, -1],
    [0, 0.2, 2.1, -0.6, -1],
    [0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  chosenReference: [
    [0, 0, 0, 0, 0],
    [0, 0.8, 0.2, 0, -1],
    [0, 0.1, 0.9, 0, -1],
    [0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  rejectedPolicy: [
    [0, 0, 0, 0, 0],
    [0.2, -0.4, -0.2, 1.1, -1],
    [1, -0.3, -0.4, 0.2, -1],
    [0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  rejectedReference: [
    [0, 0, 0, 0, 0],
    [0.1, 0, 0, 0.6, -1],
    [0.7, 0, 0, 0.2, -1],
    [0, 0, 0, 0, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
});
export const ALIGNMENT_ORIGINAL = new Set([
  'intro',
  'pair',
  'methods',
  'reference',
  'probability',
  'loss',
  'update',
  'evaluation',
]);
