import { completed, operation } from '../construction.mjs';
import { underflowState } from '../model.mjs';

const unit = 2 ** -24;

export function drawUnderflow(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { C } = api;
  const plain = underflowState(0);
  const amplified = underflowState(1);
  const cast = beat === 0 ? operation(state, 'underflow-zero-result') : 1;
  const gain = beat === 1 ? operation(state, 'underflow-storage-operation') : beat > 1 ? 1 : 0;
  const left = 185,
    width = 610,
    right = 1065;
  const y = 510;
  const fraction = plain.gradient / unit;
  const spacings = amplified.stored / unit;
  api.text(ctx, 'One FP16 spacing above zero', left + width / 2, 290, 37, C.ink, 'center');
  api.text(ctx, 'First positive tick  =  2⁻²⁴', left + width / 2, 352, 30, C.muted, 'center');
  api.focus.target('first-spacing', () => {
    api.line(ctx, left, y, left + width, y, C.blue, 4);
    for (const [part, label] of [
      [0, '0'],
      [0.5, 'Halfway'],
      [1, '2⁻²⁴'],
    ]) {
      const x = left + part * width;
      api.line(ctx, x, y - 15, x, y + 15, part === 0.5 ? C.pink : C.blue, 4);
      api.text(ctx, label, x, y + 66, 32, part === 0.5 ? C.pink : C.ink, 'center');
    }
    const start = left + fraction * width;
    api.text(ctx, 'g = 2⁻²⁶', start, y - 95, 39, C.yellow, 'center');
    api.line(ctx, start, y - 64, start, y - 25, C.yellow, 3);
    api.circle(
      ctx,
      start - cast * fraction * width,
      y - 20 + cast * 20,
      14,
      cast === 1 ? C.blue : C.yellow,
    );
  });
  if (beat > 0) {
    api.text(ctx, 'Scaled backward pass', right + width / 2, 290, 37, C.ink, 'center');
    api.text(ctx, 'Each tick is one FP16 spacing', right + width / 2, 352, 30, C.muted, 'center');
    api.focus.target('scaled-spacings', () => {
      api.line(ctx, right, y, right + width, y, C.muted, 3);
      for (let i = 0; i <= spacings; i++) {
        const x = right + (width * i) / spacings;
        const tick = i % 16 === 0 ? 16 : 7;
        api.line(ctx, x, y - tick, x, y + tick, C.cyan, 2);
        if (i % 16 === 0) api.text(ctx, String(i), x, y + 66, 29, C.ink, 'center');
      }
      const x = right + (width * (fraction + (spacings - fraction) * gain)) / spacings;
      api.circle(ctx, x, y - 21, 13, C.yellow);
      api.text(ctx, gain === 1 ? '2⁻¹⁸' : 'g × 256', x, y - 73, 38, C.yellow, 'center');
    });
  }
  const columns = [245, 650, 1090, 1540];
  ['Loss scale', 'Before FP16 cast', 'After FP16 cast', 'FP32 unscale'].forEach((s, i) =>
    api.text(ctx, s, columns[i], 737, 32, C.muted, 'center'),
  );
  const row = (values, lineY, color) =>
    values.forEach((s, i) => {
      api.text(ctx, s, columns[i], lineY, 36, color, 'center');
    });
  api.line(ctx, 120, 772, 1800, 772, C.muted, 2);
  const zeroReady = beat > 0 || completed(state, 'underflow-zero-result');
  row(['1', '2⁻²⁶', zeroReady ? 'Stored 0' : '?', zeroReady ? '0' : ''], 844, C.blue);
  if (beat > 0) {
    const stored = beat > 1 || completed(state, 'underflow-stored-result');
    const restored = beat === 2 && completed(state, 'underflow-recovered-result');
    api.focus.target('rescue-row', () => {
      row(
        [
          '256',
          gain === 1 ? '2⁻¹⁸' : '2⁻²⁶ × 256',
          stored ? 'Stored ' + amplified.stored.toExponential(2) : '?',
          restored ? 'Recovered 2⁻²⁶' : '÷ 256  =  ?',
        ],
        950,
        C.cyan,
      );
    });
  } else {
    api.text(
      ctx,
      zeroReady
        ? 'The original gradient is closer to zero.'
        : 'Which FP16 value is closer to the yellow mark?',
      960,
      975,
      35,
      C.ink,
      'center',
    );
  }
}
export default {
  id: 'underflow',
  draw: drawUnderflow,
  cues: [
    'underflow-zero-result',
    'underflow-storage-operation',
    'underflow-stored-result',
    'underflow-recovered-result',
  ],
};
