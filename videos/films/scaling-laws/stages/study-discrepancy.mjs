import { scalingEvent } from '../construction.mjs';
import { band, curve, line, plot, point, rectangle, text } from '../defaults.mjs';
export function drawStudyDiscrepancy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-study-discrepancy-construction', () => {
    band(
      ctx,
      api,
      currentBeat === 0
        ? 'Growth exponents   ·   parameters (blue) and tokens (cyan)'
        : 'Illustrative loss profiles at fixed compute',
    );
    if (currentBeat === 0) {
      const rows = [
        [0.5, 0.5],
        [0.49, 0.51],
        [0.46, 0.54],
      ];
      rows.forEach(([a, z], i) => {
        const x = 320 + i * 550;
        for (let j = 0; j < 100; j++) {
          const col = j < a * 100 ? themeColors.blue : themeColors.cyan;
          rectangle(
            ctx,
            api,
            x + (j % 10) * 29,
            385 + Math.floor(j / 10) * 29,
            23,
            23,
            j < Math.floor(progress * 100) ? col : themeColors.panel,
            themeColors.muted,
          );
        }
        text(
          ctx,
          api,
          ['Lower envelope', 'Iso-FLOP minima', 'Surface fit'][i],
          x + 130,
          740,
          31,
          themeColors.ink,
          'center',
        );
        if (end)
          text(
            ctx,
            api,
            `${a.toFixed(2)} / ${z.toFixed(2)}`,
            x + 130,
            820,
            38,
            themeColors.yellow,
            'center',
          );
      });
      text(
        ctx,
        api,
        'More than 400 runs · 70M–16B parameters · 5B–500B tokens',
        960,
        935,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      const pl = plot(
        ctx,
        api,
        330,
        380,
        1200,
        420,
        [0, 4],
        [1.6, 3.3],
        'Schematic model size at fixed compute',
        'Schematic loss',
      );
      const old = (x) => 2.15 + 0.18 * (x - 2) ** 2;
      curve(ctx, api, pl, old, 0, 4, themeColors.muted);
      curve(ctx, api, pl, (x) => old(x) - 0.3 * progress, 0, 4, themeColors.cyan);
      point(ctx, api, pl, 2, old(2) - 0.3 * progress, themeColors.yellow);
      line(ctx, api, 930, 380, 930, 800, themeColors.yellow, 2);
      text(
        ctx,
        api,
        currentBeat === 1
          ? 'Finishing schedule changes the measured loss'
          : 'A vertical shift alone keeps the minimum at the same N',
        960,
        315,
        33,
        themeColors.ink,
        'center',
      );
      result(
        currentBeat === 1
          ? 'Record output-head FLOPs, warmup, learning rate, batch size and Adam β₂'
          : 'Porian: tuned constant-LR runs could also recover near-balanced allocation',
      );
    }
  });
}
export default {
  id: 'study-discrepancy',
  draw: drawStudyDiscrepancy,
  cues: ['sl-study-discrepancy-0', 'sl-study-discrepancy-1', 'sl-study-discrepancy-2'],
};
