import { PROPOSAL } from '../fixtures.mjs';
import { digest } from '../model.mjs';
import { cueClock, footer, trafficRow } from '../routing.mjs';

export function drawDecisionBranches(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const edited = cue('branches-edit').phase === 'after';
  const issued = cue('branches-version').phase === 'after';
  const replacement = {
    ...PROPOSAL,
    version: PROPOSAL.version + 1,
    trafficPercent: 10,
    operationId: 'op-edit',
  };
  api.focus.target('original', () => {
    trafficRow(ctx, api, {
      y: 345,
      label: 'Proposal v' + PROPOSAL.version,
      detail: edited ? 'Superseded · kept in history' : 'Casey’s review screen',
      percent: PROPOSAL.trafficPercent,
      color: C.yellow,
    });
    api.text(ctx, digest(PROPOSAL).slice(0, 12) + '…', 115, 480, 29, C.muted, 'left', 'mono');
  });
  api.focus.target('edited', () => {
    if (cue('branches-edit').phase !== 'before')
      trafficRow(ctx, api, {
        y: 646,
        label: issued ? 'Proposal v' + replacement.version : 'Casey’s edit',
        detail: 'Editor: Casey',
        percent: edited ? replacement.trafficPercent : PROPOSAL.trafficPercent,
        color: C.blue,
      });
    if (issued)
      api.text(ctx, digest(replacement).slice(0, 12) + '…', 115, 781, 29, C.blue, 'left', 'mono');
  });
  api.focus.target('outcomes', () => {
    if (state.beat === 0) {
      api.text(ctx, 'Approve', 140, 678, 39, C.green);
      api.text(ctx, 'Allow guarded dispatch', 140, 749, 32, C.ink);
      api.text(ctx, 'Reject', 760, 678, 39, C.pink);
      api.text(ctx, 'Close with Casey’s reason', 760, 749, 32, C.ink);
      api.text(ctx, 'Deadline passes', 1380, 678, 39, C.yellow);
      api.text(ctx, 'Expire without a write', 1380, 749, 32, C.ink);
    } else if (cue('branches-review').phase !== 'before') {
      const prompt =
        cue('branches-review').phase === 'during'
          ? 'Casey is the editor. Who can approve the revision?'
          : 'Pending · a different eligible reviewer must decide.';
      footer(
        ctx,
        api,
        state.beat === 2
          ? 'Ticket notes are evidence. The stored version supplies the arguments.'
          : prompt,
        C.yellow,
      );
    }
  });
}
export default {
  id: 'decision-branches',
  draw: drawDecisionBranches,
  cues: ['branches-close', 'branches-edit', 'branches-version', 'branches-review', 'branches-note'],
};
