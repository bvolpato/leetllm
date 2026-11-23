import { fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { FRESH_RECIPE as f } from '../fixtures.mjs';
import { itemShares, signed } from '../item-shares.mjs';

function gradientPair(ctx, api, { top, right = 1660, weighted, equal, clip, compare = false }) {
  const { C } = api;
  const x = (g) => right + 206 * g;
  const limit = x(-f.cap);
  const y1 = top,
    y2 = top + 106;
  api.text(ctx, '0', right, y2 + 46, 29, C.muted, 'center');
  if (compare) {
    api.text(ctx, 'Microbatch shares', 182, y1 - 92, 33, C.muted);
    const heading = clip > 0 ? 'Open circle = before clipping' : 'Gradient before clipping';
    api.text(ctx, heading, right, y1 - 92, 33, C.muted, 'right');
  }
  if (clip > 0) {
    api.line(ctx, limit, y1 - 24, limit, y2 + 23, C.yellow, 4);
    api.text(ctx, 'Clip at −' + f.cap, limit, y1 - 48, 31, C.yellow, 'center');
  }
  for (const [i, [name, g, used, built, color, id]] of [
    ['By item', f.weighted, f.clipped, weighted, C.green, 'fresh-weighted'],
    ['By batch', f.wrong, f.wrongClipped, equal, C.pink, 'fresh-wrong'],
  ].entries()) {
    const y = i ? y2 : y1;
    api.focus.target(id, () => {
      const rawLabel = i ? '−' + Math.round(-g * f.counts[1]) + '/' + f.counts[1] : signed(g);
      api.text(ctx, name, 182, y + 13, 39, color);
      if (compare) {
        const shares = i ? ['1/2', '1/2'] : f.counts.map((n) => n + '/' + f.targets.length);
        api.text(ctx, shares.join('    '), 380, y + 13, 36, color);
      } else {
        api.text(ctx, built === 1 ? rawLabel : '?', 492, y + 13, 40, color, 'right');
      }
      api.line(ctx, x(-4.6), y, right, y, C.muted, 2);
      api.circle(ctx, right, y, 5, C.muted);
      if (built > 0) {
        const raw = x(g * built);
        const appliedClip = i === 0 || compare ? clip : 0;
        const tip = x(g * built + (used - g) * appliedClip);
        api.line(ctx, right, y, tip, y, color, 7);
        api.circle(ctx, tip, y, 9, color);
        if (appliedClip > 0) {
          api.line(ctx, raw, y, tip, y, C.muted, 2);
          api.circle(ctx, raw, y, 9, C.bg, color, 3);
        }
        if (compare && built === 1) api.text(ctx, rawLabel, raw, y - 23, 35, color, 'center');
      }
    });
  }
  if (compare && clip === 1)
    api.text(
      ctx,
      'Both runs send ' + signed(f.clipped) + ' into AdamW',
      limit,
      y2 + 95,
      39,
      C.ink,
      'center',
    );
}

function parameterStep(ctx, state, api) {
  const { C } = api;
  const q = (id, from, to) => cueProgress(state, id, 2, from, to);
  const data = q('fresh-data-step', 0.12, 0.31);
  const prior = q('fresh-old-weight', 0.35, 0.43);
  const shrink = q('fresh-decay-term', 0.47, 0.59);
  const final = q('fresh-final', 0.62, 0.75);
  const x = (w) => 262 + (w - f.start) * 27000;
  const y = 615;
  const label = (v) => fmt(v, 4);
  const normalized =
    '\\Delta\\theta_{data}=-' + f.rate + '\\frac{' + f.clipped + '}{' + Math.abs(f.clipped) + '}';
  api.text(
    ctx,
    'First AdamW update    ·    corrected m = ' +
      signed(f.clipped) +
      '    ·    corrected v = ' +
      f.clipped ** 2 +
      '    ·    ε = 0',
    180,
    235,
    35,
    C.muted,
  );
  api.focus.target('fresh-data-step', () => {
    api.math(
      ctx,
      normalized + (data === 1 ? '=+' + label(-f.update.dataStep) : ''),
      180,
      387,
      49,
      C.green,
    );
    api.line(ctx, x(f.start) - 38, y, x(f.dataEndpoint) + 76, y, C.muted, 3);
    for (const offset of [0, 0.01, 0.02, 0.03, 0.04, 0.05]) {
      api.line(ctx, x(f.start + offset), y - 10, x(f.start + offset), y + 12, C.muted, 3);
      api.text(ctx, label(f.start + offset), x(f.start + offset), y + 65, 29, C.muted, 'center');
    }
    if (data > 0) {
      const tip = x(f.start + (f.dataEndpoint - f.start) * data);
      api.arrow(ctx, x(f.start), y - 25, tip, y - 25, C.green, 6);
      if (data === 1)
        api.text(ctx, 'Data only  ' + label(f.dataEndpoint), tip, y - 103, 36, C.green, 'center');
    }
  });
  api.focus.target('fresh-old-weight', () => {
    api.circle(ctx, x(f.start), y, 11, C.ink);
    if (prior > 0) {
      api.line(ctx, x(f.start), y + 95, x(f.start), y + 142, C.yellow, 3);
      api.text(ctx, 'Prior weight  ' + f.start, x(f.start), y + 205, 36, C.yellow, 'center');
    }
  });
  api.focus.target('fresh-decay-term', () => {
    if (prior > 0)
      api.math(
        ctx,
        '\\Delta\\theta_{decay}=-' +
          f.rate +
          '(' +
          f.decay +
          ')(' +
          f.start +
          ')' +
          (shrink === 1 ? '=-' + label(f.update.shrink) : ''),
        945,
        387,
        45,
        C.yellow,
      );
    if (shrink > 0) {
      const start = x(f.dataEndpoint);
      api.arrow(
        ctx,
        start,
        y - 62,
        x(f.dataEndpoint - f.update.shrink * shrink),
        y - 62,
        C.yellow,
        6,
      );
    }
  });
  api.focus.target('fresh-final', () => {
    if (final === 1) {
      api.circle(ctx, x(f.update.weight), y, 13, C.cyan);
      api.line(ctx, x(f.update.weight), y + 88, x(f.update.weight), y + 133, C.cyan, 3);
    }
    api.text(
      ctx,
      final === 1 ? 'Final parameter = ' + label(f.update.weight) : 'Final parameter = ?',
      1720,
      y + 205,
      44,
      C.cyan,
      'right',
    );
  });
  api.focus.target('fresh-clock', () =>
    api.text(
      ctx,
      'Completed optimizer updates: ' + (final === 1 ? f.update.count : 0),
      180,
      964,
      32,
      C.muted,
    ),
  );
}

export function drawFreshRecipe(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const q = (id, b, from, to) => cueProgress(state, id, b, from, to);
  if (beat === 2) return parameterStep(ctx, state, api);
  if (beat === 3) {
    api.text(ctx, 'Same targets, same starting state, same clip threshold', 180, 245, 35, C.muted);
    api.focus.target('fresh-replay', () => {
      const input = q('fresh-replay', 3, 0.08, 0.37);
      const clipped = q('fresh-both-clipped', 3, 0.39, 0.62);
      api.focus.target('fresh-both-clipped', () =>
        gradientPair(ctx, api, {
          top: 482,
          weighted: input,
          equal: input,
          clip: clipped,
          compare: true,
        }),
      );
    });
    api.focus.target('fresh-same-weight', () => {
      const saved = q('fresh-same-weight', 3, 0.59, 0.7) === 1;
      api.text(
        ctx,
        saved ? 'Both save w = ' + fmt(f.update.weight) : 'Saved weights   ?',
        960,
        835,
        53,
        C.ink,
        'center',
      );
    });
    api.focus.target('fresh-audit', () => {
      const settled = q('fresh-audit', 3, 0.76, 0.87) === 1;
      api.text(
        ctx,
        settled
          ? 'Log the counts and the gradient before clipping.'
          : 'Which measurement distinguishes these updates?',
        960,
        961,
        40,
        C.cyan,
        'center',
      );
    });
    return;
  }

  api.text(
    ctx,
    'Squared error    ·    w = ' + f.start + '    ·    mean over ' + f.targets.length + ' items',
    180,
    240,
    36,
    C.ink,
  );
  const means = q('fresh-means', 0, 0.28, 0.68);
  itemShares(ctx, api, f, {
    grouped: true,
    showMeans: means === 1,
    showGradients: means > 0,
    showFractions: beat === 1 && q('fresh-item-weights', 1, 0.06, 0.22) === 1,
    target: 'fresh-items',
  });
  if (beat === 0) {
    api.focus.target('fresh-gradient-question', () =>
      api.text(
        ctx,
        means === 1
          ? 'Correctly accumulated mean gradient = ?'
          : 'Each item contributes 2(w − target).',
        960,
        805,
        48,
        means === 1 ? C.yellow : C.ink,
        'center',
      ),
    );
    return;
  }
  api.focus.target('fresh-clipped', () =>
    gradientPair(ctx, api, {
      top: 739,
      weighted: q('fresh-weighted', 1, 0.22, 0.34),
      equal: q('fresh-wrong', 1, 0.37, 0.48),
      clip: q('fresh-clipped', 1, 0.55, 0.7),
    }),
  );
  api.focus.target('fresh-step-question', () =>
    api.text(
      ctx,
      'First AdamW step    ·    η = ' +
        f.rate +
        '    ·    λ = ' +
        f.decay +
        '    ·    ε = 0    ·    next w = ?',
      960,
      989,
      37,
      C.ink,
      'center',
    ),
  );
}
export default {
  id: 'fresh-recipe',
  draw: drawFreshRecipe,
  cues: [
    'fresh-inputs',
    'fresh-means',
    'fresh-gradient-question',
    'fresh-item-weights',
    'fresh-weighted',
    'fresh-wrong',
    'fresh-clipped',
    'fresh-step-question',
    'fresh-data-step',
    'fresh-old-weight',
    'fresh-decay-term',
    'fresh-final',
    'fresh-clock',
    'fresh-replay',
    'fresh-both-clipped',
    'fresh-same-weight',
    'fresh-audit',
  ],
};
