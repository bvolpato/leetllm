import { crossVectorState } from '../arithmetic.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationFade,
  drawRecommendationMath,
  drawRecommendationRect,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintCrossVector(
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
  {
    const matrix = false,
      m = crossVectorState();
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
      drawRecommendationVector(ctx, api, themeColors, m.weights, 1350, 340, {
        label: 'w',
        co: themeColors.pink,
      });
      const qs = P('cross-scalar', 1, 0.05, 0.3),
        qp = P('cross-products', 1, 0.3, 0.55),
        qr = P('cross-vector-result', 1, 0.65, 0.98);
      if (currentBeat === 0)
        drawRecommendationMath(
          ctx,
          api,
          themeColors,
          String.raw`x_{l+1}=x_0(x_l^T w)+b+x_l`,
          960,
          700,
          45,
        );
      if (currentBeat === 1) {
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          qs === 1 ? '[5, 7] · [1, 0] = 5' : '[5, 7] · [1, 0] = ?',
          960,
          525,
          34,
          themeColors.pink,
        );
        const plot = api.teaching.axes({
          x: 230,
          y: 630,
          width: 540,
          height: 310,
          xDomain: [0, 17],
          yDomain: [0, 25],
          equalUnits: true,
          xTicks: [0, 5, 10, 15],
          yTicks: [0, 10, 20],
          xLabel: 'first crossed coordinate',
          yLabel: 'second',
          fontSize: 22,
        });
        const progress = qp / 3 + (qr * 2) / 3;
        api.teaching.vectorAccumulation({
          plot,
          terms: [
            {
              id: 'base-times-projection',
              label: 'x₀ × 5',
              weight: 1,
              values: m.cross,
              color: themeColors.yellow,
            },
            {
              id: 'outside-bias',
              label: 'outside bias',
              weight: 1,
              values: m.bias,
              color: themeColors.muted,
            },
            {
              id: 'current-residual',
              label: 'current xₗ',
              weight: 1,
              values: m.xl,
              color: themeColors.cyan,
            },
          ],
          progress,
          ledger: {
            x: 1020,
            y: 610,
            width: 720,
            height: 365,
          },
          fontSize: 25,
          revealTotal: qr === 1,
          totalLabel: 'crossed feature',
          format: (v) => String(Number(v.toFixed(3))),
          color: themeColors.green,
        });
      }
      if (currentBeat === 2) {
        const q = P('cross-degree', 2, 0.08, 0.85);
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'each cross multiplies by one original-input factor',
          960,
          580,
          31,
          themeColors.yellow,
        );
        for (let i = 0; i < 3; i++) {
          const r = drawRecommendationClamp(ctx, api, q * 3 - i),
            x = 270 + i * 560;
          drawRecommendationFade(ctx, api, r, () => {
            drawRecommendationRect(ctx, api, themeColors, x, 690, 430, 115, themeColors.cyan);
            drawRecommendationMath(
              ctx,
              api,
              themeColors,
              i === 0 ? 'x' : i === 1 ? 'x^2' : 'x^3',
              x + 215,
              765,
              48,
              themeColors.cyan,
            );
            drawRecommendationText(
              ctx,
              api,
              themeColors,
              i === 0
                ? 'input: degree 1'
                : i === 1
                  ? 'one cross: degree ≤ 2'
                  : 'two crosses: degree ≤ 3',
              x + 215,
              870,
              27,
              themeColors.yellow,
            );
          });
        }
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'O(D) per layer · shared weights tie polynomial coefficients',
          960,
          1000,
          30,
          themeColors.muted,
        );
      }
    }
  }
}
export function drawCrossVector(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintCrossVector(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'cross-vector',
  draw: drawCrossVector,
  cues: [
    'cross-vector-b1',
    'cross-vector-b2',
    'cross-scalar',
    'cross-products',
    'cross-vector-result',
    'cross-vector-b3',
    'cross-degree',
  ],
};
