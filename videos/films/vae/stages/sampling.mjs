import { eps } from '../fixtures.mjs';
import { priorDecodeFrame, reparameterizationFrame } from '../model.mjs';
import { cloud, equation, latentPlane, pixelGrid, text } from '../defaults.mjs';
export function drawSampling(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.12, 0.86),
    F = components.fade;
  {
    const q = latentPlane(ctx, api),
      frame = reparameterizationFrame(currentBeat, progress2, state.cues),
      m = frame.mean,
      scale = frame.scale,
      result = frame.sample;
    const at0 = q.point(eps[0], eps[1]);
    const at = q.point(result[0], result[1]);
    cloud(ctx, api, q, m, scale, currentBeat === 2 ? themeColors.muted : themeColors.cyan, 0.35);
    if (currentBeat < 2)
      api.focus.target('fixed-noise-point', () =>
        api.circle(ctx, at0.x, at0.y, 10, themeColors.muted),
      );
    if (currentBeat === 2) {
      const reveal = api.focus.progress('prior-decoded-output-b3-2', phaseForBeat(2)),
        decoded = priorDecodeFrame(reveal, result),
        point = q.point(...decoded.latent),
        origin = q.point(0, 0);
      api.focus.target('prior-sample-point', () => {
        api.circle(ctx, point.x, point.y, 8, themeColors.yellow);
        api.arrow(ctx, origin.x, origin.y, point.x, point.y, themeColors.yellow, 5);
      });
      api.arrow(ctx, point.x + 18, point.y, 1180, 530, themeColors.green, 4);
      if (reveal > 0)
        components.particle({
          points: [
            {
              x: point.x + 28,
              y: point.y,
            },
            {
              x: 1152,
              y: 530,
            },
          ],
          progress: reveal,
          radius: 8,
          fill: themeColors.green,
        });
      api.focus.target('prior-decoder', () =>
        equation(ctx, api, 'D(z)', 1280, 530, 52, themeColors.green, 'center'),
      );
      text(ctx, api, 'same prior draw', 1280, 600, 27, themeColors.muted, 'center');
      text(ctx, api, 'decoded 5 × 5 output', 1580, 390, 28, themeColors.green, 'center');
      api.focus.target('prior-decoded-output', () =>
        pixelGrid(
          ctx,
          api,
          decoded.pixels.map((value, index) =>
            api.lerp(0.08, value, api.clamp(decoded.reveal * 25 - index)),
          ),
          1450,
          430,
          52,
        ),
      );
    } else {
      api.focus.target('reparameterized-point', () =>
        api.circle(ctx, at.x, at.y, 14, themeColors.yellow),
      );
      text(
        ctx,
        api,
        'current z ≈ [' + result.map((v) => v.toFixed(3)).join(', ') + ']',
        1400,
        600,
        31,
        themeColors.ink,
        'center',
      );
      api.focus.target('encoder-mean', () =>
        text(
          ctx,
          api,
          'mean [' + m.map((v) => v.toFixed(2)).join(', ') + ']',
          1400,
          700,
          28,
          themeColors.cyan,
          'center',
        ),
      );
      api.focus.target('encoder-scale', () =>
        text(
          ctx,
          api,
          'scale [' + scale.map((v) => v.toFixed(2)).join(', ') + ']',
          1400,
          755,
          28,
          themeColors.green,
          'center',
        ),
      );
    }
    api.focus.target('reparameterization-rule', () =>
      equation(
        ctx,
        api,
        currentBeat === 2
          ? String.raw`z=[${result.map((value) => value.toFixed(2)).join(',')}]\sim\mathcal N(0,I)`
          : String.raw`z=\mu+\sigma\odot\epsilon`,
        currentBeat === 2 ? 1280 : 1400,
        currentBeat === 2 ? 340 : 420,
        currentBeat === 2 ? 36 : 56,
        themeColors.yellow,
        'center',
      ),
    );
    text(ctx, api, frame.stage, 960, 940, 29, themeColors.yellow, 'center');
    if (currentBeat === 1)
      equation(
        ctx,
        api,
        !frame.changingScale
          ? String.raw`\frac{\partial z_i}{\partial\mu_i}=1`
          : String.raw`\frac{\partial z_i}{\partial\sigma_i}=\epsilon_i`,
        1400,
        850,
        39,
        themeColors.cyan,
        'center',
      );
  }
}
export default {
  id: 'sampling',
  draw: drawSampling,
  cues: [
    'noise-scale',
    'noise-shift',
    'encoder-mean-b2-1',
    'encoder-scale-b2-2',
    'prior-sample-point-b3-1',
    'prior-decoded-output-b3-2',
  ],
};
