import { alignmentClipping } from '../model.mjs';
import { progress, heard } from '../clock.mjs';

export function drawPpoClipping(ctx, scene, state, api) {
  const { C } = api;
  const old = 0.2;
  const current = old + 0.1 * progress(state, 'clip-up', 1) - 0.2 * progress(state, 'clip-down', 3);
  const ratio = current / old;
  const x = (p) => 275 + p * 3200;
  api.focus.target('clip-inputs', () => {
    api.text(ctx, 'Chance of the sampled token', 125, 272, 36, C.ink);
    api.line(ctx, x(0), 400, x(0.4), 400, C.muted, 3);
    for (const p of [0, 0.1, old, 0.3, 0.4]) {
      api.line(ctx, x(p), 389, x(p), 413, C.muted, 3);
      api.text(ctx, Math.round(p * 100) + '%', x(p), 458, 29, C.muted, 'center');
    }
    api.text(ctx, 'Old policy', x(old), 515, 29, C.blue, 'center');
    api.circle(ctx, x(old), 400, 14, C.bg, C.blue, 4);
    api.circle(ctx, x(current), 400, 8, C.yellow);
    api.text(ctx, 'Actor', x(current), 356, 34, C.yellow, 'center');
    api.text(
      ctx,
      'Ratio   ' + (current * 100).toFixed(0) + '% / 20% = ' + ratio.toFixed(2),
      1790,
      272,
      39,
      C.yellow,
      'right',
    );
  });
  api.focus.target('clip-products', () => {
    const columns = [160, 660, 1090, 1560];
    ['Advantage', 'Actual ratio × A', 'Clipped ratio × A', 'Smaller product'].forEach((t, i) =>
      api.text(ctx, t, columns[i], 620, 31, C.muted, i ? 'center' : 'left'),
    );
    for (const [i, advantage] of [1, -1].entries()) {
      const row = alignmentClipping(ratio, advantage);
      const show = i === 0 ? heard(state, 'clip-good', 2) : heard(state, 'clip-bad', 2);
      const y = 730 + i * 125;
      const num = (n) => (n > 0 ? '+' : '−') + Math.abs(n).toFixed(2);
      api.text(ctx, num(advantage), columns[0], y, 46, C.ink);
      api.text(ctx, num(row.raw), columns[1], y, 46, C.ink, 'center');
      api.text(ctx, num(row.clipped), columns[2], y, 46, C.ink, 'center');
      api.text(ctx, show ? num(row.surrogate) : '?', columns[3], y, 53, C.yellow, 'center');
    }
  });
  const question =
    state.beat === 1 ? 'For +1 advantage, which product counts?' : 'Clip range   0.8 to 1.2';
  api.text(ctx, question, 960, 975, 35, state.beat === 1 ? C.yellow : C.muted, 'center');
}

export default {
  id: 'ppo-clipping',
  draw: drawPpoClipping,
  cues: ['clip-old', 'clip-up', 'clip-offers', 'clip-good', 'clip-bad', 'clip-down', 'clip-low'],
};
