import { sampleModel } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalMark,
  drawOriginalText,
  drawOriginalTransfer,
} from '../defaults.mjs';
export function drawBanks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('banks', state);
  {
    const bank = true,
      routeId = 'bank-routes',
      receiptId = 'bank-receipt';
    drawOriginalText(
      ctx,
      api,
      currentBeat === 0
        ? 'Distinct words · stride 32'
        : currentBeat === 1
          ? 'Padding transition · stride 32 → 33'
          : modelState.completed === 8
            ? 'All eight lanes read word zero'
            : 'Switch to a same-word broadcast',
      160,
      285,
      32,
      themeColors.cyan,
    );
    drawOriginalMark(ctx, api, 'bank-routes', () => {
      const count = modelState.waiting
        ? 8
        : modelState.completed + Number(Boolean(modelState.moving));
      const sources = Array.from(
        {
          length: 8,
        },
        (_, i) =>
          drawOriginalCard(
            ctx,
            api,
            'L' + i + ' · ' + (i < count ? modelState.words[i] : '?'),
            145 + i * 205,
            370,
            170,
            95,
            themeColors.blue,
            29,
          ),
      );
      const requested = modelState.words.slice(0, count),
        destinationIds = [...new Set(requested.map((word) => word % 32))];
      const shapes = new Map(
        destinationIds.map((id, i) => [
          id,
          drawOriginalCard(
            ctx,
            api,
            'bank ' + id,
            destinationIds.length === 1 ? 790 : 145 + i * 205,
            700,
            destinationIds.length === 1 ? 300 : 170,
            95,
            themeColors.yellow,
            29,
          ),
        ]),
      );
      requested.forEach((word, i) => {
        const id = word % 32;
        drawOriginalTransfer(
          ctx,
          api,
          sources[i],
          shapes.get(id),
          modelState.waiting || i < modelState.completed ? 1 : modelState.moving.p,
          themeColors.yellow,
        );
      });
    });
    drawOriginalMark(ctx, api, 'bank-receipt', () => {
      const prefix = modelState.waiting
        ? 'Current layout · next request set: ?'
        : modelState.completed + '/8 requests collected';
      drawOriginalText(
        ctx,
        api,
        prefix + ' · max distinct words per bank: ' + modelState.maxDistinctWords,
        960,
        900,
        32,
        modelState.maxDistinctWords > 1 ? themeColors.pink : themeColors.green,
        'center',
      );
    });
    drawOriginalEquation(
      ctx,
      api,
      '\\text{bank}=\\text{word index}\\bmod32',
      960,
      1010,
      34,
      themeColors.muted,
    );
  }
}
export default {
  id: 'banks',
  draw: drawBanks,
  cues: ['bank-conflict', 'pad-banks', 'broadcast-word'],
};
