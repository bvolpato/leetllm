import { built, clamped, cueAmount } from '../arithmetic.mjs';
import { noise, pixels } from '../fixtures.mjs';
import {
  arrow,
  chapterEquation,
  chapterGrid,
  chapterText,
  note,
  plane,
  point,
} from '../defaults.mjs';
export function drawPosteriorContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-posterior-contract-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-posterior-contract-' + id),
    fmt = (v, n = 4) => Number(v.toFixed(n)).toString();
  {
    if (currentBeat === 0) {
      chapterText(ctx, api, 'generative model', 490, 300, 35, themeColors.ink, 'center');
      chapterEquation(ctx, api, 'p(z)\\;p(x\\mid z)', 490, 420, 45, themeColors.green, 'center');
      chapterGrid(ctx, api, pixels, 350, 570, 55);
      chapterText(ctx, api, 'observed crop x', 490, 900, 30, themeColors.cyan, 'center');
      const x = 1120,
        y = 590;
      point(ctx, api, x, y, themeColors.yellow, 13);
      for (let i = 0; i < Math.floor(q * noise.length); i++) {
        const n = noise[i];
        point(ctx, api, x + n.x * 85, y + n.y * 75, themeColors.cyan, 4);
      }
      arrow(ctx, api, 715, 695, 885, 695, themeColors.cyan);
      chapterText(ctx, api, 'one shared encoder', 1120, 335, 35, themeColors.cyan, 'center');
      chapterText(
        ctx,
        api,
        'q(z | x) approximates p(z | x)',
        1120,
        830,
        33,
        themeColors.ink,
        'center',
      );
      note(
        ctx,
        api,
        'Inference conditions on this crop; the same encoder weights serve other crops.',
      );
    } else if (currentBeat === 1) {
      const ax = plane(
        ctx,
        api,
        210,
        370,
        760,
        420,
        [-4, 4],
        [-4, 4],
        'coordinate 1',
        'coordinate 2',
      );
      const amount = q;
      for (const sign of [-1, 1]) {
        const n = Math.floor(noise.length * amount);
        teaching.scatter({
          plot: ax,
          points: noise.slice(0, n).map((v) => ({
            x: sign + v.x,
            y: sign + v.y,
          })),
          color: sign < 0 ? themeColors.pink : themeColors.cyan,
          radius: 4,
        });
      }
      chapterText(ctx, api, 'equal mixture of two crops', 590, 290, 32, themeColors.ink, 'center');
      chapterEquation(
        ctx,
        api,
        '\\Sigma_{\\rm within}=I',
        1400,
        400,
        43,
        themeColors.ink,
        'center',
      );
      chapterEquation(
        ctx,
        api,
        ready('mixture')
          ? '\\Sigma_{\\rm mixture}=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}'
          : '\\Sigma_{\\rm mixture}=?',
        1400,
        630,
        44,
        themeColors.yellow,
        'center',
      );
      note(
        ctx,
        api,
        'Conditional independence belongs to one crop; mixing crop means adds cross-coordinate covariance.',
      );
    } else {
      const vals = [-2, -0.7, 0, 0.1, 2],
        n = Math.max(1, Math.ceil(q * vals.length));
      chapterText(ctx, api, 'log variance ℓ', 400, 315, 32, themeColors.ink, 'center');
      chapterText(ctx, api, 'variance exp(ℓ)', 950, 315, 32, themeColors.green, 'center');
      chapterText(
        ctx,
        api,
        'standard deviation exp(ℓ/2)',
        1510,
        315,
        32,
        themeColors.cyan,
        'center',
      );
      vals.slice(0, n).forEach((l, i) => {
        const y = 420 + i * 90;
        chapterText(ctx, api, String(l), 400, y, 32, themeColors.ink, 'center');
        arrow(ctx, api, 570, y - 10, 710, y - 10, themeColors.muted);
        chapterText(ctx, api, fmt(Math.exp(l)), 950, y, 32, themeColors.green, 'center');
        arrow(ctx, api, 1130, y - 10, 1260, y - 10, themeColors.muted);
        chapterText(ctx, api, fmt(Math.exp(l / 2)), 1510, y, 32, themeColors.cyan, 'center');
      });
      note(
        ctx,
        api,
        'Check finite usable scales and gradients; finite log variance can exponentiate to zero or infinity.',
      );
    }
  }
}
export default {
  id: 'posterior-contract',
  draw: drawPosteriorContract,
  cues: [
    'vae-posterior-contract-0-build',
    'vae-posterior-contract-1-build',
    'vae-posterior-contract-mixture',
    'vae-posterior-contract-2-build',
  ],
};
