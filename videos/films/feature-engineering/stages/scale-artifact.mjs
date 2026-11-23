import { iqr, mean, median, robustOutlier, scaleRows, std } from '../construction.mjs';
import { featureFrame } from '../model.mjs';
import {
  drawFeatureConstructionEquation,
  drawFeatureConstructionHead,
  drawFeatureConstructionNote,
  drawFeatureConstructionStage,
  drawFeatureConstructionText,
} from '../defaults.mjs';
export function drawScaleArtifact(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = featureFrame(state),
    currentBeat = f.b,
    progress = f.p,
    show = (id, beat) => f.started(id, beat);
  drawFeatureConstructionStage(ctx, api, 'scale-artifact-operation', () => {
    if (currentBeat === 0) {
      drawFeatureConstructionHead(ctx, api, 'Keep the stored training ruler');
      drawFeatureConstructionEquation(
        ctx,
        api,
        String.raw`z=\frac{x-1523.25}{3959.86795},\qquad r=\frac{x-27}{28.75}`,
        960,
        420,
        46,
      );
      const x = 42;
      drawFeatureConstructionText(
        ctx,
        api,
        'J6 ·42min → z ' +
          ((x - mean) / std).toFixed(4) +
          ' · robust ' +
          ((x - median) / iqr).toFixed(4),
        960,
        625,
        37,
        themeColors.cyan,
        'center',
      );
      drawFeatureConstructionEquation(
        ctx,
        api,
        String.raw`Q_1=16.5,\quad Q_3=45.25,\quad IQR=28.75`,
        960,
        790,
        42,
        themeColors.yellow,
      );
      drawFeatureConstructionNote(
        ctx,
        api,
        'Inclusive interpolation convention · a zero denominator needs an explicit policy.',
      );
    } else {
      drawFeatureConstructionHead(ctx, api, 'Same identities · three declared output scales');
      const plots = [
        {
          name: 'standard',
          x: 220,
          domain: [-0.5, 3],
          fn: (x) => (x - mean) / std,
          c: themeColors.blue,
        },
        {
          name: 'robust (full tail)',
          x: 770,
          domain: [-1, 420],
          fn: (x) => (x - median) / iqr,
          c: themeColors.cyan,
        },
        {
          name: 'log(1+x)',
          x: 1320,
          domain: [0, 10],
          fn: Math.log1p,
          c: themeColors.green,
        },
      ];
      for (const d of plots) {
        const plot = api.teaching.axes({
          x: d.x,
          y: 390,
          width: 430,
          height: 420,
          xDomain: d.domain,
          yDomain: [0, 8],
          xTicks:
            d.domain[1] > 100 ? [0, 200, 400] : d.domain[1] === 10 ? [0, 5, 10] : [0, 1, 2, 3],
          yTicks: [],
          xLabel: d.name,
          fontSize: 23,
        });
        scaleRows.forEach((row, i) => {
          if (d.name === 'log(1+x)' && !show('feature-scale-log', 1)) return;
          const q = plot.point(d.fn(row.wait), 8 - i - 0.5);
          api.circle(ctx, q.x, q.y, 11, row.wait === 12000 ? themeColors.pink : d.c);
          drawFeatureConstructionText(
            ctx,
            api,
            row.id,
            q.x + 15,
            q.y + 7,
            20,
            row.wait === 12000 ? themeColors.pink : d.c,
          );
        });
      }
      drawFeatureConstructionText(
        ctx,
        api,
        'J8 remains ' + robustOutlier.toFixed(3) + ' robust · log compresses but is unbounded',
        960,
        950,
        31,
        themeColors.yellow,
        'center',
      );
      drawFeatureConstructionNote(
        ctx,
        api,
        'Invertible monotone transforms preserve rank; conditioning,regularization and precision can change.',
      );
    }
  });
}
export default {
  id: 'scale-artifact',
  draw: drawScaleArtifact,
  cues: ['scale-artifact-0', 'scale-artifact-1', 'feature-scale-log'],
};
