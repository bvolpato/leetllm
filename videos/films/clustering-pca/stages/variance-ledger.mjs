import { visibleLineSegments } from '../arithmetic.mjs';
import { directed, energyRows } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionMath,
  extensionNote,
  extensionRows,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawVarianceLedger(ctx, scene, state, api) {
  return api.focus.target('variance-ledger-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-variance-ledger-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      {
        const all = energyRows(),
          row = all[2];
        if (currentBeat === 0) {
          const q = extensionAxes(ctx, api, [-2.5, 1], [-0.5, 2.5], 140, 340, 800, 500);
          extensionSegment(ctx, api, pendingSegments, q, [0, 0], row.centered, themeColors.ink, 5);
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            [0, 0],
            row.foot,
            themeColors.cyan,
            6,
            cueProgress(0, 0),
          );
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            row.foot,
            row.centered,
            themeColors.pink,
            6,
            cueProgress(0, 1),
          );
          extensionDots(
            ctx,
            api,
            'variance-ledger',
            colors,
            ids,
            labelBoxes,
            q,
            [row.centered, row.foot],
            ['C', 'projection'],
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            'C in centered space',
            1430,
            330,
            34,
            themeColors.cyan,
          );
          extensionRows(
            ctx,
            api,
            labelBoxes,
            [
              '||xc||² = ' + row.total.toFixed(3),
              'score² = ' + (resultComplete(0, 0) ? row.retained.toFixed(3) : '?'),
              'residual² = ' + (resultComplete(0, 1) ? row.discarded.toFixed(3) : '?'),
            ],
            1430,
            460,
            115,
          );
          if (resultComplete(0, 2))
            extensionMath(
              ctx,
              api,
              row.total.toFixed(3) + '=' + row.retained.toFixed(3) + '+' + row.discarded.toFixed(3),
              1430,
              870,
              38,
              themeColors.green,
            );
        } else {
          ['ID', 'score²', 'residual²', 'total'].forEach((v, i) =>
            extensionText(ctx, api, labelBoxes, v, 220 + i * 320, 315, 28, themeColors.muted),
          );
          all.forEach((row, i) =>
            [
              row.id,
              row.retained.toFixed(3),
              row.discarded.toFixed(3),
              row.total.toFixed(3),
            ].forEach((v, j) =>
              extensionText(
                ctx,
                api,
                labelBoxes,
                v,
                220 + j * 320,
                405 + i * 77,
                30,
                j === 1 ? themeColors.cyan : j === 2 ? themeColors.pink : themeColors.ink,
              ),
            ),
          );
          const retained = all.reduce((s, r) => s + r.retained, 0),
            residual = all.reduce((s, r) => s + r.discarded, 0);
          extensionText(
            ctx,
            api,
            labelBoxes,
            resultComplete(1, 0)
              ? 'Total: ' + (retained + residual).toFixed(3)
              : 'Sum all six rows',
            1510,
            380,
            33,
            themeColors.ink,
          );
          if (resultComplete(1, 1)) {
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Retain ' + retained.toFixed(3),
              1510,
              535,
              37,
              themeColors.cyan,
            );
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Discard ' + residual.toFixed(3),
              1510,
              650,
              37,
              themeColors.pink,
            );
          }
          if (resultComplete(1, 2))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Sample variances: ' + (retained / 5).toFixed(4) + ' + ' + (residual / 5).toFixed(4),
              1510,
              810,
              27,
              themeColors.yellow,
            );
          if (cueProgress(1, 3) > 0)
            extensionMath(
              ctx,
              api,
              String.raw`\widehat x=μ+\sum_jz_jv_j`,
              1510,
              925,
              39,
              themeColors.green,
            );
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          'Orthogonal components account for the same fixed source energy.',
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
  id: 'variance-ledger',
  draw: drawVarianceLedger,
  cues: [
    'cp-variance-ledger-0-0',
    'cp-variance-ledger-0-1',
    'cp-variance-ledger-0-2',
    'cp-variance-ledger-0-3',
    'cp-variance-ledger-1-0',
    'cp-variance-ledger-1-1',
    'cp-variance-ledger-1-2',
    'cp-variance-ledger-1-3',
    'cp-variance-ledger-1-4',
  ],
};
