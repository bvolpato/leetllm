import { VECTOR_A, VECTOR_B } from '../fixtures.mjs';
import { average } from '../arithmetic.mjs';
import { after } from '../decisions.mjs';

export function drawAverage(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, color) => api.text(ctx, v, x, y, size, color, 'center');
  const means = average(VECTOR_A, VECTOR_B);
  ['Parameter', 'Code', 'Math', 'Equal-weight mean'].forEach((v, i) =>
    label(v, [300, 675, 990, 1465][i], 370, 38, [C.muted, C.blue, C.pink, C.ink][i]),
  );
  means.forEach((mean, i) => {
    const y = 523 + i * 195;
    const ready = after(state, i === 0 ? 'first-mean' : 'second-mean');
    api.focus.target(i === 0 ? 'row-one' : 'row-two', () => {
      label('w' + (i + 1), 300, y, 47, C.muted);
      label(VECTOR_A[i], 675, y, 62, C.blue);
      label(VECTOR_B[i], 990, y, 62, C.pink);
      api.arrow(ctx, 1135, y - 20, 1230, y - 20, C.muted, 3);
      api.focus.target('merged-weights', () => {
        label(
          ready ? '(' + VECTOR_A[i] + ' + ' + VECTOR_B[i] + ') / 2 = ' + mean : '?',
          1465,
          y,
          53,
          ready ? C.yellow : C.muted,
        );
      });
    });
    api.line(ctx, 175, y + 62, 1750, y + 62, C.panel, 3);
  });
  label('Two matching coordinates from the Code and Math checkpoints', 960, 916, 34, C.muted);
}
export default {
  id: 'average',
  draw: drawAverage,
  cues: ['average-row-one', 'first-mean', 'second-mean', 'average-test'],
};
