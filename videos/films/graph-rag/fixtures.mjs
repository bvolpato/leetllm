export const RECORDS = {
  author: {
    text: 'Lena wrote River Walk.',
    allowed: true,
    version: 1,
    currentVersion: 1,
  },
  publisher: {
    text: 'River Walk was published by Willow Press.',
    allowed: true,
    version: 1,
    currentVersion: 1,
  },
};
export const EDGES = [
  {
    from: 'person:lena',
    to: 'book:river',
    relation: 'wrote',
    source: 'author',
  },
  {
    from: 'book:river',
    to: 'publisher:willow',
    relation: 'published by',
    source: 'publisher',
  },
];
export const BOOK_ENTRIES = [
  ['B1', 'Gardening'],
  ['B2', 'Gardening'],
  ['B3', 'Travel'],
  ['B3', 'Travel'],
  ['B4', 'Cooking'],
  ['B5', 'Travel'],
];
export const BOOK_TOPICS = ['Gardening', 'Travel', 'Cooking'];
export const REVIEWED_SUPPORT = [
  {
    ...EDGES[0],
    text: 'Lena wrote River Walk.',
    version: 1,
  },
  {
    ...EDGES[1],
    text: 'River Walk was published by Willow Press.',
    version: 1,
  },
];
export const COMMUNITY_BEAT_SECONDS = 18.558;
export const COMMUNITY_CUE = {
  reportsStart: 5.7,
  reportsEnd: 6.325,
  batchesStart: 7.7875,
  batchesEnd: 9.8,
  partialsStart: 10.0375,
  partialsEnd: 12.1625,
  combineStart: 12.5375,
  combineEnd: 13.6125,
};
export const CLUSTER_EDGES = [
  ['A', 'B'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'A'],
  ['A', 'C'],
  ['E', 'F'],
];
export const CONTEXT_CANDIDATES = [
  {
    id: 'relation',
    score: 0.98,
    tokens: 30,
  },
  {
    id: 'text',
    score: 0.91,
    tokens: 55,
  },
  {
    id: 'report',
    score: 0.62,
    tokens: 80,
  },
];
