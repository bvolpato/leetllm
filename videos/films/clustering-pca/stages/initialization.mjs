import { xy } from '../fixtures.mjs';
import { distance, mix, visibleLineSegments } from '../arithmetic.mjs';
import { directed, emptyCenterRepair } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionNote,
  extensionRing,
  extensionRows,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawInitialization(ctx, scene, state, api) {
  return api.focus.target('initialization-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-initialization-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      {
        const model = emptyCenterRepair(),
          repair = currentBeat > 0 ? cueProgress(1, 0) : 0,
          settle = currentBeat === 2 ? cueProgress(2, 0) : 0,
          assigned = currentBeat > 0 || cueProgress(0, 2) > 0,
          current = model.initial.map((p, i) => {
            const reseeded =
              i === 2
                ? [
                    mix(p[0], xy[model.farthest][0], repair),
                    mix(p[1], xy[model.farthest][1], repair),
                  ]
                : p;
            return reseeded.map((v, j) => mix(v, model.fit.centers[i][j], settle));
          }),
          assignment = settle > 0 ? model.fit.labels : repair === 1 ? model.after : model.before;
        const q = extensionAxes(ctx, api);
        if (assigned)
          xy.forEach((p, i) => {
            if (assignment[i] < 2 || repair === 1)
              extensionSegment(
                ctx,
                api,
                pendingSegments,
                q,
                p,
                current[assignment[i]],
                colors[assignment[i]],
                3,
              );
          });
        extensionDots(
          ctx,
          api,
          'initialization',
          colors,
          ids,
          labelBoxes,
          q,
          xy,
          ids,
          assigned ? assignment : null,
        );
        current.slice(0, 2).forEach((p) => extensionRing(ctx, api, q, p));
        if (repair === 1) extensionRing(ctx, api, q, current[2], themeColors.pink);
        else {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'C₂ at (100,100) · outside this magnified view',
            1430,
            325,
            27,
            themeColors.pink,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Original center remains at its stated coordinates.',
            1430,
            380,
            24,
            themeColors.muted,
          );
        }
        const counts = assigned
          ? [0, 1, 2].map((k) => assignment.filter((v) => v === k).length)
          : ['?', '?', '?'];
        extensionRows(
          ctx,
          api,
          labelBoxes,
          ['Assigned members', ...counts.map((n, k) => 'C' + k + ': ' + n)],
          1490,
          475,
          72,
        );
        if (resultComplete(0, 3) && repair < 1)
          extensionText(
            ctx,
            api,
            labelBoxes,
            'C₂ mean: 0/0 → STOP',
            1490,
            815,
            35,
            themeColors.pink,
          );
        if (repair === 1)
          extensionText(
            ctx,
            api,
            labelBoxes,
            settle === 1
              ? 'Settled centers and repeated memberships'
              : 'Reseed C₂ at F, then assign again',
            1490,
            815,
            29,
            themeColors.green,
          );
        if (currentBeat >= 1 && cueProgress(1, 2) > 0)
          extensionText(
            ctx,
            api,
            labelBoxes,
            'First-center ties · repeated assignment · cap 20',
            1490,
            905,
            25,
            themeColors.muted,
          );
        if (currentBeat === 2) {
          const error = xy.reduce((sum, p, i) => sum + distance(p, current[assignment[i]]) ** 2, 0);
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Current repaired run J = ' + error.toFixed(2),
            1490,
            970,
            29,
            themeColors.yellow,
          );
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          repair === 1
            ? 'A stated repair changes the actual center and its memberships.'
            : 'Point coordinates stay fixed while the initialization changes.',
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
  id: 'initialization',
  draw: drawInitialization,
  cues: [
    'cp-initialization-0-0',
    'cp-initialization-0-1',
    'cp-initialization-0-2',
    'cp-initialization-0-3',
    'cp-initialization-0-4',
    'cp-initialization-1-0',
    'cp-initialization-1-1',
    'cp-initialization-1-2',
    'cp-initialization-1-3',
    'cp-initialization-2-0',
    'cp-initialization-2-1',
    'cp-initialization-2-2',
    'cp-initialization-2-3',
  ],
};
