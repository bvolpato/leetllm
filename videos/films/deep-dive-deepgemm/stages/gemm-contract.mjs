import { gemmTile } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import {
  drawBox,
  drawEquation,
  drawGrid,
  drawLink,
  drawSubtitle,
  drawText,
} from '../defaults.mjs';
export function drawGemmContract(ctx, scene, state, api) {
  return api.focus.target('gemm-contract-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('gemm-contract', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      if (currentBeat === 0) {
        drawSubtitle(ctx, api, 'Stored weight rows meet activation rows through K');
        drawGrid(
          ctx,
          api,
          [
            [1, 2],
            [0, -1],
          ],
          150,
          395,
          420,
          230,
          themeColors.blue,
          42,
        );
        drawGrid(
          ctx,
          api,
          [
            [3, 4],
            [1, -1],
          ],
          745,
          395,
          420,
          230,
          themeColors.pink,
          42,
        );
        drawText(ctx, api, 'A · M × K', 360, 350, 32, themeColors.blue, 'center');
        drawText(ctx, api, 'B · N × K', 955, 350, 32, themeColors.pink, 'center');
        const work = gemmTile(teaching2(0, 3)),
          labels = work.result.map((row, r) =>
            row.map((v, col) => (r * 2 + col < work.completed ? v : '·')),
          );
        drawGrid(ctx, api, labels, 1340, 395, 420, 230, themeColors.green, 42);
        drawText(ctx, api, 'D · M × N', 1550, 350, 32, themeColors.green, 'center');
        if (teaching2(0, 2) > 0) {
          drawEquation(ctx, api, 'D_{ij}=\\sum_k A_{ik}B_{jk}', 960, 785, 57);
          drawText(
            ctx,
            api,
            'K matches K · each pair owns one output',
            960,
            885,
            31,
            themeColors.muted,
            'center',
          );
        }
        if (done(0, 4))
          drawText(
            ctx,
            api,
            'First stored row: 11 and −4',
            960,
            950,
            37,
            themeColors.green,
            'center',
          );
      } else if (currentBeat === 1) {
        drawSubtitle(ctx, api, 'Whole work is the sum of every output’s K products');
        const p = teaching2(1, 0);
        drawGrid(
          ctx,
          api,
          Array.from(
            {
              length: 4,
            },
            (_, r) =>
              Array.from(
                {
                  length: 8,
                },
                (_, col) => (r * 8 + col < Math.floor(p * 32) ? 'K' : '·'),
              ),
          ),
          200,
          390,
          1000,
          300,
          themeColors.blue,
          32,
        );
        drawText(
          ctx,
          api,
          'Schematic output tile · every entry reduces K',
          700,
          745,
          29,
          themeColors.muted,
          'center',
        );
        drawText(ctx, api, 'M = 512', 1390, 430, 39, themeColors.blue);
        drawText(ctx, api, 'N = 4,096', 1390, 520, 39, themeColors.pink);
        drawText(ctx, api, 'K = 4,096', 1390, 610, 39, themeColors.cyan);
        if (done(1, 0)) drawEquation(ctx, api, '2MNK', 960, 850, 65);
        if (done(1, 1))
          drawText(
            ctx,
            api,
            '17,179,869,184 operations',
            960,
            945,
            42,
            themeColors.green,
            'center',
          );
        if (done(1, 2))
          drawBox(ctx, api, 'Example time · 10 µs', 1350, 750, 430, 90, themeColors.yellow);
        if (done(1, 3))
          drawText(ctx, api, '≈ 1,718 TFLOP/s', 1565, 915, 36, themeColors.yellow, 'center');
      } else {
        drawSubtitle(ctx, api, 'A physical tile is part of the product');
        const a = drawBox(ctx, api, 'A / scales / strides', 140, 440, 450, 110, themeColors.blue),
          tile = drawBox(
            ctx,
            api,
            'One tile\npartial accumulators',
            750,
            410,
            440,
            170,
            themeColors.cyan,
          ),
          out = drawBox(ctx, api, 'C + conversion + store', 1360, 440, 430, 110, themeColors.green);
        drawLink(ctx, api, a, tile, teaching2(2, 1), themeColors.blue);
        drawLink(ctx, api, tile, out, teaching2(2, 3), themeColors.green);
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 8; j++)
            api.rect(
              ctx,
              780 + j * 45,
              675 + i * 45,
              36,
              36,
              i === 1 && j < 3 ? themeColors.cyan : themeColors.panel,
              themeColors.muted,
              2,
            );
        drawText(
          ctx,
          api,
          'Tile work and full-matrix work have different scopes',
          960,
          925,
          35,
          themeColors.cyan,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'gemm-contract',
  draw: drawGemmContract,
  cues: [
    'gemm-contract-b0',
    'dg-gemm-contract-0-0',
    'dg-gemm-contract-0-1',
    'dg-gemm-contract-0-2',
    'dg-gemm-contract-0-3',
    'dg-gemm-contract-0-4',
    'gemm-contract-b1',
    'dg-gemm-contract-1-0',
    'dg-gemm-contract-1-1',
    'dg-gemm-contract-1-2',
    'dg-gemm-contract-1-3',
    'gemm-contract-b2',
    'dg-gemm-contract-2-0',
    'dg-gemm-contract-2-1',
    'dg-gemm-contract-2-2',
    'dg-gemm-contract-2-3',
  ],
};
