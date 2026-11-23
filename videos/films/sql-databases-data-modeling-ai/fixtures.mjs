export const asOf = '2026-08-12T12:00:00Z';
export const paragraph = 'Return items within fourteen days.';
export const documents = Object.freeze([
  {
    id: 'd7-old',
    workspace: 'w01',
    title: 'Return Policy',
    source: 'returns',
    from: '2026-01-01T00:00:00Z',
    to: '2026-07-01T00:00:00Z',
  },
  {
    id: 'd7',
    workspace: 'w01',
    title: 'Return Policy',
    source: 'returns',
    from: '2026-07-01T00:00:00Z',
    to: null,
  },
  {
    id: 'd9',
    workspace: 'w01',
    title: 'Staff Guide',
    source: 'staff',
    from: '2026-01-01T00:00:00Z',
    to: null,
  },
  {
    id: 'd99',
    workspace: 'w02',
    title: 'Return Policy',
    source: 'returns',
    from: '2026-01-01T00:00:00Z',
    to: null,
  },
]);
export const chunks = Object.freeze([
  {
    id: 'c7-old',
    document: 'd7-old',
    text: 'Return items within thirty days.',
  },
  {
    id: 'c7a',
    document: 'd7',
    text: paragraph,
  },
  {
    id: 'c7b',
    document: 'd7',
    text: 'Bring the receipt when you return an item.',
  },
  {
    id: 'c9a',
    document: 'd9',
    text: 'Returns above $200 need a manager.',
  },
  {
    id: 'c99',
    document: 'd99',
    text: 'Return items within seven days.',
  },
]);
export const permissions = Object.freeze([
  ['c7-old', 'Bob'],
  ['c7a', 'Alice'],
  ['c7a', 'Bob'],
  ['c7b', 'Alice'],
  ['c7b', 'Bob'],
  ['c9a', 'Alice'],
  ['c99', 'Bob'],
]);
export const replacement = Object.freeze([
  {
    id: 'c7c',
    document: 'd7-next',
    text: paragraph,
  },
  {
    id: 'c7d',
    document: 'd7-next',
    text: 'Bring the receipt when you return an item.',
  },
  {
    id: 'c7e',
    document: 'd7-next',
    text: 'Return clothing with the tags attached.',
  },
]);
export const publicationInput = Object.freeze({
  workspace: 'w01',
  previous: 'd7',
  document: 'd7-next',
  source: 'returns',
  title: 'Return Policy',
  effective: asOf,
  chunks: replacement.map((row) => ({
    ...row,
  })),
  grants: replacement.map((row) => [row.id, 'Bob']),
});
export const toyEmbeddings = Object.freeze([
  {
    id: 'E1-c99',
    chunk: 'c99',
    model: 'E1',
    vector: [3, 1],
  },
  {
    id: 'E1-c7-old',
    chunk: 'c7-old',
    model: 'E1',
    vector: [1, 1],
  },
  {
    id: 'E1-c9a',
    chunk: 'c9a',
    model: 'E1',
    vector: [1, 2],
  },
  {
    id: 'E1-c7c',
    chunk: 'c7c',
    model: 'E1',
    vector: [1, 3],
  },
  {
    id: 'E1-c7d',
    chunk: 'c7d',
    model: 'E1',
    vector: [0, 3],
  },
  {
    id: 'E1-c7e',
    chunk: 'c7e',
    model: 'E1',
    vector: [-1, 3],
  },
]);
export const SQL_ADDED_SCENES = new Set([
  'schema-contract',
  'query-null',
  'literal-substring',
  'version-guard',
  'aggregate-order',
  'delete-order',
  'role-boundary',
  'transaction-context',
  'publish-boundary',
  'idempotency-boundary',
  'plan-contract',
  'vector-contract',
  'lineage-version',
  'fresh-request',
]);
