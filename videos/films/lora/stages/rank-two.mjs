import { rotatedPlane } from '../model.mjs';
import { num, sum, scale, project } from '../geometry.mjs';
import { text, math, line, arrow, circle, fade, axes3, drawPlane } from '../defaults.mjs';
export function drawRankTwo(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const b1 = [1, 0.3, 0.2],
    b2 = [-0.25, 1, -0.4];
  ctx.save();
  {
    const rotationP = api.focus.progress('rank-two-rotation', stage(2, 0.35, 0.8));
    const plane = rotatedPlane(api.phase(rotationP, 0, 0.6));
    const currentB2 = beat === 2 ? plane.second : b2;
    const reveal = stage(0),
      o = axes3(ctx, api);
    drawPlane(ctx, api, reveal, b1, currentB2);
    const t = stage(1) * 2 * Math.PI;
    const reach = beat === 2 ? api.phase(rotationP, 0.6, 1) : 0;
    const u = api.lerp(1.1 * Math.cos(t), plane.c1, reach),
      v = api.lerp(0.85 * Math.sin(t), plane.c2, reach);
    const first = scale(b1, u),
      second = scale(currentB2, v),
      total = sum(first, second);
    api.focus.target('first-basis', () => arrow(ctx, api, o, project(b1), themeColors.blue, 5));
    fade(ctx, api, Math.max(reveal, Number(api.focus.progress('rank-two-b1-1', 0) > 0)), () =>
      api.focus.target('second-basis', () =>
        arrow(ctx, api, o, project(currentB2), themeColors.pink, 5),
      ),
    );
    math(ctx, api, 'b_1', 1020, 660, 31, themeColors.blue, 'center');
    fade(ctx, api, reveal, () => math(ctx, api, 'b_2', 440, 855, 31, themeColors.pink, 'center'));
    if (reveal > 0.5 || api.focus.progress('rank-two-b1-1', 0) > 0) {
      api.focus.target('first-contribution', () =>
        arrow(ctx, api, o, project(first), themeColors.blue, 7),
      );
      api.focus.target('second-contribution', () =>
        arrow(ctx, api, project(first), project(total), themeColors.pink, 7),
      );
      api.focus.target('resultant-vector', () =>
        arrow(ctx, api, o, project(total), themeColors.yellow, 4),
      );
      circle(ctx, api, project(total).x, project(total).y, 10, themeColors.yellow);
    }
    text(ctx, api, 'COMBINE TWO INDEPENDENT DIRECTIONS', 170, 285, 30, themeColors.muted);
    math(ctx, api, '\\Delta Wx=c_1b_1+c_2b_2', 1410, 370, 43, themeColors.yellow, 'center');
    text(ctx, api, 'coefficient 1   ' + num(u), 1410, 495, 32, themeColors.blue, 'center', 'mono');
    text(ctx, api, 'coefficient 2   ' + num(v), 1410, 560, 32, themeColors.pink, 'center', 'mono');
    fade(ctx, api, stage(1, 0.3, 0.6), () => {
      const target = project(plane.target),
        onPlane = project(total);
      if (rotationP < 0.999) line(ctx, api, onPlane, target, themeColors.red, 3);
      circle(
        ctx,
        api,
        target.x,
        target.y,
        11,
        rotationP >= 0.999 ? themeColors.green : themeColors.red,
      );
      text(
        ctx,
        api,
        'target',
        target.x + 45,
        target.y - 20,
        25,
        rotationP >= 0.999 ? themeColors.green : themeColors.red,
      );
      text(
        ctx,
        api,
        rotationP >= 0.999
          ? 'new plane reaches the same target'
          : 'target outside the original plane',
        1410,
        685,
        31,
        rotationP >= 0.999 ? themeColors.green : themeColors.red,
        'center',
      );
    });
    fade(ctx, api, stage(2), () => {
      api.focus.target('rank-limit', () =>
        math(ctx, api, '\\operatorname{rank}(BA)\\leq r', 1410, 815, 48, themeColors.ink, 'center'),
      );
      if (rotationP > 0)
        text(
          ctx,
          api,
          'Prescribed rotation · not a simulated optimizer step',
          960,
          990,
          28,
          themeColors.muted,
          'center',
        );
    });
  }
  ctx.restore();
}
export default {
  id: 'rank-two',
  draw: drawRankTwo,
  cues: ['rank-two-b1-1', 'rank-two-b2-1', 'rank-two-b2-2', 'rank-two-b3-1', 'rank-two-rotation'],
};
