import { stableSoftmax } from 'vizmatic';
import { cue } from '../arithmetic.mjs';
import { TEXT_STATE } from '../fixtures.mjs';
import { crossAttentionFixture } from '../model.mjs';

export function drawZeroInsertion(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const at = (id, index, from, to) => cue(state, id, index, from, to);
  api.focus.target('mm-zero-insertion-construction', () => {
    if (beat < 2) {
      const inserted = at('mm-insert-position', 0, 0.48, 0.76) > 0;
      const masked = at('mm-mask-repair', 1, 0.64, 0.88) === 1;
      const shared = inserted && !masked;
      const weights = stableSoftmax(shared ? [0, 0] : [0]);
      const visualWeight = weights[1] ?? 0;
      const result = weights[0] * 2 + visualWeight * 0;
      const pending = shared && beat === 0;
      const normalized = beat === 1 && at('mm-zero-normalize', 1, 0, 0.27) >= 1;
      const showWeights = !shared || normalized;
      api.text(ctx, 'One attention read', 180, 286, 39, C.ink);
      for (const [i, name, value, col, weight] of [
        [0, 'Text', 2, C.green, weights[0]],
        [1, 'Visual', 0, C.blue, visualWeight],
      ]) {
        if (i === 1 && !inserted) continue;
        const x = 180 + 810 * i;
        api.text(ctx, name, x, 407, 43, col);
        api.text(ctx, `score 0     value ${value}`, x, 494, 45, C.ink);
        api.text(
          ctx,
          i === 1 && masked ? 'Masked out of the sum' : 'exp(0) = 1',
          x,
          575,
          33,
          i === 1 && masked ? C.muted : col,
        );
        if (showWeights) api.text(ctx, `weight ${weight.toFixed(1)}`, x, 656, 33, col);
      }
      const start = 180,
        width = 1530;
      api.text(ctx, 'Share of the attention weight', start, 747, 31, C.muted);
      if (showWeights) {
        api.rect(ctx, start, 775, width * weights[0], 61, C.green, C.panel, 0);
        if (visualWeight > 0)
          api.rect(
            ctx,
            start + width * weights[0],
            775,
            width * visualWeight,
            61,
            C.blue,
            C.panel,
            0,
          );
      } else api.rect(ctx, start, 775, width, 61, C.panel, C.muted, 0);
      const read = masked
        ? `Mask restores the text read: ${result}`
        : !inserted
          ? `Text read = ${result}`
          : at('mm-shared-result', 1, 0.27, 0.56) === 1
            ? `${weights[0]} × 2 + ${visualWeight} × 0 = ${result}`
            : pending
              ? 'With the visual position inserted, what is the new read?'
              : 'Multiply each value by its share.';
      api.text(ctx, read, 960, 946, 46, masked ? C.green : C.yellow, 'center');
      return;
    }
    const gate = 0.35 * at('mm-residual-open', 2, 0.5, 0.78);
    const f = crossAttentionFixture(gate);
    api.text(
      ctx,
      'Separate visual read A     ·     h′ = h + tanh(g) × A',
      960,
      307,
      43,
      C.ink,
      'center',
    );
    api.text(
      ctx,
      `g = ${gate.toFixed(2)}      tanh(g) = ${f.gateStrength.toFixed(3)}`,
      960,
      399,
      39,
      C.yellow,
      'center',
    );
    TEXT_STATE.forEach((base, i) => {
      const y = 528 + 145 * i,
        x = 575,
        scale = 1240;
      const added = f.fused[i] - base;
      api.text(ctx, `Coordinate ${i + 1}`, 157, y + 42, 35, C.ink);
      api.rect(ctx, x, y, base * scale, 56, C.blue, undefined, 0);
      if (added > 0) api.rect(ctx, x + base * scale, y, added * scale, 56, C.green, undefined, 0);
      api.text(ctx, f.fused[i].toFixed(3), 1765, y + 42, 40, C.ink, 'right');
    });
    api.text(
      ctx,
      'Blue: base text state       Green: visual contribution',
      960,
      976,
      34,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'zero-insertion',
  draw: drawZeroInsertion,
  cues: [
    'mm-insert-position',
    'mm-zero-normalize',
    'mm-shared-result',
    'mm-mask-repair',
    'mm-residual-open',
  ],
};
