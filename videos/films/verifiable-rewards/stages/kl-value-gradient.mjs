import { rlvrKl } from '../arithmetic.mjs';
import { signed, spokenProgress } from '../drawing.mjs';

const initialTheta = Math.log(4);
const base = rlvrKl(initialTheta);
export function drawKlValueGradient(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const terms = p('kl-terms', 0, 0.42, 0.8);
  const average = p('kl-weights', 1, 0.04, 0.35);
  const shift = p('kl-shift', 2, 0.02, 0.23);
  const reset = p('kl-reset', 3, 0.01, 0.19);
  const slope = p('kl-slopes', 3, 0.36, 0.67);
  const liveValue = p('kl-live-value', 3, 0.35, 0.47) >= 1;
  const fixedValue = p('kl-fixed-value', 3, 0.55, 0.67) >= 1;
  const nudge = 0.2 * shift * (1 - reset);
  const model = rlvrKl(initialTheta + nudge);
  const fixed = base.p.reduce((sum, weight, i) => sum + weight * model.sample[i], 0);
  api.focus.target('kl-input', () => {
    api.text(ctx, 'At one prefix', 165, 255, 35, C.ink);
    api.text(ctx, 'Current probability', 340, 330, 30, C.muted, 'center');
    api.text(ctx, 'Reference', 700, 330, 30, C.muted, 'center');
    api.text(ctx, 'Sample term k', 1055, 330, 30, C.muted, 'center');
    model.p.forEach((prob, i) => {
      const y = 403 + i * 74,
        color = i ? C.yellow : C.blue;
      api.text(ctx, 'Token ' + (i + 1), 120, y, 32, color);
      api.text(ctx, prob.toFixed(3), 340, y, 41, color, 'center');
      api.text(ctx, model.reference[i].toFixed(3), 700, y, 41, C.ink, 'center');
      api.text(ctx, terms > 0 ? model.sample[i].toFixed(3) : '?', 1055, y, 41, color, 'center');
    });
    if (terms > 0) {
      api.text(ctx, 'ℓ = log(reference / current)', 1300, 385, 29, C.muted);
      api.text(ctx, 'k = exp(ℓ) − ℓ − 1', 1300, 457, 35, C.ink);
    }
  });
  if (state.beat === 0) return;
  api.focus.target('kl-weights', () => {
    const left = 590,
      width = 745;
    api.text(ctx, 'Weights on the two sample terms', left, 560, 31, C.muted);
    api.text(ctx, 'Weighted sum', 1580, 560, 31, C.muted, 'center');
    [model.p, base.p].forEach((weights, row) => {
      const y = 630 + row * 128,
        split = weights[0] * width;
      api.text(
        ctx,
        row === 0 ? 'Follow current policy' : 'Freeze starting weights',
        165,
        y + 14,
        32,
        C.ink,
      );
      api.rect(ctx, left, y - 15, split, 30, C.blue, undefined, 3);
      api.rect(ctx, left + split, y - 15, width - split, 30, C.yellow, undefined, 3);
      api.text(
        ctx,
        (weights[0] * 100).toFixed(1) + '%',
        left + split / 2,
        y + 54,
        30,
        C.blue,
        'center',
      );
      api.text(
        ctx,
        (weights[1] * 100).toFixed(1) + '%',
        left + (width + split) / 2,
        y + 54,
        30,
        C.yellow,
        'center',
      );
      api.text(
        ctx,
        average > 0 ? (row === 0 ? model.expectedSample : fixed).toFixed(6) : '?',
        1580,
        y + 17,
        42,
        C.ink,
        'center',
      );
    });
  });
  if (state.beat < 3) {
    const line =
      state.beat === 1
        ? 'If the first logit rises, will the two sums still agree?'
        : 'Change to first logit   ' + signed(nudge) + '       Change to second logit   0';
    api.text(ctx, line, 960, 931, 40, C.ink, 'center');
  } else {
    api.focus.target('kl-slopes', () => {
      api.text(
        ctx,
        slope > 0
          ? 'Slope at the starting policy, with respect to the first logit'
          : 'Return to the starting policy',
        960,
        882,
        34,
        C.muted,
        'center',
      );
      if (liveValue) {
        api.text(
          ctx,
          'Live weights   ' + signed(base.fullGradient, 6),
          615,
          959,
          41,
          C.blue,
          'center',
        );
      }
      if (fixedValue) {
        api.text(
          ctx,
          'Frozen weights   ' + signed(base.fixedGradient, 6),
          1305,
          959,
          41,
          C.yellow,
          'center',
        );
      }
    });
  }
}

export default {
  id: 'kl-value-gradient',
  draw: drawKlValueGradient,
  cues: [
    'kl-input',
    'kl-terms',
    'kl-weights',
    'kl-shift',
    'kl-cheaper',
    'kl-reset',
    'kl-slopes',
    'kl-live-value',
    'kl-fixed-value',
  ],
};
