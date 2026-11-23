import { stableSoftmax } from 'vizmatic';
import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

const teacher = [2, 0],
  student = [0, 2];
function firstGradient(t) {
  const q = stableSoftmax(teacher, t)[0];
  const p = stableSoftmax(student, t)[0];
  return { q, p, raw: (p - q) / t, scaled: t * (p - q) };
}

export function drawTemperatureGradient(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('temperature-gradient-mechanism', () => {
    text(ctx, api, 'Scores before division', 140, 274, 33, C.muted);
    text(ctx, api, 'Teacher   [2, 0]', 655, 274, 40, C.blue);
    text(ctx, api, 'Student   [0, 2]', 1230, 274, 40, C.cyan);
    if (beat < 2) {
      const xs = [220, 540, 850, 1200, 1595];
      ['Temperature', 'Teacher q', 'Student p', '(p − q) / T', 'T × (p − q)'].forEach((s, i) =>
        text(ctx, api, s, xs[i], 430, 35, C.muted, 'center'),
      );
      [1, 4, 40].forEach((t, i) => {
        const cue = ['gradient-one', 'gradient-four', 'gradient-forty'][i];
        const show =
          i === 0 && beat === 0
            ? 1
            : spokenProgress(state, api, cue, 1, [0.01, 0.1, 0.45][i], [0.08, 0.18, 0.53][i]);
        if (show === 0) return;
        const { q, p, raw, scaled } = firstGradient(t);
        const scaleCue =
          i === 0
            ? 'gradient-square'
            : i === 1
              ? 'gradient-scaled-result'
              : 'gradient-forty-result';
        const scale = spokenProgress(
          state,
          api,
          scaleCue,
          i === 0 ? 0 : 1,
          [0.66, 0.25, 0.46][i],
          [0.86, 0.4, 0.56][i],
        );
        const y = 554 + i * 118;
        [
          String(t),
          q.toFixed(3),
          p.toFixed(3),
          raw.toFixed(4),
          scale === 1 ? 'scaled ' + scaled.toFixed(4) : '· · ·',
        ].forEach((s, j) =>
          text(ctx, api, s, xs[j], y, 44, [C.ink, C.blue, C.cyan, C.ink, C.yellow][j], 'center'),
        );
      });
      text(ctx, api, 'Gradient on the first student logit', 960, 927, 37, C.muted, 'center');
      return;
    }
    const alpha = spokenProgress(state, api, 'mixture-alpha', 2, 0.4, 0.6);
    const hard = stableSoftmax(student)[0] - 1;
    const soft = firstGradient(4).scaled;
    const grad = (1 - alpha) * hard + alpha * soft;
    text(ctx, api, 'Hard target   [1, 0] at T = 1', 180, 433, 40, C.ink);
    text(ctx, api, 'Soft teacher at T = 4', 1130, 433, 40, C.blue);
    const x = 267,
      width = 1390;
    api.line(ctx, x, 571, x + width, 571, C.muted, 4);
    api.circle(ctx, x + width * alpha, 571, 17, C.yellow);
    text(ctx, api, 'α = ' + alpha.toFixed(2), 960, 682, 53, C.yellow, 'center');
    text(ctx, api, 'First logit     ' + grad.toFixed(3), 565, 829, 41, C.cyan, 'center');
    text(ctx, api, 'Alternative     +' + (-grad).toFixed(3), 1360, 829, 41, C.cyan, 'center');
    text(
      ctx,
      api,
      'Mixed gradient     (1 − α) × hard gradient  +  α × scaled soft gradient',
      960,
      964,
      34,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'temperature-gradient',
  draw: drawTemperatureGradient,
  cues: [
    'gradient-square',
    'gradient-one',
    'gradient-four',
    'gradient-scaled-result',
    'gradient-forty',
    'gradient-forty-result',
    'mixture-alpha',
  ],
};
