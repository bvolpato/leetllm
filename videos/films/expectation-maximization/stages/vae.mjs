import { gammaDensity } from '../arithmetic.mjs';
import { constructedFrame } from '../construction.mjs';
import { boundGeometry, responsibilitiesAt50 } from '../model.mjs';
import {
  drawConstructedCurve,
  drawConstructedHead,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
export function drawVae(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    colors = [themeColors.blue, themeColors.pink],
    teaching = boundGeometry();
  const shares = (values, x, y, w = 1100, h = 70) => {
    let left = x;
    values.forEach((v, i) => {
      api.rect(ctx, left, y, w * v, h, colors[i]);
      if (v * w > 100)
        drawConstructedText(
          ctx,
          api,
          v.toFixed(4),
          left + (w * v) / 2,
          y + h * 0.68,
          30,
          themeColors.bg,
          'center',
        );
      left += w * v;
    });
  };
  api.focus.target('vae-operation', () => {
    drawConstructedHead(ctx, api, 'Exact discrete membership and an approximate continuous family');
    drawConstructedText(
      ctx,
      api,
      'GMM: exact posterior for 50 ms',
      960,
      365,
      34,
      themeColors.blue,
      'center',
    );
    shares(responsibilitiesAt50, 410, 430, 1100, 70);
    if (currentBeat > 0) {
      const p = drawConstructedPlot(
        ctx,
        api,
        300,
        675,
        900,
        220,
        [-3, 5],
        [0, 0.25],
        'continuous latent z',
        'illustrative q density',
        [-3, 1, 5],
        [0, 0.2],
      );
      drawConstructedCurve(ctx, api, p, (x) => gammaDensity(x, 1, 4), -3, 5, themeColors.pink, 4);
      drawConstructedText(
        ctx,
        api,
        'Learned encoder posterior family',
        1510,
        730,
        30,
        themeColors.pink,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        'Joint ELBO gradients',
        1510,
        840,
        31,
        themeColors.pink,
        'center',
      );
    } else
      drawConstructedText(
        ctx,
        api,
        'Exact memberships feed the weighted Gaussian M-step.',
        960,
        780,
        35,
        themeColors.blue,
        'center',
      );
    drawConstructedNote(
      ctx,
      api,
      'The encoder curve is an illustrative family,not a measured or exact nonlinear-model posterior.',
    );
  });
}
export default {
  id: 'vae',
  draw: drawVae,
  cues: [
    'vae-beat-1-focus-1',
    'vae-weighted-m-step',
    'vae-beat-2-focus-1',
    'vae-joint-elbo-training',
    'vae-beat-3-focus-1',
    'vae-encoder-recap',
    'vae-em-recap',
  ],
};
