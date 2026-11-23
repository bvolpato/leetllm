import { TOP_PIXEL } from '../fixtures.mjs';
import { imageNoise } from '../model.mjs';
import { afterPhrase, cueProgress, decimal, ddimTerms, worksheet } from '../pixel-study.mjs';

const jump = worksheet(0.5, 0.9);
const clean = jump.recovered[TOP_PIXEL];
const epsilon = imageNoise[TOP_PIXEL];

export function drawDdimContract(ctx, scene, state, api) {
  const { C } = api;
  const changed = afterPhrase(state, 'eta-change', 1);
  const eta = Number(changed);
  const terms = ddimTerms(clean, epsilon, 0.5, 0.9, eta);
  const p = cueProgress(state, 'eta-fork', 2);
  const resolved = afterPhrase(state, 'eta-landings', 2);
  const x = (value) => 425 + ((value - 0.5) / 0.8) * 1250;
  const coefficient = Math.sqrt(0.1 - terms.sigma ** 2);
  api.focus.target('jump-settings', () => {
    api.text(ctx, 'Same input and noise prediction', 125, 258, 34, C.muted);
    api.text(ctx, 'Selected levels   0.50 → 0.90', 125, 333, 42, C.ink);
    api.text(ctx, `η = ${eta}`, 1240, 257, 48, C.yellow);
    api.text(ctx, `σ = ${decimal(terms.sigma)}`, 1465, 257, 44, C.pink);
    api.math(
      ctx,
      String.raw`\sigma=\eta\sqrt{\frac{1-\bar\alpha_s}{1-\bar\alpha_t}}\sqrt{1-\frac{\bar\alpha_t}{\bar\alpha_s}}`,
      1460,
      375,
      34,
      C.muted,
      'center',
    );
  });
  api.focus.target('jump-center', () => {
    api.text(ctx, 'Shared center', 125, 469, 31, C.muted);
    api.text(
      ctx,
      `√0.90 × 1   +   ${decimal(coefficient)} × (−0.4)   ≈   ${decimal(terms.center)}`,
      455,
      469,
      41,
      C.cyan,
    );
  });
  api.focus.target('jump-landings', () => {
    for (const [i, z] of [-1, 1].entries()) {
      const y = 644 + i * 175;
      api.text(ctx, `z = ${z > 0 ? '+1' : '−1'}`, 130, y + 13, 44, C.ink);
      api.line(ctx, x(0.5), y, x(1.3), y, C.muted, 3);
      for (const tick of [0.5, 0.7, 0.9, 1.1, 1.3]) {
        api.line(ctx, x(tick), y - 6, x(tick), y + 10, C.muted, 2);
        if (i === 1) api.text(ctx, String(tick), x(tick), y + 56, 29, C.muted, 'center');
      }
      api.circle(ctx, x(terms.center), y, 15, C.bg, C.cyan, 4);
      const next = terms.center + z * terms.sigma;
      if (!changed || p > 0) {
        const tip = x(terms.center + z * terms.sigma * p);
        if (Math.abs(tip - x(terms.center)) > 2)
          api.line(ctx, x(terms.center), y, tip, y, C.pink, 6);
        api.circle(ctx, tip, y, 9, C.yellow, C.bg, 2);
        if (!changed || resolved) api.text(ctx, decimal(next), tip, y - 37, 36, C.yellow, 'center');
      }
    }
  });
  api.text(ctx, 'Normalized brightness at the destination level', 960, 928, 28, C.muted, 'center');
  api.math(
    ctx,
    String.raw`x_s=\sqrt{\bar\alpha_s}\hat{x}_0+\sqrt{1-\bar\alpha_s-\sigma^2}\,\hat\epsilon+\sigma z`,
    960,
    1021,
    43,
    C.ink,
    'center',
  );
}

export default {
  id: 'ddim-contract',
  draw: drawDdimContract,
  cues: ['eta-zero', 'eta-change', 'eta-direction', 'eta-question', 'eta-fork', 'eta-landings'],
};
