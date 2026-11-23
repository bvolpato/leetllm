import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, footer, header } from '../defaults.mjs';
export function drawBackendSupport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('backend-support', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-backend-support-mechanism', () => {
    header(ctx, api, 'Operation eligibility precedes binary availability');
    const fields = [
      'GPU architecture',
      'dtype / packing',
      'Q/KV heads',
      'head dimensions',
      'layout / mask',
      'split policy',
    ];
    fields.forEach((v, i) =>
      extensionCard(
        ctx,
        api,
        v,
        180 + (i % 3) * 560,
        370 + Math.floor(i / 3) * 145,
        470,
        progress > (i + 0.2) / 6 ? themeColors.cyan : themeColors.muted,
        95,
        29,
      ),
    );
    const current =
      currentBeat === 1 && progress > 0.5
        ? 'Unsupported operation: compiler cannot admit it'
        : currentBeat === 1
          ? 'Supported, missing binary: matching JIT path'
          : currentBeat === 2
            ? 'Released fleet support needs matching architecture cache'
            : 'Record the selected backend with the operation';
    extensionCard(
      ctx,
      api,
      current,
      230,
      770,
      1460,
      currentBeat === 1 && progress > 0.5 ? themeColors.pink : themeColors.yellow,
      110,
      31,
    );
    footer(ctx, api, 'Match the architecture cache to the GPUs that will serve the model');
  });
}
export default {
  id: 'backend-support',
  draw: drawBackendSupport,
  cues: [
    'fi-backend-support-0',
    'fi-backend-support-0-result',
    'fi-backend-support-1',
    'fi-backend-support-1-result',
    'fi-backend-support-2',
    'fi-backend-support-2-result',
  ],
};
