import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, grid, header } from '../defaults.mjs';
export function drawGraphContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('graph-contract', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-graph-contract-mechanism', () => {
    header(ctx, api, 'Fixed addresses can hold a changed problem');
    extensionCard(ctx, api, 'Metadata buffer address A', 180, 380, 700, themeColors.blue);
    extensionCard(ctx, api, 'Prepared plan / launch record', 1040, 380, 700, themeColors.cyan);
    if (currentBeat === 0) {
      grid(
        ctx,
        api,
        [
          [
            '3 pages',
            'tail ' + (progress > 0.45 ? '2' : '1'),
            'length ' + (progress > 0.45 ? '10' : '9'),
          ],
        ],
        180,
        560,
        700,
        100,
        themeColors.blue,
        28,
      );
      extensionCard(
        ctx,
        api,
        progress > 0.45 ? 'Old plan covers 9 keys' : 'Plan covers 9 keys',
        1040,
        560,
        700,
        progress > 0.45 ? themeColors.pink : themeColors.green,
      );
      extensionCard(
        ctx,
        api,
        'Plan: host work + device copies · outside capture',
        280,
        800,
        1360,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const blocks = progress < 0.55 ? 2 : 3;
      for (let i = 0; i < blocks; i++)
        extensionCard(ctx, api, 'CTA' + i, 180 + i * 250, 580, 200, themeColors.blue);
      extensionCard(ctx, api, 'Captured launch: 2 CTAs', 1120, 580, 620, themeColors.cyan);
      extensionText(
        ctx,
        api,
        blocks === 3
          ? 'Changed work assignment can invalidate replay'
          : 'Refresh ≠ compile ≠ capture',
        960,
        850,
        34,
        blocks === 3 ? themeColors.pink : themeColors.yellow,
        'center',
      );
    } else {
      extensionCard(
        ctx,
        api,
        'Separate 0.7.1 non-FA MLA wrapper',
        220,
        570,
        1450,
        themeColors.blue,
      );
      extensionCard(
        ctx,
        api,
        progress > 0.5
          ? 'Different prepared backend → new wrapper + capture'
          : 'One-plan graph contract protects captured metadata pointers',
        220,
        760,
        1450,
        themeColors.yellow,
      );
    }
    footer(ctx, api, 'Some monolithic CuTe plans permit bounded query redistribution');
  });
}
export default {
  id: 'graph-contract',
  draw: drawGraphContract,
  cues: [
    'fi-graph-contract-0',
    'fi-graph-contract-0-result',
    'fi-graph-contract-1',
    'fi-graph-contract-1-result',
    'fi-graph-contract-2',
    'fi-graph-contract-2-result',
  ],
};
