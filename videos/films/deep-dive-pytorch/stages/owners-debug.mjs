import { sampleModel } from '../construction.mjs';
import { drawArrow, drawCard, drawFooter, drawText } from '../defaults.mjs';
export function drawOwnersDebug(ctx, scene, state, api) {
  return api.focus.target('pt-owners-debug-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('owners-debug', state),
      { b: currentBeat, p: progress } = modelState;
    {
      const flow =
        currentBeat === 0
          ? ['IDs', 'Embedding', 'Attention', 'MLP / norm', 'Backward', 'Optimizer']
          : currentBeat === 1
            ? ['HTTP / queue', 'Sampling', 'KV blocks', 'Tensor operators', 'Output', 'Client']
            : [
                'Storage copy',
                'Guard log',
                'Gather peak',
                'Saved cursor',
                'Next batch',
                'Next update',
              ];
      drawText(
        ctx,
        api,
        currentBeat === 0
          ? 'Training step: wait for the owned dependency'
          : currentBeat === 1
            ? 'Serving runtime owns different surrounding work'
            : 'Locate the first changed receipt',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      flow.forEach((v, i) => {
        const col = i % 3,
          row = Math.floor(i / 3);
        drawCard(
          ctx,
          api,
          v,
          180 + col * 560,
          410 + row * 300,
          480,
          i <= Math.floor(progress * 6) ? themeColors.cyan : themeColors.muted,
          110,
        );
        if (col < 2)
          drawArrow(
            ctx,
            api,
            685 + col * 560,
            465 + row * 300,
            715 + col * 560,
            465 + row * 300,
            themeColors.blue,
          );
      });
      drawFooter(
        ctx,
        api,
        'Inspect the responsible owner while preserving the earlier matching inputs',
      );
    }
  });
}
export default {
  id: 'owners-debug',
  draw: drawOwnersDebug,
  cues: ['pt-owners-debug-0', 'pt-owners-debug-1', 'pt-owners-debug-2'],
};
