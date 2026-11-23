import { actionMeanNll } from './arithmetic.mjs';

export function drawActionPositions(
  ctx,
  api,
  { ids, names, mask, scores, result, showSum = true },
) {
  const { C } = api;
  const width = 1430 / ids.length,
    x = (i) => 377 + (i + 0.5) * width;
  api.text(ctx, 'Response', 110, 393, 32, C.ink);
  api.text(ctx, 'Supplied log p', 110, 579, 29, C.ink);
  api.text(ctx, 'Direct loss', 110, 763, 32, C.ink);
  ids.forEach((id, i) => {
    const color = mask[i] ? C.blue : C.yellow;
    api.focus.target('action-position-' + i, () => {
      api.rect(ctx, x(i) - width * 0.47, 303, width * 0.94, 142, C.panel, color, 12);
      api.text(ctx, names[i], x(i), 365, 36, color, 'center');
      api.text(ctx, 'ID ' + id, x(i), 419, 29, C.ink, 'center');
      api.text(ctx, String(scores[i]), x(i), 582, 45, color, 'center', 'mono');
      if (mask[i]) {
        api.arrow(ctx, x(i), 610, x(i), 676, C.blue, 3);
        api.text(ctx, (-scores[i]).toFixed(1), x(i), 766, 46, C.blue, 'center');
      } else {
        api.line(ctx, x(i) - 27, 652, x(i) + 27, 652, C.yellow, 5);
        api.text(ctx, 'mask 0', x(i), 759, 31, C.yellow, 'center');
      }
    });
  });
  api.focus.target('action-mean', () => {
    const actions = scores.filter((_, i) => mask[i]);
    const sum = -actions.reduce((a, v) => a + v, 0);
    const value = result ? actionMeanNll(scores, mask).toFixed(2) : '?';
    api.text(
      ctx,
      showSum
        ? `${sum.toFixed(1)}  /  ${actions.length} sampled tokens  =  ${value}`
        : 'Mean loss over sampled tokens = ?',
      960,
      937,
      50,
      C.ink,
      'center',
      'serif',
    );
  });
}
