import { posteriorFrame } from '../model.mjs';
import { box, cloud, equation, pixelGrid, text } from '../defaults.mjs';
export function drawPosterior(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    F = components.fade;
  const vector = (values) => '[' + values.map((value) => Number(value.toFixed(4))).join(', ') + ']';
  {
    const frame = posteriorFrame(currentBeat, progress2, state.cues);
    const input = api.groupBounds(
      ...api.focus.target('posterior-input', () => pixelGrid(ctx, api, frame.input, 190, 385, 72)),
    );
    text(
      ctx,
      api,
      frame.inputMix > 0.5 ? 'lower crop' : 'badge crop',
      370,
      315,
      34,
      themeColors.cyan,
      'center',
    );
    const encoder = box(
      ctx,
      api,
      ['supplied encoder', 'mean / log variance'],
      640,
      470,
      330,
      150,
      themeColors.yellow,
      26,
    );
    api.connect(ctx, input, encoder, {
      color: themeColors.cyan,
      width: 4,
    });
    const q = teaching.axes({
      x: 1090,
      y: 375,
      width: 650,
      height: 400,
      xDomain: [-3, 3],
      yDomain: [-3, 3],
      equalUnits: true,
      xTicks: [-2, 0, 2],
      yTicks: [-2, 0, 2],
      xLabel: 'latent coordinate 1',
      yLabel: 'latent coordinate 2',
      fontSize: 29,
    });
    cloud(ctx, api, q, [0, 0], [1, 1], themeColors.muted, 0.35);
    api.focus.target('latent-posterior-cloud', () => {
      cloud(ctx, api, q, frame.mean, frame.scale, themeColors.cyan);
      const at = q.point(...frame.mean);
      api.circle(ctx, at.x, at.y, 10, themeColors.yellow);
    });
    text(
      ctx,
      api,
      'gray: prior   cyan: input-conditioned posterior',
      1415,
      300,
      27,
      themeColors.muted,
      'center',
    );
    text(ctx, api, 'mean ' + vector(frame.mean), 1415, 900, 31, themeColors.cyan, 'center');
    if (currentBeat < 2)
      equation(
        ctx,
        api,
        String.raw`q(z\mid x)=\mathcal N(\mu(x),\mathrm{diag}(\sigma^2(x)))`,
        960,
        975,
        39,
        themeColors.ink,
        'center',
      );
    else
      api.focus.target('standard-deviation-transform', () => {
        text(
          ctx,
          api,
          'first log variance = ' + frame.logVariance[0].toFixed(2),
          540,
          850,
          30,
          themeColors.yellow,
          'center',
        );
        equation(
          ctx,
          api,
          String.raw`\sigma_1=\exp(\tfrac12\log\sigma_1^2)`,
          540,
          930,
          40,
          themeColors.yellow,
          'center',
        );
        text(
          ctx,
          api,
          'first width = ' + frame.scale[0].toFixed(3),
          1415,
          975,
          32,
          themeColors.green,
          'center',
        );
      });
  }
}
export default {
  id: 'posterior',
  draw: drawPosterior,
  cues: ['posterior-select', 'posterior-other', 'posterior-return', 'posterior-scale'],
};
