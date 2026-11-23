import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionText,
} from '../defaults.mjs';
export function drawCoverageOperation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('coverage-operation', state);
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat
        ? 'Stable arithmetic preserves a tiny probability'
        : 'Independent attempts: multiply failure mass, then complement',
    );
    if (!currentBeat) {
      for (let i = 0; i < 5; i++) {
        const x = 180 + i * 330;
        drawConstructionBox(ctx, api, 'Attempt ' + (i + 1), x, 385, 270, 85, themeColors.blue);
        if (i < modelState.failures)
          drawConstructionBox(ctx, api, 'failure × 0.7', x, 520, 270, 85, themeColors.cyan, 28);
      }
      if (modelState.failures)
        drawConstructionText(
          ctx,
          api,
          'All fail: ' +
            Array.from(
              {
                length: modelState.failures,
              },
              () => '.7',
            ).join(' × '),
          960,
          720,
          37,
          themeColors.cyan,
          'center',
        );
      if (modelState.result) {
        drawConstructionText(
          ctx,
          api,
          '0.7⁵ = ' + modelState.mass.toFixed(5),
          960,
          815,
          40,
          themeColors.pink,
          'center',
        );
        drawConstructionText(
          ctx,
          api,
          'At least one succeeds = 1 - ' +
            modelState.mass.toFixed(5) +
            ' = ' +
            modelState.coverage.toFixed(5),
          960,
          915,
          40,
          themeColors.green,
          'center',
        );
      }
    } else {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['p', 'N', 'stable operation'],
          ['1 × 10⁻²⁰', 100, '−expm1(N × log1p(−p))'],
        ],
        170,
        385,
        1580,
        190,
        themeColors.cyan,
        29,
      );
      if (modelState.tiny)
        drawConstructionText(
          ctx,
          api,
          'Candidate-existence probability ≈ 1 × 10⁻¹⁸',
          960,
          690,
          40,
          themeColors.green,
          'center',
        );
      drawConstructionBox(
        ctx,
        api,
        'Selector still must identify a valid candidate',
        360,
        815,
        1200,
        100,
        themeColors.yellow,
        31,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Independent attempts are an explicit assumption; coverage does not measure the returned answer.',
    );
  }
}
export default {
  id: 'coverage-operation',
  draw: drawCoverageOperation,
  cues: [
    'ra-coverage-operation-0-0',
    'ra-coverage-operation-0-1',
    'ra-coverage-operation-0-2',
    'ra-coverage-operation-0-3',
    'ra-coverage-operation-1-0',
    'ra-coverage-operation-1-1',
    'ra-coverage-operation-1-2',
    'ra-coverage-operation-1-3',
  ],
};
