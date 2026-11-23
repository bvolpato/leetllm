import { IMAGE, KERNEL } from '../fixtures.mjs';
import { scanSnapshot } from '../construction.mjs';
import {
  cellOutline,
  cueProgress,
  equation,
  featureGrid,
  imageGrid,
  sharedKernel,
  text,
} from '../defaults.mjs';
export function drawSlide(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  const fade = components.fade;
  ctx.save();
  {
    const sweep = currentBeat === 0 ? cueProgress(ctx, api, 'sliding-sweep', stage(0)) : 1;
    const brightReady = currentBeat > 0 || cueProgress(ctx, api, 'bright-window-result', 0) >= 1;
    const f = scanSnapshot(IMAGE, KERNEL, sweep),
      selected = sweep > 0 ? f.active : [0, 2];
    const values = f.result.map((row, r) =>
      row.map((value, col) =>
        r * 3 + col < f.count || (r === 0 && col === 0) || (r === 0 && col === 2 && brightReady)
          ? value
          : '?',
      ),
    );
    const inputCells = api.focus.target('sliding-window', () =>
      imageGrid(ctx, api, IMAGE, 230, 350, 100, {
        selected,
      }),
    );
    const weights = sharedKernel(ctx, api);
    cellOutline(ctx, api, weights[2], themeColors.cyan);
    if (sweep > 0)
      cellOutline(ctx, api, inputCells[selected[0] * 5 + selected[1] + 2], themeColors.cyan);
    text(ctx, api, 'same w(0,2) = +1', 960, 755, 26, themeColors.cyan, 'center');
    api.focus.target('constructed-feature-map', () =>
      featureGrid(ctx, api, values, 1250, 430, 110, {
        active: sweep > 0 ? f.output[0] * 3 + f.output[1] : 2,
      }),
    );
    api.arrow(ctx, 820, 680, 1180, 680, themeColors.green, 5);
    equation(ctx, api, '5-3+1=3', 960, 990, 48, themeColors.ink);
  }
  ctx.restore();
}
export default {
  id: 'slide',
  draw: drawSlide,
  cues: ['bright-window-result', 'sliding-sweep', 'map-complete'],
};
