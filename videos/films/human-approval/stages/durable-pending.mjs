import { PROPOSAL } from '../fixtures.mjs';
import { digest } from '../model.mjs';
import { cueClock, footer } from '../routing.mjs';

export function drawDurablePending(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const committed = done('pending-save');
  const stopped = done('pending-stop');
  const recovered = done('pending-reload');
  api.focus.target('record', () => {
    api.text(ctx, 'Approval store', 115, 325, 51, C.ink, 'left', 'serif');
    api.line(ctx, 115, 369, 975, 369, C.yellow, 3);
    api.text(
      ctx,
      committed ? 'Durable pending · committed' : 'Preparing the pending row',
      115,
      459,
      43,
      committed ? C.yellow : C.muted,
    );
    api.text(
      ctx,
      (committed ? 'Stored: ' : 'Pending fields: ') + 'canary 25% · revision 3',
      115,
      547,
      35,
      C.ink,
    );
    api.text(ctx, 'Release manager   /   review before tick 200', 115, 629, 32, C.ink);
    api.text(
      ctx,
      'Digest  ' + digest(PROPOSAL).slice(0, 12) + '…',
      115,
      711,
      32,
      C.muted,
      'left',
      'mono',
    );
    if (cue('pending-key').phase !== 'before')
      api.text(ctx, 'Operation key   ' + PROPOSAL.operationId, 115, 787, 34, C.yellow);
    if (done('pending-notify'))
      api.text(ctx, 'Casey has the review request', 115, 858, 35, C.yellow);
  });
  api.focus.target('worker', () => {
    api.text(ctx, 'Worker memory', 1110, 325, 51, C.ink, 'left', 'serif');
    api.line(ctx, 1110, 369, 1805, 369, C.blue, 3);
    api.text(
      ctx,
      stopped ? 'Original worker offline' : 'Original worker',
      1110,
      479,
      42,
      stopped ? C.muted : C.blue,
    );
    if (!stopped) api.text(ctx, 'op-17 · local request', 1110, 563, 36, C.ink);
    if (cue('pending-reload').phase !== 'before') {
      api.text(ctx, 'New worker', 1110, 652, 42, C.blue);
      api.text(ctx, 'Read pending record', 1110, 739, 34, C.ink);
      if (recovered)
        api.text(ctx, 'Operation key   ' + PROPOSAL.operationId, 1110, 820, 34, C.green);
    }
  });
  if (cue('pending-expire').phase !== 'before')
    footer(ctx, api, 'If the deadline passes without a decision, expire op-17 without dispatch.');
  else if (recovered)
    footer(
      ctx,
      api,
      `Recovered pending ${PROPOSAL.operationId} · revision ${PROPOSAL.revision} · pending · effects 0`,
      C.green,
    );
}
export default {
  id: 'durable-pending',
  draw: drawDurablePending,
  cues: [
    'pending-save',
    'pending-key',
    'pending-notify',
    'pending-stop',
    'pending-reload',
    'pending-expire',
  ],
};
