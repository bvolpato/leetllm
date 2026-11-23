import { opProgress } from '../construction.mjs';
import { MAX_ADDED_VARIANCE } from '../fixtures.mjs';
import {
  drawOriginalField,
  drawOriginalMath,
  drawOriginalSpoken,
  drawOriginalText,
  drawOriginalTile,
} from '../defaults.mjs';
function paintTransport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress2, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    const progress =
      beat === 0
        ? 0.74 * stage(0)
        : beat === 1
          ? 0.74 + 0.26 * drawOriginalSpoken(ctx, api, 'transport-beat-2-focus-2', stage(1))
          : 1;
    api.focus.target('transport-transport-field', () =>
      drawOriginalField(
        ctx,
        api,
        150,
        310,
        1050,
        progress,
        {
          trails: true,
        },
        () => [-2.8 + stage(1) * 4.9, 0.75],
      ),
    );
    drawOriginalText(
      ctx,
      api,
      'one rule · different starting points',
      675,
      270,
      31,
      themeColors.cyan,
      'center',
    );
    drawOriginalMath(
      ctx,
      api,
      String.raw`\frac{dx}{du}=-\frac12\nabla_x\log p_u(x)`,
      1510,
      415,
      40,
    );
    drawOriginalText(
      ctx,
      api,
      'added variance decreases',
      1510,
      510,
      31,
      themeColors.yellow,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      `u = ${(MAX_ADDED_VARIANCE * (1 - progress)).toFixed(2)}`,
      1510,
      605,
      47,
      themeColors.ink,
      'center',
    );
    api.focus.target('transport-transport-tile', () =>
      drawOriginalTile(ctx, api, 1415, 680, 190, progress),
    );
    drawOriginalText(
      ctx,
      api,
      'same table + fixed noise',
      1510,
      925,
      27,
      themeColors.cyan,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'white ring P0 · toy exact-score sampler',
      675,
      1020,
      29,
      themeColors.yellow,
      'center',
    );
    drawOriginalText(ctx, api, 'pixel-mixture analogy', 1510, 990, 27, themeColors.muted, 'center');
  }
  ctx.restore();
}
export function drawTransport(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintTransport(
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
  id: 'transport',
  draw: drawTransport,
  cues: [
    'transport-beat-1-focus-1',
    'df-transport-0',
    'transport-beat-2-focus-1',
    'transport-beat-2-focus-2',
    'df-transport-1',
    'transport-beat-3-focus-1',
    'transport-beat-3-focus-2',
    'df-transport-2',
  ],
};
