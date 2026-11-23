import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, grid, header, rect } from '../defaults.mjs';
export function drawWrapperCall(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('wrapper-call', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-wrapper-call-mechanism', () => {
    header(ctx, api, 'Pinned 0.6.18 FA2 paged-prefill call · source-checked CUDA program');
    if (currentBeat === 0) {
      [
        ['qo_indptr', '[0,3,4,8] · token rows'],
        ['paged_kv_indptr', '[0,2,3,6] · page IDs'],
        ['paged_kv_indices', '[7,2,11,3,14,6]'],
        ['head_dim_qk', '128'],
      ].forEach(([v, z], i) => {
        api.text(ctx, v, 190, 415 + i * 125, 30, themeColors.blue, 'left', 'mono');
        if (progress > (i + 0.2) / 4)
          extensionCard(ctx, api, z, 940, 365 + i * 125, 800, themeColors.cyan, 90, 31);
      });
    } else if (currentBeat === 1) {
      grid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 8,
            },
            (_, i) => 'KV head' + i,
          ),
        ],
        180,
        380,
        1540,
        90,
        themeColors.blue,
        27,
      );
      for (let h = 0; h < 8; h++)
        for (let q = 0; q < 4; q++)
          rect(
            ctx,
            api,
            190 + h * 192 + q * 40,
            580,
            30,
            90,
            progress > (h + 0.2) / 8 ? themeColors.cyan : themeColors.panel,
          );
      extensionText(
        ctx,
        api,
        '32 query heads share 8 stored KV heads in groups of 4',
        960,
        835,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      extensionCard(ctx, api, 'Q shape   8 × 32 × 128', 170, 390, 700, themeColors.blue);
      extensionCard(ctx, api, 'O shape   8 × 32 × 128', 1050, 390, 700, themeColors.cyan);
      extensionCard(
        ctx,
        api,
        'int32 pointers / indices / tails',
        170,
        630,
        700,
        themeColors.yellow,
      );
      extensionCard(
        ctx,
        api,
        'Scratch: 128 MiB recommendation',
        1050,
        630,
        700,
        themeColors.yellow,
      );
    }
    footer(ctx, api, 'Dense comparison on CUDA: check finite values and output error');
  });
}
export default {
  id: 'wrapper-call',
  draw: drawWrapperCall,
  cues: [
    'fi-wrapper-call-0',
    'fi-wrapper-call-0-result',
    'fi-wrapper-call-1',
    'fi-wrapper-call-1-result',
    'fi-wrapper-call-2',
    'fi-wrapper-call-2-result',
  ],
};
