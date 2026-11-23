import { systemExtensionFrame } from '../construction.mjs';
import { bar, chapterCard, chapterText, header } from '../defaults.mjs';
export function drawMemoryRealization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('memory-realization', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-memory-realization-mechanism', () => {
    header(ctx, api, 'One replica · one loaded weight set');
    bar(
      ctx,
      api,
      16,
      32,
      240,
      400,
      1420,
      themeColors.blue,
      '8 billion × 2 bytes = 16 GB of weights',
    );
    if (currentBeat === 0) {
      const n = Math.min(4, Math.floor(progress * 5));
      for (let i = 0; i < 4; i++)
        chapterCard(
          ctx,
          api,
          i < n ? 'History ' + (i + 1) : 'Unused request slot',
          220 + i * 390,
          575,
          340,
          i < n ? themeColors.cyan : themeColors.muted,
        );
      chapterCard(
        ctx,
        api,
        'Workspace + activations + allocator reserve',
        260,
        790,
        1400,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const shared = progress > 0.4;
      for (let r = 0; r < 2; r++) {
        chapterText(ctx, api, 'Request ' + (r + 1), 200, 610 + r * 150, 30, themeColors.blue);
        for (let k = 0; k < 4; k++)
          chapterCard(
            ctx,
            api,
            (k < 2 && shared ? 'Shared P' : 'R' + r + ' P') + k,
            500 + k * 280,
            560 + r * 150,
            220,
            k < 2 && shared ? themeColors.yellow : themeColors.cyan,
            82,
            26,
          );
      }
      chapterText(
        ctx,
        api,
        shared
          ? 'Two logical references can retain one compatible physical prefix'
          : 'Separate full-history storage assumption',
        960,
        900,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      bar(
        ctx,
        api,
        16 * (1 - progress) + 8 * progress,
        32,
        240,
        620,
        1420,
        themeColors.cyan,
        'Weight payload under 2-byte → 1-byte storage',
      );
      chapterText(
        ctx,
        api,
        'Scales, metadata, unquantized tensors and kernel behavior remain',
        960,
        820,
        31,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'memory-realization',
  draw: drawMemoryRealization,
  cues: [
    'sd-memory-realization-0-operation',
    'sd-memory-realization-0-result',
    'sd-memory-realization-1-operation',
    'sd-memory-realization-1-result',
    'sd-memory-realization-2-operation',
    'sd-memory-realization-2-result',
  ],
};
