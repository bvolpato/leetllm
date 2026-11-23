import { TOWER_OBSERVED } from '../fixtures.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationFade,
  drawRecommendationRect,
  drawRecommendationStraight,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintTowerContract(
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
    if (currentBeat === 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'query tower',
        450,
        285,
        31,
        themeColors.yellow,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'item tower · precompute',
        1440,
        285,
        31,
        themeColors.cyan,
      );
      drawRecommendationVector(ctx, api, themeColors, [3, 4], 350, 380, {
        label: 'u',
        co: themeColors.yellow,
      });
      drawRecommendationVector(ctx, api, themeColors, [6, 8], 1350, 380, {
        label: 'v',
        co: themeColors.cyan,
      });
      const q = P('tower-normalization', 0, 0.35, 0.85);
      drawRecommendationVector(ctx, api, themeColors, [0.6, 0.8], 350, 650, {
        label: 'u / ‖u‖',
        co: themeColors.yellow,
        unknown: q !== 1,
      });
      drawRecommendationVector(ctx, api, themeColors, [0.6, 0.8], 1350, 650, {
        label: 'v / ‖v‖',
        co: themeColors.cyan,
        unknown: q !== 1,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Separate normalization toy · u = [3, 4], v = [6, 8]',
        960,
        570,
        27,
        themeColors.muted,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q === 1 ? 'cosine = 1 · raw dot = 50' : 'normalize both before cosine similarity',
        960,
        950,
        36,
        themeColors.green,
      );
    } else if (currentBeat === 1) {
      const q = P('tower-counts', 1, 0.08, 0.55);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Actual article CPU fixture',
        960,
        285,
        32,
        themeColors.yellow,
      );
      for (let i = 0; i < 1000; i++) {
        const x = 170 + (i % 50) * 16,
          y = 370 + Math.floor(i / 50) * 18;
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          x,
          y,
          11,
          11,
          themeColors.muted + '70',
          themeColors.muted + '25',
        );
      }
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        '1,000 exact 16-D dots',
        570,
        830,
        31,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Use exact neighbors as the reference for approximate search',
        570,
        885,
        27,
        themeColors.muted,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'five selected IDs',
        1465,
        330,
        29,
        themeColors.green,
      );
      TOWER_OBSERVED.selected.forEach((d, i) => {
        const r = drawRecommendationClamp(ctx, api, q * 5 - i);
        drawRecommendationFade(ctx, api, r, () => {
          drawRecommendationRect(
            ctx,
            api,
            themeColors,
            1220,
            370 + i * 92,
            490,
            72,
            themeColors.green,
          );
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            `#${d.id}`,
            1250,
            415 + i * 92,
            28,
            themeColors.green,
            'left',
          );
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            d.score.toFixed(5),
            1675,
            415 + i * 92,
            28,
            themeColors.green,
            'right',
          );
        });
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'joint cross layer: 32 coordinates × 5',
        1445,
        930,
        30,
        themeColors.yellow,
      );
    } else {
      const q = S(2);
      drawRecommendationDocument(ctx, api, themeColors, 'api-guide', 200, 375, {
        w: 420,
      });
      drawRecommendationDocument(ctx, api, themeColors, 'blog-post', 1250, 375, {
        w: 420,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'observed positive',
        410,
        500,
        29,
        themeColors.green,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'sampled alternative',
        1460,
        500,
        29,
        themeColors.muted,
      );
      api.line(ctx, 700, 650, 1200, 650, themeColors.muted, 3);
      drawRecommendationStraight(
        ctx,
        api,
        themeColors,
        950,
        650,
        720,
        650,
        q,
        themeColors.green,
        'raise',
      );
      drawRecommendationStraight(
        ctx,
        api,
        themeColors,
        950,
        750,
        1180,
        750,
        q,
        themeColors.pink,
        'lower',
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'sampled alternatives are not verified dislikes',
        960,
        910,
        32,
        themeColors.yellow,
      );
    }
  }
}
export function drawTowerContract(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintTowerContract(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'tower-contract',
  draw: drawTowerContract,
  cues: [
    'tower-contract-b1',
    'tower-normalization',
    'tower-contract-b2',
    'tower-counts',
    'tower-contract-b3',
  ],
};
