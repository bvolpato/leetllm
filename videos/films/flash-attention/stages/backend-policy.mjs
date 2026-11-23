import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionL,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawBackendPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('backend-policy', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    const names = ['Actual-input eligibility', 'Restricted execution', 'Measured workload'];
    names.forEach((name, i) => {
      const x = 200 + i * 560;
      drawFlashExtensionRectangle(ctx, api, x, 430, 470, 170, themeColors.panel, colors[i]);
      drawFlashExtensionText(ctx, api, name, x + 235, 495, 30, colors[i], 'center');
      drawFlashExtensionText(
        ctx,
        api,
        i === 0
          ? 'actual mask / dtype / shape'
          : i === 1 && currentBeat === 1
            ? 'OOM propagates'
            : i === 2
              ? 'warm up, sync, repeat'
              : 'completed permitted path',
        x + 235,
        555,
        25,
        themeColors.ink,
        'center',
      );
      if (i < 2)
        drawFlashExtensionL(
          ctx,
          api,
          [
            {
              x: x + 480,
              y: 515,
            },
            {
              x: x + 540,
              y: 515,
            },
          ],
          themeColors.muted,
          4,
        );
    });
    if (currentBeat === 1)
      drawFlashExtensionText(
        ctx,
        api,
        'Handle an out-of-memory error at the failed call',
        960,
        790,
        34,
        themeColors.pink,
        'center',
      );
    else
      drawFlashExtensionText(
        ctx,
        api,
        'Use the profiler trace to identify the kernel that ran',
        960,
        790,
        34,
        themeColors.yellow,
        'center',
      );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('backend-policy-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'backend-policy',
  draw: drawBackendPolicy,
  cues: [
    'backend-policy-beat-1',
    'backend-policy-beat-2',
    'fa-execution-error',
    'backend-policy-beat-3',
    'backend-policy-beat-4',
  ],
};
