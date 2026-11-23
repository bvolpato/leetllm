import { cacheDecision } from '../model.mjs';
import { filmPainter } from '../defaults.mjs';

const stored = { key: ['deployments', 'token-A', 'tools/list', 'page-1'], receivedAt: 0 };
const privateLookup = { auth: 'token-A', cursor: 'page-1', stored, now: 10, ttlMs: 1000 };
const releaseRows = new Map([['reranker-v17', { owner: 'search', status: 'canary_clean' }]]);

function drawScopedCache(ctx, scene, state, api) {
  const { C } = api;
  const { label, line, chip, target, started, finished } = filmPainter(ctx, api);
  const done = (cue) => finished('t-scoped-cache-' + cue);
  return target('scoped-cache-mechanism', () => {
    if (state.beat === 0) {
      label('Search host  /  list-change notice', 150, 290, 40, C.cyan, 'left');
      label('Visible to the model', 480, 402, 39, C.blue);
      label('Catalog fetched for review', 1410, 402, 39, C.cyan);
      line(950, 450, 950, 813, C.muted, 2);
      chip('get_release_status', 165, 490, 630, C.blue, 80, 34);
      if (started('t-scoped-cache-refresh')) {
        chip('get_release_status', 1095, 490, 630, C.cyan, 80, 34);
        chip('promote_model', 1095, 640, 630, C.yellow, 80, 34);
        label('Declared read-only   /   review pending', 1410, 789, 31, C.yellow);
      }
      label(
        'The host keeps the previously reviewed list in the model’s context.',
        960,
        915,
        32,
        C.muted,
      );
      return;
    }
    if (state.beat === 2 && started('t-scoped-cache-caller')) {
      label('Deployments  /  authorized row lookup', 160, 288, 43, C.ink, 'left');
      const queries = [
        ['search', 'reranker-v17', 'cache-row-search'],
        ['ads', 'reranker-v17', 'cache-row-ads'],
        ['search', 'missing', 'cache-row-ads'],
      ];
      ['Verified caller', 'Requested release', 'Returned to caller'].forEach((heading, i) =>
        label(heading, [170, 615, 1220][i], 427, 34, C.muted, 'left'),
      );
      for (const [i, [caller, release, cue]] of queries.entries()) {
        const y = 541 + i * 126;
        const row = releaseRows.get(release);
        const allowed = row?.owner === caller;
        label(caller, 170, y, 41, C.blue, 'left');
        label(release, 615, y, 39, C.ink, 'left');
        if (finished(cue))
          label(
            allowed ? row.status : 'release unavailable',
            1220,
            y,
            37,
            allowed ? C.green : C.yellow,
            'left',
          );
      }
      label(
        'The server takes the caller identity from verified credentials.',
        960,
        918,
        32,
        C.muted,
      );
      return;
    }
    if (state.beat === 2) {
      label('Continuation of a paused call', 960, 259, 39, C.ink);
      chip('requestState or inputResponses present', 170, 325, 850, C.blue, 76, 30);
      if (done('retry')) chip(cacheDecision({ retry: true }), 1150, 325, 630, C.yellow, 76, 30);
      label('Send the retry to the server for current checks.', 960, 640, 39, C.ink);
      return;
    }
    label(
      'Private list   /   received 0 ms   /   now 10 ms   /   lifetime 1,000 ms',
      960,
      254,
      33,
      C.muted,
    );
    const cases = [
      ['Token A   /   page 1', { changed: done('invalidate') }, true],
      ['Token B   /   page 1', { auth: 'token-B' }, done('private')],
      ['Token A   /   page 2', { cursor: 'page-2' }, done('cursor')],
      ['Public list   /   lifetime 0 ms', { now: 0, ttlMs: 0 }, done('zero')],
    ];
    cases.forEach(([name, args, reveal], i) => {
      const y = 325 + i * 125;
      chip(name, 170, y, 850, C.blue, 76, 30);
      if (reveal) {
        const result = cacheDecision({ ...privateLookup, ...args });
        chip(result, 1150, y, 630, result === 'hit' ? C.green : C.yellow, 76, 30);
      }
    });
    if (started('t-scoped-cache-invalidate'))
      label('List-change notice for the saved private entry', 960, 895, 36, C.yellow);
  });
}

export default {
  id: 'scoped-cache',
  draw: drawScopedCache,
  cues: [
    't-scoped-cache-refresh',
    't-scoped-cache-zero',
    't-scoped-cache-private',
    't-scoped-cache-cursor',
    't-scoped-cache-invalidate',
    't-scoped-cache-retry',
    't-scoped-cache-caller',
    'cache-row-search',
    'cache-row-ads',
  ],
};
