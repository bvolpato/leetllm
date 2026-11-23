import { nearestRank } from '../arithmetic.mjs';
import { LATENCY_ILLUSTRATION } from '../fixtures.mjs';

function drawSortedRequests(ctx, api) {
  const { C, focus } = api;
  const sample = nearestRank(LATENCY_ILLUSTRATION, 0.95);
  const rankReady = focus.progress('canary-nearest-rank') === 1;
  const tailReady = focus.visible('canary-sample-tail');
  const x = (i) => 120 + 81 * i,
    y = 840;
  const height = (ms) => (405 * ms) / sample.sorted.at(-1);
  focus.target('canary-sample', () => {
    api.text(ctx, 'Illustration • 20 sorted requests', 120, 274, 44, C.ink, 'left', 'serif');
    api.text(ctx, 'Friday’s sample count was not recorded.', 120, 348, 34, C.muted);
  });
  sample.sorted.forEach((ms, i) => {
    const isRank = i + 1 === sample.rank,
      last = i + 1 === sample.count;
    const color = isRank && rankReady ? C.green : last && tailReady ? C.pink : C.blue;
    focus.target(
      isRank ? 'canary-sample-rank' : last ? 'canary-sample-tail' : 'ordered-bars',
      () => {
        api.rect(ctx, x(i), y - height(ms), 57, height(ms), color, undefined, 3);
        if (i === 0 || (i + 1) % 5 === 0 || isRank)
          api.text(ctx, i + 1, x(i) + 28, y + 50, 34, color, 'center');
        if (isRank && rankReady)
          api.text(ctx, ms + ' ms', x(i) + 53, y - height(ms) - 30, 38, C.green, 'right');
        if (last && tailReady)
          api.text(ctx, ms + ' ms', x(i) + 28, y - height(ms) - 30, 38, C.pink, 'center');
      },
    );
  });
  focus.target('canary-sample-rank', () => {
    api.text(
      ctx,
      rankReady
        ? '0.95 × 20 = 19     Read the 19th request.'
        : 'Nearest rank = round up(0.95 × 20)',
      120,
      1004,
      39,
      rankReady ? C.green : C.muted,
    );
  });
}

export function drawCanary(ctx, scene, state, api) {
  if (state.beat === 2) return drawSortedRequests(ctx, api);
  const { C, focus } = api;
  const x = (ms) => 180 + ms * 2.55,
    y = 594;
  focus.target('canary-offline-access-gate-pass-both-cases', () =>
    api.text(ctx, 'B18 • both named access checks passed', 120, 281, 38, C.green),
  );
  focus.target('canary-other-required-checks-reviewed', () =>
    api.text(ctx, 'Priya approved the 5% canary', 120, 345, 37, C.ink),
  );
  focus.target('canary-latency-check', () => {
    api.line(ctx, x(0), y, x(600), y, C.muted, 5);
    for (const ms of [0, 250, 500, 600]) {
      const c = ms === 500 ? C.yellow : C.muted;
      api.line(ctx, x(ms), y - 26, x(ms), y + 28, c, 4);
      api.text(ctx, ms + ' ms', x(ms), y + 92, 34, c, 'center');
    }
    api.text(ctx, 'Strict limit', x(500), y - 75, 36, C.yellow, 'center');
    if (focus.visible('canary-latency-comparison')) {
      api.circle(ctx, x(420), y, 17, C.cyan);
      api.text(ctx, 'p95 = 420 ms', x(420), y - 75, 47, C.cyan, 'right', 'serif');
    }
  });
  api.text(ctx, 'Response time in the agreed canary window', 120, 817, 42, C.ink, 'left', 'serif');
  if (focus.visible('canary-stage-approved'))
    focus.target('canary-stage', () =>
      api.text(
        ctx,
        'Priya approved the next stage after reviewing the other checks.',
        120,
        963,
        38,
        C.green,
      ),
    );
}
export default {
  id: 'canary',
  draw: drawCanary,
  cues: [
    'canary-beat-1-focus-1',
    'canary-latency-comparison',
    'canary-stage-approved',
    'canary-beat-2-focus-1',
    'canary-beat-2-focus-2',
    'canary-illustrative-sample',
    'canary-nearest-rank',
    'canary-sample-tail',
  ],
};
