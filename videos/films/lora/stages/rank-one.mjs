import { rankOneConstruction } from '../construction.mjs';
import { num, scale, project } from '../geometry.mjs';
import { text, math, line, arrow, circle, fade, matrix, axes3 } from '../defaults.mjs';
export function drawRankOne(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const b1 = [1, 0.3, 0.2];
  ctx.save();
  {
    const o = axes3(ctx, api),
      current = rankOneConstruction(beat, progress),
      { x, a, coefficient } = current;
    const shown = scale(b1, coefficient),
      tip = project(shown);
    const ends = [project(scale(b1, -2.4)), project(scale(b1, 2.4))];
    line(ctx, api, ends[0], ends[1], '#f4d47777', 3);
    arrow(ctx, api, o, project(b1), themeColors.blue, 5);
    const correctionColor = coefficient < 0 ? themeColors.pink : themeColors.yellow;
    if (coefficient !== 0)
      api.focus.target('correction-vector', () => arrow(ctx, api, o, tip, correctionColor, 8));
    api.focus.target('correction-vector', () =>
      circle(ctx, api, tip.x, tip.y, 11, correctionColor),
    );
    text(ctx, api, 'EVERY OUTPUT ON ONE LINE', 170, 285, 30, themeColors.muted);
    text(
      ctx,
      api,
      'x = [' + x.map(num).join(', ') + ']',
      170,
      355,
      28,
      themeColors.cyan,
      'left',
      'mono',
    );
    text(ctx, api, 'a = [1, −1, 0.5]', 170, 410, 28, themeColors.muted, 'left', 'mono');
    api.focus.target('scalar-measurement', () =>
      math(ctx, api, 'a^Tx=c', 1410, 305, 48, themeColors.cyan, 'center'),
    );
    text(ctx, api, 'one measured coefficient', 1410, 365, 30, themeColors.muted, 'center');
    api.teaching.changeCue(
      {
        x: 1220,
        y: 390,
        width: 380,
        height: 75,
        from: 1,
        to: coefficient,
        progress: 1,
        emphasis: current.changing ? 0.65 : 0,
        color: correctionColor,
      },
      () =>
        text(ctx, api, 'c = ' + num(coefficient), 1410, 440, 46, correctionColor, 'center', 'mono'),
    );
    math(ctx, api, '\\Delta Wx=bc', 1410, 535, 48, themeColors.yellow, 'center');
    if (beat === 1)
      math(
        ctx,
        api,
        String.raw`\Delta Wx=${coefficient.toFixed(2)}b_1`,
        1410,
        600,
        34,
        correctionColor,
        'center',
      );
    fade(ctx, api, Math.max(stage(2), Number(api.focus.progress('rank-one-b3-1', 0) > 0)), () => {
      math(ctx, api, '\\Delta W=ba^T', 1410, 650, 46, themeColors.ink, 'center');
      api.focus.target('outer-product', () =>
        matrix(
          ctx,
          api,
          b1.map((value) => a.map((weight) => value * weight)),
          1260,
          700,
          90,
          themeColors.yellow,
        ),
      );
    });
  }
  ctx.restore();
}
export default {
  id: 'rank-one',
  draw: drawRankOne,
  cues: ['rank-one-b1-1', 'rank-one-b2-1', 'rank-one-b3-1'],
};
