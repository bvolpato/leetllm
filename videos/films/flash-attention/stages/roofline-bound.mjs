import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionCurve,
  drawFlashExtensionDot,
  drawFlashExtensionFooter,
  drawFlashExtensionL,
  drawFlashExtensionNum,
  drawFlashExtensionPlot,
} from '../defaults.mjs';
export function drawRooflineBound(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('roofline-bound', state),
    currentBeat = f.beat,
    progress = f.progress;
  const paint = () => {
    const q = drawFlashExtensionPlot(
      ctx,
      api,
      [0, 600],
      [0, 1100],
      'arithmetic intensity (FLOPs / byte)',
      'throughput bound (TFLOPs/s)',
    );
    drawFlashExtensionCurve(
      ctx,
      api,
      q,
      (x) => Math.min(989.5, 3.35 * x),
      0,
      600,
      themeColors.blue,
    );
    const ridge = 989.5 / 3.35;
    drawFlashExtensionL(
      ctx,
      api,
      [q.point(ridge, 0), q.point(ridge, 989.5)],
      themeColors.yellow,
      3,
    );
    drawFlashExtensionDot(ctx, api, q.point(1, 3.35).x, q.point(1, 3.35).y, themeColors.pink, 11);
    drawFlashExtensionNum(ctx, api, 'Dense ceiling', '989.5 TFLOPs/s', 380);
    drawFlashExtensionNum(
      ctx,
      api,
      'Ridge',
      ridge.toFixed(1) + ' FLOPs/B',
      580,
      themeColors.yellow,
    );
    drawFlashExtensionNum(ctx, api, 'At intensity 1', '3.35 TFLOPs/s', 780, themeColors.pink);
    drawFlashExtensionFooter(
      ctx,
      api,
      'H100 SXM  ·  dense FP16/BF16 tensor-core roof  ·  3.35 TB/s HBM',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('roofline-bound-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'roofline-bound',
  draw: drawRooflineBound,
  cues: ['roofline-bound-beat-1', 'roofline-bound-beat-2', 'fa-ridge', 'roofline-bound-beat-3'],
};
