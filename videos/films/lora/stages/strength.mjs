import { num, scale, point } from '../geometry.mjs';
import { text, math, line, arrow, circle, fade, axes2 } from '../defaults.mjs';
export function drawStrength(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const origin = point(430, 730),
      map = axes2(ctx, api, origin, 100);
    const alpha = beat === 0 ? api.lerp(1, 4, stage(0)) : beat === 1 ? 4 : api.lerp(4, 8, stage(2));
    const r = stage(1, 0.18, 0.42) > 0.5 ? 2 : 1;
    const s = alpha / r;
    const vector = [0.65, 0.45];
    const tip = map(scale(vector, s));
    line(ctx, api, map(scale(vector, -1.8)), map(scale(vector, 4.5)), '#f4d47766', 2);
    api.focus.target('scaled-vector', () => arrow(ctx, api, origin, tip, themeColors.yellow, 7));
    circle(ctx, api, tip.x, tip.y, 10, themeColors.yellow);
    fade(ctx, api, stage(1, 0.18, 0.65), () =>
      arrow(ctx, api, origin, map([-0.8, 1.5]), themeColors.pink, 5),
    );
    text(
      ctx,
      api,
      beat === 0 ? 'FIXED FACTORS: SCALE THE CORRECTION' : 'COMPARE CAPACITY AND EXPLICIT SCALE',
      170,
      285,
      28,
      themeColors.muted,
    );
    api.focus.target('explicit-scale', () =>
      math(ctx, api, 's=\\frac{\\alpha}{r}', 1410, 365, 70, themeColors.ink, 'center'),
    );
    text(ctx, api, 'α = ' + num(alpha), 1410, 495, 42, themeColors.yellow, 'center', 'mono');
    api.focus.target('rank-setting', () =>
      text(ctx, api, 'r = ' + num(r), 1410, 570, 42, themeColors.pink, 'center', 'mono'),
    );
    text(ctx, api, 'multiplier = ' + num(s), 1410, 670, 44, themeColors.cyan, 'center', 'mono');
    text(
      ctx,
      api,
      beat === 0 ? 'same direction · changing strength' : 'more directions · record the scale',
      1410,
      790,
      29,
      themeColors.muted,
      'center',
    );
    fade(ctx, api, stage(2), () => undefined);
  }
  ctx.restore();
}
export default {
  id: 'strength',
  draw: drawStrength,
  cues: ['strength-b1-1', 'strength-b2-1', 'strength-b2-2', 'strength-b3-1'],
};
