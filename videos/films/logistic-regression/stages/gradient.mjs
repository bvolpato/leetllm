import { logLoss, sigmoid } from '../arithmetic.mjs';
import { mix, phase, progress, smooth } from '../construction.mjs';
import { M, T, chip, line, mark } from '../defaults.mjs';
export function drawGradient(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    q = progress(state, 'gradient-chain', 0),
    cancel = progress(state, 'gradient-cancel', 0);
  if (currentBeat === 0) {
    T(ctx, api, 'Backward through probability and score', 960, 285, 34, api.C.muted);
    mark(api, 'gradient-factors', () => {
      M(
        ctx,
        api,
        q > 0 ? '\\frac{p-y}{p(1-p)}' : '\\frac{\\partial\\ell}{\\partial p}',
        420,
        475,
        58,
        api.C.pink,
      );
      M(ctx, api, '\\times', 750, 475, 55, api.C.muted);
      M(ctx, api, 'p(1-p)', 1040, 475, 58, api.C.cyan);
      M(ctx, api, '\\times x_j', 1510, 475, 58, api.C.yellow);
    });
    mark(api, 'gradient-cancellation', () => {
      if (cancel > 0) {
        const p = smooth(cancel);
        line(
          ctx,
          api,
          [
            {
              x: 290,
              y: 585,
            },
            {
              x: mix(290, 560, p),
              y: 585,
            },
          ],
          api.C.yellow,
          5,
        );
        line(
          ctx,
          api,
          [
            {
              x: 910,
              y: 585,
            },
            {
              x: mix(910, 1170, p),
              y: 585,
            },
          ],
          api.C.yellow,
          5,
        );
        T(
          ctx,
          api,
          p === 1 ? 'matching factors cancel' : 'match the two factors',
          960,
          660,
          32,
          api.C.yellow,
        );
      }
      M(
        ctx,
        api,
        cancel === 1
          ? '\\frac{\\partial\\ell}{\\partial w_j}=(p-y)x_j'
          : '\\frac{\\partial\\ell}{\\partial w_j}=\\,?',
        960,
        805,
        58,
        cancel === 1 ? api.C.green : api.C.muted,
      );
    });
  } else {
    T(ctx, api, 'One positive training row', 960, 280, 35, api.C.pink);
    M(ctx, api, 'p-y=0.5-1=-0.5', 960, 405, 55, api.C.pink);
    const q = progress(state, 'worked-row-gradient', 1);
    mark(api, 'worked-row-gradient', () => {
      [1, 3.5, 6].forEach((v, i) => {
        const x = 340 + i * 460,
          a = smooth(phase(q, i * 0.28, 0.22 + i * 0.28));
        chip(ctx, api, 'x' + i + ' = ' + v, x, 515, 330, 100, api.C.cyan, 39);
        const y = mix(690, 760, a);
        M(
          ctx,
          api,
          '-0.5\\times' + v + '=' + (a === 1 ? -0.5 * v : '?'),
          x + 165,
          y,
          41,
          api.C.yellow,
        );
      });
    });
    const local = progress(state, 'lr-gradient-local', 1),
      z = 0.2 * local,
      p = sigmoid(z);
    api.rect(ctx, 320, 840, 1200, 28, api.C.panel, api.C.muted, 4);
    api.rect(ctx, 320, 840, 1200 * p, 28, api.C.pink);
    T(
      ctx,
      api,
      'Local score ' +
        z.toFixed(2) +
        ' → p ' +
        p.toFixed(4) +
        ' → loss ' +
        logLoss(z, 1).toFixed(4),
      960,
      930,
      31,
      api.C.cyan,
    );
    T(
      ctx,
      api,
      'A supplied positive score perturbation lowers this positive-row loss',
      960,
      1000,
      29,
      api.C.muted,
    );
  }
}
export default {
  id: 'gradient',
  draw: drawGradient,
  cues: ['gradient-chain', 'gradient-cancel', 'worked-row-gradient', 'lr-gradient-local'],
};
