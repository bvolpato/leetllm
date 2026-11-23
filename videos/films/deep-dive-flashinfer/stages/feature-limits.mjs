import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, footer, header } from '../defaults.mjs';
export function drawFeatureLimits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('feature-limits', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-feature-limits-mechanism', () => {
    header(ctx, api, 'What does each side supply?');
    const rows =
      currentBeat === 0
        ? [
            ['ragged rows', 'query offsets'],
            ['paged history', 'listed IDs + tails'],
            ['split states', 'output + statistic'],
          ]
        : currentBeat === 1
          ? [
              ['metadata', 'pointer/tail ownership'],
              ['replay', 'workspace/graph compatibility'],
              ['coverage', 'backend × dtype × mask × architecture'],
            ]
          : [
              ['CPU reference', 'check the arithmetic'],
              ['CUDA operator', 'run inference on NVIDIA GPUs'],
              ['training stack', 'weights / optimizer / checkpoint owner'],
            ];
    rows.forEach(([a, z], i) => {
      extensionCard(ctx, api, a, 170, 390 + i * 170, 640, themeColors.blue);
      if (progress > (i + 0.2) / 3)
        extensionCard(ctx, api, z, 1000, 390 + i * 170, 750, themeColors.cyan);
    });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'AMD and Apple GPUs need a separate implementation'
        : 'The engine owns allocation, admission and test coverage around the chosen compatible operator',
    );
  });
}
export default {
  id: 'feature-limits',
  draw: drawFeatureLimits,
  cues: [
    'fi-feature-limits-0',
    'fi-feature-limits-0-result',
    'fi-feature-limits-1',
    'fi-feature-limits-1-result',
    'fi-feature-limits-2',
    'fi-feature-limits-2-result',
  ],
};
