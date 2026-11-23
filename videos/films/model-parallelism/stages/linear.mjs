import { W, X } from '../fixtures.mjs';
import { shards } from '../model.mjs';
import { drawOriginalEquation, drawOriginalMatrix, drawOriginalText } from '../defaults.mjs';
export function drawLinear(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const result = shards();
  {
    api.focus.target('linear-input-row-x', () =>
      drawOriginalText(ctx, api, 'Input row x', 270, 315, 33, themeColors.blue),
    );
    api.focus.target('linear-weight-matrix-w', () =>
      drawOriginalText(ctx, api, 'Weight matrix W', 820, 315, 33, themeColors.cyan),
    );
    api.focus.target('linear-output-x-w', () =>
      drawOriginalText(ctx, api, 'Output xW', 960, 780, 33, themeColors.yellow, 'center'),
    );
    api.focus.target('linear-readout', () =>
      drawOriginalMatrix(ctx, api, X, 250, 410, 125, themeColors.blue),
    );
    const col =
      currentBeat > 1
        ? 3
        : currentBeat === 1 && state.cues
          ? Math.min(3, 1 + Math.ceil(2 * api.focus.progress('repeat-columns', 0)))
          : Math.min(3, Math.floor(4 * whole));
    api.focus.target('linear-readout-2', () =>
      drawOriginalMatrix(ctx, api, W, 820, 380, 125, themeColors.cyan, [undefined, col]),
    );
    api.focus.target('linear-readout-3', () =>
      drawOriginalMatrix(
        ctx,
        api,
        [result.y.map((v, j) => (j <= col ? v : ''))],
        715,
        825,
        125,
        themeColors.yellow,
      ),
    );
    api.focus.target('linear-equation', () =>
      drawOriginalEquation(
        ctx,
        api,
        '1\\cdot' + W[0][col] + '+2\\cdot' + W[1][col] + '=' + result.y[col],
        960,
        690,
        52,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'linear',
  draw: drawLinear,
  cues: [
    'linear-input',
    'output-coordinates',
    'column-products',
    'repeat-columns',
    'reference-output',
    'output-slices',
    'input-contributions',
  ],
};
