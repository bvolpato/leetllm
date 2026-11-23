import { complete, mix } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { pcaFrame, spreadFrame } from '../model.mjs';
import { caption, equation, line, plane, ring, target, text } from '../defaults.mjs';

export function drawPcaSpread(ctx, scene, state, api) {
  const { C } = api;
  const c = spreadFrame(state);
  const fitted = pcaFrame({ beat: 3 });
  const ticketColors = [C.blue, C.pink, C.green];
  const showPairs = state.beat >= 1;
  const comparing = c.contrastProgress > 0;
  if (!showPairs) {
    const plot = plane(ctx, api, [-1.05, 1.05, -1.05, 1.05], 155, 335, 925, 525);
    target(ctx, api, 'common-spread', () => target(ctx, api, 'contrast-spread', () => {
      const ends = [-1, 1].map((d) => c.direction.map((v) => d * v));
      line(ctx, api, plot, ends[0], ends[1], comparing ? C.pink : C.blue, 4);
      c.centered.forEach((row, i) => {
        const foot = mix(row, c.projected[i], c.commonProgress);
        const color = ticketColors[i];
        line(ctx, api, plot, row, foot, color, 3);
        const original = plot.point(...row);
        api.circle(ctx, original.x, original.y, 8, color);
        // Different radii keep both tickets visible when their centers coincide.
        ring(ctx, api, plot.point(...foot), color, i === 0 ? 21 : 14);
      });
    }));
    ['Slow only', 'Rollback only', 'Both'].forEach((label, i) =>
      text(ctx, api, label, 270 + 315 * i, 920, 32, ticketColors[i], 'center'),
    );
  } else {
    const products = fitted.scores[0].map((score, i) => score * fitted.scores[1][i]);
    const progress = event(state, 1, 'paired-products', 0.13, 0.26);
    const cross = event(state, 1, 'cross-sum', 0.40, 0.48);
    const columns = [390, 643, 912];
    ['Common', 'Contrast', 'Product'].forEach((label, i) =>
      text(ctx, api, label, columns[i], 340, 35, [C.blue, C.pink, C.yellow][i], 'center'),
    );
    const scoreFraction = (score, common) => {
      const units = common ? 3 : 1;
      const n = Math.round(score * units * Math.SQRT2);
      if (n === 0) return '0';
      return (n < 0 ? '−' : '') + Math.abs(n) + (common ? '/(3√2)' : '/√2');
    };
    target(ctx, api, 'paired-products', () => {
      products.forEach((product, i) => {
        const y = 475 + i * 123;
        text(ctx, api, ['Slow', 'Rollback', 'Both'][i], 105, y + 10, 32, ticketColors[i]);
        text(ctx, api, scoreFraction(fitted.scores[0][i], true), columns[0], y + 10, 41, C.ink, 'center');
        text(ctx, api, '×', 517, y + 8, 34, C.muted, 'center');
        text(ctx, api, scoreFraction(fitted.scores[1][i], false), columns[1], y + 10, 41, C.ink, 'center');
        text(ctx, api, '=', 775, y + 8, 32, C.muted, 'center');
        if (progress >= (i + 1) / 3) {
          const term = Math.round(6 * product);
          text(ctx, api, term === 0 ? '0' : (term > 0 ? '+' : '−') + Math.abs(term) + '/6',
            columns[2], y + 10, 44, C.yellow, 'center');
        }
      });
    });
    target(ctx, api, 'cross-sum', () => {
      api.line(ctx, 813, 804, 1010, 804, C.muted, 2);
      text(ctx, api, 'Off-diagonal sum', 736, 875, 31, C.muted, 'right');
      if (cross === 1) text(ctx, api, String(Math.round(products.reduce((a, b) => a + b, 0))), 912, 882, 52, C.yellow, 'center');
    });
  }

  const base = 764;
  text(ctx, api, 'Sum of squared scores', 1430, 302, 37, C.ink, 'center');
  api.line(ctx, 1130, base, 1750, base, C.muted, 3);
  const commonEnergy = fitted.energies[0] * c.commonProgress;
  const bars = [
    { name: 'common', x: 1180, value: commonEnergy, color: C.blue, finished: complete(c.commonProgress), label: '\\frac13' },
    { name: 'contrast', x: 1490, value: c.energy, color: C.pink, finished: complete(c.contrastProgress), label: '1' },
  ];
  bars.forEach(({ name, x, value, color, finished, label }, i) => {
    if (i === 1 && !comparing) return;
    target(ctx, api, 'pca-' + name + '-energy', () => {
      if (value > 0) api.rect(ctx, x, base - 398 * value, 200, 398 * value, color, color, 1);
    });
    text(ctx, api, i === 1 && !finished ? 'turning' : name, x + 100, 825, 32, color, 'center');
    equation(ctx, api, finished ? label : value.toFixed(2), x + 100, 890, 42, color);
  });
  if (showPairs && complete(event(state, 1, 'leading-direction', 0.72, 0.84))) {
    caption(ctx, api, 'First principal direction: contrast');
  }
}

export default {
  id: 'pca-spread',
  draw: drawPcaSpread,
  cues: ['common-spread', 'contrast-spread', 'paired-products', 'cross-sum', 'leading-direction'],
};
