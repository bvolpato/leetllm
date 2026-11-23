import { visionSiglip } from '../arithmetic.mjs';
import { visionBound } from '../construction.mjs';
import { card, detailText, footer, title } from '../defaults.mjs';
export function drawSiglipPairs(ctx, scene, state, api) {
  api.focus.target('siglip-pairs-mechanism', () => {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    {
      const r = visionSiglip();
      title(ctx, api, 'Every image-caption pair owns one logistic loss');
      components.matrix({
        values: r.scores,
        x: 250,
        y: 400,
        cellSize: 150,
        gap: 8,
        style: {
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
          fontSize: 39,
        },
      });
      components.matrix({
        values: r.labels,
        x: 800,
        y: 400,
        cellSize: 150,
        gap: 8,
        style: {
          fill: themeColors.panel,
          stroke: themeColors.yellow,
          textColor: themeColors.ink,
          fontSize: 39,
        },
      });
      components.matrix({
        values: r.losses.map((row) => row.map((v) => +v.toFixed(3))),
        x: 1350,
        y: 400,
        cellSize: 150,
        gap: 8,
        style: {
          fill: themeColors.panel,
          stroke: themeColors.pink,
          textColor: themeColors.ink,
          fontSize: 39,
        },
      });
      detailText(ctx, api, 'scores', 410, 340, 31, themeColors.blue, 'center');
      detailText(ctx, api, 'pair labels', 960, 340, 31, themeColors.yellow, 'center');
      detailText(ctx, api, 'log(1+exp(−label×score))', 1510, 340, 28, themeColors.pink, 'center');
      if (currentBeat >= 1)
        card(
          ctx,
          api,
          `sum ${r.sum.toFixed(3)} / batch 2 = ${r.objective.toFixed(3)}`,
          390,
          825,
          1140,
          85,
          themeColors.green,
          34,
        );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Independent pair losses still use remote negatives and gradient synchronization'
          : 'The four-pair mean would divide by 4 and halve these gradients',
      );
    }
    return true;
  });
}
export default {
  id: 'siglip-pairs',
  draw: drawSiglipPairs,
  cues: ['siglip-pairs-beat-0', 'siglip-pairs-beat-1', 'siglip-pairs-beat-2'],
};
