import { rlvrRepair, rlvrGroupUpdate } from '../arithmetic.mjs';
import { freshRecords } from '../capacity.mjs';
import { signed, spokenProgress } from '../drawing.mjs';

const fixed = rlvrRepair(2);
const weak = rlvrRepair(1);
const eta = 0.3;
const after = rlvrGroupUpdate(fixed.rewards, eta);
const oldRule = rlvrGroupUpdate(weak.rewards, eta);
const start = 1 / fixed.rewards.length;
const percent = (value) => (100 * value).toFixed(1) + '%';

export function drawFreshStepPayoff(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const gradients = p('step-grad', 1, 0.46, 0.66);
  const logits = p('step-logits', 1, 0.69, 0.81);
  const normalize = p('step-normalize', 2, 0.01, 0.25);
  const move = p('step-move', 2, 0.27, 0.5);
  const replay = p('step-replay', 3, 0.17, 0.38);
  const compare = p('step-compare', 3, 0.4, 0.55);
  const oldValue = p('step-old-value', 3, 0.55, 0.65) >= 1;
  const y = (i) => 467 + i * 108;
  const x = (v) => 1090 + (v - 0.27) * 4720;
  api.text(ctx, '18 × 14     ·     three measured responses', 164, 266, 41, C.ink);
  api.text(ctx, 'Outcome', 164, 365, 29, C.muted);
  const descriptions = ['One box', 'Two boxes', 'Time limit'];
  api.focus.target('step-arithmetic', () => {
    api.text(ctx, 'Advantage', 550, 365, 28, C.muted, 'center');
    api.text(ctx, 'Gradient', 739, 365, 28, C.muted, 'center');
    api.text(ctx, 'Logit', 941, 365, 28, C.muted, 'center');
    fixed.advantages.forEach((a, i) => {
      api.text(ctx, signed(a, 3), 550, y(i), 33, C.ink, 'center');
      api.text(
        ctx,
        gradients > 0 ? signed(after.gradient[i], 3) : '·',
        739,
        y(i),
        33,
        C.muted,
        'center',
      );
      const z = after.logits[i] * logits;
      api.text(ctx, z === 0 ? '0' : signed(z, 3), 941, y(i), 33, C.blue, 'center');
    });
  });
  api.focus.target('probability-ruler', () => {
    api.text(ctx, 'Probability of sampling this response', 1090, 326, 32, C.ink);
    [0.3, start, 0.38].forEach((v) =>
      api.text(ctx, v === start ? '⅓' : percent(v), x(v), 400, 29, C.muted, 'center'),
    );
    descriptions.forEach((description, i) => {
      const row = () => {
        const yy = y(i) - 12;
        api.text(ctx, freshRecords[i].id + '   ' + description, 164, y(i), 34, C.ink);
        api.line(ctx, x(0.27), yy, x(0.397), yy, C.muted, 2);
        for (const tick of [0.3, 0.38]) api.line(ctx, x(tick), yy - 6, x(tick), yy + 6, C.muted, 2);
        api.line(ctx, x(start), yy - 22, x(start), yy + 22, C.yellow, 3);
        const v = start + (after.probabilities[i] - start) * move;
        const color = move > 0 ? C.cyan : C.yellow;
        if (move > 0) api.line(ctx, x(start), yy, x(v), yy, color, 8);
        api.circle(ctx, x(v), yy, 11, color);
        if (move >= 1)
          api.text(ctx, percent(after.probabilities[i]), x(v), yy + 45, 29, color, 'center');
        if (i === 1 && replay > 0) {
          const oldX = x(start + compare * (oldRule.probabilities[i] - start));
          api.line(ctx, x(start), yy - 6, oldX, yy - 6, C.yellow, 5);
          api.circle(ctx, oldX, yy - 6, 10, C.yellow);
          if (oldValue)
            api.text(
              ctx,
              'Old ' + percent(oldRule.probabilities[i]),
              oldX,
              yy - 26,
              28,
              C.yellow,
              'center',
            );
        }
      };
      if (i === 1) api.focus.target('second-probability', row);
      else row();
    });
  });
  api.text(ctx, 'R4   Host lost', 164, y(3), 33, C.muted);
  api.text(ctx, 'Unscored · outside this three-category policy', 550, y(3), 31, C.muted);
  if (p('step-transfer', 3, 0.8, 0.97) > 0) {
    const workers = 19;
    const slots = 14;
    api.focus.target('next-check', () => {
      api.text(ctx, 'Next prompt', 164, 951, 34, C.cyan);
      api.text(ctx, workers + ' workers × ' + slots + ' slots', 465, 951, 39, C.ink);
      api.text(ctx, 'Key   ' + workers * slots, 1065, 951, 39, C.ink);
      api.text(ctx, 'Model answer   ?', 1410, 951, 36, C.yellow);
    });
    return;
  }
  api.focus.target('normalizer', () => {
    let rule =
      state.beat === 0 ? 'Which way will the two-box response move?' : 'Each category starts at ⅓.';
    if (gradients > 0) rule = 'At the rollout policy:   gradient = −advantage / 3';
    if (logits > 0) rule = 'One SGD step:   logit = 0 − 0.3 × gradient';
    if (normalize > 0) {
      const total = after.logits.reduce((sum, z) => sum + Math.exp(z), 0);
      rule =
        'R2 probability    exp(' +
        signed(after.logits[1], 4) +
        ') / ' +
        total.toFixed(4) +
        (move >= 1 ? ' = ' + percent(after.probabilities[1]) : '');
    }
    if (oldValue)
      rule =
        'Same R2 text, same starting policy:    first box ' +
        percent(oldRule.probabilities[1]) +
        '    ·    single box ' +
        percent(after.probabilities[1]);
    api.text(ctx, rule, 960, 945, 36, C.ink, 'center');
  });
}
export default {
  id: 'fresh-step-payoff',
  draw: drawFreshStepPayoff,
  cues: [
    'step-start',
    'step-ask',
    'step-grad',
    'step-logits',
    'step-normalize',
    'step-move',
    'step-replay',
    'step-compare',
    'step-old-value',
    'step-transfer',
  ],
};
