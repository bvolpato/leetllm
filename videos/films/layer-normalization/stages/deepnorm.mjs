import { motion } from '../timing.mjs';
import { deepNormTrace } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawDeepnorm(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    fade = components.fade;
  {
    const d = deepNormTrace();
    text(
      ctx,
      api,
      `Decoder-only example · N = ${d.layers} layers`,
      960,
      275,
      32,
      themeColors.muted,
      'center',
    );
    if (currentBeat === 0) {
      const q = api.phase(progress, 0.12, 0.58),
        values = d.skip.map((v, i) => v + q * d.branch[i]);
      equation(
        ctx,
        api,
        String.raw`\alpha=(2N)^{1/4}\approx ${d.alpha.toFixed(3)}`,
        960,
        360,
        52,
        themeColors.yellow,
        'center',
      );
      d.skip.forEach((v, i) => {
        const xx = 400 + i * 390,
          top = 625 - Math.max(v, 0) * 14;
        api.rect(ctx, xx - 65, top, 130, Math.abs(v) * 14, themeColors.blue);
        text(ctx, api, v.toFixed(2), xx, top - 35, 34, themeColors.blue, 'center');
        api.arrow(ctx, xx, 670, xx, 735, themeColors.yellow, 4);
        text(
          ctx,
          api,
          (d.branch[i] >= 0 ? '+' : '') + d.branch[i].toFixed(2),
          xx + 135,
          710,
          31,
          themeColors.pink,
          'center',
        );
        text(ctx, api, values[i].toFixed(3), xx, 805, 38, themeColors.yellow, 'center');
      });
      text(
        ctx,
        api,
        'scaled skip + branch → normalize the completed sum',
        960,
        930,
        38,
        themeColors.ink,
        'center',
      );
      if (progress > 0.65)
        text(
          ctx,
          api,
          'LN output: ' + d.output.map((v) => v.toFixed(3)).join('     '),
          960,
          1010,
          32,
          themeColors.green,
          'center',
        );
    } else {
      equation(
        ctx,
        api,
        String.raw`\beta=(8N)^{-1/4}\approx ${d.beta.toFixed(3)}`,
        960,
        370,
        52,
        themeColors.pink,
        'center',
      );
      const q = api.phase(progress, 0.05, 0.35),
        width = 620 * (1 - q + q * d.beta);
      api.rect(ctx, 960 - width / 2, 480, width, 110, themeColors.pink);
      text(
        ctx,
        api,
        'selected branch weight initialization',
        960,
        640,
        33,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        `variance multiplier β² ≈ ${(d.beta ** 2).toFixed(4)}`,
        960,
        720,
        35,
        themeColors.yellow,
        'center',
      );
      equation(
        ctx,
        api,
        String.raw`x_{l+1}=\operatorname{LN}(\alpha x_l+G_l(x_l))`,
        960,
        845,
        57,
        themeColors.ink,
        'center',
      );
      const trained = motion(state, 'trained-write', 1, 0.60, 0.68) > 0;
      api.focus.target('forward-write', () => text(
        ctx,
        api,
        trained ? 'Trained branch writes  +2      →      add 2 at that coordinate, then normalize the vector' : 'Initialization gain β on FFN and attention V/O weights     ·     Q/K gain 1',
        960,
        1010,
        32,
        themeColors.green,
        'center',
      ));
    }
    return;
  }
}
export default {
  id: 'deepnorm',
  draw: drawDeepnorm,
  cues: ['trained-write'],
};
