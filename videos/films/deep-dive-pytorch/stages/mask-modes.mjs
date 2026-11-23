import { cueFraction } from '../cues.mjs';

export function drawMaskModes(ctx, scene, state, api) {
  const { C } = api,
    values = [4, 8, 1000],
    padding = [false, false, true];
  const step = (id, beat, start, end) => cueFraction(state, id, beat, start, end);
  if (state.beat === 3) {
    api.focus.target('mask-check', () => {
      api.text(ctx, 'Reference formula', 240, 370, 55, C.ink);
      api.text(ctx, 'CPU math SDPA', 1250, 370, 55, C.cyan);
      api.line(ctx, 750, 350, 1180, 350, C.muted, 3);
      api.text(ctx, 'Compare forward outputs', 960, 510, 48, C.ink, 'center');
      api.text(ctx, 'Compare gradients for Q, K and V', 960, 605, 46, C.ink, 'center');
      if (step('flex-contract', 3, 0.59, 0.75) > 0) {
        api.text(ctx, 'FlexAttention', 240, 808, 46, C.yellow);
        api.text(ctx, 'score modifier  →  change scores', 700, 805, 38, C.ink);
        api.text(ctx, 'block mask  →  skip blocks', 700, 885, 38, C.ink);
      }
    });
    return;
  }
  const call = step('pass-padding', 0, 0.56, 0.78) > 0;
  const invert = step('invert-padding', 1, 0.16, 0.31) > 0;
  const additive = state.beat === 1 && step('bias-mask', 1, 0.68, 0.82) > 0;
  const allowed = padding.map((v) => (invert ? !v : v));
  const pass = values.filter((_, i) => allowed[i]);
  const out = pass.reduce((a, b) => a + b, 0) / pass.length;
  const oldDropout =
    state.beat === 2 &&
    step('old-dropout', 2, 0.08, 0.24) > 0 &&
    step('zero-dropout', 2, 0.5, 0.67) === 0;
  api.focus.target('mask-flags', () => {
    api.text(ctx, 'Value', 130, 335, 42, C.ink);
    api.text(ctx, 'Padding flag', 130, 487, 37, C.ink);
    api.text(ctx, additive ? 'Add to score' : 'SDPA keep mask', 130, 642, 37, C.ink);
    values.forEach((v, i) => {
      const x = 685 + i * 440;
      api.text(ctx, i === 2 ? 'padding' : 'real key ' + i, x, 257, 31, C.muted, 'center');
      api.text(ctx, String(v), x, 345, 70, C.ink, 'center');
      api.text(
        ctx,
        padding[i] ? 'True' : 'False',
        x,
        487,
        44,
        padding[i] ? C.yellow : C.muted,
        'center',
      );
      if (!call) return;
      const color = allowed[i] ? C.cyan : C.muted;
      api.rect(ctx, x - 142, 565, 284, 106, C.panel, color, 4);
      api.text(
        ctx,
        additive ? (allowed[i] ? '0' : '−∞') : allowed[i] ? 'True' : 'False',
        x,
        635,
        47,
        color,
        'center',
      );
      if (allowed[i]) api.arrow(ctx, x, 685, x, 743, C.cyan, 5);
    });
  });
  api.focus.target('mask-mix', () => {
    const wrongShown = step('wrong-padding', 1, 0, 0.12) > 0;
    const rightShown = step('mix-real', 1, 0.3, 0.53) > 0;
    api.text(
      ctx,
      'All scores = 0     •     dropout_p = ' + (oldDropout ? '0.2' : '0.0'),
      960,
      822,
      37,
      C.muted,
      'center',
      'mono',
    );
    let result = 'Which value comes out?';
    if (oldDropout) result = 'Dropout active in eval()';
    else if ((wrongShown && !invert) || rightShown)
      result =
        (pass.length === 1 ? 'Output = ' : '(' + pass.join(' + ') + ') / ' + pass.length + ' = ') +
        out;
    else if (invert) result = 'Mix the two real keys';
    else if (!call) result = 'MultiheadAttention padding mask';
    api.text(ctx, result, 960, 959, 57, invert ? C.cyan : C.yellow, 'center');
  });
}
export default {
  id: 'mask-modes',
  draw: drawMaskModes,
  cues: [
    'pass-padding',
    'wrong-padding',
    'invert-padding',
    'mix-real',
    'bias-mask',
    'old-dropout',
    'zero-dropout',
    'mask-reference',
    'flex-contract',
  ],
};
