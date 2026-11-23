import { opProgress } from '../construction.mjs';
import {
  drawOriginalArrow,
  drawOriginalCircle,
  drawOriginalLine,
  drawOriginalMath,
  drawOriginalSpoken,
  drawOriginalTarget,
  drawOriginalText,
} from '../defaults.mjs';
function paintGuidance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    const w =
      beat < 1
        ? 0
        : beat > 1
          ? 3
          : drawOriginalSpoken(ctx, api, 'guidance-add-scaled', api.phase(progress, 0.36, 0.64)) +
            2 *
              drawOriginalSpoken(ctx, api, 'guidance-extrapolate', api.phase(progress, 0.81, 0.96));
    const origin = {
        x: 530,
        y: 465,
      },
      u = [0.2, -0.1],
      c = [0.05, -0.35],
      scale = 480;
    const screen = (v) => ({
      x: origin.x + v[0] * scale,
      y: origin.y - v[1] * scale,
    });
    const un = screen(u),
      cond = screen(c),
      guided = screen(u.map((v, i) => v + w * (c[i] - v)));
    drawOriginalLine(ctx, api, 180, origin.y, 1100, origin.y, '#8d9cb955', 2);
    drawOriginalLine(ctx, api, origin.x, 900, origin.x, 300, '#8d9cb955', 2);
    api.focus.target('guidance-unconditional-vector', () =>
      drawOriginalArrow(ctx, api, origin.x, origin.y, un.x, un.y, themeColors.blue, 5),
    );
    drawOriginalCircle(ctx, api, un.x, un.y, 8, themeColors.blue);
    api.focus.target('guidance-conditional-vector', () =>
      drawOriginalArrow(ctx, api, origin.x, origin.y, cond.x, cond.y, themeColors.cyan, 5),
    );
    drawOriginalCircle(ctx, api, cond.x, cond.y, 8, themeColors.cyan);
    drawOriginalTarget(ctx, api, 'guidance-difference', () =>
      drawOriginalArrow(ctx, api, un.x, un.y, cond.x, cond.y, themeColors.yellow, 3),
    );
    drawOriginalText(ctx, api, 'w = 1', cond.x + 100, cond.y + 55, 24, themeColors.cyan, 'center');
    if (w > 0.001)
      drawOriginalArrow(ctx, api, un.x, un.y, guided.x, guided.y, themeColors.yellow, 6);
    api.focus.target('guidance-guided-vector', () =>
      drawOriginalCircle(ctx, api, guided.x, guided.y, 10, themeColors.yellow, themeColors.bg, 3),
    );
    drawOriginalText(ctx, api, 'noise coordinate 1', 850, 790, 28, themeColors.muted, 'center');
    drawOriginalText(ctx, api, 'unconditional', 1220, 340, 31, themeColors.blue);
    drawOriginalText(ctx, api, 'conditional', 1220, 405, 31, themeColors.cyan);
    drawOriginalText(ctx, api, 'guided', 1220, 470, 31, themeColors.yellow);
    drawOriginalText(ctx, api, '(0.20, −0.10)', 1770, 340, 27, themeColors.blue, 'right');
    drawOriginalText(ctx, api, '(0.05, −0.35)', 1770, 405, 27, themeColors.cyan, 'right');
    drawOriginalText(
      ctx,
      api,
      `(${(u[0] + w * (c[0] - u[0])).toFixed(2)}, ${(u[1] + w * (c[1] - u[1])).toFixed(2)})`,
      1770,
      470,
      27,
      themeColors.yellow,
      'right',
    );
    drawOriginalText(ctx, api, `w = ${w.toFixed(2)}`, 1450, 590, 50, themeColors.yellow, 'center');
    drawOriginalMath(
      ctx,
      api,
      String.raw`\hat\epsilon=\epsilon_u+w(\epsilon_c-\epsilon_u)`,
      960,
      265,
      46,
    );
    drawOriginalText(
      ctx,
      api,
      'two noise-prediction coordinates',
      590,
      980,
      28,
      themeColors.muted,
      'center',
    );
    fade(stage(2), () => {
      drawOriginalText(
        ctx,
        api,
        'evaluate across prompts',
        1460,
        735,
        30,
        themeColors.ink,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'alignment · diversity · artifacts',
        1460,
        810,
        29,
        themeColors.muted,
        'center',
      );
    });
  }
  ctx.restore();
}
export function drawGuidance(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintGuidance(
    ctx,
    scene,
    {
      ...state,
      beatP: p,
    },
    api,
  );
}
export default {
  id: 'guidance',
  draw: drawGuidance,
  cues: [
    'guidance-beat-1-focus-1',
    'df-guidance-0',
    'guidance-difference',
    'guidance-add-scaled',
    'guidance-unit-scale',
    'guidance-extrapolate',
    'df-guidance-1',
    'guidance-beat-3-focus-1',
    'df-guidance-2',
  ],
};
