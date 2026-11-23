import { cueProgress } from '../construction.mjs';
import { floorRuns } from '../model.mjs';
import { box, mark, text } from '../defaults.mjs';

export function drawNumericFloor(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const c = api.C;
  if (beat < 2) {
    text(ctx, api, '9,000 scored requests per run    /    floor  2/3', 180, 259, 37, c.ink);
    floorRuns.forEach((r, i) => {
      const x = 180 + i * 850;
      box(ctx, api, x, 325, 730, 216, c.muted);
      text(ctx, api, 'Report ' + (i ? 'B' : 'A'), x + 38, 389, 34, c.muted);
      mark(api, i ? 'display-b' : 'display-a', () =>
        text(ctx, api, r.display, x + 38, 491, 72, c.cyan, 'left', true),
      );
      if (beat === 1 && cueProgress(state, 'read-counts', 1, 0.02, 0.2) === 1)
        text(ctx, api, r.matches + ' / ' + r.total, x + 355, 485, 36, c.ink, 'left', true);
    });
    if (beat === 0) {
      text(ctx, api, 'Printed with  f"{score:.3f}"', 960, 723, 42, c.muted, 'center', true);
      text(ctx, api, 'Do both runs clear the floor?', 960, 870, 49, c.yellow, 'center');
      return;
    }

    const left = 350;
    const step = 260;
    const start = 5997;
    const at = (matches) => left + (matches - start) * step;
    const limit = (floorRuns[0].total * 2) / 3;
    const threshold = cueProgress(state, 'place-floor', 1, 0.28, 0.43) === 1;
    const counts = cueProgress(state, 'read-counts', 1, 0.02, 0.2) === 1;
    const extraMatch = cueProgress(state, 'one-more-match', 1, 0.2, 0.28);
    const verdict = cueProgress(state, 'count-verdict', 1, 0.65, 0.83) === 1;
    mark(api, 'count-ruler', () => {
      text(ctx, api, 'Matches near the cutoff', 180, 635, 31, c.muted);
      api.line(ctx, at(start) - 80, 787, at(start + 5) + 80, 787, c.muted, 3);
      for (let n = start; n <= start + 5; n++) {
        api.line(ctx, at(n), 775, at(n), 800, c.muted, 3);
        text(ctx, api, n, at(n), 853, 33, c.ink, 'center', true);
      }
      if (threshold) {
        api.line(ctx, at(limit), 669, at(limit), 751, c.yellow, 4);
        text(ctx, api, '2/3 floor', at(limit), 650, 31, c.yellow, 'center');
      }
      if (counts) {
        const first = at(floorRuns[0].matches);
        if (extraMatch > 0)
          api.line(
            ctx,
            first,
            787,
            first + (at(floorRuns[1].matches) - first) * extraMatch,
            787,
            c.cyan,
            5,
          );
        floorRuns.forEach((r, i) => {
          if (i === 1 && extraMatch < 1) return;
          api.circle(ctx, at(r.matches), 787, 15, c.cyan);
          text(ctx, api, i ? 'B' : 'A', at(r.matches) + 38, 748, 33, c.cyan, 'center', true);
        });
      }
    });
    if (verdict)
      floorRuns.forEach((r, i) => {
        text(
          ctx,
          api,
          (i ? 'B' : 'A') +
            '   ' +
            r.earned +
            (r.pass ? ' = ' : ' < ') +
            r.required +
            (r.pass ? '   PASS' : '   FAIL'),
          535 + i * 850,
          962,
          36,
          r.pass ? c.green : c.pink,
          'center',
          true,
        );
      });
    return;
  }

  mark(api, 'integer-rule', () => {
    text(ctx, api, 'matches / total ≥ a / b', 210, 345, 53, c.ink, 'left', true);
    text(ctx, api, 'total > 0     b > 0', 210, 426, 34, c.muted, 'left', true);
    if (cueProgress(state, 'py-numeric-positive', 2, 0.04, 0.2) === 1)
      text(ctx, api, 'multiply both sides by b × total', 210, 555, 39, c.blue);
    if (cueProgress(state, 'py-numeric-cross', 2, 0.22, 0.42) === 1)
      text(ctx, api, 'b × matches ≥ a × total', 210, 661, 54, c.cyan, 'left', true);
    if (cueProgress(state, 'py-numeric-special', 2, 0.45, 0.58) === 1)
      text(
        ctx,
        api,
        'For this scorer:  3 × matches ≥ 2 × total',
        210,
        777,
        38,
        c.ink,
        'left',
        true,
      );
  });
  mark(api, 'empty-list', () => {
    text(ctx, api, 'score_examples([])', 210, 943, 38, c.muted, 'left', true);
    if (cueProgress(state, 'py-numeric-zero', 2, 0.7, 0.92) === 1)
      text(ctx, api, 'ValueError: examples must not be empty', 725, 943, 35, c.pink, 'left', true);
  });
}

export default {
  id: 'numeric-floor',
  draw: drawNumericFloor,
  cues: [
    'py-numeric-display',
    'read-counts',
    'one-more-match',
    'place-floor',
    'count-verdict',
    'py-numeric-positive',
    'py-numeric-cross',
    'py-numeric-special',
    'py-numeric-zero',
  ],
};
