import { labels, xy } from '../fixtures.mjs';
import { mix, visibleLineSegments } from '../arithmetic.mjs';
import { directed, seedMass } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionMath,
  extensionNote,
  extensionRing,
  extensionRows,
  extensionText,
} from '../defaults.mjs';
export function drawSeedingMass(ctx, scene, state, api) {
  return api.focus.target('seeding-mass-construction', () => {
    {
      const { C: themeColors, teaching: teaching } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-seeding-mass-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      {
        const q = extensionAxes(ctx, api, [0, 10], [-0.5, 5.5], 120, 355, 720, 430),
          mass = seedMass(),
          updated = seedMass([0, 5]),
          recompute = currentBeat >= 2 ? cueProgress(2, 1) : 0,
          weights = mass.weights.map((v, i) => mix(v, updated.weights[i], recompute));
        extensionDots(ctx, api, 'seeding-mass', colors, ids, labelBoxes, q, xy);
        extensionRing(ctx, api, q, xy[0]);
        if (currentBeat >= 2 && resultComplete(2, 0))
          extensionRing(ctx, api, q, xy[5], themeColors.pink);
        if (currentBeat === 0) {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'First selected center: A',
            480,
            300,
            31,
            themeColors.yellow,
          );
          extensionMath(
            ctx,
            api,
            String.raw`p_i=\frac{D(x_i)^2}{\sum_jD(x_j)^2}`,
            1370,
            450,
            50,
            themeColors.cyan,
          );
          if (resultComplete(0, 1))
            extensionRows(
              ctx,
              api,
              labelBoxes,
              mass.weights.map((v, i) => ids[i] + '  D² = ' + v.toFixed(2)),
              1370,
              600,
              57,
            );
        } else if (currentBeat <= 2) {
          const reveal = currentBeat >= 2 && resultComplete(2, 0),
            drawP = currentBeat === 1 ? 0 : Math.min(0.39, cueProgress(2, 0) * 0.39),
            categories = mass.weights.map((v, i) => ({
              id: ids[i],
              label: ids[i],
              mass: v,
              color: colors[labels[i]],
            }));
          teaching.categoricalSampling({
            x: 910,
            y: 275,
            width: 880,
            height: 660,
            categories,
            draws: [
              {
                id: 'u=.8',
                uniform: 0.8,
              },
            ],
            normalization: 'weights',
            visibleDraws: reveal ? 1 : 0,
            drawProgress: reveal ? 0 : drawP,
            fontSize: 25,
            color: themeColors.ink,
            trackColor: themeColors.panel,
          });
          if (currentBeat === 1)
            extensionText(
              ctx,
              api,
              labelBoxes,
              resultComplete(1, 2)
                ? 'Supplied u = 0.8 · which interval?'
                : 'Build the squared-distance mass first.',
              480,
              920,
              30,
              themeColors.yellow,
            );
          else
            extensionText(
              ctx,
              api,
              labelBoxes,
              reveal ? 'Selected F · inspect updated D² below' : 'Supplied u = 0.8 · answer held',
              480,
              920,
              30,
              reveal ? themeColors.pink : themeColors.yellow,
            );
          if (currentBeat >= 2 && cueProgress(2, 1) > 0)
            extensionText(
              ctx,
              api,
              labelBoxes,
              'New D²: [' + weights.map((v) => v.toFixed(2)).join(', ') + ']',
              960,
              970,
              27,
              themeColors.cyan,
            );
        } else {
          extensionRing(ctx, api, q, xy[5], themeColors.pink);
          extensionMath(
            ctx,
            api,
            String.raw`\mathbb E[J_{\rm init}]\le8(\ln k+2)J^*`,
            1380,
            395,
            40,
            themeColors.yellow,
          );
          if (resultComplete(3, 1))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Expectation over random seeds',
              1380,
              505,
              32,
              themeColors.muted,
            );
          if (cueProgress(3, 2) > 0) {
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Original: one candidate per draw',
              1380,
              660,
              30,
              themeColors.blue,
            );
            extensionText(
              ctx,
              api,
              labelBoxes,
              'scikit-learn 1.9.1: greedy trials',
              1380,
              735,
              30,
              themeColors.cyan,
            );
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Inspected 2026-09-21 · auto: one run',
              1380,
              795,
              26,
              themeColors.muted,
            );
          }
          if (resultComplete(3, 3))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Set restart count explicitly',
              1380,
              905,
              33,
              themeColors.green,
            );
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          currentBeat === 2 && resultComplete(2, 2)
            ? 'Zero total mass cannot define another draw; handle insufficient distinct locations.'
            : 'Supplied geometry and draw · no random experiment or empirical optimality claim.',
        );
      }
      for (const { q, a, z, color, width } of pendingSegments)
        for (const points of visibleLineSegments(a, z, labelBoxes))
          api.path(ctx, points, {
            color,
            width,
            clip: q.bounds,
          });
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
  id: 'seeding-mass',
  draw: drawSeedingMass,
  cues: [
    'cp-seeding-mass-0-0',
    'cp-seeding-mass-0-1',
    'cp-seeding-mass-0-2',
    'cp-seeding-mass-0-3',
    'cp-seeding-mass-1-0',
    'cp-seeding-mass-1-1',
    'cp-seeding-mass-1-2',
    'cp-seeding-mass-1-3',
    'cp-seeding-mass-2-0',
    'cp-seeding-mass-2-1',
    'cp-seeding-mass-2-2',
    'cp-seeding-mass-3-0',
    'cp-seeding-mass-3-1',
    'cp-seeding-mass-3-2',
    'cp-seeding-mass-3-3',
  ],
};
