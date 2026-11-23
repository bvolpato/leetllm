import { uctRows } from '../arithmetic.mjs';
import { cueAmount, cueDone } from '../defaults.mjs';

export function drawReturnBackup(ctx, scene, state, api) {
  const { C } = api;
  const rows = uctRows();
  const retry = rows.find((row) => row.id === 'retry');
  const reward = 1;
  const visits = retry.N + Number(cueDone(state, 'backup-count'));
  const sum = retry.W + (cueDone(state, 'backup-sum') ? reward : 0);
  const parentUpdate = cueDone(state, 'backup-parent');
  const parentN = rows.reduce((total, r) => total + r.N, Number(parentUpdate));
  const parentW = rows.reduce((total, r) => total + r.W, parentUpdate ? reward : 0);
  const xx = [395, 960, 1525];
  api.focus.target('path', () => {
    api.text(ctx, 'Root', 960, 274, 45, C.ink, 'center');
    api.text(
      ctx,
      parentN + ' visits   /   return sum ' + parentW.toFixed(1),
      960,
      344,
      34,
      C.ink,
      'center',
    );
    for (const [i, row] of rows.entries()) {
      api.line(ctx, 960, 394, xx[i], 572, row === retry ? C.cyan : C.muted, row === retry ? 6 : 2);
      api.circle(ctx, xx[i], 572, 13, C.bg, row === retry ? C.cyan : C.muted, 3);
    }
    const up = cueAmount(state, 'backup-parent');
    if (up > 0 && up < 1) api.circle(ctx, 1525 - 565 * up, 572 - 178 * up, 17, C.yellow);
    api.circle(ctx, 960, 394, 16, C.bg, parentUpdate ? C.yellow : C.ink, 5);
    if (cueDone(state, 'backup-outcome'))
      api.text(ctx, 'New return   +1', 1580, 442, 36, C.yellow, 'center');
  });
  api.focus.target('child', () => {
    for (const [i, row] of rows.entries()) {
      const selected = row === retry;
      api.text(ctx, row.id, xx[i], 668, 43, selected ? C.cyan : C.muted, 'center');
      const count = selected ? visits : row.N;
      api.text(
        ctx,
        count +
          (count === 1 ? ' visit' : ' visits') +
          '   /   sum ' +
          (selected ? sum : row.W).toFixed(1),
        xx[i],
        747,
        34,
        selected ? C.ink : C.muted,
        'center',
      );
    }
  });
  api.focus.target('mean', () => {
    const message = cueDone(state, 'backup-mean')
      ? 'Updated retry mean   =   ' +
        sum.toFixed(1) +
        ' ÷ ' +
        visits +
        '   =   ' +
        (sum / visits).toFixed(2)
      : cueDone(state, 'backup-sum')
        ? 'Updated retry mean   =   ' + sum.toFixed(1) + ' ÷ ' + visits + '   =   ?'
        : 'What average should we store for retry?';
    api.text(ctx, message, 960, 942, 45, cueDone(state, 'backup-mean') ? C.green : C.ink, 'center');
  });
}
export default {
  id: 'return-backup',
  draw: drawReturnBackup,
  cues: [
    'backup-outcome',
    'backup-question',
    'backup-count',
    'backup-sum',
    'backup-mean',
    'backup-parent',
    'backup-scope',
  ],
};
