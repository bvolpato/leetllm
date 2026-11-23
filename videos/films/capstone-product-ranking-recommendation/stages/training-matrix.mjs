import { TRAINING_PAIRS } from '../training-data.mjs';
import { pairGradientPrefix } from '../construction.mjs';
import { arrow, box, cueProgress, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawTrainingMatrix(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('training-matrix-mechanism', () => {
    rankingText(ctx, api, 'Actual nine directed CSV pairs · better minus worse', 150, 270, 33);
    const shown = currentBeat > 0 ? 9 : Math.floor(9 * cueProgress(ctx, api, 'training-pairs')),
      prefix = pairGradientPrefix(currentBeat > 1 ? 1 : cueProgress(ctx, api, 'training-gradient'));
    TRAINING_PAIRS.forEach((row, i) => {
      const y = 355 + i * 60,
        color =
          currentBeat === 1 && i === prefix.completed && prefix.fraction > 0
            ? themeColors.yellow
            : i < shown
              ? themeColors.blue
              : themeColors.muted;
      rankingText(ctx, api, row.request + ' ' + row.better + ' > ' + row.worse, 150, y, 25, color);
      if (i < shown) {
        rankingText(
          ctx,
          api,
          row.difference.map((v) => (v < 0 ? '' : '+') + v.toFixed(2)).join('  '),
          740,
          y,
          27,
          themeColors.cyan,
        );
        if (currentBeat > 0) {
          if (i < prefix.completed || (i === prefix.completed && prefix.fraction > 0))
            rankingText(ctx, api, '× −0.5', 1080, y, 26, themeColors.pink);
        }
      }
    });
    if (currentBeat === 1 && cueVisible(ctx, api, 'training-gradient')) {
      const plot = teaching.axes({
        x: 1370,
        y: 370,
        width: 300,
        height: 480,
        xDomain: [-0.6, 0.4],
        yDomain: [-1.5, 0.1],
        xTicks: [0],
        yTicks: [-1.5, -1, 0],
        xLabel: 'match sum',
        yLabel: 'quality sum',
        equalUnits: true,
        fontSize: 21,
      });
      let start = [0, 0];
      for (let i = 0; i < Math.min(9, prefix.completed + 1); i++) {
        const fraction = i < prefix.completed ? 1 : prefix.fraction,
          end = start.map((value, j) => value - (TRAINING_PAIRS[i].difference[j] * fraction) / 2),
          a = plot.point(...start),
          z = plot.point(...end);
        if (fraction > 0)
          arrow(
            ctx,
            api,
            a.x,
            a.y,
            z.x,
            z.y,
            i < prefix.completed ? themeColors.blue : themeColors.yellow,
          );
        start = end;
      }
      const tip = plot.point(...prefix.sum);
      api.circle(ctx, tip.x, tip.y, 6, themeColors.yellow);
      rankingText(
        ctx,
        api,
        prefix.completed +
          '/9 complete · numerator [' +
          prefix.sum.map((v) => v.toFixed(3)).join(', ') +
          ']',
        960,
        935,
        31,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 1 && cueProgress(ctx, api, 'training-update') === 1)
      rankingText(
        ctx,
        api,
        'Mean [0.01667, −0.16111] → w [−0.005, 0.04833]',
        960,
        1005,
        33,
        themeColors.green,
        'center',
      );
    if (currentBeat === 2) {
      if (cueVisible(ctx, api, 'training-weights'))
        box(
          ctx,
          api,
          'Mean of pairs: 3+3+3 rows here; requests need not have equal pair counts',
          180,
          900,
          1540,
          65,
          themeColors.yellow,
          28,
        );
      if (cueVisible(ctx, api, 'training-scale'))
        footer(ctx, api, 'Fit any real feature scaling on training only.');
    }
  });
}
export default {
  id: 'training-matrix',
  draw: drawTrainingMatrix,
  cues: [
    'training-pairs',
    'training-gradient',
    'training-update',
    'training-weights',
    'training-scale',
  ],
};
