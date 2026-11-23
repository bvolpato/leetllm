import { documents } from '../fixtures.mjs';
import { eligible } from '../construction.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationEase,
  drawRecommendationFade,
  drawRecommendationRect,
  drawRecommendationStraight,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintJudgmentContract(
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
      const q = P('judge-gate', 0, 0.6, 0.95);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'same request eligibility',
        970,
        280,
        30,
        themeColors.yellow,
      );
      api.line(ctx, 800, 320, 800, 900, themeColors.yellow, 4);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'current + permitted',
        800,
        965,
        28,
        themeColors.yellow,
      );
      documents.forEach((d, i) => {
        const ok = d.current && d.permitted,
          m = ok
            ? drawRecommendationEase(
                ctx,
                api,
                drawRecommendationClamp(ctx, api, q * 1.6 - i * 0.12),
              )
            : 0;
        drawRecommendationDocument(ctx, api, themeColors, d, 170 + 820 * m, 340 + i * 77, {
          w: 570 - 200 * m,
          grade: m === 1 ? d.relevance : undefined,
        });
        if (!ok) {
          api.line(ctx, 744, 350 + i * 77, 780, 386 + i * 77, themeColors.red, 3);
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            d.permitted ? 'not current' : 'not permitted',
            1390,
            370 + i * 77,
            27,
            themeColors.red,
          );
        }
      });
    } else if (currentBeat === 1) {
      eligible.forEach((d, i) => {
        drawRecommendationDocument(ctx, api, themeColors, d, 160, 335 + i * 100, {
          w: 520,
          subtitle: `fit ${d.queryFit} · reliability ${d.reliability}`,
        });
        drawRecommendationVector(ctx, api, themeColors, [d.relevance], 1440, 335 + i * 100, {
          size: 78,
          label: i === 0 ? 'frozen offline grades' : undefined,
          co: themeColors.yellow,
        });
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'serving signals',
        415,
        285,
        30,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'evaluation labels',
        1480,
        285,
        30,
        themeColors.yellow,
      );
      const q = P('judge-label-leak', 1, 0.4, 0.8);
      if (q > 0) {
        api.line(ctx, 900, 315, 900, 890, themeColors.red, 3);
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'target leakage',
          1050,
          970,
          32,
          themeColors.red,
        );
        drawRecommendationStraight(ctx, api, themeColors, 1430, 590, 940, 590, q, themeColors.red);
      }
    } else {
      const counts = [1000000, 1000, 100, 10],
        xs = [180, 610, 1040, 1470],
        q = P('judge-volumes', 2);
      counts.forEach((n, i) => {
        const r = drawRecommendationClamp(ctx, api, q * 4 - i);
        drawRecommendationFade(ctx, api, r, () => {
          const h = 530 * Math.log10(n) / Math.log10(counts[0]);
          drawRecommendationRect(
            ctx,
            api,
            themeColors,
            xs[i],
            830 - h,
            270,
            h,
            i ? themeColors.cyan : themeColors.muted,
          );
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            n.toLocaleString(),
            xs[i] + 135,
            880,
            34,
            i ? themeColors.cyan : themeColors.ink,
          );
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            ['eligible', 'candidates', 'scored', 'displayed'][i],
            xs[i] + 135,
            930,
            27,
            themeColors.muted,
          );
        });
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Pages remaining (log scale)',
        960,
        305,
        31,
        themeColors.yellow,
      );
    }
  }
}
export function drawJudgmentContract(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintJudgmentContract(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'judgment-contract',
  draw: drawJudgmentContract,
  cues: [
    'judgment-contract-b1',
    'judge-gate',
    'judgment-contract-b2',
    'judge-label-leak',
    'judgment-contract-b3',
    'judge-volumes',
  ],
};
