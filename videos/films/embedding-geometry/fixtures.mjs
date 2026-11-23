import { cosine, dot, l2, normalized, quantize } from './arithmetic.mjs';
export const QUERY = Object.freeze([1, 0]);
export const PASSAGES = Object.freeze([
  {
    id: 'A',
    phrase: 'fresh apple',
    vector: [1, 0.2],
  },
  {
    id: 'B',
    phrase: 'garden fruit basket',
    vector: [4, 2],
  },
]);
export const METRICS = Object.freeze(
  PASSAGES.map((row) => ({
    ...row,
    dot: dot(QUERY, row.vector),
    cosine: cosine(QUERY, row.vector),
    distance: l2(QUERY, row.vector),
  })),
);
export const UNIT_METRICS = Object.freeze(
  METRICS.map((row) => {
    const vector = normalized(row.vector);
    const score = dot(normalized(QUERY), vector);
    return {
      id: row.id,
      vector,
      score,
      squaredDistance: dot(
        normalized(QUERY).map((value, i) => value - vector[i]),
        normalized(QUERY).map((value, i) => value - vector[i]),
      ),
    };
  }),
);
export const SCALED_A = Object.freeze(PASSAGES[0].vector.map((value) => value * 10));
export const QUANTIZATION_FIXTURE = Object.freeze({
  query: [1, 0],
  step: 0.2,
  candidates: [
    [0.99, 0.13],
    [0.96, 0.28],
  ],
});
export const QUANTIZATION_RESULT = Object.freeze(
  QUANTIZATION_FIXTURE.candidates.map((vector) => ({
    vector,
    exactCosine: cosine(QUANTIZATION_FIXTURE.query, vector),
    code: quantize(vector, QUANTIZATION_FIXTURE.step),
  })),
);
export const SNAPSHOTS = {
  opening: [
    {
      stage: 0,
      active: [],
      title: 'Question → stored coordinates',
    },
    {
      stage: 1,
      active: ['Query', 'Passage A'],
      title: 'A search result begins with a score',
    },
    {
      stage: 2,
      active: ['Cosine', 'Dot product', 'L2'],
      title: 'The ruler shapes the ranking',
    },
  ],
  coordinates: [
    {
      stage: 0,
      visible: ['query'],
      phrase: 'ripe apple',
    },
    {
      stage: 1,
      visible: ['query', 'A'],
      phrase: 'fresh apple',
    },
    {
      stage: 2,
      visible: ['query', 'A', 'B'],
      phrase: 'garden fruit basket',
    },
  ],
  rulers: [
    {
      ruler: 'cosine',
      values: METRICS.map((row) => row.cosine),
      label: 'Angle after dividing by both lengths',
    },
    {
      ruler: 'distance',
      values: METRICS.map((row) => row.distance),
      label: 'Straight-line gap',
    },
    {
      ruler: 'comparison',
      values: METRICS.map((row) => row.distance),
      label: 'Direction, magnitude, and gap answer different questions',
    },
  ],
  magnitude: [
    {
      scale: 1,
      label: 'original length',
    },
    {
      scale: 10,
      label: 'same ray · target 10×',
    },
    {
      scale: 10,
      label: 'angle stays; endpoint moves',
    },
  ],
  normalize: [
    {
      active: 'A',
      reveal: 0,
      title: 'Divide each coordinate by its vector length',
    },
    {
      active: 'A',
      reveal: 1,
      title: 'Unit vector · direction stays',
    },
    {
      active: 'B',
      reveal: 1,
      title: 'Unit vectors · rulers agree',
    },
  ],
  quantization: [
    {
      stage: 0,
      codes: false,
      label: 'Full precision · two close scores',
    },
    {
      stage: 1,
      codes: true,
      label: 'Round coordinates to a 0.2 grid',
    },
    {
      stage: 2,
      codes: true,
      label: 'The candidates tie in this code',
    },
  ],
  deployment: [
    {
      stage: 0,
      eligible: 3,
      ranked: 0,
      label: 'Candidate pool',
    },
    {
      stage: 1,
      eligible: 2,
      ranked: 0,
      label: 'Authorization filter',
    },
    {
      stage: 2,
      eligible: 2,
      ranked: 2,
      label: 'Rank only eligible passages',
    },
  ],
  synthesis: [
    {
      stage: 0,
      active: ['Encoder', 'Vectors'],
      title: 'Name the representation',
    },
    {
      stage: 1,
      active: ['Transform', 'Metric'],
      title: 'Keep query and index contracts aligned',
    },
    {
      stage: 2,
      active: ['Recall@K', 'Bytes', 'Latency'],
      title: 'Test quality and cost together',
    },
  ],
};
export const PREFIX_DOCS = Object.freeze([
  [1, 0, 1, 0],
  [1, 0, 0, 1],
  [0, 1, 0, 1],
]);
export const PQ_PAIRS = Object.freeze([
  [1.2, 3.4],
  [0.8, 2.1],
  [5.3, 1.7],
  [0.4, 3.2],
]);
export const PQ_QUERY = Object.freeze([
  [1.1, 3.3],
  [0.7, 2],
  [5.2, 1.8],
  [0.3, 3.1],
]);
export const GRAPH = Object.freeze({
  query: [5, 2],
  points: {
    A: [0, 0],
    B: [3, 0],
    C: [1, 2],
    D: [4, 0],
    E: [5, 2.1],
  },
  edges: {
    A: ['B', 'C'],
    B: ['A', 'D'],
    C: ['A', 'E'],
    D: ['B'],
    E: ['C'],
  },
});
export const AUTH = Object.freeze({
  query: [0.8, -0.4, 0.6, -0.2],
  rows: [
    {
      id: 'Private',
      allow: false,
      vector: [0.05, -2, 0.05, -2],
    },
    {
      id: 'Rotation',
      allow: true,
      vector: [0.78, -0.38, 0.58, -0.22],
    },
    {
      id: 'Lifecycle',
      allow: true,
      vector: [0.1, 0.6, -0.4, -0.2],
    },
  ],
});
