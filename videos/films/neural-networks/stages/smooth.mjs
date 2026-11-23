import { activations } from '../fixtures.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  axes,
  curve,
  dot,
  equation,
  focusTarget,
  formatNumber,
  head,
  note,
  text,
} from '../defaults.mjs';
export function drawSmooth(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'smooth-mechanism', () => {
    const z = currentBeat === 0 ? -1.8 + 4 * cueProgress('relu-crossing', 0) : -1,
      plot = axes(ctx, api, {
        x: 260,
        y: 365,
        width: 940,
        height: 450,
        xDomain: [-3.2, 3.2],
        yDomain: [-0.6, 3.2],
        xTicks: [-3, -1, 0, 1, 3],
        yTicks: [0, 1, 2, 3],
        xLabel: 'pre-activation',
        yLabel: 'activation',
      });
    head(
      ctx,
      api,
      currentBeat === 0
        ? 'Cross the actual ReLU gate'
        : 'Magnify the negative branch around z = −1',
    );
    [
      ['ReLU', themeColors.yellow],
      ['GELU', themeColors.cyan],
      ['SiLU', themeColors.pink],
    ].forEach(([key, col]) => {
      if (key === 'ReLU' || currentBeat > 0) {
        focusTarget(ctx, api, key.toLowerCase() + '-curve', () =>
          curve(ctx, api, plot, activations[key].value, -3, 3, col),
        );
        const q = plot.point(z, activations[key].value(z));
        dot(ctx, api, q.x, q.y, col);
      }
    });
    focusTarget(ctx, api, 'activation-slopes', () => {
      if (currentBeat === 0) {
        text(
          ctx,
          api,
          z < 0 ? 'gate blocks this path' : 'gate passes this path',
          1510,
          540,
          32,
          z < 0 ? themeColors.muted : themeColors.yellow,
          'center',
        );
        text(
          ctx,
          api,
          'slope ' + activations.ReLU.derivative(z),
          1510,
          680,
          38,
          themeColors.yellow,
          'center',
        );
      } else {
        const zoom = axes(ctx, api, {
          x: 1370,
          y: 450,
          width: 340,
          height: 250,
          xDomain: [-1.5, -0.5],
          yDomain: [-0.3, 0.08],
          xTicks: [-1.5, -1, -0.5],
          yTicks: [-0.2, 0],
          xLabel: 'negative input',
          fontSize: 22,
        });
        [
          ['ReLU', themeColors.yellow],
          ['GELU', themeColors.cyan],
          ['SiLU', themeColors.pink],
        ].forEach(([key, col], i) => {
          curve(ctx, api, zoom, activations[key].value, -1.5, -0.5, col);
          text(
            ctx,
            api,
            key + ' slope ' + formatNumber(ctx, api, activations[key].derivative(-1)),
            1530,
            805 + i * 55,
            26,
            col,
            'center',
          );
        });
      }
    });
    equation(
      ctx,
      api,
      currentBeat === 0
        ? String.raw`\operatorname{ReLU}(z)=\max(0,z)`
        : String.raw`\operatorname{GELU}(z)=z\Phi(z),\quad\operatorname{SiLU}(z)=z\sigma(z)`,
      960,
      955,
      40,
      themeColors.ink,
    );
    note(ctx, api, 'A negative output does not determine the derivative sign.');
    return;
  });
}
export default {
  id: 'smooth',
  draw: drawSmooth,
  cues: ['relu-crossing', 'smooth-negative'],
};
