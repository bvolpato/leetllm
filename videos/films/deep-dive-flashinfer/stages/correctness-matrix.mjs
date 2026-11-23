import { flashinferExtensionFrame } from '../construction.mjs';
import { clauseEnded } from '../cache-picture.mjs';
import { extensionText, footer, grid, header } from '../defaults.mjs';
export function drawCorrectnessMatrix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('correctness-matrix', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-correctness-matrix-mechanism', () => {
    header(ctx, api, 'Match logical inputs, then record what was actually checked');
    const all = [
        ['case', 'output / mapping', 'LSE', 'scope'],
        ['listed pages / tail', 'index assertions', 'n/a', 'CPU actual'],
        ['split attention', '168 comparisons', '168 comparisons', 'CPU actual'],
        ['CUDA FP16 GQA', 'not run', 'not run', 'separate program'],
        ['unsupported shape', 'not eligible', 'not eligible', 'before execution'],
      ],
      count =
        currentBeat === 0 ? 1 + Math.min(3, Math.floor(progress * 4)) : currentBeat === 1 ? 4 : 5,
      labels = all.slice(0, count),
      selected =
        currentBeat === 0
          ? Math.max(1, count - 1)
          : currentBeat === 1
            ? progress < 0.5
              ? 2
              : 3
            : 4;
    grid(
      ctx,
      api,
      labels,
      150,
      380,
      1620,
      Math.max(78, labels.length * 78),
      themeColors.cyan,
      25,
      selected < labels.length
        ? Array.from(
            {
              length: 4,
            },
            (_, column) => ({
              row: selected,
              column,
              fill: themeColors.panel,
              stroke: themeColors.yellow,
            }),
          )
        : [],
    );
    if (currentBeat === 1) {
      const worked = clauseEnded(state, 'fi-correctness-matrix-1-result', 1, 0.85);
      extensionText(
        ctx,
        api,
        worked ? 'Reference value   1' : 'Compare output and normalization state',
        960,
        850,
        33,
        themeColors.yellow,
        'center',
      );
      extensionText(
        ctx,
        api,
        worked
          ? 'Allowed error   0.002 + 0.002 × 1 = 0.004'
          : '|error| ≤ atol + rtol × |reference|',
        960,
        925,
        30,
        themeColors.green,
        'center',
      );
    } else if (currentBeat === 2)
      extensionText(
        ctx,
        api,
        'Training also needs a backward comparison',
        960,
        925,
        31,
        themeColors.yellow,
        'center',
      );
    footer(ctx, api, 'Compare the same logical inputs on each backend');
  });
}
export default {
  id: 'correctness-matrix',
  draw: drawCorrectnessMatrix,
  cues: [
    'fi-correctness-matrix-0',
    'fi-correctness-matrix-0-result',
    'fi-correctness-matrix-1',
    'fi-correctness-matrix-1-result',
    'fi-correctness-matrix-2',
    'fi-correctness-matrix-2-result',
  ],
};
