import { bias, labels, passageIds, scores, states, weights } from '../fixtures.mjs';

export function drawScalarScore(ctx, scene, state, api) {
  const { C, focus } = api;
  const i = 2;
  const products = states[i].map((v, j) => v * weights[j]);
  const sum = products[0] + products[1];
  const valueX = (value) => 245 + value * 545;

  if (!state.cues?.['compare-pairs'] || state.cues['compare-pairs'].phase === 'before') {
    focus.target('head', () => {
      api.text(ctx, passageIds[i], 142, 265, 43, C.green, 'left', 'mono');
      api.text(ctx, 'Supplied pair state   [2, 1]', 142, 380, 45, C.ink);
      api.text(ctx, 'Head weights   [1, 0.5]      Bias   −0.2', 870, 380, 42, C.ink);
    });
    focus.target('ruler', () => {
      const y = 680;
      api.line(ctx, valueX(0), y, valueX(2.6), y, C.muted, 3);
      for (const tick of [0, 0.5, 1, 1.5, 2, 2.5]) {
        const x = valueX(tick);
        api.line(ctx, x, y - 12, x, y + 14, C.muted, 2);
        api.text(ctx, String(tick), x, y + 68, 34, C.muted, 'center');
      }
      const steps = [
        {
          cue: 'first-product',
          from: 0,
          to: products[0],
          level: 535,
          color: C.blue,
          label: '2 × 1',
        },
        {
          cue: 'second-product',
          from: products[0],
          to: sum,
          level: 535,
          color: C.cyan,
          label: '1 × 0.5',
        },
        {
          cue: 'logit-result',
          from: sum,
          to: scores[i],
          level: 616,
          color: C.yellow,
          label: '−0.2',
        },
      ];
      for (const step of steps) {
        const progress = focus.progress(step.cue, 0);
        if (progress <= 0) continue;
        const start = valueX(step.from),
          end = valueX(step.to);
        const tip = start + (end - start) * progress;
        api.line(ctx, start, step.level, tip, step.level, step.color, 8);
        api.circle(ctx, tip, step.level, 9, step.color);
        api.text(ctx, step.label, (start + end) / 2, step.level - 29, 36, step.color, 'center');
      }
      if (focus.progress('logit-result', 0) === 1) {
        const x = valueX(scores[i]);
        api.line(ctx, x, 632, x, y, C.green, 3);
        api.circle(ctx, x, y, 11, C.green);
      }
    });
    focus.target('total', () => {
      const result = focus.progress('logit-result', 0) === 1 ? scores[i].toFixed(2) : '?';
      api.text(ctx, `2 × 1   +   1 × 0.5   −   0.2   =   ${result}`, 960, 842, 53, C.ink, 'center');
      const applied = ['first-product', 'second-product', 'logit-result'].map((id) =>
        focus.progress(id, 0),
      );
      states.forEach((h, j) => {
        const partial =
          h[0] * weights[0] * applied[0] + h[1] * weights[1] * applied[1] + bias * applied[2];
        const x = 145 + j * 550;
        api.text(ctx, labels[j], x, 953, 32, C.muted);
        const pending = applied[2] > 0 && result === '?';
        api.text(
          ctx,
          pending ? '…' : partial.toFixed(2),
          x + 300,
          953,
          38,
          j === i ? C.green : C.blue,
        );
      });
    });
    return;
  }

  const sigmoid = focus.progress('apply-sigmoid', 0) === 1;
  focus.target('comparison', () => {
    api.text(ctx, 'Same head, one pair per passage', 135, 276, 47, C.ink);
    api.text(ctx, 'Pair logit', 830, 365, 32, C.muted);
    if (sigmoid) api.text(ctx, 'Sigmoid of logit', 1440, 365, 32, C.muted);
    labels.forEach((label, j) => {
      const y = 432 + j * 154;
      const color = j === i ? C.green : C.blue;
      api.text(ctx, label, 142, y + 38, 43, C.ink);
      api.text(ctx, passageIds[j], 142, y + 89, 30, color, 'left', 'mono');
      api.text(ctx, scores[j].toFixed(2), 871, y + 38, 46, color, 'center');
      api.line(ctx, 945, y + 23, 945 + 170 * scores[j], y + 23, color, 10);
      if (sigmoid)
        api.text(
          ctx,
          (1 / (1 + Math.exp(-scores[j]))).toFixed(3),
          1520,
          y + 38,
          41,
          color,
          'center',
        );
    });
  });
  if (sigmoid)
    api.text(
      ctx,
      'Probability of relevance? Check against held-out relevance labels.',
      135,
      965,
      34,
      C.muted,
    );
}
export default {
  id: 'scalar-score',
  draw: drawScalarScore,
  cues: [
    'pair-state',
    'first-product',
    'second-product',
    'subtract-bias',
    'logit-result',
    'compare-pairs',
    'apply-sigmoid',
  ],
};
