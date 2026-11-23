import { cue } from '../case-file.mjs';

export function drawMemoryAndExecutionState(ctx, scene, state, api) {
  const { C } = api;
  const run = state.beat;
  const saved = cue(api, 'pending-key') >= 1;
  const found = run === 1 && cue(api, 'found-receipt') >= 1;
  const recorded = found && cue(api, 'record-result') >= 1;
  const uncommitted = run === 2 && cue(api, 'uncommitted') >= 1;
  const expired = uncommitted && cue(api, 'expired-approval') >= 1;
  const unknown = run === 3 && cue(api, 'still-unknown') >= 1;

  api.text(
    ctx,
    'Billing webhook  /  PR 191  /  revision c89a1f',
    112,
    261,
    35,
    C.muted,
    'left',
    'mono',
  );
  api.text(ctx, 'Retained note   “merge approved”', 115, 349, 40, C.muted);
  api.focus.target('checkpoint', () => {
    api.text(ctx, 'Workflow checkpoint', 114, 476, 46, C.ink, 'left', 'serif');
    api.line(ctx, 114, 511, 848, 511, C.muted, 2);
    api.text(ctx, 'Merge key', 115, 600, 33, C.muted);
    api.text(ctx, saved ? 'M17' : '…', 520, 600, 47, C.blue, 'left', 'mono');
    api.text(ctx, 'Saved result', 115, 686, 33, C.muted);
    api.text(ctx, recorded ? 'Committed' : 'Pending', 520, 686, 40, recorded ? C.green : C.yellow);
  });
  api.focus.target('destination', () => {
    api.text(ctx, 'Merge destination', 1004, 476, 46, C.ink, 'left', 'serif');
    api.line(ctx, 1004, 511, 1800, 511, C.muted, 2);
    api.text(ctx, saved ? 'Look up M17' : 'Receipt lookup', 1004, 600, 41, C.blue, 'left', 'mono');
    const outcome = found
      ? 'Committed  /  c89a1f'
      : uncommitted
        ? 'Confirmed uncommitted'
        : unknown
          ? 'Outcome unknown'
          : 'Awaiting lookup';
    api.text(ctx, outcome, 1004, 686, 43, found ? C.green : C.ink);
  });
  api.focus.target('resume-action', () => {
    api.rect(ctx, 113, 788, 1688, 159, C.panel, null, 4);
    const decision = recorded
      ? 'Record receipt   ·   0 new merge calls'
      : expired
        ? 'Approval expired   ·   request fresh approval'
        : uncommitted
          ? 'Check approval for this exact revision'
          : unknown
            ? 'Keep M17 pending   ·   reconcile again'
            : run === 0
              ? 'Could the merge already have happened?'
              : 'Same checkpoint   ·   same merge key';
    api.text(ctx, decision, 958, 888, 43, recorded ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'memory-and-execution-state',
  draw: drawMemoryAndExecutionState,
  cues: [
    'pending-key',
    'found-receipt',
    'record-result',
    'uncommitted',
    'expired-approval',
    'still-unknown',
  ],
};
