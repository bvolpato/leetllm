import { precisionMergeExample } from '../fixtures.mjs';
import { after, progress, started } from '../decisions.mjs';

export function drawPrecisionDiagnosis(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  const f = precisionMergeExample(),
    x = (v) => 355 + ((v - 1) / f.step) * 1190;
  api.focus.target('precision-ruler', () => {
    const second = state.beat > 0;
    label(second ? 'Float32 inputs' : 'Round the input first', 185, 309, 43, C.ink);
    label('Base   1.000', 185, 408, 34, C.muted);
    label('Specialist   ' + f.specialist.toFixed(3), 650, 408, 36, C.blue);
    if (second && after(state, 'wide-half'))
      label('Halfway   ' + f.wide.toFixed(3), 1200, 408, 36, C.pink);
    api.line(ctx, x(f.base) - 90, 690, x(f.base + f.step) + 90, 690, C.muted, 3);
    [f.base, f.base + f.step].forEach((n) => {
      api.line(ctx, x(n), 657, x(n), 715, C.ink, 4);
      label(String(n), x(n), 783, 40, C.ink, 'center');
    });
    const from = second
      ? f.specialist + (f.wide - f.specialist) * progress(state, 'wide-half')
      : f.specialist;
    const round = progress(state, second ? 'round-output' : 'round-input');
    const stored = second ? f.roundedOutput : f.roundedInput;
    const position = from + (stored - from) * round;
    if (round > 0) api.line(ctx, x(from), 635, x(position), 635, C.cyan, 4);
    api.circle(ctx, x(position), 635, 17, second ? C.pink : C.blue);
    const caption =
      round === 1
        ? (second ? 'Saved' : 'Rounded input') + '   ' + stored.toFixed(3)
        : round > 0
          ? 'Rounding to BF16'
          : (second && started(state, 'wide-half') ? 'Working value' : 'Input') +
            '   ' +
            position.toFixed(4);
    label(caption, x(position), 568, 38, second ? C.pink : C.blue, 'center');
    label('Spacing above 1 in BF16     1 / 128 = ' + f.step, 960, 900, 39, C.yellow, 'center');
    api.text(
      ctx,
      second ? 'dtype: float32     out_dtype: bfloat16' : 'dtype: bfloat16',
      960,
      995,
      31,
      C.muted,
      'center',
      'mono',
    );
  });
}
export default {
  id: 'precision-diagnosis',
  draw: drawPrecisionDiagnosis,
  cues: ['round-input', 'wide-half', 'round-output', 'saved-weight'],
};
