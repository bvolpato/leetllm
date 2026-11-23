import { derivativeLoss, latencyExample } from '../arithmetic.mjs';
import {
  drawAxes,
  drawCurve,
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
} from '../defaults.mjs';
export function drawParametersShapeLoss(ctx, scene, state, api) {
  const { C: themeColors, line, circle } = api;
  const progress2 = api.clamp(state.p ?? 0);
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? progress2);
  const { ink, muted, cyan, blue, yellow, pink, green, red, panel } = themeColors;
  const haloCenters = [];
  const marker = (x, y, color, r = 12, hollow = false) => {
    const radius = r + 7;
    const haloOpacity = haloCenters.reduce(
      (opacity, previous) =>
        Math.min(
          opacity,
          api.phase(Math.hypot(x - previous.x, y - previous.y) - previous.radius - radius, 0, 12),
        ),
      1,
    );
    if (haloOpacity > 0) {
      ctx.save();
      ctx.globalAlpha *= haloOpacity;
      circle(ctx, x, y, radius, 'transparent', color, 2);
      if (ctx.globalAlpha > 0.2)
        haloCenters.push({
          x,
          y,
          radius,
        });
      ctx.restore();
    }
    circle(ctx, x, y, r, hollow ? 'transparent' : color, hollow ? color : themeColors.bg, 3);
  };
  const dot = (x, y, color, r = 12) => marker(x, y, color, r);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (() => {
    const b = {
      left: 215,
      top: 340,
      right: 865,
      bottom: 770,
    };
    drawAxes(ctx, api, b, String.raw`w`, String.raw`L`);
    const sampleMid = api.focus.progress('sample-mid', api.phase(beatP, 0.25, 0.55));
    const sampleThree = api.focus.progress('sample-three', api.phase(beatP, 0.6, 0.85));
    const sampleWeight = 2 + 0.5 * sampleMid + 0.5 * sampleThree;
    const quarter = beat === 1 ? api.focus.progress('quarter-sample', api.phase(beatP, 0.08, 0.25)) : 0;
    const prediction = beat === 1 ? api.focus.progress('quarter-prediction', api.phase(beatP, 0.25, 0.42)) : 0;
    const loss = beat === 1 ? api.focus.progress('quarter-loss', api.phase(beatP, 0.45, 0.63)) : 0;
    const construction = beat === 0 ? 0 : beat === 1
      ? api.focus.progress('loss-curve-b2-1', api.phase(beatP, 0.65, 0.88)) : 1;
    const map = api.focus.target('loss-curve', () =>
      drawCurve(ctx, api, b, 1.45, 3.6, 0, 5.2, derivativeLoss, cyan, 6, construction),
    );
    api.focus.target('loss-rule', () =>
      drawOriginalEquation(ctx, api, String.raw`L(w)=(2w-5)^2`, 540, 270, 47, ink, 'center'),
    );
    const w = beat === 0 ? sampleWeight : beat === 1 ? 2 + 0.25 * quarter : 3;
    const px = map.X(w),
      py = map.Y((2 * w - 5) ** 2);
    api.focus.target('curve-parameter', () => {
      if (beat === 1 && loss < 1) line(ctx, px, b.bottom, px, b.bottom + 14, yellow, 4);
      else {
        dot(px, py, yellow, 15);
        line(ctx, px, py + 14, px, b.bottom, muted, 2);
      }
    });
    if (beat > 0) dot(map.X(2.5), map.Y(0), green, 11);
    if (beat > 0 || sampleMid >= 1)
      drawOriginalEquation(ctx, api, String.raw`w^*=2.5`, map.X(2.5), 860, 33, green, 'center');
    drawOriginalText(ctx, api, 'one weight · one curve', 540, 900, 32, muted, 'center');
    for (const [i, value] of [2, 2.5, 3].entries()) {
      const received = beat > 0 || value <= w + 1e-10;
      if (received) {
        circle(ctx, map.X(value), map.Y(derivativeLoss(value)), 7, value === 2.5 ? green : pink);
        drawOriginalEquation(
          ctx,
          api,
          `L(${value})=${derivativeLoss(value)}`,
          290 + i * 255,
          970,
          31,
          value === 2.5 ? green : muted,
          'center',
        );
      }
    }
    if (beat === 1 && quarter === 1) api.focus.target('quarter-score', () => {
      drawOriginalText(ctx, api, 'At 2.25 s per block', 1330, 435, 39, yellow, 'center');
      if (prediction === 1) drawOriginalText(ctx, api, '4.5 s predicted    ·    5 s target', 1330, 545, 38, ink, 'center');
      if (loss === 1) drawOriginalEquation(ctx, api, String.raw`L(2.25)=(4.5-5)^2=0.25`, 1330, 655, 40, cyan, 'center');
    });
    const project = (u, v, z) => ({
      x: 1320 + (u - v) * 148,
      y: 650 + (u + v) * 30 - z * 65,
    });
    const surfaceLoss = (u, v) => latencyExample([2 + u, 1 + v]).loss;
    const n = 12;
    ctx.save();
    ctx.globalAlpha *= beat < 2 ? 0 : 1;
    for (let i = 0; i <= n; i += 1) {
      const a = -1.2 + (2.4 * i) / n;
      const first = Array.from(
        {
          length: n + 1,
        },
        (_, j) => {
          const v = -1.2 + (2.4 * j) / n;
          const z = 0.35 * surfaceLoss(a, v);
          return project(a, v, z);
        },
      );
      const build = api.phase(beatP, i * 0.025, 0.44 + i * 0.025);
      api.focus.target('loss-surface', () =>
        api.trace(ctx, first, build, i % 3 === 0 ? blue : '#51627f', i % 3 === 0 ? 2.3 : 1.2),
      );
      const second = Array.from(
        {
          length: n + 1,
        },
        (_, j) => {
          const u = -1.2 + (2.4 * j) / n;
          const z = 0.35 * surfaceLoss(u, a);
          return project(u, a, z);
        },
      );
      api.focus.target('loss-surface', () =>
        api.trace(ctx, second, build, i % 3 === 0 ? cyan : '#51627f', i % 3 === 0 ? 2.3 : 1.2),
      );
    }
    ctx.restore();
    const low = project(0, 0, 0);
    if (beat === 2) {
      const route = Array.from(
        {
          length: 61,
        },
        (_, i) => {
          const u = api.lerp(0, -0.5, i / 60),
            v = -2 * u;
          return project(u, v, 0.35 * surfaceLoss(u, v));
        },
      );
      const surfaceP = api.focus.progress('valley-bottom', api.phase(beatP, 0.5, 0.88));
      api.trace(ctx, route, surfaceP, yellow, 4);
      const point = api.pointAlongPath(route, surfaceP);
      api.focus.target('surface-parameter', () => dot(point.x, point.y, yellow, 10));
      circle(ctx, low.x, low.y, 7, green);
      const other = route.at(-1);
      circle(ctx, other.x, other.y, 7, green);
    }
    if (beat === 2) {
      const w1 = project(1.7, 0, 0),
        w2 = project(0, 1.7, 0),
        height = project(0, 0, 3.8);
      drawShortArrow(ctx, api, ctx, low.x, low.y, w1.x, w1.y, blue, 2);
      drawShortArrow(ctx, api, ctx, low.x, low.y, w2.x, w2.y, cyan, 2);
      drawShortArrow(ctx, api, ctx, low.x, low.y, height.x, height.y, muted, 2);
      drawOriginalEquation(ctx, api, String.raw`\Delta w_p`, w1.x + 15, w1.y + 30, 34, blue);
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\Delta w_q`,
        w2.x - 15,
        w2.y + 30,
        34,
        cyan,
        'right',
      );
      drawOriginalEquation(ctx, api, String.raw`L`, height.x + 15, height.y + 10, 34, muted);
      drawOriginalEquation(ctx, api, String.raw`L=(2w_p+w_q-5)^2`, 1340, 240, 35, ink, 'center');
      drawOriginalEquation(
        ctx,
        api,
        String.raw`(w_p,w_q)=(2,1)+(\Delta w_p,\Delta w_q)`,
        1340,
        820,
        29,
        ink,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        '(2, 1) and (1.5, 2) both predict 5 s',
        1340,
        900,
        29,
        muted,
        'center',
      );
    }
    return;
  })();
  ctx.restore();
}
export default {
  id: 'parameters-shape-loss',
  draw: drawParametersShapeLoss,
  cues: [
    'sample-curve',
    'sample-mid',
    'sample-three',
    'quarter-sample',
    'quarter-prediction',
    'quarter-loss',
    'loss-curve-b2-1',
    'loss-surface-b2-2',
    'valley-bottom',
  ],
};
