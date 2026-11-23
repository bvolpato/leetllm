import { tokenValues } from '../fixtures.mjs';
import { mix } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalCode,
  drawOriginalFooter,
  drawOriginalMark,
  drawOriginalText,
  drawOriginalTokenRow,
  drawOriginalTransfer,
} from '../defaults.mjs';
export function drawResidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('residence', state);
  {
    drawOriginalText(ctx, api, 'CPU host memory', 180, 260, 34, themeColors.blue);
    drawOriginalText(ctx, api, 'CUDA', 70, 790, 29, themeColors.cyan);
    const top = drawOriginalTokenRow(ctx, api, tokenValues, 340),
      bottom = drawOriginalMark(ctx, api, 'device-row', () =>
        drawOriginalTokenRow(
          ctx,
          api,
          tokenValues.map((v) => (modelState.landed ? v : null)),
          730,
          {
            owner: 'below',
          },
        ),
      );
    drawOriginalMark(ctx, api, 'copy-payloads', () => {
      top.forEach((source, i) => {
        if (currentBeat === 0 && modelState.copy > 0 && modelState.copy < 1) {
          const payload = drawOriginalCard(
            ctx,
            api,
            String(tokenValues[i]),
            210 + i * 195,
            mix(485, 595, modelState.copy),
            130,
            65,
            themeColors.cyan,
            33,
          );
          drawOriginalTransfer(ctx, api, source, payload, undefined, themeColors.muted);
          drawOriginalTransfer(ctx, api, payload, bottom[i], undefined, themeColors.muted);
        } else if (currentBeat === 0)
          drawOriginalTransfer(ctx, api, source, bottom[i], undefined, themeColors.muted);
      });
      drawOriginalText(
        ctx,
        api,
        modelState.landed + ' / 8 device values ready',
        1740,
        285,
        29,
        modelState.landed ? themeColors.green : themeColors.muted,
        'right',
      );
    });
    if (currentBeat === 1) {
      drawOriginalMark(ctx, api, 'placement-code', () =>
        drawOriginalCode(
          ctx,
          api,
          [
            'cpu_row = torch.tensor(values, dtype=torch.float32)',
            'x = cpu_row.to("cuda")',
            'pooled = x.mean()',
          ],
          230,
          510,
          30,
          modelState.queueActive ? 2 : 1,
          65,
        ),
      );
      drawOriginalMark(ctx, api, 'process-checks', () => {
        if (modelState.checks)
          drawOriginalText(
            ctx,
            api,
            'Check in this process: torch.version.cuda · torch.cuda.is_available()',
            960,
            920,
            29,
            themeColors.blue,
            'center',
            true,
          );
        else
          drawOriginalText(
            ctx,
            api,
            'A CUDA tensor names device work.',
            960,
            920,
            31,
            themeColors.muted,
            'center',
          );
      });
    }
    drawOriginalFooter(ctx, api, 'Same eight values · same shape · a separate device allocation');
  }
}
export default {
  id: 'residence',
  draw: drawResidence,
  cues: ['copy-row', 'device-residence', 'queue-mean', 'process-check'],
};
