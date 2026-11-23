import { sampleDeepGemmChapter } from '../construction.mjs';
import {
  drawBox,
  drawEquation,
  drawGrid,
  drawSubtitle,
  drawText,
} from '../defaults.mjs';
export function drawSparsePositionMap(ctx, scene, state, api) {
  return api.focus.target('sparse-position-map-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('sparse-position-map', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(ctx, api, 'A sparse column passes through the block table');
      if (currentBeat === 0) {
        const valid = done(0, 2),
          row = valid ? [3, 7] : [3, 3];
        drawGrid(
          ctx,
          api,
          [row],
          180,
          400,
          540,
          130,
          valid ? themeColors.blue : themeColors.pink,
          45,
        );
        drawText(ctx, api, 'Example block-index prefix', 450, 345, 31, themeColors.blue, 'center');
        drawBox(
          ctx,
          api,
          valid ? 'Unique · increasing · inside range' : 'Repeated block identity',
          900,
          405,
          850,
          110,
          valid ? themeColors.green : themeColors.pink,
          35,
        );
        if (teaching2(0, 1) > 0) {
          drawGrid(
            ctx,
            api,
            [['block 0', 'block 1', 'block 2', 'block 3']],
            170,
            690,
            1520,
            110,
            themeColors.muted,
            32,
          );
          drawText(
            ctx,
            api,
            'Score width = maximum sparse blocks × block width',
            960,
            890,
            35,
            themeColors.cyan,
            'center',
          );
        }
        if (done(0, 4))
          drawText(
            ctx,
            api,
            'Retain block identity before mapping a selected column',
            960,
            965,
            31,
            themeColors.yellow,
            'center',
          );
      } else {
        drawGrid(ctx, api, [[3, 7]], 180, 390, 540, 120, themeColors.blue, 45);
        drawText(ctx, api, 'Absolute block IDs', 450, 340, 32, themeColors.blue, 'center');
        const tokens = [12, 13, 14, 15, 28, 29, 30, 31],
          mapped = currentBeat > 1 || teaching2(1, 1) > 0;
        drawGrid(
          ctx,
          api,
          [tokens],
          170,
          680,
          1520,
          110,
          themeColors.muted,
          33,
          mapped
            ? [
                {
                  row: 0,
                  column: 5,
                  fill: themeColors.panel,
                  stroke: themeColors.yellow,
                },
              ]
            : [],
        );
        drawText(
          ctx,
          api,
          'Four tokens per block · range starts at zero',
          960,
          885,
          31,
          themeColors.muted,
          'center',
        );
        if (currentBeat === 1) {
          if (teaching2(1, 1) > 0) drawEquation(ctx, api, '5=1\\cdot4+1', 1280, 430, 52);
          if (teaching2(1, 2) > 0) drawEquation(ctx, api, '\\mathrm{block}[1]=7', 1280, 535, 45);
          if (done(1, 3))
            drawText(ctx, api, '7 × 4 + 1 = token 29', 960, 970, 43, themeColors.green, 'center');
        } else {
          drawText(
            ctx,
            api,
            'October CUDA path · block width 8 or 16',
            1240,
            390,
            29,
            themeColors.cyan,
            'center',
          );
          if (teaching2(2, 2) > 0) {
            drawBox(
              ctx,
              api,
              'Unaligned origin needs its specified offset',
              790,
              480,
              1000,
              105,
              themeColors.yellow,
              32,
            );
            api.arrow(ctx, 450, 535, 450, 625, themeColors.yellow, 4);
          }
        }
      }
    }
  });
}
export default {
  id: 'sparse-position-map',
  draw: drawSparsePositionMap,
  cues: [
    'sparse-position-map-b0',
    'dg-sparse-position-map-0-0',
    'dg-sparse-position-map-0-1',
    'dg-sparse-position-map-0-2',
    'dg-sparse-position-map-0-3',
    'dg-sparse-position-map-0-4',
    'sparse-position-map-b1',
    'dg-sparse-position-map-1-0',
    'dg-sparse-position-map-1-1',
    'dg-sparse-position-map-1-2',
    'dg-sparse-position-map-1-3',
    'dg-sparse-position-map-1-4',
    'sparse-position-map-b2',
    'dg-sparse-position-map-2-0',
    'dg-sparse-position-map-2-1',
    'dg-sparse-position-map-2-2',
    'dg-sparse-position-map-2-3',
  ],
};
