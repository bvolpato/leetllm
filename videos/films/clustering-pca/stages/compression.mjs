import { labels, pca } from '../fixtures.mjs';
import { compressionFrame, directed } from '../model.mjs';
import {
  originalEquation,
  originalFocus,
  originalFooter,
  originalLine,
  originalPlot,
  originalPoint,
  originalText,
} from '../defaults.mjs';
export function drawCompression(ctx, scene, state, api) {
  return api.focus.target('compression-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const phase = (id, beat) => directed(state, id, beat);
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      const labelOffsets = [
        [-28, 30],
        [-28, -22],
        [-25, -25],
        [28, 35],
        [-28, 35],
        [28, -24],
      ];
      let labelExclusions = [];
      {
        const q = originalPlot(ctx, api),
          frame = compressionFrame(state),
          ca = frame.rows[2];
        labelExclusions = frame.rows.map((row, i) => {
          const at = q.point(...row.current);
          return {
            x: at.x + labelOffsets[i][0] - 20,
            y: at.y + labelOffsets[i][1] - 29,
            width: 40,
            height: 39,
          };
        });
        originalLine(
          ctx,
          api,
          labelExclusions,
          q,
          pca.mean.map((v, i) => v - 4.5 * pca.vector[i]),
          pca.mean.map((v, i) => v + 4.5 * pca.vector[i]),
          1,
          themeColors.yellow,
          3,
        );
        originalFocus(ctx, api, 'reconstruction-points', () => {
          frame.rows.forEach((row) => {
            const at = q.point(...row.original);
            api.circle(ctx, at.x, at.y, 10, 'transparent', themeColors.muted, 2);
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              row.original,
              row.current,
              1,
              row.id === 2 ? themeColors.pink : themeColors.muted,
              row.id === 2 ? 5 : 3,
            );
          });
          frame.rows.forEach((row) =>
            originalPoint(
              ctx,
              api,
              ids,
              labelOffsets,
              q,
              row.id,
              row.current,
              colors[labels[row.id]],
            ),
          );
        });
        originalFocus(ctx, api, 'residual-ledger', () => {
          originalText(ctx, api, 'Point C', 1515, 340, 35, themeColors.cyan, 'center');
          originalEquation(
            ctx,
            api,
            frame.restore === 0
              ? String.raw`\widehat x_C=\mu+z_Cv_1`
              : frame.restore === 1
                ? String.raw`\widehat x_C=\mu+z_{C1}v_1+z_{C2}v_2`
                : String.raw`\widehat x_C=\mu+z_{C1}v_1+\alpha z_{C2}v_2`,
            455,
            themeColors.yellow,
            frame.restore > 0 ? 31 : 39,
          );
          if (frame.restore > 0 && frame.restore < 1)
            originalText(
              ctx,
              api,
              'α = ' + frame.restore.toFixed(3),
              1515,
              520,
              26,
              themeColors.green,
              'center',
            );
          const residual = ca.original.map((v, i) => v - ca.current[i]);
          originalEquation(
            ctx,
            api,
            phase('residual-c', 0) === 1
              ? String.raw`\|x_C-\widehat x_C\|^2=` + ca.error.toFixed(3)
              : String.raw`\|x_C-\widehat x_C\|^2=?`,
            590,
            themeColors.pink,
            34,
          );
          if (frame.collected.length) {
            originalText(
              ctx,
              api,
              frame.collected.length + ' / 6 completed residuals',
              1515,
              730,
              30,
              themeColors.muted,
              'center',
            );
            originalEquation(
              ctx,
              api,
              '\\mathrm{sum}=' + frame.sum.toFixed(2),
              815,
              frame.restore > 0 ? themeColors.green : themeColors.pink,
              45,
            );
          }
          if (phase('residual-c', 0) === 1)
            originalText(
              ctx,
              api,
              'residual ≈ [' + residual.map((v) => v.toFixed(2)).join(', ') + ']',
              1515,
              940,
              27,
              themeColors.muted,
              'center',
            );
        });
        originalFocus(ctx, api, 'variance-split', () => {
          if (phase('variance-split', 1) > 0) {
            originalText(
              ctx,
              api,
              'PC1 85.2% · PC2 14.8%',
              880,
              235,
              26,
              themeColors.muted,
              'center',
            );
            api.rect(ctx, 600, 255, 560 * pca.varianceKept, 24, themeColors.cyan);
            api.rect(
              ctx,
              600 + 560 * pca.varianceKept,
              255,
              560 * (1 - pca.varianceKept),
              24,
              themeColors.pink,
            );
          }
        });
        originalFooter(
          ctx,
          api,
          frame.restore === 1
            ? 'Two components restore the original two-dimensional vectors.'
            : 'Original locations remain as rings · the pink segment belongs to C.',
        );
      }
    }
    {
      const { C } = api;
      [
        'A · charged twice',
        'B · duplicate payment',
        'C · reset link',
        'D · two-factor code',
        'E · release runbook',
        'F · release approval',
      ].forEach((v, i) => api.text(ctx, v, 130 + i * 282, 196, 22, C.muted, 'left'));
    }
  });
}
export default {
  id: 'compression',
  draw: drawCompression,
  cues: [
    'reconstruct-c',
    'residual-c',
    'residual-all',
    'cp-compression-0-0',
    'cp-compression-0-1',
    'cp-compression-0-2',
    'cp-compression-0-3',
    'cp-compression-0-4',
    'variance-split',
    'restore-second',
    'cp-compression-1-0',
    'cp-compression-1-1',
    'cp-compression-1-2',
    'cp-compression-1-3',
  ],
};
