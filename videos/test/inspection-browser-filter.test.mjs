import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function browserFilter() {
  const source = await fs.readFile(
    process.env.INSPECTION_BROWSER_SOURCE ??
      new URL('../private-gallery/inspection/inspection.js', import.meta.url),
    'utf8',
  );
  const filters = new Map([
    ['search', { value: '' }],
    ['render-filter', { value: 'all' }],
    ['inspection-filter', { value: 'all' }],
    ['evidence-filter', { value: 'all' }],
  ]);
  const context = vm.createContext({
    document: { getElementById: (id) => filters.get(id) },
    fetch: () => new Promise(() => {}),
  });
  vm.runInContext(source, context);
  vm.runInContext('dataset = { sharedInspectionRun: {} };', context);
  return (row, filter) => {
    context.testRow = row;
    filters.get('render-filter').value = filter;
    return vm.runInContext('matches(testRow)', context);
  };
}

const row = (state) => ({
  id: 'conformal',
  title: 'Conformal',
  group: 'Models',
  findings: [],
  currentInspection: { state, directionReview: 'unrevisited' },
  correctionInspection: null,
  candidate: { inspectionRun: false },
  inspected: {},
  paperUse: {},
  mechanical: {},
  sourceDriftSinceInventory: [],
});

test('actual browser filter recognizes a verified correction while its primary is pending or failed', async () => {
  const matches = await browserFilter();
  for (const state of ['pending', 'failed']) {
    const current = row(state);
    current.correctionInspection = { state: 'complete', media: { video: { sha256: 'verified' } } };
    current.candidate = { inspectionRun: true, candidateInspectionRun: true };
    assert.equal(matches(current, 'available'), true);
    assert.equal(matches(current, 'pending'), false);
  }
});

test('prior fallback and pending corrections stay pending while completed primary remains available', async () => {
  const matches = await browserFilter(),
    current = row('pending');
  assert.equal(matches(current, 'available'), false);
  assert.equal(matches(current, 'pending'), true);
  current.correctionInspection = { state: 'rendering', media: null };
  assert.equal(matches(current, 'available'), false);
  current.currentInspection.state = 'complete';
  assert.equal(matches(current, 'available'), true);
  assert.equal(matches(current, 'pending'), false);
});

async function browserSummary(summary, sharedRun = true) {
  const source = await fs.readFile(
    process.env.INSPECTION_BROWSER_SOURCE ??
      new URL('../private-gallery/inspection/inspection.js', import.meta.url),
    'utf8',
  );
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        value: '',
        innerHTML: '',
        textContent: '',
        classList: { toggle() {}, add() {} },
        addEventListener() {},
      });
    return elements.get(id);
  };
  let deliver;
  const response = new Promise((resolve) => {
    deliver = resolve;
  });
  const context = vm.createContext({
    document: { getElementById: element, addEventListener() {} },
    fetch: () => response,
    location: { hash: '' },
  });
  vm.runInContext(source, context);
  vm.runInContext('choose = () => {};', context);
  deliver({
    ok: true,
    json: async () => ({
      sharedInspectionRun: sharedRun ? {} : null,
      summary,
      generatedAt: '2026-11-08T16:34:00Z',
      inventory: { sha256: 'a'.repeat(64) },
      lessons: [{ id: 'conformal' }],
      latestCompleted: [],
    }),
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert(!element('snapshot').textContent.startsWith('Could not load'));
  return {
    values: [...element('summary').innerHTML.matchAll(/<strong>(\d+)<\/strong>/g)].map((match) =>
      Number(match[1]),
    ),
    footer: element('footer').textContent,
  };
}

test('actual browser startup shows deduplicated77/122 while primary74 stays separate', async () => {
  const result = await browserSummary({
    lessons: 199,
    encodedVisualReviewsRecorded: 194,
    verifiedCurrentCollectionMoviesAvailable: 77,
    currentCollectionMoviesPending: 122,
    newRunComplete: 74,
    newRunPending: 125,
    newRunManualUnrevisited: 199,
  });
  assert.deepEqual(result.values, [199, 194, 77, 122, 199]);
  assert.match(result.footer, /Primary inspection run: 74 complete/);
});

test('actual browser startup preserves primary and legacy availability fallbacks', async () => {
  const primary = await browserSummary({
    lessons: 199,
    encodedVisualReviewsRecorded: 194,
    newRunComplete: 74,
    newRunPending: 125,
    newRunManualUnrevisited: 199,
  });
  assert.deepEqual(primary.values, [199, 194, 74, 125, 199]);
  const legacy = await browserSummary(
    {
      lessons: 199,
      encodedVisualReviewsRecorded: 194,
      completedCandidateMovies: 78,
      renderPending: 121,
      noEncodedVisualReviewLocated: 5,
    },
    false,
  );
  assert.deepEqual(legacy.values, [199, 194, 78, 121, 5]);
});
