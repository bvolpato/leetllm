import { text } from '../defaults.mjs';
import { runFixture } from '../model.mjs';
import { cueProgress } from '../receipt.mjs';

const insert = runFixture({ fault: 'initial' });
const update = runFixture({ fault: 'terminal' });
const xs = [155, 390, 620, 850];

function experiment(ctx, api, { name, run, y, progress, stop, read, replied, call, next, repeat }) {
  const { C } = api;
  const index = Math.floor(progress);
  const x = xs[index] + (progress - index) * ((xs[index + 1] ?? xs[index]) - xs[index]);
  api.focus.target('run-' + name, () => {
    const ink = next ? C.muted : C.ink;
    text(
      ctx,
      api,
      name === 'insert' ? 'A   Reject the INSERT' : 'B   Reject the UPDATE',
      122,
      y - 88,
      36,
      ink,
    );
    api.line(ctx, xs[0], y, xs[3], y, C.muted, 3);
    if (progress > 0) api.line(ctx, xs[0], y, x, y, C.blue, 7);
    for (const [i, label] of ['POST', 'INSERT', 'Provider', 'UPDATE'].entries()) {
      const reached = !next && progress >= i;
      api.circle(ctx, xs[i], y, 8, reached ? C.blue : C.muted);
      text(ctx, api, label, xs[i], y + 59, 27, reached ? C.ink : C.muted, 'center');
    }
    if (!next) {
      if (stop) {
        api.line(ctx, x - 13, y - 17, x + 13, y + 17, C.pink, 6);
        api.line(ctx, x - 13, y + 17, x + 13, y - 17, C.pink, 6);
      } else {
        api.circle(ctx, x, y, 13, C.yellow);
      }
    }
  });
  api.focus.target('calls-' + name, () => {
    text(
      ctx,
      api,
      next ? '·' : String(call ? run.providerCalls : 0),
      1080,
      y + 14,
      62,
      repeat ? C.yellow : next ? C.muted : C.ink,
      'center',
    );
  });
  api.focus.target('read-' + name, () => {
    const row = run.rows[0];
    text(
      ctx,
      api,
      read ? (row ? row.status + ', ' + row.version : '(no rows)') : '·',
      1370,
      y + 12,
      39,
      read ? C.cyan : C.muted,
      'center',
    );
  });
  api.focus.target('http-' + name, () => {
    text(
      ctx,
      api,
      replied ? String(run.reply.http) : '·',
      1710,
      y + 14,
      54,
      replied ? C.pink : C.muted,
      'center',
    );
  });
}

export function drawFailureBoundaries(ctx, scene, state, api) {
  const { C } = api;
  const at = (id) => cueProgress(scene, state, id);
  const insertFault = at('fault-insert'),
    secondInsert = at('second-insert');
  const secondCall = at('second-provider'),
    updateFault = at('fault-update');
  text(ctx, api, 'Same POST in two fresh databases', 120, 260, 35, C.ink);
  text(ctx, api, 'Provider calls', 1080, 305, 28, C.muted, 'center');
  text(ctx, api, 'SQLite readback', 1370, 305, 28, C.muted, 'center');
  text(ctx, api, 'HTTP', 1710, 305, 28, C.muted, 'center');
  api.line(ctx, 110, 332, 1800, 332, C.muted, 2);
  experiment(ctx, api, {
    name: 'insert',
    run: insert,
    y: 485,
    progress: insertFault,
    stop: insertFault === 1,
    read: at('read-insert') > 0,
    replied: at('reply-insert') > 0,
    call: false,
  });
  api.line(ctx, 110, 580, 1800, 580, C.muted, 2);
  experiment(ctx, api, {
    name: 'update',
    run: update,
    y: 736,
    progress: secondInsert + secondCall + updateFault,
    stop: updateFault === 1,
    read: at('read-update') > 0,
    replied: at('reply-update') > 0,
    call: secondCall === 1,
    next: state.beat === 0,
    repeat: at('repeat-risk') > 0,
  });
  text(ctx, api, 'SELECT status, version FROM tasks', 120, 886, 31, C.cyan, 'left', true);
  if (at('reply-insert') > 0)
    text(
      ctx,
      api,
      'Response body   ' + insert.reply.body.error_code,
      1780,
      886,
      30,
      C.pink,
      'right',
    );
  let note = 'Each request starts with an empty table.';
  if (state.beat === 1) note = 'The provider call sits between the two writes.';
  if (state.beat === 2)
    note =
      at('ask-repeat') > 0
        ? 'In which test could submitting again repeat provider work?'
        : 'Compare the stored state after each request.';
  if (state.beat === 3) note = 'B already spent a provider call. Reconcile the running attempt.';
  text(ctx, api, note, 960, 981, 38, state.beat >= 2 ? C.yellow : C.muted, 'center');
}
export default {
  id: 'failure-boundaries',
  draw: drawFailureBoundaries,
  cues: [
    'fault-insert',
    'read-insert',
    'reply-insert',
    'second-insert',
    'second-provider',
    'fault-update',
    'reply-update',
    'read-update',
    'ask-repeat',
    'repeat-risk',
  ],
};
