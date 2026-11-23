import { after, progress, started } from '../decisions.mjs';
import { taskArithmetic } from '../arithmetic.mjs';

export function drawTaskArithmetic(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col) => api.text(ctx, v, x, y, size, col);
  const base = [0, 0],
    code = [1, 0],
    math = [0, 1];
  const codeScale = 1 - 0.2 * progress(state, 'code-scale');
  const mathScale = 1 - 0.4 * progress(state, 'math-scale');
  const join = progress(state, 'join-vectors');
  const sum = taskArithmetic(base, [
    { scale: codeScale, vector: code },
    { scale: mathScale, vector: math },
  ]);
  const x = (v) => 325 + v * 590,
    y = (v) => 815 - v * 455;
  api.line(ctx, x(0), y(0), x(1.15), y(0), C.muted, 2);
  api.line(ctx, x(0), y(0), x(0), y(1.13), C.muted, 2);
  label('weight 1', x(0.78), y(0) + 95, 32, C.muted);
  label('weight 2', 178, y(1.18), 32, C.muted);
  label('base [0, 0]', 165, y(0) + 62, 32, C.muted);
  api.focus.target('deltas', () => {
    label('Change from the base', 1120, 330, 41, C.ink);
    label(
      started(state, 'subtract') ? 'Code   [1, 0] − [0, 0]' : 'Code   [1, 0]',
      1120,
      436,
      40,
      C.blue,
    );
    label(
      started(state, 'subtract') ? 'Math   [0, 1] − [0, 0]' : 'Math   [0, 1]',
      1120,
      526,
      40,
      C.pink,
    );
  });
  api.focus.target('code-step', () => {
    api.arrow(ctx, x(0), y(0), x(codeScale), y(0), C.blue, 8);
    label('Code', x(0.5), y(0) + 52, 32, C.blue);
    if (after(state, 'code-scale')) label('Code × ' + codeScale.toFixed(1), 1120, 646, 37, C.blue);
  });
  api.focus.target('math-step', () => {
    api.arrow(ctx, x(join * codeScale), y(0), x(join * codeScale), y(mathScale), C.pink, 8);
    label('Math', x(join * codeScale) + 28, y(mathScale) - 16, 32, C.pink);
    if (after(state, 'math-scale')) label('Math × ' + mathScale.toFixed(1), 1120, 716, 37, C.pink);
  });
  api.focus.target('result', () => {
    if (state.beat >= 1) {
      label(
        after(state, 'vector-result') ? 'Merged  [' + sum.join(', ') + ']' : 'Merged  [?, ?]',
        1120,
        850,
        49,
        C.yellow,
      );
    }
  });
}
export default {
  id: 'task-arithmetic',
  draw: drawTaskArithmetic,
  cues: ['subtract', 'code-scale', 'math-scale', 'join-vectors', 'vector-result'],
};
