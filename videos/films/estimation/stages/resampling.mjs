import { bootstrapBins, firstDraw, positiveIndex, weeklySample } from '../fixtures.mjs';
import { bootstrapFrame, cue } from '../construction.mjs';
import { axes, caption, equation, focusTarget, panel, text, percent } from '../defaults.mjs';
export function drawResampling(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = bootstrapFrame(state);
    if (currentBeat < 2) {
      text(ctx, api, 'Original sample · persistent IDs', 500, 290, 29, themeColors.muted, 'center');
      const displayIndices = [positiveIndex, 0, 2, 3, 4, 5];
      displayIndices.forEach((i, j) => {
        const r = weeklySample[i],
          x = 145 + (j % 3) * 245,
          y = 350 + Math.floor(j / 3) * 95;
        panel(
          ctx,
          api,
          x,
          y,
          220,
          72,
          () =>
            text(
              ctx,
              api,
              r.id,
              x + 110,
              y + 46,
              27,
              r.specialist ? themeColors.pink : themeColors.blue,
              'center',
            ),
          r.specialist ? themeColors.pink : themeColors.blue,
        );
      });
      text(
        ctx,
        api,
        '100 reviewed labels stay in the source',
        500,
        575,
        28,
        themeColors.muted,
        'center',
      );
      focusTarget(ctx, api, 'bootstrap-draws', () => {
        text(ctx, api, 'Draws with replacement', 500, 655, 31, themeColors.ink, 'center');
        for (let i = 0; i < Math.min(f.draws, 6); i++) {
          const index = firstDraw[i],
            row = weeklySample[index],
            x = 150 + (i % 3) * 245,
            y = 690 + Math.floor(i / 3) * 85;
          panel(
            ctx,
            api,
            x,
            y,
            220,
            65,
            () =>
              text(
                ctx,
                api,
                row.id,
                x + 110,
                y + 42,
                26,
                row.specialist ? themeColors.pink : themeColors.blue,
                'center',
              ),
            i < 2 ? themeColors.yellow : themeColors.muted,
          );
        }
      });
      focusTarget(ctx, api, 'resample-fraction', () =>
        text(
          ctx,
          api,
          f.draws +
            ' draws · ' +
            f.k +
            ' specialist' +
            (f.draws === 100 ? ' · ' + percent(f.k / 100) : ''),
          500,
          910,
          30,
          themeColors.yellow,
          'center',
        ),
      );
      const plot = axes(
        ctx,
        api,
        1020,
        410,
        720,
        400,
        [0, 0.36],
        [0, Math.max(...bootstrapBins) * 1.12],
        [0, 0.1, 0.16, 0.2, 0.3],
        [],
        'resample fraction',
        'histogram entries',
      );
      focusTarget(ctx, api, 'bootstrap-histogram', () => {
        f.bins.forEach((n, i) => {
          if (n) {
            const a = plot.point(i / 100, 0),
              z = plot.point((i + 0.82) / 100, n);
            api.rect(ctx, a.x, z.y, z.x - a.x, a.y - z.y, themeColors.cyan);
          }
        });
        text(
          ctx,
          api,
          f.completedResamples + ' deposited resamples',
          1380,
          330,
          31,
          themeColors.cyan,
          'center',
        );
      });
      if (f.range)
        text(
          ctx,
          api,
          'percentiles ' + percent(f.range[0]) + ' – ' + percent(f.range[1]),
          1380,
          940,
          29,
          themeColors.green,
          'center',
        );
      caption(
        ctx,
        api,
        'Original evidence: 100 labels · one histogram entry per complete resample',
      );
    } else {
      text(ctx, api, 'Observed sample · ten zero labels', 960, 300, 32, themeColors.blue, 'center');
      for (let i = 0; i < 10; i++) api.circle(ctx, 370 + i * 130, 390, 16, themeColors.blue);
      const q = cue(state, 'bootstrap-zero', 0.1, 0.6),
        rows = Math.ceil(q * 3);
      focusTarget(ctx, api, 'zero-bootstrap', () => {
        for (let r = 0; r < rows; r++)
          for (let i = 0; i < 10; i++)
            api.circle(ctx, 370 + i * 130, 535 + r * 100, 13, themeColors.blue);
        equation(
          ctx,
          api,
          rows === 3
            ? '\\text{every resample}:0/10\\qquad[0,0]'
            : '\\text{resample the ten observed zeros}',
          960,
          940,
          46,
          themeColors.pink,
          'center',
        );
      });
    }
  }
}
export default {
  id: 'resampling',
  draw: drawResampling,
  cues: ['bootstrap-duplicate', 'bootstrap-complete', 'bootstrap-histogram', 'bootstrap-zero'],
};
