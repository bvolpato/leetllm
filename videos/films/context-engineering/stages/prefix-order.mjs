import { boundedContext, contextDone, contextProgress } from '../arithmetic.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteRectangle,
  drawCompleteText,
} from '../defaults.mjs';
export function drawPrefixOrder(ctx, scene, state, api) {
  if (paintPrefixOrder(ctx, scene, state, api)) return;
}
function paintPrefixOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat, start = 0.08, end = 0.88) =>
      contextProgress(state, id, beat, start, end),
    resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-prefix-order-mechanism', () => {
    const move = currentBeat > 1 ? 1 : currentBeat === 1 ? cueProgress('ce-prefix-move', 1) : 0;
    drawCompleteHeading(ctx, api, 'Same input tokens · changed first header token A0 → B0');
    const span = 1500 / 364,
      x0 = 180,
      root = 96 * span,
      header = 12 * span,
      doc = 256 * span;
    [0, 1].forEach((j) => {
      const y = 430 + j * 210;
      drawCompleteText(ctx, api, j ? 'Request 2' : 'Request 1', x0, y - 35, 27, themeColors.muted);
      drawCompleteRectangle(ctx, api, x0, y, root, 85, themeColors.panel, themeColors.blue, 2);
      drawCompleteText(
        ctx,
        api,
        'Root · 96',
        x0 + root / 2,
        y + 53,
        29,
        themeColors.blue,
        'center',
      );
      const slide = boundedContext((move - 0.2) / 0.6),
        smooth = slide * slide * (3 - 2 * slide),
        lift =
          move < 0.2
            ? boundedContext(move / 0.2)
            : move > 0.8
              ? boundedContext((1 - move) / 0.2)
              : 1,
        dhx = x0 + root + header * (1 - smooth),
        hhx = x0 + root + doc * smooth,
        hy = y + 112 * lift;
      drawCompleteRectangle(ctx, api, dhx, y, doc, 85, themeColors.panel, themeColors.cyan, 2);
      drawCompleteText(
        ctx,
        api,
        'Fixed document · 256',
        dhx + doc / 2,
        y + 53,
        29,
        themeColors.cyan,
        'center',
      );
      drawCompleteRectangle(
        ctx,
        api,
        hhx,
        hy,
        header,
        85,
        themeColors.panel,
        themeColors.yellow,
        2,
      );
      drawCompleteText(ctx, api, '12', hhx + header / 2, hy + 53, 24, themeColors.yellow, 'center');
    });
    const common =
      currentBeat > 1
        ? 352
        : move === 1 && resultComplete('ce-prefix-352', 1)
          ? 352
          : resultComplete('ce-prefix-96', 1)
            ? 96
            : null;
    drawCompleteText(
      ctx,
      api,
      common === null ? 'eligible common prefix: ?' : `eligible common prefix: ${common}`,
      180,
      910,
      35,
      themeColors.green,
    );
    drawCompleteText(
      ctx,
      api,
      currentBeat > 1 || resultComplete('ce-prefix-364', 1)
        ? 'Input length · 364 tokens in both orders'
        : 'Input length · unchanged',
      180,
      975,
      30,
      themeColors.yellow,
    );
    drawCompleteFooter(
      ctx,
      api,
      currentBeat < 2
        ? 'In this example, any token can end the cached prefix.'
        : 'Read the cached input count in the provider response.',
    );
  });
  return true;
}
export default {
  id: 'prefix-order',
  draw: drawPrefixOrder,
  cues: [
    'ce-prefix-order-1',
    'ce-prefix-order-2',
    'ce-prefix-96',
    'ce-prefix-move',
    'ce-prefix-352',
    'ce-prefix-364',
    'ce-prefix-order-3',
  ],
};
