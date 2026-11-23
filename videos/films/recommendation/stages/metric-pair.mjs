import { dcg, lambdaPairLedger, metricSwapState, rankNetStep } from '../arithmetic.mjs';
import { documents } from '../fixtures.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationEase,
  drawRecommendationRect,
  drawRecommendationRowGrades,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintMetricPair(
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
    const a = metricSwapState(),
      z = metricSwapState([0, 2, 3, 0, 2], 4, 3),
      guideSwap = P('lambda-guide-swap', 1, 0.16, 0.34),
      sdkSwap = P('lambda-swaps', 1, 0.36, 0.52),
      r = P('lambda-derivatives', 1, 0.5, 0.95);
    if (currentBeat === 0) {
      const closer = P('lambda-closer', 0, 0.14, 0.33);
      const cross = P('lambda-cross', 0, 0.37, 0.53);
      const gap = api.lerp(api.lerp(-0.1, -0.04, closer), 0.1, cross);
      const low = dcg([0, 3]) / dcg([3, 0]),
        high = 1;
      const guideFirst = gap > 0;
      const x = (v) => 1130 + 4300 * v;
      const y = (v) => 794 - (v - low) * 650;
      const label = (v, px, py, size, color, align = 'left') =>
        api.text(ctx, v, px, py, size, color, align);
      label('Two returned pages', 126, 300, 40, themeColors.ink);
      const order = guideFirst ? ['API guide', 'general blog'] : ['general blog', 'API guide'];
      order.forEach((name, i) => {
        const by = 457 + i * 134;
        label(String(i + 1), 130, by, 37, themeColors.muted);
        label(name, 201, by, 46, name === 'API guide' ? themeColors.cyan : themeColors.pink);
      });
      label('NDCG at two slots', 707, 300, 38, themeColors.ink);
      label(high.toFixed(3), 680, y(high) + 10, 31, themeColors.muted, 'right');
      label(low.toFixed(3), 680, y(low) + 10, 31, themeColors.muted, 'right');
      api.line(ctx, x(-0.1), y(low), x(0), y(low), themeColors.pink, 5);
      api.line(ctx, x(0), y(low), x(0), y(high), themeColors.muted, 2);
      api.line(ctx, x(0), y(high), x(0.13), y(high), themeColors.cyan, 5);
      api.circle(
        ctx,
        x(gap),
        y(guideFirst ? high : low),
        16,
        themeColors.yellow,
        themeColors.bg,
        2,
      );
      for (const v of [-0.1, 0, 0.1])
        label(v === 0 ? 'tie' : v.toFixed(2), x(v), 868, 31, themeColors.muted, 'center');
      label('Guide score minus blog score', 1130, 975, 37, themeColors.ink, 'center');
      return;
    }
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'declared tie order · score gaps = 0',
      960,
      285,
      31,
      themeColors.yellow,
    );
    drawRecommendationRowGrades(ctx, api, themeColors, a.grades, 190, 350, {
      width: 320,
      labels: ['blog · 0', 'runbook · 2', 'guide · 3', 'changelog · 0', 'SDK · 2'],
    });
    if (currentBeat === 1) {
      [
        {
          m: a,
          label: 'guide ↔ blog',
          co: themeColors.cyan,
        },
        {
          m: z,
          label: 'SDK ↔ changelog',
          co: themeColors.green,
        },
      ].forEach(({ m, label, co }, i) => {
        const q = i === 0 ? guideSwap : sdkSwap;
        const x = 230 + i * 900;
        drawRecommendationText(ctx, api, themeColors, label, x + 270, 475, 31, co);
        m.grades.forEach((grade, k) => {
          let cx = x + k * 105,
            cy = 600;
          if (k === m.first || k === m.second) {
            const positions = api.swap(x + m.first * 105, 600, x + m.second * 105, 600, q, 80),
              at = k === m.first ? positions[0] : positions[1];
            cx = at.x;
            cy = at.y;
          }
          drawRecommendationRect(ctx, api, themeColors, cx, cy, 94, 70, co);
          drawRecommendationText(ctx, api, themeColors, grade, cx + 47, cy + 46, 30, co);
        });
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          q === 1 ? '|Δ NDCG| ' + m.delta.toFixed(4) : '|Δ NDCG| ?',
          x + 270,
          820,
          34,
          co,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          r === 1 ? 'preferred derivative ' + m.preferredDerivative.toFixed(4) : '× (−0.5)',
          x + 270,
          950,
          29,
          themeColors.pink,
        );
      });
    } else if (currentBeat === 2) {
      const getFeatures = (id) => {
        const d = documents.find((page) => page.id === id);
        return [d.queryFit, d.reliability];
      };
      const guide = getFeatures('api-guide'),
        blog = getFeatures('blog-post');
      const ordinary = rankNetStep(guide, blog);
      const weighted = rankNetStep(guide, blog, [0, 0], ordinary.rate, a.delta);
      const apply = P('lambda-weighted-gap', 2, 0.62, 0.84);
      const fixed = P('lambda-local-weight', 2, 0.32, 0.51);
      const label = (v, x, y, size, color, align = 'left') =>
        api.text(ctx, v, x, y, size, color, align);
      label('Guide lead after one step from zero', 212, 524, 40, themeColors.ink);
      for (const [i, [name, value, color]] of [
        ['Ordinary pair', ordinary.nextGap, themeColors.cyan],
        ['Weighted pair', weighted.nextGap * apply, themeColors.green],
      ].entries()) {
        const y = 643 + i * 120;
        label(name, 212, y + 13, 37, color);
        api.line(ctx, 660, y, 1580, y, themeColors.panel, 13);
        if (value > 0) api.line(ctx, 660, y, 660 + (value / 0.12) * 920, y, color, 13);
        label(i === 1 && apply === 0 ? '?' : value.toFixed(5), 1770, y + 12, 34, color, 'right');
      }
      if (fixed > 0)
        label(
          'Fixed swap weight   ' +
            a.delta.toFixed(4) +
            '     ×     ordinary gap   ' +
            ordinary.nextGap.toFixed(5),
          212,
          938,
          34,
          themeColors.yellow,
        );
    } else {
      const ledger = lambdaPairLedger(),
        progress = P('lambda-aggregate', 3, 0.31, 0.56),
        scaled = progress * ledger.pairs.length,
        arrived = Math.floor(scaled + 1e-9),
        current = ledger.pairs[Math.min(arrived, ledger.pairs.length - 1)],
        part = scaled - arrived,
        values = ledger.grades.map((_, i) =>
          ledger.pairs.slice(0, arrived).reduce((sum, pair) => sum + pair.values[i], 0),
        );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'every strict preference contributes equal and opposite signals',
        960,
        520,
        29,
        themeColors.yellow,
      );
      values.forEach((v, i) => {
        const x = 335 + i * 320;
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          x - 115,
          700,
          230,
          100,
          v < 0 ? themeColors.cyan : themeColors.pink,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          v.toFixed(4),
          x,
          765,
          33,
          v < 0 ? themeColors.cyan : themeColors.pink,
        );
      });
      if (arrived < ledger.pairs.length && part > 0) {
        for (const [index, v] of current.values.entries())
          if (v !== 0) {
            const x = 335 + index * 320,
              y = 570 + 90 * drawRecommendationEase(ctx, api, part);
            drawRecommendationText(
              ctx,
              api,
              themeColors,
              (v > 0 ? '+' : '') + v.toFixed(4),
              x,
              y,
              27,
              v < 0 ? themeColors.cyan : themeColors.pink,
            );
            api.arrow(ctx, x, y + 15, x, 680, v < 0 ? themeColors.cyan : themeColors.pink, 2);
          }
      }
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        arrived +
          ' / ' +
          ledger.pairs.length +
          ' pair contributions arrived · total signal sums to zero',
        960,
        940,
        31,
        themeColors.yellow,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'LambdaMART fits these aggregate signals with curvature-based leaf updates',
        960,
        1010,
        28,
        themeColors.muted,
      );
    }
  }
}
export function drawMetricPair(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintMetricPair(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'metric-pair',
  draw: drawMetricPair,
  cues: [
    'lambda-closer',
    'lambda-cross',
    'lambda-guide-swap',
    'lambda-local-weight',
    'lambda-weighted-gap',
    'lambda-swaps',
    'lambda-derivatives',
    'metric-pair-b3',
    'lambda-aggregate',
  ],
};
