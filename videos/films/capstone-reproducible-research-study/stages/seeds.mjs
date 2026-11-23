import { mean } from '../arithmetic.mjs';
import { cueProgress, ledger, summary } from '../evidence.mjs';
import { deltas, sampleModel } from '../model.mjs';
import { drawOriginalResearchText } from '../defaults.mjs';
export function drawSeeds(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const filtered =
      cueProgress(state, 'try-favorable-subset', 1, 0, 0.18) > 0 &&
      cueProgress(state, 'seeds-seed-difference-points-b2-1', 1, 0.35, 0.41) === 0;
    const plot = teaching.axes({
      x: 250,
      y: 370,
      width: 1420,
      height: 440,
      xDomain: [-0.5, 23.5],
      yDomain: [-0.45, 0.75],
      xTicks: [0, 6, 12, 18, 23],
      yTicks: [-0.3, 0, 0.3, 0.6],
      xLabel: 'Worked seed identity',
      yLabel: 'Shaped minus sparse early success',
      fontSize: 26,
    });
    api.focus.target('seed-difference-points', () =>
      teaching.scatter({
        plot,
        points: deltas.slice(0, modelState.n).map((y, x) => ({
          x,
          y,
          color: y < 0 ? (filtered ? themeColors.muted : themeColors.pink) : themeColors.cyan,
          radius: 9,
        })),
      }),
    );
    const zero = plot.point(0, 0).y;
    api.line(ctx, 250, zero, 1670, zero, themeColors.muted, 2);
    const shown = deltas.slice(0, modelState.n);
    api.focus.target('seed-difference-tally', () =>
      drawOriginalResearchText(
        ctx,
        api,
        filtered
          ? 'Favorable subset   /   19 pairs   /   Mean +' +
              (summary(ledger.filter((row) => row.gain >= 0)).points / 100).toFixed(3)
          : 'Shown pairs ' +
              modelState.n +
              '/24 · regressions ' +
              shown.filter((v) => v < 0).length +
              (modelState.n ? ' · mean ' + mean(shown).toFixed(3) : ''),
        960,
        930,
        31,
        themeColors.yellow,
        'center',
      ),
    );
    const regressionReveal = state.cues?.['seeds-seed-difference-points-b1-1']?.reveal ?? 0;
    api.focus.target('seed-difference-negative-points', () =>
      teaching.scatter({
        plot,
        points: shown
          .map((y, x) => ({
            x,
            y,
          }))
          .filter((point) => point.y < 0)
          .map((point) => ({
            ...point,
            color: filtered ? themeColors.panel : themeColors.pink,
            radius: 9 + 3 * regressionReveal,
          })),
      }),
    );
    const labelSize = 25;
    const labelOffset = 18;
    for (const [seed, delta] of shown.entries()) {
      if (delta >= 0) continue;
      const { x, y } = plot.point(seed, delta);
      const fitsAbove = y - labelOffset - labelSize > zero;
      const baseline = fitsAbove ? y - labelOffset : y + labelOffset + labelSize;
      api.text(
        ctx,
        String(seed),
        x,
        baseline,
        labelSize,
        filtered ? themeColors.muted : themeColors.pink,
        'center',
      );
    }
    drawOriginalResearchText(
      ctx,
      api,
      filtered
        ? 'Five recorded losses would be excluded from this calculation.'
        : 'Each dot is one paired seed. Both learners had 30 early episodes.',
      960,
      1000,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'seeds',
  draw: drawSeeds,
  cues: [
    'seed-cohort-complete',
    'seeds-seed-difference-points-b1-1',
    'seeds-seed-difference-points-b2-1',
  ],
};
