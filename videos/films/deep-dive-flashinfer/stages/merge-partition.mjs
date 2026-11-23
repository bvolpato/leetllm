import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, header } from '../defaults.mjs';
export function drawMergePartition(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('merge-partition', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-merge-partition-mechanism', () => {
    header(ctx, api, 'Logical key membership defines the attention problem');
    const keys = modelState.keys;
    keys.forEach((v, i) =>
      extensionCard(
        ctx,
        api,
        v + (v === 'k0' ? ' · value [1,0]' : ' · value [0,1]'),
        200 + i * 530,
        405,
        450,
        i === 2 ? themeColors.pink : v === 'k0' ? themeColors.blue : themeColors.cyan,
      ),
    );
    extensionText(
      ctx,
      api,
      'Equal logits: one mass unit per key occurrence',
      960,
      600,
      32,
      themeColors.yellow,
      'center',
    );
    extensionText(
      ctx,
      api,
      `Numerator [${modelState.numerator}] / mass ${modelState.mass}`,
      960,
      720,
      38,
      themeColors.cyan,
      'center',
    );
    extensionText(
      ctx,
      api,
      'Output [' + modelState.output.map((v) => v.toFixed(4)).join(', ') + ']',
      960,
      850,
      38,
      modelState.duplicate ? themeColors.pink : themeColors.green,
      'center',
    );
    if (currentBeat === 2)
      extensionText(
        ctx,
        api,
        'CPU reference: 168 split results agree with direct softmax',
        960,
        925,
        29,
        themeColors.yellow,
        'center',
      );
    footer(ctx, api, 'Count each logical key once for this query and head');
  });
}
export default {
  id: 'merge-partition',
  draw: drawMergePartition,
  cues: [
    'fi-merge-partition-0',
    'fi-merge-partition-0-result',
    'fi-merge-partition-duplicate',
    'fi-merge-partition-1',
    'fi-merge-partition-1-result',
    'fi-merge-partition-2',
    'fi-merge-partition-2-result',
  ],
};
