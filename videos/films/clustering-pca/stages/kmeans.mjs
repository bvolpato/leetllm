import { initialInertia, labels, xy } from '../fixtures.mjs';
import { distance } from '../arithmetic.mjs';
import { clusterFrame, directed } from '../model.mjs';
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
export function drawKmeans(ctx, scene, state, api) {
  return api.focus.target('kmeans-construction', () => {
    {
      const { C: themeColors, teaching: teaching } = api,
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
          frame = clusterFrame(state);
        if (frame.objectiveKnown)
          originalText(
            ctx,
            api,
            'Squared residuals: ' +
              xy
                .map(
                  (p, i) => ids[i] + ' ' + (distance(p, frame.centers[labels[i]]) ** 2).toFixed(2),
                )
                .join(' + '),
            460,
            245,
            24,
            themeColors.muted,
          );
        originalFocus(ctx, api, 'cluster-assignments', () => {
          xy.forEach((p, i) => {
            if (i < frame.assignedCount)
              originalLine(
                ctx,
                api,
                labelExclusions,
                q,
                p,
                frame.centers[labels[i]],
                currentBeat === 2 ? 0.35 + 0.65 * frame.again : 1,
                colors[labels[i]],
                4,
              );
          });
          xy.forEach((p, i) =>
            originalPoint(
              ctx,
              api,
              ids,
              labelOffsets,
              q,
              i,
              p,
              i < frame.assignedCount ? colors[labels[i]] : themeColors.muted,
            ),
          );
        });
        originalFocus(ctx, api, 'cluster-centers', () =>
          frame.centers.forEach((center, k) => {
            if (phase('centers-seed', 0) > 0) {
              const at = q.point(...center);
              api.circle(ctx, at.x, at.y, 19, 'transparent', themeColors.yellow, 4);
            }
          }),
        );
        originalFocus(ctx, api, 'centroid-mean', () => {
          originalText(
            ctx,
            api,
            frame.assignedCount === 6 ? 'Left group: A and B' : 'Memberships: pending',
            1515,
            350,
            33,
            frame.assignedCount === 6 ? themeColors.blue : themeColors.muted,
            'center',
          );
          originalEquation(
            ctx,
            api,
            frame.assignedCount < 6
              ? String.raw`\bar x=?`
              : frame.meanXKnown
                ? String.raw`\bar x=(1.0+1.2)/2=1.1`
                : String.raw`\bar x=(1.0+1.2)/2=?`,
            465,
            themeColors.cyan,
            34,
          );
          originalEquation(
            ctx,
            api,
            frame.assignedCount < 6
              ? String.raw`\bar y=?`
              : frame.meanYKnown
                ? String.raw`\bar y=(1.0+1.8)/2=1.4`
                : String.raw`\bar y=(1.0+1.8)/2=?`,
            570,
            themeColors.pink,
            34,
          );
        });
        originalFocus(ctx, api, 'cluster-objective', () =>
          teaching.changeCue(
            {
              x: 1240,
              y: 680,
              width: 550,
              height: 140,
              from: initialInertia,
              to: frame.inertia,
              progress: 1,
              color: frame.update > 0 && frame.update < 1 ? themeColors.green : themeColors.ink,
              emphasis: frame.update > 0 && frame.update < 1 ? 1 : 0,
            },
            (v) => {
              originalText(
                ctx,
                api,
                frame.objectiveKnown
                  ? 'Within-group squared distance'
                  : frame.assignedCount + ' / 6 assignments',
                1515,
                720,
                29,
                themeColors.muted,
                'center',
              );
              originalMath(
                ctx,
                api,
                frame.objectiveKnown ? 'J=' + v.value.toFixed(2) : 'J=?',
                1515,
                790,
                51,
                v.color,
                'center',
              );
            },
          ),
        );
        originalMath(
          ctx,
          api,
          String.raw`\mu_k=\frac{1}{|S_k|}\sum_{i\in S_k}x_i`,
          1515,
          925,
          38,
          themeColors.yellow,
          'center',
        );
        originalFooter(
          ctx,
          api,
          currentBeat === 2
            ? 'Same memberships after reassignment · compare restarts for a new corpus.'
            : 'Yellow rings are centers · fixed observations keep their identities.',
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
  id: 'kmeans',
  draw: drawKmeans,
  cues: [
    'centers-seed',
    'points-assign',
    'cp-kmeans-0-0',
    'cp-kmeans-0-1',
    'cp-kmeans-0-2',
    'cp-kmeans-0-3',
    'cp-kmeans-0-4',
    'mean-x',
    'mean-y',
    'centers-update',
    'cp-kmeans-1-0',
    'cp-kmeans-1-1',
    'cp-kmeans-1-2',
    'cp-kmeans-1-3',
    'cp-kmeans-1-4',
    'assign-again',
    'cp-kmeans-2-0',
    'cp-kmeans-2-1',
    'cp-kmeans-2-2',
    'cp-kmeans-2-3',
    'cp-kmeans-2-4',
  ],
};
