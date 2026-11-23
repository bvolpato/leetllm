import { kl } from '../arithmetic.mjs';
import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { jointFixture } from '../model.mjs';

export function drawSequenceKl(ctx, scene, state, api) {
  const { C } = api;
  const f = jointFixture();
  const beat = state.beat ?? 0;
  const left = 390,
    width = 1370;
  const pct = (v) => Math.round(v * 100) + '%';
  const split = spokenProgress(state, api, 'joint-first', 0, 0.39, 0.6);
  const branches = [
    spokenProgress(state, api, 'joint-after-a', 1, 0.01, 0.13),
    spokenProgress(state, api, 'joint-after-b', 1, 0.4, 0.55),
  ];
  const reversed = spokenProgress(state, api, 'joint-reverse', 3, 0.06, 0.24) === 1;
  const uniform = spokenProgress(state, api, 'joint-uniform', 3, 0.61, 0.81) === 1;
  api.focus.target('path-strips', () => {
    text(ctx, api, 'Probability of a complete two-token path', left, 255, 34, C.muted);
    for (const [i, [model, prefix, next, joint, color]] of [
      ['Teacher', f.q0, f.q1, f.q, C.blue],
      ['Student', f.p0, f.p1, f.p, C.cyan],
    ].entries()) {
      const y = 315 + i * 202;
      text(ctx, api, model, 145, y + 50, 48, color);
      api.rect(ctx, left, y, width, 69, C.panel, undefined, 1);
      let x = left;
      for (const [j, token] of ['A', 'B'].entries()) {
        const w = width * prefix[j];
        api.components.fade(split, () => {
          api.rect(ctx, x + 2, y, w - 4, 69, color, undefined, 1);
          text(ctx, api, token + '   ' + pct(prefix[j]), x + w / 2, y + 49, 36, C.bg, 'center');
        });
        let partX = x;
        for (const [k, suffix] of ['A', 'B'].entries()) {
          const part = w * next[j][k];
          api.components.fade(branches[j], () => {
            api.rect(ctx, partX + 2, y + 79, part - 4, 45, C.panel, undefined, 1);
            text(ctx, api, token + suffix, partX + part / 2, y + 112, 27, color, 'center');
            text(ctx, api, pct(joint[2 * j + k]), partX + part / 2, y + 156, 28, color, 'center');
          });
          partX += part;
        }
        x += w;
      }
    }
    if (beat <= 1) {
      if (branches[0] > 0)
        text(ctx, api, 'Teacher AA     80% × 90% = ' + pct(f.q[0]), 960, 794, 42, C.blue, 'center');
      if (branches[1] === 1)
        text(
          ctx,
          api,
          'Forward KL     What fraction reaches prefix B?',
          960,
          927,
          42,
          C.yellow,
          'center',
        );
      return;
    }
    if (beat === 4) {
      text(
        ctx,
        api,
        'GKD     Score the prefixes the student visits.',
        960,
        804,
        39,
        C.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'MiniLLM     Give earlier choices credit for the rest of the sequence.',
        960,
        910,
        35,
        C.ink,
        'center',
      );
      return;
    }
    const weights = reversed ? f.p0 : f.q0;
    const first = reversed ? kl(f.p0, f.q0) : f.first;
    const cond = reversed ? f.p1.map((p, i) => kl(p, f.q1[i])) : f.conditional;
    const total = reversed ? f.reverse : f.forward;
    const result = spokenProgress(state, api, 'joint-forward', 2, 0.55, 0.75) === 1;
    const columns = [330, 745, 1175, 1610];
    const headings = [
      'First-token KL',
      'After A',
      'After B',
      reversed ? 'Reverse joint KL' : 'Forward joint KL',
    ];
    const terms = [
      first.toFixed(4),
      weights[0].toFixed(1) + ' × ' + cond[0].toFixed(4),
      weights[1].toFixed(1) + ' × ' + cond[1].toFixed(4),
      result ? total.toFixed(4) + ' nats' : '?',
    ];
    headings.forEach((s, i) => {
      text(ctx, api, s, columns[i], 787, 30, C.muted, 'center');
      text(ctx, api, terms[i], columns[i], 861, 38, i === 3 ? C.yellow : C.ink, 'center');
    });
    let caption = reversed
      ? 'Reverse KL uses the student’s prefix probabilities.'
      : 'Forward KL uses the teacher’s prefix probabilities.';
    if (uniform) {
      const even = f.first + (f.conditional[0] + f.conditional[1]) / 2;
      caption =
        'Forward terms with equal weights     ' +
        even.toFixed(4) +
        ' nats     •     Forward joint KL     ' +
        f.forward.toFixed(4);
    }
    text(ctx, api, caption, 960, 971, 33, C.muted, 'center');
  });
}
export default {
  id: 'sequence-kl',
  draw: drawSequenceKl,
  cues: [
    'joint-first',
    'joint-after-a',
    'joint-after-b',
    'joint-forward',
    'joint-reverse',
    'joint-uniform',
  ],
};
