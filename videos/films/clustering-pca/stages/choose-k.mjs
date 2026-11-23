import { clusterTrials, xy } from '../fixtures.mjs';
import { silhouette } from '../arithmetic.mjs';
import { directed, partitionFrame } from '../model.mjs';
import {
  originalEquation,
  originalFocus,
  originalFooter,
  originalLine,
  originalPlot,
  originalPoint,
  originalText,
} from '../defaults.mjs';
export function drawChooseK(ctx, scene, state, api) {
  return api.focus.target('choose-k-construction', () => {
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
          trial = partitionFrame(state),
          own = phase('silhouette-own', 1),
          other = phase('silhouette-other', 1),
          score = phase('silhouette-score', 1),
          sil = silhouette(xy, trial.labels, 0);
        originalFocus(ctx, api, 'partition-cloud', () => {
          xy.forEach((p, i) =>
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              p,
              trial.centers[trial.labels[i]],
              1,
              colors[trial.labels[i]],
              3,
            ),
          );
          trial.centers.forEach((p, k) => {
            const at = q.point(...p);
            api.circle(ctx, at.x, at.y, 17, 'transparent', colors[k], 4);
          });
          xy.forEach((p, i) =>
            originalPoint(ctx, api, ids, labelOffsets, q, i, p, colors[trial.labels[i]]),
          );
        });
        if (currentBeat === 0) {
          originalText(
            ctx,
            api,
            trial.k + ' groups · tested converged fit',
            1515,
            420,
            31,
            themeColors.ink,
            'center',
          );
          originalEquation(ctx, api, 'J=' + trial.inertia.toFixed(2), 570, themeColors.yellow, 52);
          originalText(
            ctx,
            api,
            trial.k === 4
              ? 'A reviewed pair has split.'
              : trial.k === 3
                ? 'Three separate pairs.'
                : 'Two pairs share one center.',
            1515,
            740,
            30,
            themeColors.muted,
            'center',
          );
        } else if (currentBeat === 1) {
          originalFocus(ctx, api, 'silhouette-own', () =>
            originalLine(ctx, api, labelExclusions, q, xy[0], xy[1], own, themeColors.cyan, 6),
          );
          originalFocus(ctx, api, 'silhouette-other', () =>
            [0, 1, 2]
              .filter((k) => k !== trial.labels[0])
              .forEach((k) =>
                xy.forEach((p, i) => {
                  if (trial.labels[i] === k)
                    originalLine(
                      ctx,
                      api,
                      labelExclusions,
                      q,
                      xy[0],
                      p,
                      other,
                      k === sil.otherGroup ? themeColors.pink : themeColors.muted,
                      3,
                    );
                }),
              ),
          );
          originalText(
            ctx,
            api,
            'Silhouette for point A',
            1515,
            350,
            35,
            themeColors.ink,
            'center',
          );
          originalEquation(
            ctx,
            api,
            own === 1 ? 'a=' + sil.a.toFixed(3) : 'a=?',
            465,
            themeColors.cyan,
            43,
          );
          originalEquation(
            ctx,
            api,
            other === 1 ? 'b=' + sil.b.toFixed(3) : 'b=?',
            575,
            themeColors.pink,
            43,
          );
          originalFocus(ctx, api, 'silhouette-score', () =>
            originalEquation(
              ctx,
              api,
              score === 1 ? 's(A)=\\frac{b-a}{\\max(a,b)}=' + sil.score.toFixed(2) : 's(A)=?',
              745,
              themeColors.green,
              37,
            ),
          );
          originalText(
            ctx,
            api,
            'a: own members · b: nearest other group mean',
            1515,
            880,
            25,
            themeColors.muted,
            'center',
          );
        } else
          originalFocus(ctx, api, 'partition-scores', () => {
            originalText(ctx, api, 'k', 1310, 375, 30, themeColors.muted, 'center');
            originalText(ctx, api, 'inertia', 1500, 375, 30, themeColors.muted, 'center');
            originalText(ctx, api, 'mean silhouette', 1710, 375, 25, themeColors.muted, 'center');
            clusterTrials.forEach((row, i) => {
              const y = 490 + i * 140,
                color = row.k === 3 ? themeColors.green : themeColors.muted;
              originalText(ctx, api, String(row.k), 1310, y, 40, color, 'center');
              originalText(ctx, api, row.inertia.toFixed(2), 1500, y, 40, color, 'center');
              originalText(ctx, api, row.silhouette.toFixed(2), 1710, y, 40, color, 'center');
            });
          });
        originalFooter(
          ctx,
          api,
          'Scores describe these partitions; reviewed messages justify their names.',
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
  id: 'choose-k',
  draw: drawChooseK,
  cues: [
    'partition-two',
    'partition-three',
    'partition-four',
    'cp-choose-k-0-0',
    'cp-choose-k-0-1',
    'cp-choose-k-0-2',
    'cp-choose-k-0-3',
    'cp-choose-k-0-4',
    'silhouette-own',
    'silhouette-other',
    'silhouette-score',
    'cp-choose-k-1-0',
    'cp-choose-k-1-1',
    'cp-choose-k-1-2',
    'cp-choose-k-1-3',
    'cp-choose-k-1-4',
    'partition-scores',
    'cp-choose-k-2-0',
    'cp-choose-k-2-1',
    'cp-choose-k-2-2',
    'cp-choose-k-2-3',
    'cp-choose-k-2-4',
  ],
};
