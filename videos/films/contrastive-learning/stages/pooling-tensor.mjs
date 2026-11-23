import { finiteUnit, maskedMean } from '../arithmetic.mjs';
import { drawCells, drawMatrix, drawNote, drawText } from '../defaults.mjs';
import { dotProduct } from 'vizmatic';
export function drawPoolingTensor(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-pooling-tensor-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('pooling-tensor-mechanism', () => {
    const states = [
        [
          [1, 0],
          [0, 1],
          [99, 99],
        ],
        [
          [0, 2],
          [0, 0],
          [99, 99],
        ],
      ],
      masks = [
        [1, 1, 0],
        [1, 0, 0],
      ],
      means = states.map((v, i) => maskedMean(v, masks[i])),
      units = means.map(finiteUnit);
    if (currentBeat === 0) {
      drawText(
        ctx,
        api,
        'Supplied token states · no model downloaded',
        960,
        280,
        35,
        themeColors.yellow,
      );
      states.forEach((rows, i) => {
        const y = 390 + i * 225;
        drawText(ctx, api, 'Sequence ' + (i + 1), 260, y + 30, 29, themeColors.blue);
        rows.forEach((v, j) => {
          const x = 490 + j * 285;
          drawCells(
            ctx,
            api,
            masks[i][j] ? v : v.map((z) => z * (1 - cueProgress('mask'))),
            x,
            y,
            130,
            70,
            masks[i][j] ? themeColors.blue : themeColors.muted,
          );
          drawText(
            ctx,
            api,
            'mask ' + masks[i][j],
            x + 120,
            y + 120,
            27,
            masks[i][j] ? themeColors.blue : themeColors.pink,
          );
        });
        if (B('sum')) {
          const valid = rows.filter((_, j) => masks[i][j]),
            count = cueProgress('sum') * valid.length,
            sum = [0, 1].map((k) =>
              valid.reduce((a, v, j) => a + v[k] * api.clamp(count - j, 0, 1), 0),
            ),
            shown = resultComplete('mean') ? (resultComplete('norm') ? units[i] : means[i]) : sum;
          drawText(
            ctx,
            api,
            resultComplete('mean')
              ? resultComplete('norm')
                ? 'unit vector'
                : 'mean'
              : 'Σ valid states',
            1560,
            y - 25,
            27,
            themeColors.cyan,
          );
          drawCells(ctx, api, shown, 1410, y, 150, 70, themeColors.cyan);
        }
      });
      if (resultComplete('norm'))
        drawText(
          ctx,
          api,
          'Finite nonzero means → normalized unit vectors',
          960,
          910,
          35,
          themeColors.green,
        );
      drawNote(ctx, api, 'Mask before sum and count · empty valid-token sets are rejected');
    } else {
      drawText(
        ctx,
        api,
        'Q × Dᵀ · candidates remain separate columns',
        960,
        280,
        35,
        themeColors.yellow,
      );
      drawMatrix(ctx, api, units, 250, 420, 160, 100, () => false);
      drawText(ctx, api, 'Q', 410, 360, 32, themeColors.blue);
      drawMatrix(
        ctx,
        api,
        [
          [1, 0],
          [0, 1],
        ],
        800,
        420,
        160,
        100,
        (i, j) => i === j,
      );
      drawText(ctx, api, 'Dᵀ', 960, 360, 32, themeColors.cyan);
      if (resultComplete('matrix')) {
        const scores = units.map((q) =>
          [
            [1, 0],
            [0, 1],
          ].map((d) => dotProduct(q, d)),
        );
        drawMatrix(ctx, api, scores, 1370, 420, 160, 100, (i, j) => i === j);
        drawText(ctx, api, 'scores', 1530, 360, 32, themeColors.green);
      }
      if (resultComplete('loss'))
        drawText(ctx, api, 'Mean row CE = 0.349931', 960, 760, 40, themeColors.green);
      if (resultComplete('gradient')) {
        drawCells(ctx, api, ['−0.883883', '0.883883'], 420, 840, 340, 75, themeColors.yellow);
        drawText(ctx, api, 'padding gradient: 0', 1400, 890, 32, themeColors.muted);
      }
      drawNote(ctx, api, 'Actual CPU derivative through supplied states,pooling and normalization');
    }
  });
}
export default {
  id: 'pooling-tensor',
  draw: drawPoolingTensor,
  cues: [
    'cl-pooling-tensor-mask',
    'cl-pooling-tensor-sum',
    'cl-pooling-tensor-mean',
    'cl-pooling-tensor-norm',
    'cl-pooling-tensor-matrix',
    'cl-pooling-tensor-loss',
    'cl-pooling-tensor-gradient',
  ],
};
