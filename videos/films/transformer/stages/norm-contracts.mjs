import { normStats, sum } from '../arithmetic.mjs';
import {
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintNormContracts(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  if (b < 2) {
    const input = [2, 2, 2, 2];
    const stats = normStats(input);
    const meanSquare = sum(input.map((x) => x * x)) / input.length;
    const rmsDivisor = Math.sqrt(meanSquare + 1e-5);
    const centered = known('centered', 0);
    const rmsKnown = known('constant', 1);
    const rmsStarted = b === 1 && known('voice-1', 1);
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Four features of one token',
      'Scale = 1     ·     LayerNorm shift = 0     ·     ε = 0.00001',
    );
    const paintRow = (label, values, y, color) => {
      api.text(ctx, label, 370, y + 52, 36, color, 'right');
      drawExtendedRow(ctx, api, C, (n) => f(n, 0), values, 430, y, 820, color, 82);
    };
    paintRow('Input', input, 365, C.blue);
    paintRow('LayerNorm', stats.normalized.map((v) => (centered ? v : '?')), 545, C.cyan);
    if (b === 1) {
      const values = input.map((x) => (rmsKnown ? '≈ ' + f(x / rmsDivisor, 2) : '?'));
      paintRow('RMSNorm', values, 725, C.green);
    }
    api.text(ctx, 'mean = ' + f(stats.mean, 0), 1310, 417, 36, C.blue);
    if (known('voice-0', 0)) api.text(ctx, input[0] + ' − ' + stats.mean, 1310, 597, 39, C.cyan);
    if (rmsStarted)
      api.text(ctx, input[0] + ' / √(' + meanSquare + ' + ε)', 1310, 777, 39, C.green);
    if (b === 0 && known('variance', 0)) {
      drawExtendedText(
        ctx,
        api,
        C,
        'Variance before scale and shift  =  v / (v + ε)',
        960,
        828,
        39,
        C.yellow,
        'center',
      );
    }
    if (b === 1 && rmsKnown)
      drawExtendedNote(ctx, api, C, 'Same four inputs, different outputs from the centering step');
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Follow the direct residual derivative',
      'Pre-LN places normalization inside the update branch',
    );
    const x = 370,
      y = 560,
      xx = mix(x, 1540, p);
    api.line(ctx, x, y, 1540, y, C.blue, 7);
    api.circle(ctx, xx, y, 13, C.yellow);
    drawExtendedText(ctx, api, C, 'x', x, 490, 34, C.blue, 'center');
    drawExtendedText(ctx, api, C, 'x + branch(x)', 1540, 490, 33, C.green, 'center');
    drawExtendedText(ctx, api, C, 'direct route', 960, 520, 29, C.blue, 'center');
    api.path(
      ctx,
      [
        {
          x: 370,
          y: 580,
        },
        {
          x: 370,
          y: 760,
        },
        {
          x: 1540,
          y: 760,
        },
        {
          x: 1540,
          y: 580,
        },
      ],
      {
        color: C.cyan,
        width: 4,
      },
    );
    drawExtendedText(ctx, api, C, 'LayerNorm → learned update', 960, 820, 30, C.cyan, 'center');
    if (known('residual', 2))
      drawExtendedText(
        ctx,
        api,
        C,
        'direct derivative I + branch derivative',
        960,
        390,
        32,
        C.yellow,
        'center',
      );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Post-LN applies LayerNorm after the addition:  LayerNorm(x + update)',
    );
  }
}
export function drawNormContractsStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintNormContracts);
}
export default {
  id: 'norm-contracts',
  draw: drawNormContractsStage,
  cues: [
    'tr-norm-contracts-voice-0',
    'tr-norm-contracts-variance',
    'tr-norm-contracts-voice-1',
    'tr-norm-contracts-constant',
    'tr-norm-contracts-centered',
    'tr-norm-contracts-voice-2',
    'tr-norm-contracts-residual',
  ],
};
