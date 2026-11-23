import { saved, next, reset } from '../arithmetic.mjs';
import { cueFraction } from '../cues.mjs';
import { weightScale, drawStep } from '../weight-scale.mjs';

export function drawRecovery(ctx, scene, state, api) {
  const { C } = api;
  const step = (id, b, a, z) => cueFraction(state, id, b, a, z);
  const checkpoint = step('save-adam', 0, 0.19, 0.4) > 0;
  const supplied = step('next-grad', 0, 0.5, 0.65) > 0;
  const full = step('complete-step', 1, 0.03, 0.14);
  const resetHistory = step('reset-step', 1, 0.29, 0.4) > 0;
  const resetMoment = step('reset-moment', 1, 0.41, 0.48) > 0;
  const fresh = step('reset-direction', 1, 0.49, 0.59);
  api.focus.target('adam-start', () => {
    api.text(
      ctx,
      checkpoint ? 'Checkpoint after g = +0.5' : 'Adam starts at w = 1',
      115,
      249,
      40,
      C.ink,
    );
    if (checkpoint)
      api.text(
        ctx,
        'w  ' +
          saved.w.toFixed(6) +
          '       m  ' +
          saved.m.toFixed(3) +
          '       v  ' +
          saved.v.toFixed(5) +
          '       step  ' +
          saved.step,
        115,
        319,
        40,
        C.yellow,
      );
  });
  api.focus.target('adam-lanes', () => {
    const x = weightScale(ctx, api, [0.985, 0.99, 0.995, 1, 1.005], 660, 1730, 416, 610, 3);
    api.text(
      ctx,
      supplied ? 'Next g = −0.25' : 'Next gradient',
      115,
      410,
      38,
      supplied ? C.yellow : C.muted,
    );
    api.text(ctx, full >= 1 ? 'Live = restored' : 'Live / full restore', 115, 500, 39, C.green);
    api.text(ctx, fresh >= 1 ? 'Weights only' : 'Fresh optimizer', 115, 598, 39, C.pink);
    if (checkpoint) {
      drawStep(ctx, api, x, 485, saved.w, next.w, full, C.green);
      drawStep(ctx, api, x, 583, saved.w, reset.w, fresh, C.pink);
    }
  });
  api.focus.target('adam-branches', () => {
    const branches = [
      ['Uninterrupted', next, full, C.green],
      ['Complete restore', next, full, C.green],
      ['Weights-only restore', reset, fresh, C.pink],
    ];
    branches.forEach(([label, after, p, color], i) => {
      const left = 140 + i * 587;
      api.text(ctx, label, left, 697, 32, color);
      const isReset = i === 2 && resetHistory;
      if (!checkpoint || (i === 2 && !isReset)) {
        if (checkpoint) api.text(ctx, 'Ready to replay', left, 768, 35, C.muted);
        return;
      }
      const initial = isReset ? { w: saved.w, m: 0, v: 0, step: 0 } : saved;
      const value = p >= 1 ? after : initial;
      api.text(
        ctx,
        (p >= 1 ? 'Next w = ' : 'Start w = ') + value.w.toFixed(6),
        left,
        764,
        38,
        C.ink,
      );
      const history = isReset && resetMoment ? after : value;
      api.text(
        ctx,
        'm ' + history.m.toFixed(6) + ' · v ' + history.v.toFixed(6),
        left,
        820,
        27,
        C.muted,
      );
      api.text(ctx, 'Optimizer step ' + history.step, left, 869, 30, color);
    });
    if (full >= 1) {
      api.text(ctx, 'Full history:   0.9 × 0.05 − 0.025 = +0.020', 110, 989, 35, C.green);
      if (resetMoment) api.text(ctx, 'Reset:   0.9 × 0 − 0.025 = −0.025', 1040, 989, 35, C.pink);
    } else if (state.beat === 0 && supplied)
      api.text(
        ctx,
        'Same weight, same next gradient. Same next step?',
        960,
        989,
        42,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'recovery',
  draw: drawRecovery,
  cues: [
    'save-adam',
    'next-grad',
    'complete-step',
    'reset-step',
    'reset-moment',
    'reset-direction',
    'compare-resume',
  ],
};
