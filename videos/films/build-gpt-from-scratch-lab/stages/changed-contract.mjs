import { spoken, ended, transferSnapshot } from '../construction.mjs';
import { bracket, tile } from '../prompt.mjs';

export function drawChangedContract(ctx, scene, state, api) {
  const { C } = api;
  const s = transferSnapshot(state);
  const source = [...s.before.inputs, s.before.labels.at(-1)];
  const x = (i) => 578 + i * 248;
  const fix = spoken(state, 'answer-target', 1);
  const compared = ended(state, 'compare-probe', 0);
  const lastPair = spoken(state, 'last-label', 1) > 0;
  const inputIndex = lastPair ? s.before.inputs.length - 1 : 2;
  api.text(ctx, 'Position', 160, 277, 30, C.muted);
  source.forEach((_, i) =>
    api.text(ctx, String(i), x(i), 277, 33, i === inputIndex ? C.yellow : C.muted, 'center'),
  );
  api.text(ctx, 'Frozen source', 160, 395, 35, C.muted);
  source.forEach((v, i) =>
    tile(ctx, api, v, x(i), 325, i === inputIndex + 1 && fix > 0 ? C.yellow : C.muted, 195),
  );
  api.text(ctx, 'Probe input', 160, 579, 35, C.blue);
  api.focus.target('probe', () =>
    s.after.inputs.forEach((v, i) => tile(ctx, api, v, x(i), 509, i === 3 ? C.pink : C.blue, 195)),
  );
  if (s.prefixRevealed) bracket(ctx, api, x(0) - 98, x(2) + 98, 652, C.blue);

  api.text(ctx, 'Loader labels', 160, 779, 35, C.yellow);
  api.focus.target('loader', () => {
    if (fix === 0)
      s.before.inputs.forEach((v, i) =>
        tile(ctx, api, v, x(i), 709, i === 2 ? C.pink : C.muted, 195),
      );
    else
      s.before.labels.forEach((v, i) =>
        tile(ctx, api, v, x(i + 1 - fix), 709, i === inputIndex ? C.yellow : C.muted, 195),
      );
    const labels = fix === 1 ? s.before.labels : s.before.inputs;
    const correct = labels.every((id, i) => id === source[i + 1]);
    const labelCheck =
      fix === 1 || (s.copyRevealed && fix === 0)
        ? 'y == source[1:]    →    ' + (correct ? 'True' : 'False')
        : fix > 0
          ? 'Aligning source successors'
          : 'Labels returned for the original input';
    api.text(ctx, labelCheck, 960, 878, 37, C.yellow, 'center');
  });
  api.focus.target('comparison', () => {
    api.text(
      ctx,
      compared
        ? 'Max change in prefix logits   ' + s.delta.toFixed(3)
        : 'Compare logits at positions 0, 1 and 2',
      170,
      989,
      36,
      compared ? C.cyan : C.ink,
    );
  });
  api.focus.target('decision', () => {
    api.text(
      ctx,
      s.targetRevealed
        ? 'Source ' + source[inputIndex] + ' predicts ' + s.before.labels[inputIndex]
        : 'Which label belongs under position 2?',
      1740,
      989,
      35,
      C.yellow,
      'right',
    );
  });
}
export default {
  id: 'changed-contract',
  draw: drawChangedContract,
  cues: [
    'future-input-change',
    'compare-probe',
    'answer-prefix',
    'answer-target',
    'answer-invariant',
    'answer-copy',
    'last-label',
  ],
};
