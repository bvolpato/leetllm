import { spoken } from '../cue.mjs';
import { surfaceLoss } from '../arithmetic.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, line, rectangle, text } from '../defaults.mjs';
export function drawMidScaleGate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-mid-scale-gate-construction', () => {
    band(ctx, api, 'Example mid-scale trial   ·   10B parameters and 100B tokens');
    const x = 550,
      y = 770,
      scale = 4500;
    line(ctx, api, x, y, 1500, y, themeColors.muted);
    const pred = surfaceLoss(10e9, 100e9),
      obs = 2.35,
      diff = Math.abs(pred - obs),
      err = currentBeat === 0 ? 0 : currentBeat === 2 ? diff : diff * progress;
    rectangle(ctx, api, x, y - 0.02 * scale, 250, 0.02 * scale, themeColors.cyan);
    text(ctx, api, 'Tolerance 0.020', 675, 835, 32, themeColors.cyan, 'center');
    rectangle(ctx, api, 1060, y - err * scale, 250, err * scale, themeColors.pink);
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Observation pending'
        : (currentBeat === 1 && !end ? 'Gap bar drawn ' : 'Absolute residual ') + err.toFixed(3),
      1185,
      835,
      32,
      themeColors.pink,
      'center',
    );
    text(ctx, api, 'Forecast ' + pred.toFixed(3), 960, 370, 40, themeColors.cyan, 'center');
    if (spoken(scene, state, 'gate-observed').phase === 'after')
      text(
        ctx,
        api,
        'Supplied observed ' + obs.toFixed(3),
        960,
        450,
        40,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Throughput = useful tokens ÷ GPU-seconds',
        960,
        520,
        36,
        themeColors.yellow,
        'center',
      );
    }
    result(
      currentBeat === 0
        ? 'Declare loss and throughput gates before the target run'
        : currentBeat === 1
          ? spoken(scene, state, 'gate-hold').phase === 'after'
            ? '0.040 > 0.020 → HOLD the large run'
            : 'Compare the observed gap with the tolerance'
          : 'Investigate the loss gap and profile throughput separately',
    );
  });
}
export default {
  id: 'mid-scale-gate',
  draw: drawMidScaleGate,
  cues: [
    'sl-mid-scale-gate-0',
    'sl-mid-scale-gate-1',
    'sl-mid-scale-gate-2',
    'gate-observed',
    'gate-hold',
  ],
};
