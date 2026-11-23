import { crossMatrixState } from '../arithmetic.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationMath,
  drawRecommendationStraight,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintCrossMatrix(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  beatProgress,
  stageId,
) {
  const S = (beat, a = 0.08, z = 0.85) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(beatProgress, a, z);
  const P = (cue, beat = 0, a = 0.08, z = 0.85) => {
    const c = state.cues?.[cue];
    return c
      ? c.phase === 'before'
        ? 0
        : c.phase === 'after'
          ? 1
          : drawRecommendationClamp(ctx, api, c.progress)
      : S(beat, a, z);
  };
  const R = (cue, beat = 0, a = 0.08, z = 0.85) => P(cue, beat, a, z) === 1;
  {
    const matrix = true,
      m = crossMatrixState();
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'original input x₀',
      340,
      285,
      30,
      themeColors.yellow,
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'current vector xₗ',
      900,
      285,
      30,
      themeColors.cyan,
    );
    drawRecommendationVector(ctx, api, themeColors, m.x0, 250, 340, {
      co: themeColors.yellow,
    });
    drawRecommendationVector(ctx, api, themeColors, m.xl, 810, 340, {
      co: themeColors.cyan,
    });
    {
      drawRecommendationVector(ctx, api, themeColors, [1, 0], 1330, 340, {
        label: 'W row 1',
        co: themeColors.pink,
      });
      drawRecommendationVector(ctx, api, themeColors, [0, 1], 1330, 485, {
        co: themeColors.pink,
      });
      if (currentBeat === 0)
        drawRecommendationMath(
          ctx,
          api,
          themeColors,
          String.raw`x_{l+1}=x_0\odot(Wx_l+b)+x_l`,
          960,
          750,
          44,
        );
      if (currentBeat === 1) {
        const inside = R('cross-inside', 1, 0.08, 0.35),
          result = R('cross-matrix-result', 1, 0.55, 0.9);
        drawRecommendationVector(ctx, api, themeColors, m.inside, 230, 650, {
          label: 'Wxₗ + b',
          co: themeColors.pink,
          unknown: !inside,
        });
        drawRecommendationVector(ctx, api, themeColors, m.cross, 800, 650, {
          label: 'x₀ ⊙ inside',
          co: themeColors.yellow,
          unknown: !inside,
        });
        drawRecommendationVector(ctx, api, themeColors, m.result, 1350, 650, {
          label: 'plus current xₗ',
          co: themeColors.green,
          unknown: !result,
        });
        drawRecommendationStraight(
          ctx,
          api,
          themeColors,
          470,
          690,
          750,
          690,
          P('cross-inside', 1),
          themeColors.pink,
        );
        drawRecommendationStraight(
          ctx,
          api,
          themeColors,
          1040,
          690,
          1300,
          690,
          P('cross-matrix-result', 1),
          themeColors.green,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'bias is inside the coordinatewise product',
          960,
          930,
          32,
          themeColors.yellow,
        );
      }
      if (currentBeat === 2) {
        const q = P('cross-query-change', 2, 0.1, 0.75);
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'Separate original-vector probe · fixed item [1, 2]',
          960,
          590,
          29,
          themeColors.yellow,
        );
        drawRecommendationVector(ctx, api, themeColors, [0, 1, 1, 2], 220, 690, {
          size: 105,
          label: 'query A + same item',
          co: themeColors.cyan,
        });
        drawRecommendationVector(ctx, api, themeColors, [1, 0, 1, 2], 1150, 690, {
          size: 105,
          label: 'query B + same item',
          co: themeColors.blue,
        });
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          q === 1 ? 'crossed item [2.25, 4.5]' : 'crossed item ?',
          440,
          880,
          31,
          themeColors.cyan,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          q === 1 ? 'crossed item [2.5, 5]' : 'crossed item ?',
          1370,
          880,
          31,
          themeColors.blue,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'vector-probe w = [0.5, 0.25, 0.5, 0.25] · b = 0',
          960,
          955,
          29,
          themeColors.muted,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'complete joint representation depends on this query',
          960,
          1020,
          29,
          themeColors.pink,
        );
      }
    }
  }
}
export function drawCrossMatrix(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintCrossMatrix(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'cross-matrix',
  draw: drawCrossMatrix,
  cues: [
    'cross-matrix-b1',
    'cross-matrix-b2',
    'cross-inside',
    'cross-matrix-result',
    'cross-matrix-b3',
    'cross-query-change',
  ],
};
