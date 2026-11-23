import { opProgress } from '../construction.mjs';
import { forwardValue } from '../arithmetic.mjs';
import { TOP_PIXEL } from '../fixtures.mjs';
import { image, imageNoise } from '../model.mjs';
import { decimal } from '../pixel-study.mjs';
import {
  drawOriginalMath,
  drawOriginalRect,
  drawOriginalTarget,
  drawOriginalText,
  drawOriginalTile,
} from '../defaults.mjs';
function paintForward(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    const alpha =
      beat === 0
        ? api.lerp(1, 0.35, stage(0))
        : beat === 1
          ? api.lerp(0.35, 0.001, stage(1))
          : api.lerp(0.001, 0.9, api.phase(progress, 0.05, 0.42)) -
            0.4 * api.phase(progress, 0.55, 0.9);
    api.focus.target('forward-forward-tile', () =>
      drawOriginalTile(ctx, api, 145, 330, 500, alpha),
    );
    drawOriginalText(
      ctx,
      api,
      'same image · same noise draw',
      395,
      285,
      29,
      themeColors.muted,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      `Marked pixel   ${decimal(forwardValue(image[TOP_PIXEL], imageNoise[TOP_PIXEL], alpha))}`,
      395,
      900,
      30,
      themeColors.cyan,
      'center',
    );
    api.focus.target('forward-clean', () => drawOriginalTile(ctx, api, 835, 360, 240, 1, 'clean'));
    api.focus.target('forward-noise', () => drawOriginalTile(ctx, api, 1395, 360, 240, 0, 'noise'));
    drawOriginalText(ctx, api, 'clean signal', 955, 655, 32, themeColors.cyan, 'center');
    drawOriginalText(ctx, api, 'Gaussian noise', 1515, 655, 32, themeColors.yellow, 'center');
    drawOriginalText(ctx, api, '+', 1235, 500, 60, themeColors.ink, 'center');
    const signal = Math.sqrt(alpha),
      noise = Math.sqrt(1 - alpha);
    drawOriginalTarget(ctx, api, 'forward-signal-strength', () => {
      drawOriginalRect(ctx, api, 825, 730, 275, 38, '#233752', undefined, 5);
      drawOriginalRect(ctx, api, 825, 730, 275 * signal, 38, themeColors.cyan, undefined, 5);
    });
    drawOriginalTarget(ctx, api, 'forward-noise-strength', () => {
      drawOriginalRect(ctx, api, 1385, 730, 275, 38, '#233752', undefined, 5);
      drawOriginalRect(ctx, api, 1385, 730, 275 * noise, 38, themeColors.yellow, undefined, 5);
    });
    drawOriginalMath(ctx, api, String.raw`\sqrt{\bar\alpha_t}`, 962, 835, 42, themeColors.cyan);
    drawOriginalMath(
      ctx,
      api,
      String.raw`\sqrt{1-\bar\alpha_t}`,
      1522,
      835,
      42,
      themeColors.yellow,
    );
    drawOriginalText(
      ctx,
      api,
      `retained variance  ${alpha.toFixed(3)}`,
      1240,
      940,
      32,
      themeColors.muted,
      'center',
    );
  }
  ctx.restore();
}
export function drawForward(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintForward(
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
  id: 'forward',
  draw: drawForward,
  cues: [
    'forward-add-noise',
    'forward-edges-fade',
    'df-forward-0',
    'forward-sweep',
    'forward-retained-signal',
    'df-forward-1',
    'forward-beat-3-focus-1',
    'forward-beat-3-focus-2',
    'df-forward-2',
  ],
};
