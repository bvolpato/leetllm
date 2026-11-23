import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatNumber,
  formatVector,
  incidentMatrix,
  incidentNote,
  incidentRoute,
  incidentText,
  strokeArrow,
} from '../defaults.mjs';
export function drawLearnedLstm(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('learned-lstm', state),
    { b: currentBeat, p: progress2, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  api.focus.target('learned-lstm-operation', () => {
    const q = m.lstm;
    if (currentBeat === 0) {
      incidentText(
        ctx,
        api,
        'Separate supplied LSTM fixture · reproduction event',
        960,
        275,
        31,
        themeColors.muted,
        'center',
      );
      incidentText(ctx, api, 'old h', 300, 395, 29, themeColors.blue, 'center');
      incidentMatrix(ctx, api, [q.hOld], 215, 430, themeColors.blue, 76);
      incidentText(ctx, api, 'current x', 950, 395, 29, themeColors.green, 'center');
      incidentMatrix(ctx, api, [[0, 1, 0]], 825, 430, themeColors.green, 76);
      const progress = cue('lstm-concat', progress2);
      incidentRoute(
        ctx,
        api,
        {
          x: 300,
          y: 540,
        },
        {
          x: 785,
          y: 710,
        },
        progress,
        themeColors.blue,
      );
      incidentRoute(
        ctx,
        api,
        {
          x: 950,
          y: 540,
        },
        {
          x: 1040,
          y: 710,
        },
        progress,
        themeColors.green,
      );
      if (progress > 0) {
        incidentText(ctx, api, 'concatenate [h ; x]', 1400, 665, 29, themeColors.cyan, 'center');
        incidentMatrix(ctx, api, [q.joined], 755, 705, themeColors.cyan, 76);
      }
      incidentText(
        ctx,
        api,
        'old cell  c = ' + formatVector(ctx, api, q.cOld),
        960,
        910,
        37,
        themeColors.yellow,
        'center',
      );
      incidentNote(
        ctx,
        api,
        'Each of four distinct affine maps has shape 2 × 5, plus a two-value bias.',
      );
    } else if (currentBeat === 1) {
      incidentText(
        ctx,
        api,
        '[h ; x] = ' + formatVector(ctx, api, q.joined),
        960,
        275,
        30,
        themeColors.cyan,
        'center',
      );
      const gateIndex = started('lstm-output-gate', progress2 > 0.78)
        ? 3
        : started('lstm-candidate-gate', progress2 > 0.58)
          ? 2
          : started('lstm-input-gate', progress2 > 0.38)
            ? 1
            : 0;
      const matrices = [
        q.forgetMatrix,
        [
          [0, 0, 0, -1, 0],
          [0, 0, 0, 0, 0],
        ],
        [
          [0, 0, 0, 0.5, 0],
          [0, 0, 0, 0, 0],
        ],
        [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      ];
      const names = ['forget f', 'input i', 'candidate g', 'output o'],
        logits = [q.forgetLogits, [-1, 0], [0.5, 0], [Math.log(4), 0]],
        values = [q.f, q.i, q.candidate, q.o];
      incidentText(
        ctx,
        api,
        names[gateIndex] + ' · affine weights',
        400,
        385,
        30,
        colors[gateIndex % 3],
        'center',
      );
      incidentMatrix(ctx, api, matrices[gateIndex], 205, 425, colors[gateIndex % 3], 67);
      incidentText(
        ctx,
        api,
        'bias ' + (gateIndex === 3 ? '[ln 4, 0]' : '[0, 0]'),
        400,
        650,
        28,
        themeColors.muted,
        'center',
      );
      strokeArrow(ctx, api, 650, 505, 890, 505, themeColors.cyan);
      incidentText(
        ctx,
        api,
        'logits ' + formatVector(ctx, api, logits[gateIndex]),
        1210,
        505,
        35,
        themeColors.ink,
        'center',
      );
      strokeArrow(ctx, api, 1210, 550, 1210, 650, themeColors.cyan);
      incidentText(
        ctx,
        api,
        gateIndex === 2 ? 'tanh' : 'sigmoid',
        1210,
        700,
        30,
        themeColors.cyan,
        'center',
      );
      const revealId = [
        'lstm-forget-result',
        'lstm-input-result',
        'lstm-candidate-result',
        'lstm-output-result',
      ][gateIndex];
      if (started(revealId, progress2 > 0.3))
        incidentText(
          ctx,
          api,
          names[gateIndex] + ' = ' + formatVector(ctx, api, values[gateIndex]),
          1210,
          815,
          42,
          themeColors.yellow,
          'center',
        );
      incidentNote(
        ctx,
        api,
        'These weights are hand-chosen. Four different maps construct four different control vectors.',
      );
    } else {
      const gates = [
        ['f', q.f, themeColors.pink],
        ['i', q.i, themeColors.blue],
        ['g', q.candidate, themeColors.green],
        ['o', q.o, themeColors.yellow],
      ];
      gates.forEach(([label, values, color], j) => {
        incidentText(ctx, api, label, 255 + j * 475, 280, 32, color, 'center');
        incidentMatrix(ctx, api, [values], 175 + j * 475, 310, color, 65);
      });
      const progress = cue('lstm-cell-join', progress2),
        writtenProgress = cue('lstm-hidden-expose', progress2);
      for (let j = 0; j < 2; j++) {
        const y = 520 + j * 245;
        incidentText(ctx, api, 'coordinate ' + j, 130, y, 26, themeColors.muted);
        incidentText(
          ctx,
          api,
          formatNumber(ctx, api, q.f[j]) + ' × ' + formatNumber(ctx, api, q.cOld[j]),
          460,
          y,
          31,
          themeColors.pink,
          'center',
        );
        incidentText(
          ctx,
          api,
          formatNumber(ctx, api, q.i[j]) + ' × ' + formatNumber(ctx, api, q.candidate[j]),
          1190,
          y,
          31,
          themeColors.blue,
          'center',
        );
        incidentText(
          ctx,
          api,
          'retain ' + formatNumber(ctx, api, q.retained[j], 6),
          460,
          y + 66,
          27,
          themeColors.pink,
          'center',
        );
        incidentText(
          ctx,
          api,
          'write ' + formatNumber(ctx, api, q.written[j], 6),
          1190,
          y + 66,
          27,
          themeColors.blue,
          'center',
        );
        const target = {
          x: 815,
          y: y + 110,
        };
        incidentRoute(
          ctx,
          api,
          {
            x: 460,
            y: y + 90,
          },
          target,
          progress,
          themeColors.pink,
        );
        incidentRoute(
          ctx,
          api,
          {
            x: 1190,
            y: y + 90,
          },
          target,
          progress,
          themeColors.blue,
        );
        if (started('lstm-cell-result', progress2 > 0.3))
          incidentText(
            ctx,
            api,
            'c = ' + formatNumber(ctx, api, q.nextCell[j], 6),
            815,
            y + 165,
            34,
            themeColors.green,
            'center',
          );
        if (writtenProgress > 0) {
          strokeArrow(ctx, api, 1070, y + 138, 1375, y + 138, themeColors.yellow, 3);
          incidentText(ctx, api, 'o × tanh(c)', 1560, y + 80, 26, themeColors.yellow, 'center');
        }
        if (started('lstm-hidden-result', progress2 > 0.65))
          incidentText(
            ctx,
            api,
            'h = ' + formatNumber(ctx, api, q.nextHidden[j], 6),
            1560,
            y + 150,
            34,
            themeColors.yellow,
            'center',
          );
      }
      incidentNote(
        ctx,
        api,
        'The stored cell joins retained and written terms without tanh. Only the exposed hidden state applies it.',
      );
    }
  });
}
export default {
  id: 'learned-lstm',
  draw: drawLearnedLstm,
  cues: [
    'learned-lstm-0',
    'lstm-concat',
    'learned-lstm-1',
    'lstm-forget-result',
    'lstm-input-gate',
    'lstm-input-result',
    'lstm-candidate-gate',
    'lstm-candidate-result',
    'lstm-output-gate',
    'lstm-output-result',
    'learned-lstm-2',
    'lstm-cell-join',
    'lstm-cell-result',
    'lstm-hidden-expose',
    'lstm-hidden-result',
  ],
};
