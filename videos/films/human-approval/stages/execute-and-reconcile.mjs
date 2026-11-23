import { executionSnapshot } from '../construction.mjs';
import { FRESH_PROPOSAL } from '../fixtures.mjs';
import { cueClock, footer, trafficStrip } from '../routing.mjs';

const cues = [
  'execute-claim-complete',
  'execute-and-reconcile-b1-1',
  'execute-apply-complete',
  'execute-and-reconcile-b1-2',
  'execute-timeout-complete',
  'execute-ask',
  'execute-proof',
  'execute-and-reconcile-b2-1',
  'execute-and-reconcile-b2-2',
  'execute-retry',
];

export function drawExecuteAndReconcile(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const clock = state.cues ?? Object.fromEntries(cues.map((id) => [id, cue(id)]));
  const s = executionSnapshot(state.beat, state.beatP, clock);
  const loss = cue('execute-and-reconcile-b1-2');
  const query = cue('execute-and-reconcile-b2-1');
  const reply = cue('execute-and-reconcile-b2-2');
  const awaitingAnswer = cue('execute-ask').phase === 'after' && !s.timedOut;
  api.text(ctx, 'Casey’s new grant', 115, 280, 39, C.yellow);
  api.text(
    ctx,
    'op-18    /    10% → 25%    /    requires revision 4',
    1805,
    280,
    35,
    C.yellow,
    'right',
  );
  api.line(ctx, 115, 330, 1805, 330, C.muted, 2);

  api.focus.target('host', () => {
    api.text(ctx, 'Execution worker', 115, 455, 47, C.ink, 'left', 'serif');
    const label = s.receiptRecorded
      ? 'Executed · revision ' + s.receipt.revision
      : s.timedOut
        ? 'Timeout · unknown'
        : awaitingAnswer
          ? 'Timed out · outcome?'
          : s.hostState;
    const color = s.receiptRecorded ? C.green : s.timedOut ? C.yellow : C.blue;
    api.text(ctx, label, 115, 573, 49, color);
    api.text(ctx, 'Operation key   ' + s.operationId, 115, 680, 33, C.ink);
    if (s.receipt) api.text(ctx, 'Receipt saved · ' + s.receipt.operationId, 115, 765, 34, C.green);
    else api.text(ctx, 'Local receipts   0', 115, 765, 34, C.muted);
  });

  api.focus.target('destination', () => {
    api.text(ctx, 'Live router', 1230, 455, 47, C.ink, 'left', 'serif');
    api.text(ctx, 'Canary traffic', 1230, 568, 33, C.muted);
    api.text(ctx, s.targetShare + '%', 1805, 571, 55, C.cyan, 'right');
    trafficStrip(ctx, api, 1230, 605, 580, s.targetShare, C.cyan);
    api.text(
      ctx,
      s.applied
        ? 'Target committed · revision ' + s.targetRevision
        : 'Revision ' + s.targetRevision,
      1230,
      747,
      35,
      C.ink,
    );
    api.text(
      ctx,
      'Writes by ' + FRESH_PROPOSAL.operationId + '   ' + s.effects,
      1230,
      824,
      33,
      C.cyan,
    );
  });

  api.focus.target('wire', () => {
    const start = 690,
      end = 1150;
    const sending = cue('execute-and-reconcile-b1-1');
    const reading = query.phase !== 'before';
    const outbound = reading ? query : sending;
    api.text(ctx, reading ? 'Look up op-18' : 'Send op-18', 920, 462, 31, C.blue, 'center');
    api.arrow(ctx, start, 511, end, 511, C.blue, 3);
    if (outbound.phase === 'during')
      api.circle(ctx, start + (end - start) * outbound.progress, 511, 11, C.blue);
    if (reading) {
      api.arrow(ctx, end, 685, start, 685, C.green, 3);
      if (reply.phase === 'during')
        api.circle(ctx, end - (end - start) * reply.progress, 685, 11, C.green);
      api.text(
        ctx,
        s.receiptRecorded ? 'op-18 receipt' : 'Receipt requested',
        920,
        757,
        31,
        s.receiptRecorded ? C.green : C.muted,
        'center',
      );
    } else if (loss.phase !== 'before') {
      const halfway = 920;
      api.line(ctx, end, 685, halfway, 685, C.pink, 4);
      if (s.replyLost) {
        api.line(ctx, halfway - 12, 673, halfway + 12, 697, C.pink, 4);
        api.line(ctx, halfway - 12, 697, halfway + 12, 673, C.pink, 4);
      } else api.circle(ctx, end - (end - halfway) * loss.progress, 685, 11, C.pink);
      api.text(
        ctx,
        s.replyLost ? 'Reply lost' : 'Returning receipt',
        920,
        757,
        31,
        C.pink,
        'center',
      );
    }
    if (awaitingAnswer)
      footer(ctx, api, 'What outcome can the worker record from the timeout alone?', C.yellow);
    if (s.receiptRecorded)
      footer(
        ctx,
        api,
        state.beat === 3
          ? 'Retry only within the destination’s same-key, same-arguments contract.'
          : 'One write. Looking up its receipt leaves the traffic split alone.',
        C.green,
      );
  });
}
export default { id: 'execute-and-reconcile', draw: drawExecuteAndReconcile, cues };
