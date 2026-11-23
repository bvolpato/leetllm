import { incidentFrame } from '../construction.mjs';
import { gruResetComparison, incidentModel } from '../model.mjs';
import {
  formatNumber,
  formatVector,
  incidentAxis,
  incidentMatrix,
  incidentNote,
  incidentText,
  strokeArrow,
  strokeLine,
} from '../defaults.mjs';
export function drawLearnedGru(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('learned-gru', state),
    { b: currentBeat, p: progress2, cue, started } = f;
  api.focus.target('learned-gru-operation', () => {
    const q = m.gru;
    incidentText(
      ctx,
      api,
      'Separate supplied GRU fixture · old h = ' + formatVector(ctx, api, q.hidden),
      960,
      270,
      30,
      themeColors.muted,
      'center',
    );
    if (currentBeat === 0) {
      incidentMatrix(ctx, api, [[0, 1, 0]], 245, 350, themeColors.green, 80);
      incidentText(ctx, api, 'reproduction x', 365, 490, 29, themeColors.green, 'center');
      const rows = [
        {
          name: 'keep z',
          weights: ['ln 19', 0],
          logits: [Math.log(19), 0],
          values: q.z,
          color: themeColors.blue,
          cue: 'gru-keep-result',
        },
        {
          name: 'reset r',
          weights: ['−ln 9', 'ln 9'],
          logits: [-Math.log(9), Math.log(9)],
          values: q.reset,
          color: themeColors.pink,
          cue: 'gru-reset-result',
        },
      ];
      rows.forEach((row, j) => {
        const y = 390 + j * 340;
        incidentText(ctx, api, row.name, 920, y - 55, 33, row.color, 'center');
        incidentText(
          ctx,
          api,
          'reproduction weights ' + row.weights.join(', '),
          1060,
          y + 8,
          29,
          row.color,
          'center',
        );
        incidentText(
          ctx,
          api,
          'all other weights and biases = 0',
          1060,
          y + 63,
          26,
          themeColors.muted,
          'center',
        );
        strokeArrow(ctx, api, 1060, y + 95, 1060, y + 145, row.color);
        if (started(row.cue, progress2 > 0.3 + j * 0.4))
          incidentText(
            ctx,
            api,
            'σ(' + formatVector(ctx, api, row.logits) + ') = ' + formatVector(ctx, api, row.values),
            1060,
            y + 209,
            36,
            row.color,
            'center',
          );
      });
      incidentNote(
        ctx,
        api,
        'Both controls are sigmoid affine projections, even when hidden weights are zero in this fixture.',
      );
    } else if (currentBeat === 1) {
      incidentText(ctx, api, 'Same recurrent matrix', 285, 370, 28, themeColors.cyan, 'center');
      incidentMatrix(ctx, api, q.recurrent, 205, 405, themeColors.cyan, 70);
      incidentText(
        ctx,
        api,
        'keep z = ' +
          formatVector(ctx, api, q.z) +
          '   reset r = ' +
          formatVector(ctx, api, q.reset),
        1160,
        360,
        29,
        themeColors.ink,
        'center',
      );
      const variants = [
        {
          name: 'Original · reset before W',
          candidate: q.beforeCandidate,
          hidden: q.beforeHidden,
          color: themeColors.pink,
          cue: 'gru-original-blend',
        },
        {
          name: 'PyTorch · reset after W',
          candidate: q.afterCandidate,
          hidden: q.afterHidden,
          color: themeColors.blue,
          cue: 'gru-pytorch-blend',
        },
      ];
      variants.forEach((variant, row) => {
        const top = 465 + row * 260;
        incidentText(ctx, api, variant.name, 1220, top, 29, variant.color, 'center');
        for (let j = 0; j < 2; j++) {
          const x = 620 + j * 640,
            map = incidentAxis(ctx, api, x, top + 110, 490, -1, 1),
            start = map(q.hidden[j]),
            end = map(variant.candidate[j]);
          incidentText(
            ctx,
            api,
            'coordinate ' + j + '   z=' + formatNumber(ctx, api, q.z[j], 2),
            x + 245,
            top + 62,
            26,
            themeColors.muted,
            'center',
          );
          api.circle(ctx, start, top + 110, 7, themeColors.green, themeColors.green, 1);
          api.circle(ctx, end, top + 110, 7, variant.color, variant.color, 1);
          const progress = cue(variant.cue, progress2),
            value = q.hidden[j] + (variant.hidden[j] - q.hidden[j]) * progress;
          strokeLine(ctx, api, start, top + 80, map(value), top + 80, themeColors.yellow, 5);
          api.circle(ctx, map(value), top + 80, 9, themeColors.yellow, themeColors.yellow, 1);
          if (started(variant.cue, progress2 > 0.4))
            incidentText(
              ctx,
              api,
              'h = ' + formatNumber(ctx, api, variant.hidden[j], 6),
              x + 245,
              top + 190,
              30,
              variant.color,
              'center',
            );
        }
      });
      incidentNote(
        ctx,
        api,
        'Each coordinate uses its own keep fraction. Yellow markers travel from the old state toward its candidate.',
      );
    } else {
      incidentText(ctx, api, 'Do the two orders commute?', 960, 330, 39, themeColors.ink, 'center');
      const cases = [
        {
          name: 'uniform reset',
          reset: [0.5, 0.5],
          matrix: q.recurrent,
        },
        {
          name: 'diagonal W',
          reset: q.reset,
          matrix: [
            [1, 0],
            [0, 4],
          ],
        },
      ];
      cases.forEach((item, j) => {
        const x = 450 + j * 980,
          comparison = gruResetComparison({
            reset: item.reset,
            recurrent: item.matrix,
          });
        incidentText(ctx, api, item.name, x, 435, 31, themeColors.cyan, 'center');
        incidentMatrix(ctx, api, item.matrix, x - 80, 470, themeColors.cyan, 70);
        incidentText(
          ctx,
          api,
          'r = ' + formatVector(ctx, api, item.reset),
          x,
          690,
          28,
          themeColors.pink,
          'center',
        );
        if (started('gru-agreement', progress2 > 0.15))
          incidentText(
            ctx,
            api,
            formatVector(ctx, api, comparison.before) +
              ' = ' +
              formatVector(ctx, api, comparison.after),
            x,
            760,
            30,
            themeColors.green,
            'center',
          );
      });
      if (started('gru-bias', progress2 > 0.4)) {
        incidentText(
          ctx,
          api,
          'Candidate recurrent bias = 1',
          960,
          861,
          31,
          themeColors.yellow,
          'center',
        );
        incidentText(
          ctx,
          api,
          'r = 0.1 → contribution 0.1',
          460,
          928,
          31,
          themeColors.pink,
          'center',
        );
        incidentText(
          ctx,
          api,
          'r = 0.9 → contribution 0.9',
          1450,
          928,
          31,
          themeColors.blue,
          'center',
        );
      }
      incidentNote(
        ctx,
        api,
        'One fixed input bias cannot reproduce both reset-dependent contributions.',
      );
    }
  });
}
export default {
  id: 'learned-gru',
  draw: drawLearnedGru,
  cues: [
    'learned-gru-0',
    'gru-keep-result',
    'gru-reset-result',
    'learned-gru-1',
    'gru-original-blend',
    'gru-pytorch-blend',
    'learned-gru-2',
    'gru-agreement',
    'gru-bias',
  ],
};
