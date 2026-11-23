import { cueProgress, motion } from '../construction.mjs';
import { proxyOptimizationProgress } from '../model.mjs';
import { badge, graphAxes, line } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat === 0) {
    const p = cueProgress(state, 'fresh-samples', motion(state, 0.2, 0.7));
    for (const [i, value] of [0.92, 0.64].entries()) {
      const x = 550 + i * 820,
        color = i ? api.C.yellow : api.C.cyan;
      badge(api, ctx, i ? 'Fresh policy pairs' : 'Stored test pairs', x, 310, color, 37);
      line(api, ctx, x - 200, 790, x + 200, 790);
      const visible = !i || p > 0;
      if (visible) api.rect(ctx, x - 110, 790 - value * 380, 220, value * 380, color, undefined, 12);
      api.focus.target('fresh-accuracy', () =>
        badge(api, ctx, visible ? (100 * value).toFixed(0) + '%' : 'Awaiting fresh pairs', x, 870, color, 48),
      );
    }
    badge(
      api,
      ctx,
      'Illustrative accuracy on different output distributions',
      960,
      995,
      api.C.muted,
      30,
    );
    return;
  }
  const x = 290,
    y = 365,
    w = 1340,
    h = 360,
    n = 5,
    drawP = proxyOptimizationProgress(state),
    cursor = drawP * n;
  const proxy = (i) => 0.25 + (0.57 * i) / n,
    gold = (i) => (i <= 3 ? 0.3 + (0.45 * i) / 3 : 0.75 - (0.37 * (i - 3)) / 2);
  graphAxes(api, ctx, x, y, w, h, 'optimization progress · schematic', 'reward');
  for (const [id, name, fn, color, lx] of [
    ['proxy-reward', 'Proxy model', proxy, api.C.pink, 650],
    ['gold-reward', 'Larger gold model', gold, api.C.cyan, 1300],
  ]) {
    api.focus.target(id, () => {
      badge(api, ctx, name, lx, 280, color, 34);
      const points = Array.from(
        {
          length: Math.floor(cursor) + 1,
        },
        (_, i) => ({
          x: x + (i / n) * w,
          y: y + h - fn(i) * h,
        }),
      );
      points.push({
        x: x + drawP * w,
        y: y + h - fn(cursor) * h,
      });
      if (points.length > 1)
        api.path(ctx, points, {
          color,
          width: 5,
        });
      api.circle(ctx, x + drawP * w, y + h - fn(cursor) * h, 16, color);
    });
  }
  badge(api, ctx, 'Gao et al. studied learned proxy and gold scorers', 960, 930, api.C.muted, 30);
  badge(api, ctx, 'Human judgments are separate evidence', 960, 1000, api.C.yellow, 32);
}

export function drawFreshPolicyEvaluation(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'fresh-policy-evaluation',
  draw: drawFreshPolicyEvaluation,
  cues: [
    'fresh-samples',
    'optimization-first-phase',
    'fresh-policy-evaluation-b3-1',
    'fresh-policy-evaluation-b3-2',
  ],
};
