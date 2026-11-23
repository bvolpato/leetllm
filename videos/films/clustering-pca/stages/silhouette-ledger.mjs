import { clusterTrials, labels, xy } from '../fixtures.mjs';
import { silhouette, visibleLineSegments } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionMath,
  extensionNote,
  extensionRows,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawSilhouetteLedger(ctx, scene, state, api) {
  return api.focus.target('silhouette-ledger-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-silhouette-ledger-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      {
        const trial = clusterTrials[1],
          all = clusterTrials.map((t) => xy.map((_, i) => silhouette(xy, t.labels, i))),
          a = all[1][0];
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Same six IDs · actual partition contributions',
          960,
          270,
          34,
          themeColors.cyan,
        );
        if (currentBeat === 0) {
          const q = extensionAxes(ctx, api, [0, 10], [-0.5, 5.5], 150, 370, 870, 455);
          extensionDots(
            ctx,
            api,
            'silhouette-ledger',
            colors,
            ids,
            labelBoxes,
            q,
            xy,
            ids,
            trial.labels,
          );
          if (cueProgress(0, 1) > 0)
            extensionSegment(
              ctx,
              api,
              pendingSegments,
              q,
              xy[0],
              xy[1],
              themeColors.cyan,
              5,
              cueProgress(0, 1),
            );
          if (cueProgress(0, 2) > 0)
            [2, 3, 4, 5].forEach((i) =>
              extensionSegment(
                ctx,
                api,
                pendingSegments,
                q,
                xy[0],
                xy[i],
                labels[i] === 1 ? themeColors.pink : themeColors.muted,
                2,
                cueProgress(0, 2),
              ),
            );
          extensionRows(
            ctx,
            api,
            labelBoxes,
            [
              'a = ' + (resultComplete(0, 1) ? a.a.toFixed(3) : '?'),
              'b = ' + (resultComplete(0, 2) ? a.b.toFixed(3) : '?'),
              's(A) = ' + (resultComplete(0, 3) ? a.score.toFixed(3) : '?'),
            ],
            1470,
            430,
            130,
          );
          if (cueProgress(0, 3) > 0)
            extensionMath(
              ctx,
              api,
              String.raw`s=\frac{b-a}{\max(a,b)}`,
              1470,
              880,
              40,
              themeColors.green,
            );
        } else {
          const count = currentBeat > 1 ? 6 : Math.floor(6 * cueProgress(1, 2) + 1e-9),
            meanKnown = currentBeat > 1 || resultComplete(1, 3);
          ['k', 'A', 'B', 'C', 'D', 'E', 'F', 'mean'].forEach((v, i) =>
            extensionText(ctx, api, labelBoxes, v, 205 + i * 210, 370, 27, themeColors.muted),
          );
          clusterTrials.forEach((trial, r) => {
            const y = 480 + r * 150;
            extensionText(ctx, api, labelBoxes, trial.k, 205, y, 37, themeColors.yellow);
            all[r].forEach((row, i) => {
              if (i < count)
                extensionText(
                  ctx,
                  api,
                  labelBoxes,
                  row.score.toFixed(3) + (row.singleton ? ' *' : ''),
                  415 + i * 210,
                  y,
                  29,
                  row.singleton ? themeColors.pink : themeColors.cyan,
                );
            });
            extensionText(
              ctx,
              api,
              labelBoxes,
              meanKnown ? trial.silhouette.toFixed(3) : '?',
              1675,
              y,
              35,
              r === 1 ? themeColors.green : themeColors.ink,
            );
          });
          if (resultComplete(1, 0))
            extensionText(
              ctx,
              api,
              labelBoxes,
              '* Singleton = 0 · zero / zero distance case = 0',
              960,
              920,
              28,
              themeColors.pink,
            );
          if (currentBeat === 2) {
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Observed inertia: ' + clusterTrials.map((t) => t.inertia.toFixed(2)).join(' → '),
              960,
              880,
              31,
              themeColors.yellow,
            );
          }
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          currentBeat === 2
            ? 'Lower inertia can accompany fragmented groups; reviewed topics need their own evidence.'
            : 'Only collected point contributions enter the displayed partition mean.',
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
  id: 'silhouette-ledger',
  draw: drawSilhouetteLedger,
  cues: [
    'cp-silhouette-ledger-0-0',
    'cp-silhouette-ledger-0-1',
    'cp-silhouette-ledger-0-2',
    'cp-silhouette-ledger-0-3',
    'cp-silhouette-ledger-0-4',
    'cp-silhouette-ledger-1-0',
    'cp-silhouette-ledger-1-1',
    'cp-silhouette-ledger-1-2',
    'cp-silhouette-ledger-1-3',
    'cp-silhouette-ledger-2-0',
    'cp-silhouette-ledger-2-1',
    'cp-silhouette-ledger-2-2',
    'cp-silhouette-ledger-2-3',
  ],
};
