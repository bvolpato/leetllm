import { fmt, pair } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawAccumulationAndClippingMath,
  drawAccumulationAndClippingTarget,
  drawAccumulationAndClippingText,
} from '../defaults.mjs';
function drawClipGeometry(ctx, state, api) {
  const { C, teaching } = api;
  const ordinary = cueProgress(state, 'clip-ordinary', 0, 0.05, 0.28);
  const outlier = cueProgress(state, 'clip-outlier', 0, 0.36, 0.53);
  const contraction = cueProgress(state, 'clip-factor', 0, 0.72, 0.92);
  const raw = outlier > 0 ? [300, 400] : [3, 4];
  const norm = Math.hypot(...raw);
  const cap = 5;
  const factor = Math.min(1, cap / norm);
  const used = raw.map((g) => g * factor);
  const construction = raw.map((g, j) => g + (used[j] - g) * contraction);
  api.text(ctx, 'Two views of the same gradient', 180, 238, 38, C.ink);
  for (const [j, max] of [500, 6].entries()) {
    const x = 245 + 865 * j;
    api.text(ctx, j ? 'Detail near zero' : 'Full scale', x + 276, 326, 38, C.muted, 'center');
    const plot = teaching.axes({
      x,
      y: 402,
      width: 580,
      height: 405,
      xDomain: [0, max],
      yDomain: [0, max],
      equalUnits: true,
      xTicks: [0, j ? 3 : 300, max],
      yTicks: [j ? 4 : 400, max],
      xLabel: 'gₐ',
      yLabel: 'gᵦ',
      fontSize: 26,
      color: C.muted,
    });
    api.focus.target('gradient-views', () => {
      const arc = Array.from({ length: 65 }, (_, i) => {
        const angle = (Math.PI * i) / 128;
        return { x: cap * Math.cos(angle), y: cap * Math.sin(angle) };
      });
      teaching.curve({ plot, points: arc, color: C.yellow, width: 4 });
      const start = plot.point(0, 0);
      const scale = outlier > 0 ? 1 : ordinary;
      const display = construction.map((g) => g * scale);
      const endFraction = Math.min(1, max / Math.max(...display));
      if (outlier > 0 && !j) {
        const rawTip = plot.point(...raw);
        api.line(ctx, start.x, start.y, rawTip.x, rawTip.y, C.muted, 3);
        api.circle(ctx, rawTip.x, rawTip.y, 9, C.bg, C.muted, 3);
      }
      const tip = plot.point(display[0] * endFraction, display[1] * endFraction);
      if (endFraction === 1) api.arrow(ctx, start.x, start.y, tip.x, tip.y, C.cyan, 7);
      else api.line(ctx, start.x, start.y, tip.x, tip.y, C.cyan, 6);
      if (j && endFraction < 1)
        api.text(ctx, 'Tip outside detail', x + 330, 381, 28, C.cyan, 'center');
    });
  }
  api.focus.target('clip-rule', () =>
    api.text(
      ctx,
      'Threshold  ' + cap + '    ·    one factor for both coordinates',
      960,
      921,
      37,
      C.yellow,
      'center',
    ),
  );
  api.focus.target('gradient-views', () =>
    api.text(
      ctx,
      contraction === 1
        ? 'Used gradient   ' + pair(used) + '    ·    norm ' + fmt(Math.hypot(...used))
        : outlier === 1 || (ordinary === 1 && outlier === 0)
          ? 'Input   ' + pair(raw) + '    ·    norm ' + fmt(norm)
          : 'Gradient input',
      960,
      1006,
      45,
      C.ink,
      'center',
    ),
  );
}

export function drawClipping(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    if (currentBeat === 0) return drawClipGeometry(ctx, state, api);
    if (currentBeat === 1) {
      drawAccumulationAndClippingText(
        ctx,
        api,
        themeColors,
        'Fresh Adam state · η = 0.01 · ε = 10⁻⁸ · compare the same first update',
        170,
        245,
        30,
        themeColors.muted,
      );
      for (const [i, g] of [
        [300, 400],
        [3, 4],
      ].entries()) {
        const x = 240 + i * 850,
          color = i ? themeColors.green : themeColors.cyan;
        drawAccumulationAndClippingText(
          ctx,
          api,
          themeColors,
          i ? 'Clipped input (3, 4)' : 'Raw input (300, 400)',
          x,
          365,
          36,
          color,
        );
        drawAccumulationAndClippingTarget(ctx, api, 'clip-moments', () => {
          const p = phase('clip-moments', 1);
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            p === 1 ? 'm₁ = ' + pair(g.map((v) => 0.1 * v)) : 'm₁ = ?',
            x,
            455,
            33,
            color,
          );
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            p === 1 ? 'v₁ = ' + pair(g.map((v) => 0.001 * v * v)) : 'v₁ = ?',
            x,
            525,
            33,
            color,
          );
        });
        drawAccumulationAndClippingTarget(ctx, api, 'clip-normalized', () => {
          const plot = teaching.axes({
            x: x + 80,
            y: 650,
            width: 450,
            height: 280,
            xDomain: [0, 0.012],
            yDomain: [0, 0.012],
            equalUnits: true,
            xTicks: [0, 0.01],
            yTicks: [0.01],
            fontSize: 22,
            color: themeColors.muted,
          });
          const p = phase('clip-normalized', 1),
            origin = plot.point(0, 0),
            step = g.map((v) => (0.01 * v) / (v + 1e-8)),
            end = plot.point(step[0] * p, step[1] * p);
          if (p > 0) api.arrow(ctx, origin.x, origin.y, end.x, end.y, color, 7);
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            p === 1 ? 'Subtracted update ≈ (0.01, 0.01)' : 'Subtracted update = ?',
            x,
            1020,
            31,
            color,
          );
        });
      }
      drawAccumulationAndClippingTarget(ctx, api, 'clip-boundary', () =>
        drawAccumulationAndClippingText(
          ctx,
          api,
          themeColors,
          'Clipping changes the gradient stored in both buffers.',
          960,
          600,
          33,
          themeColors.yellow,
          'center',
        ),
      );
    } else {
      drawAccumulationAndClippingText(
        ctx,
        api,
        themeColors,
        'Illustrative input log · threshold 5 · reject nonfinite before consuming state',
        170,
        245,
        30,
        themeColors.muted,
      );
      drawAccumulationAndClippingTarget(ctx, api, 'clip-observe', () => {
        const columns = [230, 650, 1100, 1520];
        ['Input', 'Preclip norm', 'Used norm', 'Completed update'].forEach((label, i) =>
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            label,
            columns[i],
            365,
            29,
            themeColors.muted,
          ),
        );
        for (const [i, [g, norm, used]] of [
          ['(3, 4)', '5', '5'],
          ['(300, 400)', '500', '5'],
        ].entries()) {
          const y = 465 + i * 125;
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            g,
            columns[0],
            y,
            35,
            themeColors.cyan,
          );
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            norm,
            columns[1],
            y,
            35,
            themeColors.ink,
          );
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            used,
            columns[2],
            y,
            35,
            themeColors.green,
          );
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            String(i + 1),
            columns[3],
            y,
            35,
            themeColors.green,
          );
        }
      });
      drawAccumulationAndClippingTarget(ctx, api, 'clip-nonfinite', () => {
        const p = phase('clip-nonfinite', 2);
        drawAccumulationAndClippingText(
          ctx,
          api,
          themeColors,
          'nonfinite input',
          230,
          715,
          34,
          themeColors.pink,
        );
        drawAccumulationAndClippingText(
          ctx,
          api,
          themeColors,
          'NaN',
          650,
          715,
          35,
          themeColors.pink,
        );
        if (p > 0) {
          api.line(ctx, 1050, 680, 1120, 750, themeColors.pink, 7);
          api.line(ctx, 1120, 680, 1050, 750, themeColors.pink, 7);
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            'Still 2',
            1520,
            715,
            35,
            themeColors.pink,
          );
          drawAccumulationAndClippingText(
            ctx,
            api,
            themeColors,
            'Reject before moments and parameter state.',
            230,
            815,
            32,
            themeColors.pink,
          );
        }
      });
      drawAccumulationAndClippingTarget(ctx, api, 'clip-zero', () =>
        drawAccumulationAndClippingText(
          ctx,
          api,
          themeColors,
          phase('clip-zero', 2) === 1
            ? 'Separate zero-vector check: (0, 0) → (0, 0)'
            : 'Separate zero-vector check = ?',
          230,
          930,
          31,
          themeColors.cyan,
        ),
      );
      drawAccumulationAndClippingTarget(ctx, api, 'clip-frequency', () =>
        drawAccumulationAndClippingText(
          ctx,
          api,
          themeColors,
          phase('clip-frequency', 2) > 0
            ? 'Observed clipping fraction = 1 / 2 · investigate if persistent'
            : 'Record clip count / completed updates.',
          960,
          1040,
          31,
          themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'clipping',
  draw: drawClipping,
  cues: [
    'clip-rule',
    'clip-ordinary',
    'clip-outlier',
    'clip-factor',
    'clip-moments',
    'clip-boundary',
    'clip-normalized',
    'clip-observe',
    'clip-nonfinite',
    'clip-zero',
    'clip-frequency',
  ],
};
