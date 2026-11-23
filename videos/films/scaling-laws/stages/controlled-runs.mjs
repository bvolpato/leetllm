import { spoken } from '../cue.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, curve, line, plot, point, rectangle, text } from '../defaults.mjs';
export function drawControlledRuns(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const Y = (y, a, z, t, h) => t + h - ((y - a) / (z - a)) * h;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-controlled-runs-construction', () => {
    band(ctx, api, 'Invented runs on the same held-out text   ·   nats per token');
    if (currentBeat < 2) {
      const cases = [
          [1, 10, 2.8],
          [2, 10, 2.6],
          [1, 20, 2.55],
          [2, 20, 2.35],
        ],
        n =
          1 +
          ['runs-double-n', 'runs-double-d', 'runs-double-both'].filter(
            (id) => spoken(scene, state, id).phase !== 'before',
          ).length;
      cases.forEach(([N, D, L], i) => {
        if (currentBeat === 0 && i >= n) return;
        const x = 220 + i * 420;
        text(ctx, api, 'Run ' + (i + 1), x + 150, 355, 31, themeColors.ink, 'center');
        rectangle(ctx, api, x, 400, 300, 330, themeColors.panel, themeColors.muted);
        rectangle(
          ctx,
          api,
          x + 35,
          700 - D * 12,
          N * 100,
          D * 12,
          i % 2 ? themeColors.blue : themeColors.cyan,
        );
        text(ctx, api, `N ${N}B · D ${D}B`, x + 150, 800, 29, themeColors.ink, 'center');
        text(
          ctx,
          api,
          i < n || currentBeat === 1 ? `Loss ${L.toFixed(2)}` : 'Loss ?',
          x + 150,
          855,
          32,
          themeColors.yellow,
          'center',
        );
      });
      result(
        currentBeat === 0
          ? 'The two middle runs both cost twice the baseline'
          : '2.60 − 2.55 = 0.05 nats per token on this evaluation',
      );
    } else {
      const pl = plot(
        ctx,
        api,
        300,
        360,
        1280,
        430,
        [0, 6],
        [1.9, 3.05],
        'Compute C (log scale)',
        'Loss',
      );
      curve(ctx, api, pl, (x) => 2 + 10 ** (-0.05 * x), 0, 6, themeColors.cyan, progress);
      line(
        ctx,
        api,
        300,
        Y(2, 1.9, 3.05, 360, 430),
        1580,
        Y(2, 1.9, 3.05, 360, 430),
        themeColors.muted,
      );
      for (let i = 0; i <= 6; i++)
        if (i <= progress * 6) {
          point(ctx, api, pl, i, 2 + 10 ** (-0.05 * i));
          text(
            ctx,
            api,
            ['10⁰', '10¹', '10²', '10³', '10⁴', '10⁵', '10⁶'][i],
            300 + (i / 6) * 1280,
            820,
            27,
            themeColors.muted,
            'center',
          );
        }
      text(
        ctx,
        api,
        'Floor E = 2 · subtract it before taking log excess loss',
        960,
        905,
        31,
        themeColors.yellow,
        'center',
      );
      result('Equal multiplicative steps yield shrinking absolute gains');
    }
  });
}
export default {
  id: 'controlled-runs',
  draw: drawControlledRuns,
  cues: [
    'sl-controlled-runs-0',
    'sl-controlled-runs-1',
    'sl-controlled-runs-2',
    'runs-double-n',
    'runs-double-d',
    'runs-double-both',
  ],
};
