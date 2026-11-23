import { assess } from '../model.mjs';
import { required } from '../fixtures.mjs';
import { bound, mix } from '../arithmetic.mjs';

export function assessmentSheet(
  ctx,
  api,
  { heading, rows, moving, arrivals = rows, note, inputs },
) {
  const { C } = api;
  const valid = assess(rows);
  const scored = required.length - valid.missing.length;
  const passed = rows.filter((r) => r.pass).length;
  const y = (n) => 427 + 126 * n;
  const slotX = 735,
    width = 260;
  const approach = 0.7;
  function tile(x, top, row) {
    const ink = row.pass ? C.green : C.pink;
    api.rect(ctx, x, top, width, 71, C.panel, ink, 5);
    api.text(
      ctx,
      row.id + '   ' + (row.pass ? 'TRUE' : 'FALSE'),
      x + width / 2,
      top + 49,
      36,
      ink,
      'center',
    );
  }
  api.text(ctx, heading, 145, 259, 39, C.ink);
  api.text(ctx, inputs ? 'Fixture / citations' : 'Scores as received', 145, 371, 32, C.muted);
  api.text(ctx, 'Required citation checks', slotX, 371, 32, C.muted);
  required.forEach((id, i) => {
    const top = y(i);
    api.rect(ctx, slotX, top, width, 71, C.panel, C.muted, 5);
    const row = rows.find((r) => r.id === id);
    if (row) tile(slotX, top, row);
    else if (id !== moving?.id || moving.p <= approach)
      api.text(ctx, 'No score', slotX + width / 2, top + 48, 32, C.muted, 'center');
    api.text(ctx, 'Case ' + id, 1035, top + 46, 32, C.ink);
  });
  if (inputs)
    inputs.forEach((list, i) =>
      api.text(
        ctx,
        required[i] + '  ' + JSON.stringify(list),
        145,
        y(i) + 49,
        35,
        C.ink,
        'left',
        'mono',
      ),
    );
  else
    arrivals.forEach((row, i) => {
      if (row.id !== moving?.id) tile(145, y(i), row);
    });
  if (moving) {
    const source = arrivals.findIndex((r) => r.id === moving.id);
    const sy = y(inputs ? required.indexOf(moving.id) : source);
    const dy = y(required.indexOf(moving.id));
    const p = moving.p;
    // Cross the empty gutter before changing rows, so the key stays readable during the join.
    const x =
      p < 0.3 ? mix(145, 438, p / 0.3) : mix(438, slotX, bound((p - approach) / (1 - approach)));
    const top = mix(sy, dy, bound((p - 0.3) / 0.4));
    if (!inputs || p > 0.3) tile(x, top, moving);
  }
  api.text(ctx, 'Required cells scored', 1280, 373, 31, C.muted);
  api.text(ctx, `${scored} / ${required.length}`, 1280, 483, 68, C.cyan);
  api.text(ctx, 'Passes / scored cells', 1280, 619, 31, C.muted);
  api.text(
    ctx,
    scored ? `${passed} / ${scored}` : 'Pending',
    1280,
    727,
    scored ? 68 : 43,
    scored ? C.ink : C.muted,
  );
  if (note) api.text(ctx, note, 145, 936, 39, C.yellow);
}
