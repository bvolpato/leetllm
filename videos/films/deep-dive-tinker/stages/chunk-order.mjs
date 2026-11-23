import { sentence, tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawChunkOrder(ctx, scene, state, api) {
  return paintChunkOrder(ctx, scene, state, api);
}
function paintChunkOrder(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('chunk-order', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'chunk-order', beat, index);
  return focus.target('tk-chunk-order-trace', () => {
    drawExtendedText(
      ctx,
      api,
      modelState.empty
        ? 'Separate empty-input probe'
        : modelState.oversized
          ? 'Separate one-byte chunk-target probe'
          : 'Five intact datums · supplied count limit 2',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    const q = currentBeat === 0 ? 0 : cueProgress(1, 1);
    [0, 1, 2, 3, 4].forEach((i) => {
      const group = Math.floor(i / 2),
        sourceX = 230 + i * 300,
        targetX = 235 + group * 550 + (i % 2) * 210,
        x = sourceX + (targetX - sourceX) * q,
        y = 350 + 260 * q;
      drawExtendedCard(ctx, api, 'D' + i, x, y, 180, 105, themeColors.blue, 33);
    });
    if (currentBeat > 0) {
      [0, 1, 2].forEach((n, i) => {
        const x = 200 + i * 550;
        api.line(ctx, x, 575, x, 740, themeColors.cyan, 3);
        api.line(ctx, x, 740, x + 470, 740, themeColors.cyan, 3);
        api.line(ctx, x + 470, 740, x + 470, 575, themeColors.cyan, 3);
        drawExtendedText(
          ctx,
          api,
          'request ID ' + n,
          435 + i * 550,
          790,
          30,
          themeColors.cyan,
          'center',
        );
      });
      if (modelState.showChunks)
        drawExtendedText(
          ctx,
          api,
          'Counts 2 / 2 / 1 · next request ID 3',
          960,
          860,
          32,
          themeColors.green,
          'center',
        );
    }
    if (modelState.empty) {
      drawExtendedCard(ctx, api, 'Input: []', 230, 355, 500, 105, themeColors.blue, 31);
      drawExtendedCard(
        ctx,
        api,
        modelState.emptyComplete ? 'Emitted chunks: []' : 'Emission pending',
        1120,
        355,
        600,
        105,
        modelState.emptyComplete ? themeColors.green : themeColors.muted,
        31,
      );
      if (modelState.emptyComplete)
        drawExtendedText(
          ctx,
          api,
          '0 datums → 0 chunks',
          960,
          505,
          29,
          themeColors.green,
          'center',
        );
    } else if (modelState.oversized) {
      const travel = cueProgress(1, 3),
        packet = drawExtendedCard(
          ctx,
          api,
          'D0 · intact',
          230 + 1070 * travel,
          355,
          300,
          105,
          themeColors.yellow,
          31,
        );
      drawExtendedText(
        ctx,
        api,
        'Estimated datum bytes exceed the 1-byte target',
        960,
        505,
        28,
        themeColors.pink,
        'center',
      );
    }
    if (modelState.oversized || modelState.empty)
      drawExtendedText(
        ctx,
        api,
        'Count-limit-2 result retained below',
        960,
        550,
        26,
        themeColors.muted,
        'center',
      );
    drawExtendedNote(
      ctx,
      api,
      modelState.empty
        ? 'An empty request emits no new sequence chunk; the earlier count probe is retained separately.'
        : 'A byte target guides chunking; an indivisible datum remains whole when it exceeds that target.',
    );
  });
}
export default {
  id: 'chunk-order',
  draw: drawChunkOrder,
  cues: [
    'tk-chunk-order-0-0',
    'tk-chunk-order-0-1',
    'tk-chunk-order-0-2',
    'tk-chunk-order-1-0',
    'tk-chunk-order-1-1',
    'tk-chunk-order-1-2',
    'tk-chunk-order-1-3',
    'tk-chunk-order-1-4',
    'tk-chunk-order-2-0',
    'tk-chunk-order-2-1',
    'tk-chunk-order-2-2',
  ],
};
