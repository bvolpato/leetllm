import { sampleModel } from '../model.mjs';
import { tokenValues } from '../fixtures.mjs';
import {
  drawOriginalCard,
  drawOriginalFooter,
  drawOriginalMark,
  drawOriginalText,
  drawOriginalTransfer,
} from '../defaults.mjs';
export function drawCoalescing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('coalescing', state);
  {
    drawOriginalText(
      ctx,
      api,
      currentBeat === 0
        ? 'One warp load   /   eight consecutive words'
        : currentBeat === 1
          ? 'Same values   /   one word every 32 positions'
          : 'Same values   /   consecutive words again',
      160,
      285,
      32,
      themeColors.cyan,
    );
    drawOriginalMark(ctx, api, 'memory-routes', () => {
      const count = modelState.waiting
        ? 8
        : modelState.completed + Number(Boolean(modelState.moving));
      const sources = Array.from(
        {
          length: 8,
        },
        (_, i) => {
          const left = 145 + i * 205;
          drawOriginalText(ctx, api, 'L' + i + '  ·  ' + tokenValues[i], left + 85, 346, 27, themeColors.blue, 'center');
          return drawOriginalCard(
            ctx,
            api,
            i < count ? 'byte ' + modelState.words[i] * 4 : '·',
            left,
            370,
            170,
            95,
            themeColors.blue,
            29,
          );
        },
      );
      const requested = modelState.words.slice(0, count),
        destinationIds = [...new Set(requested.map((word) => Math.floor((word * 4) / 32)))];
      const shapes = new Map(
        destinationIds.map((id, i) => [
          id,
          drawOriginalCard(
            ctx,
            api,
            'seg ' + id,
            destinationIds.length === 1 ? 790 : 145 + i * 205,
            700,
            destinationIds.length === 1 ? 300 : 170,
            95,
            themeColors.cyan,
            29,
          ),
        ]),
      );
      requested.forEach((word, i) => {
        const id = Math.floor((word * 4) / 32);
        drawOriginalTransfer(
          ctx,
          api,
          sources[i],
          shapes.get(id),
          modelState.waiting || i < modelState.completed ? 1 : modelState.moving.p,
          themeColors.cyan,
        );
      });
    });
    drawOriginalMark(ctx, api, 'segment-receipt', () => {
      const prefix = modelState.waiting
        ? 'Previous layout'
        : modelState.completed + '/8 lanes traced';
      drawOriginalText(
        ctx,
        api,
        prefix + '     ' + modelState.segments.length + ' segments × 32 B = ' + modelState.footprint + ' B',
        960,
        900,
        32,
        themeColors.green,
        'center',
      );
    });
    drawOriginalFooter(
      ctx,
      api,
      'Compute capability 6.0+   ·   4-byte words   ·   base aligned to 32 bytes',
    );
  }
}
export default {
  id: 'coalescing',
  draw: drawCoalescing,
  cues: ['collect-adjacent', 'predict-segments', 'fan-segments', 'restore-segments'],
};
