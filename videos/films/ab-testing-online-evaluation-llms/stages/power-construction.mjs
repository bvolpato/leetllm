import { onlineCueProgress } from '../construction.mjs';
import { binaryPowerTerms } from '../model.mjs';
import { line, text } from '../defaults.mjs';

const original = binaryPowerTerms(0.6, 0.05);
const smaller = binaryPowerTerms(0.6, 0.025);
const number = (n) => n.toLocaleString('en-US');

export function drawPowerConstruction(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, beat) => onlineCueProgress(state, 'budget-' + id, beat);
  const second = p('smaller', 2) === 1;
  const plan = second ? smaller : original;
  const finished = p('area', 3) === 1;
  const size = p('area', 3);
  text(
    ctx,
    api,
    'Fixed horizon  ·  equal groups  ·  independent yes/no outcomes',
    145,
    245,
    31,
    C.muted,
  );
  api.focus.target('budget-inputs', () => {
    text(ctx, api, 'A  ' + (100 * plan.a).toFixed(1) + '%', 145, 353, 49, C.blue);
    text(ctx, api, 'B  ' + (100 * plan.b).toFixed(1) + '%', 515, 353, 49, C.cyan);
    text(ctx, api, 'Target lift   ' + 100 * plan.delta + ' percentage points', 145, 425, 37);
    if (p('pooled', 0) > 0) {
      text(ctx, api, 'Pooled rate  p̄ = ' + plan.p.toFixed(4), 145, 516, 32, C.blue);
      text(ctx, api, '1.96 × √[2p̄(1 − p̄)]', 145, 583, 38);
      text(ctx, api, '≈ ' + plan.nullTerm.toFixed(3), 780, 583, 36, C.blue);
    }
    if (p('separate', 1) > 0) {
      text(ctx, api, 'Keep the two rates separate under the alternative', 145, 673, 31, C.cyan);
      text(ctx, api, '0.842 × √[a(1 − a) + b(1 − b)]', 145, 740, 38);
      text(ctx, api, '≈ ' + plan.alternativeTerm.toFixed(3), 780, 740, 36, C.cyan);
    }
    if (p('side', 1) === 1)
      text(
        ctx,
        api,
        '(' +
          plan.nullTerm.toFixed(3) +
          ' + ' +
          plan.alternativeTerm.toFixed(3) +
          ') / ' +
          plan.delta.toFixed(3) +
          ' ≈ ' +
          plan.ratio.toFixed(2),
        145,
        852,
        38,
        C.yellow,
      );
  });
  api.focus.target('budget-square', () => {
    const left = 1180;
    const floor = 817;
    const scale = 5.8;
    const base = scale * original.ratio;
    const target = scale * smaller.ratio;
    text(ctx, api, 'Users needed in one arm', 1080, 338, 40);
    if (p('side', 1) > 0) {
      const side = base + (target - base) * size;
      api.rect(ctx, left, floor - side, side, side, C.panel, C.cyan, 0);
      if (size > 0) api.rect(ctx, left, floor - base, base, base, C.bg, C.blue, 0);
      if (second && !finished) {
        line(ctx, api, left, floor + 35, left + target, floor + 35, C.yellow, 5);
        text(ctx, api, 'New side ≈ ' + smaller.ratio.toFixed(2), left, floor + 89, 32, C.yellow);
      }
      if (p('total', 1) === 1) {
        text(
          ctx,
          api,
          number(original.perArm),
          left + base / 2,
          floor - base / 2 + 13,
          45,
          C.blue,
          'center',
        );
        if (finished)
          text(
            ctx,
            api,
            number(smaller.perArm) + ' in the full square',
            left + target / 2,
            floor - target + 72,
            33,
            C.cyan,
            'center',
          );
      }
    }
  });
  let result = 'Two-sided false-positive rate 5%   ·   power 80%';
  if (p('total', 1) === 1)
    result =
      'Round up per arm, then double: 2 × ' +
      number(original.perArm) +
      ' = ' +
      number(original.total) +
      ' users';
  if (second) result = 'With half the target lift, about how many times as many users?';
  if (finished)
    result =
      number(smaller.total) +
      ' users ÷ ' +
      number(original.total) +
      ' users ≈ ' +
      (smaller.total / original.total).toFixed(2) +
      ' times the traffic';
  text(ctx, api, result, 960, 983, 38, C.ink, 'center');
}
export default {
  id: 'power-construction',
  draw: drawPowerConstruction,
  cues: [
    'budget-pooled',
    'budget-separate',
    'budget-side',
    'budget-total',
    'budget-smaller',
    'budget-area',
  ],
};
