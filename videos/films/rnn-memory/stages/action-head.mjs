import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatNumber,
  incidentMath,
  incidentMatrix,
  incidentNote,
  incidentText,
  strokeArrow,
} from '../defaults.mjs';
export function drawActionHead(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('action-head', state),
    { b: currentBeat, p: progress, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  api.focus.target('action-head-operation', () => {
    const outputNames = ['ignore', 'rollback', 'escalate'];
    incidentText(ctx, api, 'Retained incident state', 305, 300, 28, themeColors.green, 'center');
    incidentMatrix(
      ctx,
      api,
      m.roundedState.map((value) => [value]),
      267,
      335,
      themeColors.green,
      76,
    );
    incidentText(ctx, api, 'Action projection', 785, 300, 28, themeColors.blue, 'center');
    incidentMatrix(ctx, api, m.readout, 705, 335, themeColors.blue, 76);
    if (currentBeat < 2) {
      m.logits.forEach((value, i) => {
        const y = 370 + i * 155,
          ready = currentBeat > 0 || started('head-row-' + i, progress > (i + 1) * 0.18);
        strokeArrow(ctx, api, 885, y + 8, 1080, y + 8, themeColors.blue, 2);
        incidentText(ctx, api, outputNames[i], 1130, y + 15, 27, colors[i]);
        if (ready)
          incidentText(
            ctx,
            api,
            formatNumber(ctx, api, value, 4),
            1460,
            y + 15,
            37,
            themeColors.ink,
            'right',
          );
        else incidentText(ctx, api, '?', 1460, y + 15, 37, themeColors.muted, 'right');
        if (currentBeat === 1 && started('head-softmax', progress > 0.25)) {
          const width = (330 * m.probabilities[i]) / 0.5;
          api.rect(ctx, 1130, y + 43, width, 26, colors[i], undefined, 3);
          incidentText(
            ctx,
            api,
            (m.probabilities[i] * 100).toFixed(1) + '%',
            1710,
            y + 20,
            30,
            colors[i],
            'right',
          );
        }
      });
      if (currentBeat === 1)
        incidentMath(
          ctx,
          api,
          String.raw`p_i=\frac{e^{z_i-\max z}}{\sum_j e^{z_j-\max z}}`,
          960,
          873,
          41,
          themeColors.cyan,
        );
      incidentNote(
        ctx,
        api,
        currentBeat === 0
          ? 'Which action has the largest logit?'
          : 'Rollback is the largest supplied logit. This is one trace, not held-out accuracy.',
      );
    } else {
      incidentText(ctx, api, 'One recurrent block', 1280, 330, 29, themeColors.cyan, 'center');
      const pieces = [
        {
          n: 6,
          label: 'input',
          color: themeColors.blue,
        },
        {
          n: 4,
          label: 'recurrent',
          color: themeColors.pink,
        },
        {
          n: 2,
          label: 'bias',
          color: themeColors.yellow,
        },
      ];
      let k = 0;
      pieces.forEach((piece) => {
        for (let j = 0; j < piece.n; j++, k++)
          api.rect(
            ctx,
            1090 + (k % 6) * 56,
            390 + Math.floor(k / 6) * 63,
            48,
            48,
            piece.color,
            undefined,
            4,
          );
        incidentText(
          ctx,
          api,
          piece.label + ' ' + piece.n,
          1130,
          600 + pieces.indexOf(piece) * 47,
          27,
          piece.color,
        );
      });
      const headReady = started('head-parameter-count', progress > 0.3);
      if (headReady) {
        incidentText(
          ctx,
          api,
          'head: 6 weights + 3 biases',
          960,
          813,
          34,
          themeColors.green,
          'center',
        );
        incidentText(
          ctx,
          api,
          '12 + 9 = 21 parameters',
          960,
          882,
          47,
          themeColors.yellow,
          'center',
        );
      }
      [3, 30, 300].forEach((n, i) =>
        incidentText(ctx, api, n + ' events', 510 + i * 450, 956, 29, themeColors.ink, 'center'),
      );
      incidentNote(
        ctx,
        api,
        'Same parameter storage · execution and saved full-BPTT activations grow with sequence length.',
      );
    }
  });
}
export default {
  id: 'action-head',
  draw: drawActionHead,
  cues: [
    'action-head-0',
    'head-row-0',
    'head-row-1',
    'head-row-2',
    'action-head-1',
    'head-softmax',
    'action-head-2',
    'head-parameter-count',
  ],
};
