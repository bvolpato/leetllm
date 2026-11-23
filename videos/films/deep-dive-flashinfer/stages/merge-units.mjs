import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, header, rect } from '../defaults.mjs';
export function drawMergeUnits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('merge-units', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-merge-units-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat === 0
        ? 'Convert only the producer’s declared logarithm base'
        : currentBeat === 1
          ? 'A dated cuDNN frontend boundary'
          : 'Select the actual low-level producer',
    );
    if (currentBeat === 0) {
      const factor = modelState.factor;
      extensionCard(ctx, api, 'Producer: natural-log LSE', 170, 370, 690, themeColors.blue);
      extensionCard(
        ctx,
        api,
        factor === 0
          ? 'No conversion yet'
          : factor === 1
            ? 'Divide once by ln2'
            : 'Incorrect: divide twice by ln2',
        1050,
        370,
        710,
        factor === 2 ? themeColors.pink : themeColors.yellow,
      );
      extensionText(
        ctx,
        api,
        'Stored values: [' + modelState.bs.map((v) => v.toFixed(4)).join(', ') + ']',
        960,
        600,
        36,
        themeColors.cyan,
        'center',
      );
      const share = modelState.merged.weights[0];
      rect(ctx, api, 350, 740, 1200 * share, 75, themeColors.blue, themeColors.blue);
      rect(
        ctx,
        api,
        350 + 1200 * share,
        740,
        1200 * (1 - share),
        75,
        themeColors.pink,
        themeColors.pink,
      );
      extensionText(
        ctx,
        api,
        'Actual merged output [' +
          modelState.merged.output.map((v) => v.toFixed(4)).join(', ') +
          ']',
        960,
        900,
        35,
        factor === 1 ? themeColors.green : themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      [
        ['0.6.18 frontend', 'natural log returned'],
        ['0.7.0 release', 'conversion fix included'],
        ['0.7.1 frontend', 'log₂ default; ln explicit'],
      ].forEach(([v, z], i) => {
        extensionCard(ctx, api, v, 170, 385 + i * 160, 600, themeColors.blue);
        if (progress > (i + 0.2) / 3)
          extensionCard(ctx, api, z, 950, 385 + i * 160, 800, themeColors.cyan);
      });
    } else {
      extensionCard(ctx, api, 'Frontend path', 180, 410, 680, themeColors.blue);
      extensionCard(ctx, api, 'log₂ or explicit natural log', 1050, 410, 680, themeColors.cyan);
      extensionCard(ctx, api, 'cubin cuDNN path', 180, 650, 680, themeColors.blue);
      extensionCard(
        ctx,
        api,
        progress > 0.5 ? 'log₂; natural-log request rejected' : 'Inspect producer contract',
        1050,
        650,
        680,
        progress > 0.5 ? themeColors.yellow : themeColors.muted,
      );
    }
    footer(ctx, api, 'Version, backend and requested statistic units travel with the state');
  });
}
export default {
  id: 'merge-units',
  draw: drawMergeUnits,
  cues: [
    'fi-merge-units-0',
    'fi-merge-units-0-result',
    'fi-merge-units-1',
    'fi-merge-units-1-result',
    'fi-merge-units-2',
    'fi-merge-units-2-result',
  ],
};
