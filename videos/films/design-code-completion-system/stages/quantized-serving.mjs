import { completionCue } from '../construction.mjs';
import { completionFooter, completionHeading, completionText } from '../defaults.mjs';
export function drawQuantizedServing(ctx, scene, state, api) {
  api.focus.target('cc-quantized-serving-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
      done = (id) => completionCue(state, id) >= 1;
    {
      completionHeading(ctx, api, 'Hypothetical 3 billion stored weights · raw payload only');
      const sizes = [6, 3, 1.5];
      ['16-bit', '8-bit', '4-bit'].forEach((label, i) => {
        completionText(
          ctx,
          api,
          label,
          260,
          435 + i * 160,
          34,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
        );
        api.rect(
          ctx,
          550,
          370 + i * 160,
          sizes[i] * 165,
          100,
          themeColors.panel,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
          2,
          5,
        );
        if (done('cc-weight-six-onehalf') || currentBeat > 0)
          completionText(
            ctx,
            api,
            sizes[i] + ' decimal GB',
            550 + sizes[i] * 82.5,
            435 + i * 160,
            29,
            [themeColors.blue, themeColors.cyan, themeColors.green][i],
            'center',
          );
      });
      completionFooter(
        ctx,
        api,
        currentBeat
          ? 'Profile real kernels, prefill/decode, KV capacity and useful editor quality separately'
          : 'Scales, metadata, unquantized layers, KV and workspace remain outside these bars',
      );
    }
    return true;
  });
}
export default {
  id: 'quantized-serving',
  draw: drawQuantizedServing,
  cues: ['cc-quantized-serving-0', 'cc-weight-six-onehalf', 'cc-quantized-serving-1'],
};
