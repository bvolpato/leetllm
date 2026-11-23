export const CANDIDATES = Object.freeze([
  {
    id: 'cursor-client',
    run: cursorClient,
    vector: [0.25, 0.95],
  },
  {
    id: 'oversized-page',
    run: oversizedPageClient,
    vector: [0.99, 0.02],
  },
]);
export const FIXTURE_PAGE_LIMIT = 100;
export const FIXTURE_RETRY_LIMIT = 2;
export const SEED_METADATA = Object.freeze({
  id: 'S12',
  source: 'reviewed API docs v1',
  family: 'pagination',
  taskSlice: 'Search client · pagination + rate-limit recovery',
  contract: {
    cursor: 'follow returned cursor until null',
    pageLimit: FIXTURE_PAGE_LIMIT,
    retryLimit: FIXTURE_RETRY_LIMIT,
  },
});
export const ADMISSION_GATES = Object.freeze([
  'Schema + lineage',
  'Overlap screen',
  'Trusted verifier',
  'Diversity',
  'Fixed-vote judge',
]);
export const RESERVED_TASK = 'Fetch every page with the returned cursor.';
export const ADMISSION_FIXTURES = Object.freeze([
  {
    id: 'C1',
    task: 'retry',
    text: 'Resume after a temporary rate limit.',
    seed: 'S12',
    run: cursorClient,
    vector: [0.25, 0.95],
    votes: [0.8, 0.2],
  },
  {
    id: 'C2',
    task: 'cursor',
    text: 'Follow a sequence of returned cursors.',
    seed: 'S12',
    run: cursorClient,
    vector: [0.35, 0.9],
    votes: [0.8, 0.7],
  },
  {
    id: 'C3',
    task: 'page reader',
    text: 'Read another page of results.',
    seed: 'S12',
    run: cursorClient,
    vector: [0.99, 0.02],
    votes: [0.8, 0.2],
  },
  {
    id: 'C4',
    task: 'large page',
    text: 'Fetch ten thousand rows at once.',
    seed: 'S12',
    run: oversizedPageClient,
    vector: [0.2, 0.9],
    votes: [0.8, 0.2],
  },
  {
    id: 'C5',
    task: 'fetch all pages',
    text: 'Please fetch every page with the returned cursor.',
    seed: 'S12',
    run: cursorClient,
    vector: [0.2, 0.9],
    votes: [0.8, 0.2],
  },
  {
    id: 'C6',
    task: 'resume search',
    text: 'Retry an interrupted page request.',
    seed: null,
    run: cursorClient,
    vector: [0.2, 0.9],
    votes: [0.8, 0.2],
  },
]);
export function cursorClient(fetchPage) {
  const items = [];
  let cursor = null;
  for (let page = 0; page < 4; page++) {
    let response;
    for (let attempt = 0; attempt <= 2; attempt++) {
      response = fetchPage({
        cursor,
        limit: 100,
      });
      if (response.status === 200) break;
      if (response.status !== 429 || attempt === 2) {
        return {
          complete: false,
          items,
          error: response.error,
        };
      }
    }
    items.push(...response.items);
    if (response.nextCursor === null)
      return {
        complete: true,
        items,
      };
    cursor = response.nextCursor;
  }
  return {
    complete: false,
    items,
    error: 'page safety limit reached',
  };
}
export function oversizedPageClient(fetchPage) {
  const request = {
    cursor: null,
    limit: 10000,
  };
  const response = fetchPage(request);
  return {
    complete: false,
    items: response.items,
    error: response.error,
  };
}
export function noRetryClient(fetchPage) {
  const response = fetchPage({
    cursor: null,
    limit: 100,
  });
  return {
    complete: false,
    items: response.items,
    error: response.error,
  };
}
export function firstPageOnlyClient(fetchPage) {
  let response = fetchPage({
    cursor: null,
    limit: 100,
  });
  if (response.status === 429)
    response = fetchPage({
      cursor: null,
      limit: 100,
    });
  return {
    complete: false,
    items: response.items,
    error: response.nextCursor ? 'client stopped before the next cursor' : response.error,
  };
}
export const GENERATED_CASES = Object.freeze([
  {
    id: 'C2',
    task: 'Empty cursor',
    expected: 'Stop after the final page',
    family: 0,
  },
  {
    id: 'C1',
    task: 'Temporary rate limit',
    expected: 'Bounded retry of the same cursor',
    family: 1,
  },
  {
    id: 'C4',
    task: 'Oversized page',
    expected: 'Reject a limit above 100',
    family: 2,
  },
  {
    id: 'C3',
    task: 'Another cursor wording',
    expected: 'Stop after the final page',
    family: 0,
  },
  {
    id: 'C7',
    task: 'A further cursor paraphrase',
    expected: 'Stop after the final page',
    family: 0,
  },
]);
export const TAIL_DRAWS = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.8].map((uniform, index) => ({
  id: 'S' + (index + 1),
  uniform,
}));

export const PARAPHRASE = 'Use the cursor to read all remaining results.';
export const NOVELTY_EXAMPLE = {
  references: [
    [1, 0],
    [0, 1],
  ],
  cutoff: 0.82,
  proposals: [
    { ...ADMISSION_FIXTURES[0], id: 'B', vector: [0.45, 0.4] },
    { ...ADMISSION_FIXTURES[0], id: 'C', vector: [0.46, 0.41] },
  ],
};
export const LOG_ANSWERS = [
  {
    answer: 'Log the request ID.',
    log: (event) => ({ emailRequest: 'declined', record: { request_id: event.request_id } }),
  },
  {
    answer: 'Log the customer email.',
    log: (event) => ({ emailRequest: 'success', record: { customer_email: event.customer_email } }),
  },
];
export const RELEASE_SUITES = [
  { id: 'common', label: 'Ordinary searches', count: 92, total: 100, limit: 90 },
  { id: 'rare', label: 'Retry, then paginate', count: 38, total: 50, limit: 40 },
  { id: 'unsafe', label: 'Unsafe answers', count: 1, total: 200, limit: 2 },
];
