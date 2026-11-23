import { PARAMETERS } from '../fixtures.mjs';
import { freshGradientFrame, neuralFrame } from '../construction.mjs';
import { focusTarget, line, text } from '../defaults.mjs';

export function drawEarnedGradientTransfer(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  const q = freshGradientFrame(state);
  const g = q.gradient;
  const hasHidden = f.completed('fresh-forward-values', 0);
  const hasLogit = f.completed('nn-fresh-logit', 0);
  const hasSignal = f.completed('nn-fresh-hidden-sensitivity', 1);
  const afterUpdate = f.beat >= 2 && q.step > 0;
  const digits = (v, n) => Number(v.toFixed(n)).toString();

  focusTarget(ctx, api, 'fresh-request', () => {
    text(ctx, api, 'Request [−1, 2]     •     timeout target 1', 960, 251, 38, C.ink, 'center');
    text(ctx, api, 'Original network', 170, 376, 41);
    text(ctx, api, 'Hidden inputs', 170, 475, 32, C.muted);
    text(
      ctx,
      api,
      hasHidden ? g.z1.map((v) => digits(v, 2)).join('      ') : '?',
      580,
      475,
      39,
      C.cyan,
      'center',
    );
    text(ctx, api, 'After ReLU', 170, 554, 32, C.muted);
    text(
      ctx,
      api,
      hasHidden ? g.h.map((v) => digits(v, 2)).join('      ') : '?',
      580,
      554,
      39,
      C.cyan,
      'center',
    );
    text(ctx, api, 'Logit', 170, 646, 32, C.muted);
    text(ctx, api, hasLogit ? digits(g.z2, 2) : '?', 580, 646, 39, C.ink, 'center');
    text(ctx, api, 'Score', 170, 724, 32, C.muted);
    text(ctx, api, hasLogit ? g.score.toFixed(4) : '?', 580, 724, 39, C.ink, 'center');
    if (hasLogit) {
      text(ctx, api, 'Open path to unit 2', 170, 827, 32, C.cyan);
      text(
        ctx,
        api,
        '(p − 1) × 0.1' + (hasSignal ? '  ≈  ' + g.dz1[1].toFixed(4) : ''),
        170,
        902,
        41,
      );
    }
  });

  focusTarget(ctx, api, 'fresh-weights', () => {
    text(ctx, api, 'Input weights of unit 2', 963, 376, 41);
    for (const [i, y] of [522, 765].entries()) {
      const known = f.completed(i === 0 ? 'fresh-gradient-products' : 'nn-fresh-negative', 1);
      const start = PARAMETERS.w1[1][i];
      const value = q.parameters.w1[1][i];
      const x = 1380 + 21500 * (value - start);
      text(
        ctx,
        api,
        (i ? 'Queue' : 'Prompt') + ' input  × ' + (i ? '2' : '−1'),
        963,
        y - 55,
        34,
        C.ink,
      );
      text(
        ctx,
        api,
        afterUpdate ? start.toFixed(2) + '  →  ' + value.toFixed(4) : start.toFixed(2),
        1725,
        y - 55,
        38,
        C.cyan,
        'right',
      );
      line(ctx, api, 1060, y, 1700, y, C.muted, 3);
      line(ctx, api, 1380, y - 16, 1380, y + 16, C.muted, 4);
      if (afterUpdate) line(ctx, api, 1380, y, x, y, C.cyan, 9);
      api.circle(ctx, x, y, 15, C.cyan);
      if (known)
        text(ctx, api, '∇ ' + digits(g.dw1[1][i], 4), 1380, y + 75, 36, C.yellow, 'center');
    }
    text(ctx, api, 'Change from starting weight', 1380, 915, 31, C.muted, 'center');
  });

  focusTarget(ctx, api, 'fresh-result', () => {
    if (q.reveal) {
      text(
        ctx,
        api,
        'same request: score ' +
          g.score.toFixed(4) +
          ' → ' +
          q.result.score.toFixed(4) +
          '     •     logit ' +
          g.z2.toFixed(2) +
          ' → ' +
          q.result.z2.toFixed(4),
        960,
        1013,
        38,
        C.green,
        'center',
      );
    } else if (f.beat === 0) {
      text(
        ctx,
        api,
        'Which weight should increase? Which should decrease?',
        960,
        1013,
        37,
        C.ink,
        'center',
      );
    } else if (f.beat === 2) {
      text(
        ctx,
        api,
        'SGD step  =  −0.1 × gradient, for each weight and bias',
        960,
        1013,
        36,
        C.ink,
        'center',
      );
    } else if (f.completed('nn-fresh-inactive', 1)) {
      text(
        ctx,
        api,
        'Unit 1   •   closed gate   •   both input gradients are zero',
        960,
        1013,
        35,
        C.ink,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Weight gradient = hidden sensitivity × input feature',
        960,
        1013,
        35,
        C.ink,
        'center',
      );
    }
  });
}

export default {
  id: 'earned-gradient-transfer',
  draw: drawEarnedGradientTransfer,
  cues: [
    'earned-gradient-transfer-beat-0',
    'fresh-forward-values',
    'nn-fresh-logit',
    'earned-gradient-transfer-beat-1',
    'nn-fresh-hidden-sensitivity',
    'fresh-gradient-products',
    'nn-fresh-negative',
    'nn-fresh-inactive',
    'earned-gradient-transfer-beat-2',
    'fresh-gradient-step',
    'fresh-gradient-result',
  ],
};
