import { spoken } from '../construction.mjs';
import { atColumn, prompt, tile } from '../prompt.mjs';

export function drawTargets(ctx, scene, state, api) {
  const { C } = api;
  const shift = spoken(state, 'slide-labels', 1);
  const ready = shift === 1;
  const prefix = prompt.slice(0, -1);
  api.text(ctx, 'Source', 105, 353, 38, C.muted);
  prompt.forEach((p, i) => tile(ctx, api, p.piece, atColumn(i), 280, C.muted));
  api.text(ctx, 'Input x', 105, 582, 38, C.blue);
  api.focus.target('input', () =>
    prefix.forEach((p, i) => tile(ctx, api, p.piece, atColumn(i), 510, i === 2 ? C.cyan : C.blue)),
  );
  api.text(ctx, 'Label y', 105, 815, 38, C.yellow);
  api.focus.target('labels', () => {
    // A copy starts directly below its input. Slide the suffix one column left.
    if (shift === 0) {
      prefix.forEach((p, i) =>
        tile(ctx, api, p.piece, atColumn(i), 740, i === 2 ? C.pink : C.muted),
      );
    } else {
      prompt
        .slice(1)
        .forEach((p, i) =>
          tile(ctx, api, p.piece, atColumn(i + 1 - shift), 740, i === 2 ? C.yellow : C.muted),
        );
    }
    api.arrow(ctx, atColumn(2), 642, atColumn(2), 716, ready ? C.yellow : C.pink, 5);
  });
  api.text(
    ctx,
    ready
      ? 'y = source[1:]     ·     comma → line break'
      : shift > 0
        ? 'Align each successor with the input that predicts it'
        : 'y = x     ·     what would a perfect score reward?',
    970,
    963,
    38,
    ready ? C.yellow : C.ink,
    'center',
  );
}
export default { id: 'targets', draw: drawTargets, cues: ['copy-pair', 'slide-labels'] };
