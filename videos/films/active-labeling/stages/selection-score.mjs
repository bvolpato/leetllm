import { euclidean } from '../arithmetic.mjs';
import { selectionItems } from '../fixtures.mjs';
import { binaryMeasures, hybridSteps } from '../model.mjs';
import {
  cueVisible,
  detailFooter,
  detailHeading,
  detailRectangle,
  detailTarget,
  detailText,
} from '../defaults.mjs';
export function drawSelectionScore(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      detailHeading(ctx, api, 'Three binary acquisition scores agree on the order');
      const measures = cueVisible(ctx, api, 'binary-scores'),
        entropy = cueVisible(ctx, api, 'entropy-build'),
        ranked = cueVisible(ctx, api, 'binary-ranking');
      ['P(A preferred)', 'Least confidence', 'Normalized margin', 'Entropy / bits'].forEach(
        (s, i) =>
          detailText(ctx, api, s, [270, 700, 1130, 1570][i], 350, 27, themeColors.muted, 'center'),
      );
      detailTarget(ctx, api, 'binary-scores', () =>
        [0.49, 0.53, 0.7, 0.97].forEach((v, i) => {
          const y = 445 + i * 125,
            m = binaryMeasures(v);
          detailText(ctx, api, v.toFixed(2), 270, y, 35, themeColors.blue, 'center');
          if (measures) {
            [
              [m.least, 580, themeColors.cyan],
              [m.margin, 1010, themeColors.yellow],
            ].forEach(([q, x, col]) => {
              detailRectangle(ctx, api, x, y - 30, 200 * q, 40, col, col);
              detailText(ctx, api, q.toFixed(2), x + 250, y + 4, 28, col, 'center');
            });
          }
          if (entropy)
            detailTarget(ctx, api, 'entropy-build', () => {
              detailRectangle(
                ctx,
                api,
                1450,
                y - 30,
                190 * m.entropy,
                40,
                themeColors.pink,
                themeColors.pink,
              );
              detailText(
                ctx,
                api,
                m.entropy.toFixed(3),
                1710,
                y + 4,
                28,
                themeColors.pink,
                'center',
              );
            });
        }),
      );
      detailTarget(ctx, api, 'binary-ranking', () => {
        if (ranked)
          detailText(
            ctx,
            api,
            'Review priority: .49 → .53 → .70 → .97',
            960,
            975,
            34,
            themeColors.green,
            'center',
          );
      });
      detailFooter(
        ctx,
        api,
        'Binary rankings coincide; multiclass criteria need not rank candidates alike.',
      );
    } else if (currentBeat === 1) {
      detailHeading(ctx, api, 'The hybrid score earns its second selection');
      const weighted = cueVisible(ctx, api, 'weighted-score'),
        again = cueVisible(ctx, api, 'recompute-distance'),
        step = hybridSteps()[1],
        items = ['handoff', 'canary-2'].map((id) => step.ranked.find((r) => r.item.id === id));
      items.forEach((r, i) => {
        const y = 400 + i * 220;
        detailText(ctx, api, r.item.id, 180, y + 50, 31, themeColors.ink);
        detailText(
          ctx,
          api,
          'U=' +
            r.item.uncertainty.toFixed(2) +
            ' · D=' +
            (r.distance / Math.max(...step.ranked.map((r) => r.distance))).toFixed(3),
          180,
          y + 110,
          27,
          themeColors.muted,
        );
        if (weighted)
          detailTarget(ctx, api, 'weighted-score', () => {
            const u = 0.6 * r.item.uncertainty,
              d = r.score - u;
            detailRectangle(ctx, api, 700, y, 900 * u, 70, themeColors.blue, themeColors.blue);
            detailRectangle(
              ctx,
              api,
              700 + 900 * u,
              y,
              900 * d,
              70,
              themeColors.cyan,
              themeColors.cyan,
            );
            detailText(
              ctx,
              api,
              r.score.toFixed(3),
              1590,
              y + 52,
              36,
              i ? themeColors.muted : themeColors.green,
              'center',
            );
          });
      });
      detailText(ctx, api, '0.6 × uncertainty', 940, 835, 28, themeColors.blue, 'center');
      detailText(
        ctx,
        api,
        '0.4 × normalized nearest distance',
        1340,
        900,
        28,
        themeColors.cyan,
        'center',
      );
      detailTarget(ctx, api, 'recompute-distance', () => {
        if (again)
          detailText(
            ctx,
            api,
            'Choose handoff → recompute every remaining nearest distance',
            960,
            975,
            32,
            themeColors.green,
            'center',
          );
      });
      detailFooter(ctx, api, 'A centroid may be synthetic; a medoid is an actual record.');
    } else {
      detailHeading(ctx, api, 'Covering radius and targeted failures are different objectives');
      const radius = cueVisible(ctx, api, 'covering-radius'),
        bias = cueVisible(ctx, api, 'sampling-bias'),
        steps = hybridSteps(),
        selected = steps[1].selected,
        remaining = selectionItems.filter((i) => !selected.includes(i)),
        gaps = remaining.map((i) => ({
          id: i.id,
          d: Math.min(...selected.map((s) => euclidean(i.xy, s.xy))),
        })),
        max = Math.max(...gaps.map((g) => g.d));
      detailText(
        ctx,
        api,
        'Selected: canary-1 and handoff · supplied geometry',
        960,
        350,
        28,
        themeColors.blue,
        'center',
      );
      detailTarget(ctx, api, 'covering-radius', () => {
        if (radius)
          gaps.forEach((r, i) => {
            const y = 420 + i * 110;
            detailText(ctx, api, r.id, 180, y + 40, 27, themeColors.muted);
            detailRectangle(
              ctx,
              api,
              610,
              y,
              100 * r.d,
              50,
              r.d === max ? themeColors.yellow : themeColors.blue,
              r.d === max ? themeColors.yellow : themeColors.blue,
            );
            detailText(
              ctx,
              api,
              r.d.toFixed(2),
              1350,
              y + 40,
              28,
              r.d === max ? themeColors.yellow : themeColors.blue,
            );
          });
      });
      if (radius)
        detailText(
          ctx,
          api,
          'k-center: choose a budgeted subset that minimizes this maximum distance',
          960,
          915,
          29,
          themeColors.yellow,
          'center',
        );
      detailTarget(ctx, api, 'sampling-bias', () => {
        if (bias)
          detailText(
            ctx,
            api,
            'Selected-case rates alone do not establish production prevalence',
            960,
            980,
            35,
            themeColors.pink,
            'center',
          );
      });
      detailFooter(
        ctx,
        api,
        'Use representative or justified probability sampling for a prevalence estimate.',
      );
    }
  }
  return;
}
export default {
  id: 'selection-score',
  draw: drawSelectionScore,
  cues: [
    'binary-scores',
    'entropy-build',
    'binary-ranking',
    'weighted-score',
    'recompute-distance',
    'covering-radius',
    'sampling-bias',
  ],
};
