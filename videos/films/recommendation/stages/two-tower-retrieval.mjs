import { SHORT } from '../fixtures.mjs';
import { twoTowerConstructionFor } from '../model.mjs';
import {
  drawRecommendationColor,
  drawRecommendationDocument,
  drawRecommendationEase,
  drawRecommendationMath,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintTwoTowerRetrieval(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  beatProgress,
  stageId,
) {
  const plot = api.teaching.axes({
      x: 230,
      y: 360,
      width: 700,
      height: 480,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'embedding coordinate 1',
      yLabel: 'coordinate 2',
    }),
    o = plot.point(0, 0),
    m = twoTowerConstructionFor(currentBeat, beatProgress, state.cues);
  if (m.query.progress > 0) {
    const u = plot.point(...m.query.point);
    api.arrow(ctx, o.x, o.y, u.x, u.y, themeColors.yellow, 4);
  }
  drawRecommendationText(
    ctx,
    api,
    themeColors,
    m.query.complete ? 'query [1, 0]' : 'query vector',
    565,
    290,
    31,
    themeColors.yellow,
  );
  m.items.forEach((item, i) => {
    const co = drawRecommendationColor(ctx, api, themeColors, item.id),
      a = plot.point(...item.point),
      base = plot.point(...item.base);
    drawRecommendationDocument(ctx, api, themeColors, item.id, 1160, 365 + i * 160, {
      w: 540,
      subtitle: item.complete
        ? `item v = [${item.values.join(', ')}]`
        : 'supplied coordinates pending',
    });
    if (item.progress > 0) {
      api.line(ctx, o.x, o.y, base.x, base.y, co + '65', 3);
      if (item.point[1] > 0) api.line(ctx, base.x, base.y, a.x, a.y, co + '65', 3);
      api.line(ctx, o.x, o.y, a.x, a.y, co, 4);
      api.circle(ctx, a.x, a.y, 10, co);
      if (item.complete)
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          SHORT[item.id],
          a.x + (i === 0 ? 45 : 0),
          a.y - 24,
          25,
          co,
        );
    }
    if (item.projection > 0) {
      const z = plot.point(item.score, 0),
        y = api.lerp(a.y, z.y, drawRecommendationEase(ctx, api, item.projection));
      api.line(ctx, a.x, a.y, z.x, y, co, 3);
      api.circle(ctx, z.x, y, 9, co);
      if (item.resultKnown)
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          item.score.toFixed(1),
          1735,
          411 + i * 160,
          30,
          co,
        );
    }
  });
  if (m.query.complete)
    drawRecommendationMath(
      ctx,
      api,
      themeColors,
      String.raw`[1,0]\cdot[v_1,v_2]=v_1`,
      1430,
      930,
      42,
      themeColors.yellow,
    );
}
export function drawTwoTowerRetrieval(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintTwoTowerRetrieval(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'two-tower-retrieval',
  draw: drawTwoTowerRetrieval,
  cues: [
    'two-tower-retrieval-beat-1-focus-1',
    'two-tower-retrieval-beat-2-focus-1',
    'tower-query-components',
    'tower-guide-components',
    'tower-runbook-components',
    'tower-blog-components',
    'tower-projection',
    'two-tower-retrieval-beat-3-focus-1',
  ],
};
