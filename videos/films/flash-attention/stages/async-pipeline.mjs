import { flashExtensionFrame, tilePipelinePrefix } from '../model.mjs';
import {
  drawFlashExtensionFooter,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawAsyncPipeline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('async-pipeline', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    let steps =
      currentBeat === 0
        ? 2
        : currentBeat === 1
          ? f.started('fa-release-a', false)
            ? f.go('fa-release-a') === 1
              ? 6
              : 5
            : f.started('fa-copy-b', false)
              ? f.go('fa-copy-b') === 1
                ? 5
                : 4
              : f.started('fa-read-a', false)
                ? f.go('fa-read-a') === 1
                  ? 3
                  : 2
                : f.started('fa-copy-a', false)
                  ? 1
                  : 0
          : 8;
    const model = tilePipelinePrefix(steps);
    for (const [i, key] of ['A', 'B'].entries()) {
      const s = model.slots[key],
        x = 380 + i * 770;
      drawFlashExtensionRectangle(
        ctx,
        api,
        x,
        400,
        500,
        250,
        themeColors.panel,
        s.status === 'free'
          ? themeColors.muted
          : s.status === 'reading'
            ? themeColors.yellow
            : themeColors.cyan,
      );
      drawFlashExtensionText(ctx, api, 'Slot ' + key, x + 250, 365, 37, colors[i], 'center');
      drawFlashExtensionText(
        ctx,
        api,
        s.tile === null ? 'free' : 'K/V tile ' + s.tile,
        x + 250,
        490,
        39,
        s.status === 'reading' ? themeColors.yellow : themeColors.cyan,
        'center',
      );
      drawFlashExtensionText(ctx, api, s.status, x + 250, 585, 34, themeColors.ink, 'center');
    }
    drawFlashExtensionText(
      ctx,
      api,
      'Last event: ' + (model.events.at(-1)?.kind ?? 'await copy issue'),
      960,
      780,
      38,
      themeColors.yellow,
      'center',
    );
    drawFlashExtensionText(
      ctx,
      api,
      'Copy complete → safe to read',
      960,
      900,
      36,
      themeColors.pink,
      'center',
    );
    drawFlashExtensionFooter(
      ctx,
      api,
      'Consumers release slot → safe to overwrite',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('async-pipeline-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'async-pipeline',
  draw: drawAsyncPipeline,
  cues: [
    'async-pipeline-beat-1',
    'async-pipeline-beat-2',
    'fa-copy-a',
    'fa-read-a',
    'fa-copy-b',
    'fa-release-a',
    'async-pipeline-beat-3',
  ],
};
