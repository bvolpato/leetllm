import { alignmentFreshStep } from '../construction.mjs';
import { heard, progress } from '../clock.mjs';

export function drawFreshTransfer(ctx, scene, state, api) {
  const { C } = api;
  const step = progress(state, 'pa-fresh-step', 1);
  const v = alignmentFreshStep(step);
  const colors = [C.green, C.blue, C.pink];
  const names = ['A  ·  Ticket', 'B  ·  Direct grant', 'C  ·  Exception'];
  const normalized = state.beat >= 2;
  const sum = v.updated.map(Math.exp).reduce((total, w) => total + w, 0);
  const signed = (n) => (n < 0 ? '−' : '+') + Math.abs(n).toFixed(3);
  api.focus.target('fresh-transfer-construction', () => {
    api.text(ctx, 'Reviewer chose A over C    ·    Uniform reference', 130, 275, 42, C.ink);
    api.text(ctx, 'β = 0.5     Step size = 0.4', 130, 344, 31, C.muted);
    const headers = normalized
      ? ['Reply', 'Starting share', 'New weight / total', 'New share']
      : ['Reply', 'Starting share', 'Logit', 'Gradient'];
    const columns = [130, 620, 1050, 1540];
    headers.forEach((h, i) =>
      api.text(ctx, h, columns[i], 439, 32, C.muted, i ? 'center' : 'left'),
    );
    for (const [i, name] of names.entries()) {
      const y = 550 + i * 115;
      api.text(ctx, name, 130, y, 42, colors[i]);
      api.text(ctx, (v.start[i] * 100).toFixed(0) + '%', columns[1], y, 43, C.ink, 'center');
      if (normalized) {
        api.text(
          ctx,
          Math.exp(v.updated[i]).toFixed(4) + ' / ' + sum.toFixed(4),
          columns[2],
          y,
          39,
          C.ink,
          'center',
        );
        const reveal = heard(
          state,
          ['pa-fresh-prob-a', 'pa-fresh-prob-b', 'pa-fresh-prob-c'][i],
          2,
        );
        api.text(
          ctx,
          reveal ? (100 * v.probabilities[i]).toFixed(2) + '%' : '?',
          columns[3],
          y,
          46,
          colors[i],
          'center',
        );
      } else {
        api.text(ctx, v.updated[i].toFixed(3), columns[2], y, 43, C.ink, 'center');
        const show = heard(state, 'pa-fresh-gradient', 1);
        api.text(
          ctx,
          show ? (i === 1 ? '0' : signed(v.gradient[i])) : '?',
          columns[3],
          y,
          43,
          colors[i],
          'center',
        );
      }
    }
    if (normalized) {
      let x = 130;
      for (const [i, p] of v.probabilities.entries()) {
        const width = 1630 * p;
        if (heard(state, ['pa-fresh-prob-a', 'pa-fresh-prob-b', 'pa-fresh-prob-c'][i], 2)) {
          api.rect(ctx, x, 835, width - 3, 52, colors[i], null, 3);
        }
        x += width;
      }
    }
    let footer = 'Which logits move up, down or stay still?';
    if (state.beat === 1)
      footer = 'A/C = 0.30 / 0.60     ·     P(A wins) = ' + v.comparison.toFixed(3);
    if (normalized)
      footer = heard(state, 'pa-fresh-loss', 2)
        ? 'New-pair loss    ' + v.beforeLoss.toFixed(3) + '  →  ' + v.loss.toFixed(3)
        : 'All three replies share the new denominator.';
    api.text(ctx, footer, 130, 975, 37, C.yellow);
  });
}

export default {
  id: 'fresh-transfer',
  draw: drawFreshTransfer,
  cues: [
    'fresh-transfer-b0',
    'fresh-transfer-b1',
    'pa-fresh-gradient',
    'pa-fresh-step',
    'fresh-transfer-b2',
    'pa-fresh-prob-a',
    'pa-fresh-prob-b',
    'pa-fresh-prob-c',
    'pa-fresh-loss',
  ],
};
