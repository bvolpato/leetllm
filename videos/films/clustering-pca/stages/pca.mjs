import { labels, pca, xy } from '../fixtures.mjs';
import { mix } from '../arithmetic.mjs';
import { directed, projectionFrame } from '../model.mjs';
import {
  originalEquation,
  originalFocus,
  originalFooter,
  originalLine,
  originalMath,
  originalPlot,
  originalPoint,
  originalText,
} from '../defaults.mjs';
export function drawPca(ctx, scene, state, api) {
  return api.focus.target('pca-construction', () => {
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
        const frame = projectionFrame(state),
          q =
            currentBeat === 0
              ? originalPlot(ctx, api, [-5.2, 10.2], [-3, 5.5])
              : originalPlot(ctx, api, [-5.2, 5.2], [-3, 3]);
        originalText(
          ctx,
          api,
          'Space: ' +
            (currentBeat === 0
              ? frame.centered === 0
                ? 'original'
                : frame.centered === 1
                  ? 'centered'
                  : 'shared translation'
              : 'centered + projected') +
            ' · fitted μ = [4.700, 2.267]',
          460,
          245,
          25,
          themeColors.muted,
        );
        labelExclusions = frame.rows.map((row, i) => {
          const at = q.point(...row.point);
          return {
            x: at.x + labelOffsets[i][0] - 20,
            y: at.y + labelOffsets[i][1] - 29,
            width: 40,
            height: 39,
          };
        });
        if (currentBeat === 0)
          originalFocus(ctx, api, 'centered-cloud', () => {
            xy.forEach((p, i) => {
              originalLine(
                ctx,
                api,
                labelExclusions,
                q,
                p,
                frame.rows[i].point,
                1,
                themeColors.muted,
                2,
              );
              originalPoint(
                ctx,
                api,
                ids,
                labelOffsets,
                q,
                i,
                frame.rows[i].point,
                colors[labels[i]],
              );
            });
            const mean = q.point(...pca.mean.map((v) => v * (1 - frame.centered)));
            api.circle(ctx, mean.x, mean.y, 9, themeColors.yellow);
          });
        else
          originalFocus(ctx, api, 'candidate-projection', () => {
            const direction = frame.vector,
              extent = 4.6;
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              direction.map((v) => -extent * v),
              direction.map((v) => extent * v),
              1,
              themeColors.yellow,
              4,
            );
            frame.rows.forEach((row) => {
              originalLine(
                ctx,
                api,
                labelExclusions,
                q,
                row.point,
                row.foot,
                frame.projection,
                themeColors.muted,
                3,
              );
              if (frame.projection > 0) {
                const at = q.point(
                  ...row.point.map((v, axis) => mix(v, row.foot[axis], frame.projection)),
                );
                api.circle(ctx, at.x, at.y, 6, themeColors.yellow);
              }
            });
            frame.rows.forEach((row, i) =>
              originalPoint(ctx, api, ids, labelOffsets, q, i, row.point, colors[labels[i]]),
            );
          });
        if (currentBeat === 0) {
          originalText(
            ctx,
            api,
            'One fitted mean for every row',
            1515,
            410,
            30,
            themeColors.muted,
            'center',
          );
          originalEquation(
            ctx,
            api,
            String.raw`\mu\approx[4.70,\;2.27]`,
            525,
            themeColors.cyan,
            40,
          );
          originalEquation(ctx, api, String.raw`x_c=x-\mu`, 680, themeColors.yellow, 48);
          originalFooter(
            ctx,
            api,
            'A shared translation preserves Euclidean pairwise differences.',
          );
        } else if (currentBeat === 1) {
          originalText(
            ctx,
            api,
            frame.rotation === 1 ? 'First principal direction' : 'Candidate unit direction',
            1515,
            350,
            32,
            themeColors.yellow,
            'center',
          );
          originalText(ctx, api, 'Sum of squared scores', 1515, 455, 32, themeColors.ink, 'center');
          originalMath(
            ctx,
            api,
            frame.projection === 1 ? frame.energy.toFixed(2) : '?',
            1515,
            555,
            56,
            themeColors.cyan,
            'center',
          );
          api.rect(ctx, 1260, 635, 510, 44, themeColors.panel, themeColors.muted, 1);
          if (frame.projection === 1)
            api.rect(ctx, 1260, 635, (510 * frame.energy) / frame.total, 44, themeColors.cyan);
          originalText(
            ctx,
            api,
            frame.projection === 1
              ? ((100 * frame.energy) / frame.total).toFixed(1) + '% of centered squared spread'
              : 'Construct the projections first.',
            1515,
            760,
            27,
            themeColors.cyan,
            'center',
          );
          originalFooter(
            ctx,
            api,
            'Unit length fixes the scale; rotate the direction to compare projections.',
          );
        } else {
          const row = frame.rows[2],
            score = frame.sign * pca.scores[2],
            at = q.point(...row.foot);
          originalFocus(ctx, api, 'pca-score', () => {
            api.circle(ctx, at.x, at.y, 15, 'transparent', themeColors.cyan, 4);
            originalEquation(
              ctx,
              api,
              String.raw`z_C=(x_C-\mu)^\top v_1`,
              465,
              themeColors.cyan,
              37,
            );
            originalEquation(
              ctx,
              api,
              phase('pca-score', 2) === 1 ? 'z_C=' + score.toFixed(3) : 'z_C=?',
              600,
              themeColors.cyan,
              47,
            );
          });
          const direction = frame.sign < 0 ? '[-1.000, 0.016]' : '[1.000, -0.016]';
          originalText(ctx, api, 'v₁ ≈ ' + direction, 1515, 765, 30, themeColors.yellow, 'center');
          originalFooter(
            ctx,
            api,
            'One score locates the projection; a reversed axis describes the same line.',
          );
        }
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
  id: 'pca',
  draw: drawPca,
  cues: [
    'pca-center',
    'cp-pca-0-0',
    'cp-pca-0-1',
    'cp-pca-0-2',
    'cp-pca-0-3',
    'pca-project',
    'pca-rotate',
    'cp-pca-1-0',
    'cp-pca-1-1',
    'cp-pca-1-2',
    'cp-pca-1-3',
    'cp-pca-1-4',
    'pca-score',
    'pca-sign',
    'cp-pca-2-0',
    'cp-pca-2-1',
    'cp-pca-2-2',
    'cp-pca-2-3',
  ],
};
