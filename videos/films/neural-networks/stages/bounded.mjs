import { activations } from '../fixtures.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  arrow,
  axes,
  curve,
  dot,
  equation,
  focusTarget,
  formatNumber,
  head,
  line,
  note,
  text,
} from '../defaults.mjs';
export function drawBounded(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'bounded-mechanism', () => {
    head(ctx, api, 'The same local tangent scales the incoming learning signal');
    const z = currentBeat === 0 ? -4 + 8 * cueProgress('bounded-sweep', 0) : 4,
      plot = axes(ctx, api, {
        x: 280,
        y: 380,
        width: 980,
        height: 410,
        xDomain: [-4.3, 4.3],
        yDomain: [-1.2, 1.2],
        xTicks: [-4, 0, 4],
        yTicks: [-1, 0, 1],
        xLabel: 'pre-activation z',
        yLabel: 'output',
      });
    [
      ['sigmoid', themeColors.blue],
      ['tanh', themeColors.cyan],
    ].forEach(([key, col], i) => {
      focusTarget(ctx, api, key + '-curve', () => {
        const a = activations[key],
          value = a.value(z),
          slope = a.derivative(z);
        curve(ctx, api, plot, a.value, -4, 4, col);
        const lo = Math.max(-4, z - 0.6),
          hi = Math.min(4, z + 0.6);
        line(
          ctx,
          api,
          ...Object.values(plot.point(lo, value + slope * (lo - z))),
          ...Object.values(plot.point(hi, value + slope * (hi - z))),
          themeColors.yellow,
          5,
        );
        const q = plot.point(z, value);
        dot(ctx, api, q.x, q.y, col);
      });
      const derivative = activations[key].derivative(z),
        yy = 410 + i * 250;
      text(ctx, api, key, 1510, yy, 35, col, 'center');
      text(
        ctx,
        api,
        'slope ' + formatNumber(ctx, api, derivative),
        1510,
        yy + 65,
        32,
        col,
        'center',
      );
      const yy2 = yy + 125;
      arrow(ctx, api, 1300, yy2, 1710, yy2, themeColors.muted, 2);
      line(ctx, api, 1320, yy2, 1320 + 350 * derivative, yy2, col, 12);
      text(
        ctx,
        api,
        'incoming 1 → ' + formatNumber(ctx, api, derivative),
        1510,
        yy2 + 55,
        28,
        col,
        'center',
      );
    });
    focusTarget(ctx, api, 'tail-gradients', () =>
      equation(
        ctx,
        api,
        String.raw`g_{\rm earlier}=g_{\rm later}\,a\prime(z)`,
        960,
        950,
        45,
        themeColors.yellow,
      ),
    );
    note(
      ctx,
      api,
      'Small local slopes weaken this branch; other weights and operations also contribute.',
    );
    return;
  });
}
export default {
  id: 'bounded',
  draw: drawBounded,
  cues: ['bounded-sweep', 'tail-slope'],
};
