import { coverageIntervals } from '../fixtures.mjs';
import { afterCue, cue, event } from '../construction.mjs';
import { wilson } from '../model.mjs';
import { axes, caption, equation, focusTarget, interval, text } from '../defaults.mjs';

const ten = wilson(0, 10);
const twenty = wilson(0, 20);
const all = wilson(10, 10);
const pct = (p) => (p * 100).toFixed(1) + '%';

function coverage(ctx, state, api) {
  const { C } = api;
  const plot = axes(
    ctx,
    api,
    380,
    370,
    1120,
    480,
    [0.02, 0.36],
    [0, 25],
    [0.05, 0.1, 0.16, 0.2, 0.3, 0.35],
    [],
    'population rate',
  );
  focusTarget(ctx, api, 'sim-design', () => {
    text(ctx, api, 'Fresh samples · 100 independent labels each', 960, 255, 38, C.ink, 'center');
    if (cue(state, 'fix-rate', 0.2, 0.29) > 0) {
      const truth = plot.point(0.16, 0);
      api.line(ctx, truth.x, 360, truth.x, 855, C.yellow, 4);
      text(ctx, api, 'Fixed rate 16%', truth.x, 332, 31, C.yellow, 'center');
    }
  });
  const visible = Math.ceil(coverageIntervals.length * cue(state, 'coverage-build', 0.3, 0.47));
  focusTarget(ctx, api, 'coverage-intervals', () => {
    coverageIntervals
      .slice(0, visible)
      .forEach((r, i) =>
        interval(ctx, api, plot, r.interval, 24 - i, r.covers ? C.green : C.red, 1, r.k / r.n),
      );
  });
  focusTarget(ctx, api, 'miss-count', () => {
    if (afterCue(state, 'count-misses', 0.54, 0.6)) {
      const misses = coverageIntervals.filter((r) => !r.covers).length;
      caption(ctx, api, visible - misses + ' cover the fixed rate · ' + misses + ' miss');
    } else if (visible) caption(ctx, api, visible + ' intervals');
  });
}

export function drawBoundary(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat;
  if (beat === 5 && cue(state, 'switch-size', 0.12, 0.2) > 0) {
    coverage(ctx, state, api);
    return;
  }

  const transfer = beat === 2 || beat === 3;
  const mirror = beat >= 4;
  const pink = Math.ceil(10 * event(state, 4, 'all-wilson', 0.13, 0.37));
  const extra = transfer ? Math.ceil(10 * event(state, 2, 'add-clean', 0.01, 0.25)) : 0;
  const opened = Math.ceil(10 * event(state, 0, 'open-ten', 0.15, 0.53));
  focusTarget(ctx, api, 'boundary-labels', () => {
    for (let i = 0; i < 10 + extra; i++) {
      const x = 420 + (i % 10) * 120;
      const y = 315 + Math.floor(i / 10) * 68;
      if (i < opened || i >= 10) {
        api.circle(ctx, x, y, 20, i < pink ? C.pink : C.blue);
      } else {
        api.rect(ctx, x - 26, y - 18, 52, 36, C.panel, C.muted, 4);
        api.line(ctx, x - 22, y - 14, x, y + 2, C.muted, 2);
        api.line(ctx, x, y + 2, x + 22, y - 14, C.muted, 2);
      }
    }
    text(
      ctx,
      api,
      pink + ' specialist / ' + (opened + extra) + ' reviewed',
      960,
      248,
      38,
      C.ink,
      'center',
    );
  });

  const rateX = (p) => 285 + 1350 * p;
  api.line(ctx, rateX(0), 705, rateX(1), 705, C.muted, 3);
  for (const rate of [0, 0.25, 0.5, 0.75, 1]) {
    const x = rateX(rate);
    api.line(ctx, x, 704, x, 718, C.muted, 2);
    text(ctx, api, 100 * rate + '%', x, 762, 28, C.muted, 'center');
  }
  function whisker(low, high, y, color, width = 7) {
    api.line(ctx, rateX(low), y, rateX(high), y, color, width);
    for (const p of [low, high]) api.line(ctx, rateX(p), y - 14, rateX(p), y + 14, color, 3);
  }

  if (beat === 0) {
    caption(ctx, api, 'Specialist share in the population');
    return;
  }
  if (beat === 1 && cue(state, 'zero-wald', 0.01, 0.12) > 0)
    focusTarget(ctx, api, 'collapsed-wald', () => {
      api.circle(ctx, rateX(0), 477, 11, C.red);
      text(ctx, api, 'Wald · both ends at zero', rateX(0) + 35, 488, 31, C.red);
    });

  const extend = event(state, 1, 'zero-wilson', 0.14, 0.25);
  if (extend > 0)
    focusTarget(ctx, api, 'zero-score-range', () => {
      const known = beat > 1 || afterCue(state, 'zero-ten', 0.91, 0.99);
      const faded = transfer || mirror;
      const y = faded ? 490 : 585;
      whisker(0, ten.high * extend, y, faded ? C.muted : C.green, faded ? 4 : 8);
      text(
        ctx,
        api,
        'Wilson · 0/10' + (known ? ' · upper ' + pct(ten.high) : ''),
        rateX(ten.high) + 32,
        y + 11,
        31,
        faded ? C.muted : C.green,
      );
      if (beat === 3) {
        const q = cue(state, 'narrow-cap', 0.37, 0.53);
        if (q > 0) {
          whisker(0, api.lerp(ten.high, twenty.high, q), 605, C.green);
          text(ctx, api, 'Wilson · 0/20', rateX(ten.high) + 32, 616, 31, C.green);
        }
      }
    });
  if (mirror) {
    focusTarget(ctx, api, 'all-score-range', () => {
      const q = event(state, 4, 'mirror-range', 0.39, 0.55);
      if (q > 0) {
        whisker(1 - q * (1 - all.low), 1, 605, C.cyan);
        text(ctx, api, 'Wilson · 10/10', rateX(all.low) - 35, 615, 31, C.cyan, 'right');
      }
      if (beat === 5 || afterCue(state, 'mirror-ends', 0.59, 0.95))
        text(
          ctx,
          api,
          'Compatible population rates · ' + pct(all.low) + ' to 100%',
          960,
          910,
          42,
          C.cyan,
          'center',
        );
    });
    return;
  }

  focusTarget(ctx, api, 'zero-bound', () => {
    if (event(state, 1, 'zero-formula', 0.39, 0.52) === 0) return;
    text(ctx, api, 'Upper end with zero positives', 525, 840, 31, C.muted, 'center');
    equation(ctx, api, 'U=\\frac{1.96^2}{n+1.96^2}', 525, 940, 53, C.ink, 'center');
    if (beat === 1 && cue(state, 'plug-ten', 0.71, 0.79) === 0) return;
    const substituted = beat === 3 && cue(state, 'plug-twenty', 0.01, 0.15) > 0;
    const n = transfer ? (substituted ? '20' : '?') : '10';
    const solved = transfer
      ? beat === 3 && afterCue(state, 'zero-twenty', 0.53, 0.65)
      : afterCue(state, 'zero-ten', 0.91, 0.99);
    text(
      ctx,
      api,
      transfer && extra < 10
        ? 'Opening the second row'
        : transfer
          ? 'Twenty reviewed · zero positives'
          : 'Ten reviewed · zero positives',
      1340,
      840,
      31,
      C.muted,
      'center',
    );
    const answer = solved
      ? '\\approx ' + pct(transfer ? twenty.high : ten.high).replace('%', '\\%')
      : '=\\;?';
    equation(ctx, api, '\\frac{3.84}{' + n + '+3.84}' + answer, 1340, 940, 50, C.green, 'center');
  });
}

export default {
  id: 'boundary',
  draw: drawBoundary,
  cues: [
    'open-ten',
    'zero-wald',
    'zero-wilson',
    'zero-formula',
    'plug-ten',
    'zero-ten',
    'add-clean',
    'plug-twenty',
    'narrow-cap',
    'zero-twenty',
    'all-wilson',
    'mirror-range',
    'mirror-ends',
    'switch-size',
    'fix-rate',
    'coverage-build',
    'count-misses',
  ],
};
