import { approvalFixture, articleActionHash, freshGuardFrame, guardCue } from '../model.mjs';

const proposed = 'c',
  approved = 'a';
const admission = approvalFixture([{ artifact: proposed }]).outcomes[0];
const digest = (letter) => articleActionHash(letter).slice(0, 8) + '…';

export function paintFreshBoundary(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  const step = (id, b, a, z) => guardCue(state, id, b, a, z);
  const f = freshGuardFrame(state);
  const draft = step('fresh-claims', 0, 0.2, 0.36) > 0;
  const call = step('fresh-artifacts', 0, 0.38, 0.56) > 0;
  const timeout = step('fresh-timeout', 0, 0.57, 0.72) > 0;

  api.focus.target('fresh-premises', () => {
    text(ctx, 'Permitted runbook', 120, 238, 31, C.cyan);
    text(ctx, 'Rollback requires manager approval. The window is 45 minutes.', 120, 308, 43, C.ink);
  });
  line(ctx, 120, 356, 1790, 356, C.muted, 2);
  api.focus.target('fresh-support', () => {
    text(ctx, 'Private draft', 120, 431, 30, C.muted);
    if (draft) {
      text(ctx, '“The window is 45 minutes.”', 120, 497, 37, C.ink);
      text(ctx, '“Manager approval alone authorizes rollback.”', 120, 564, 37, C.ink);
      if (f.support) text(ctx, 'Supported', 1075, 497, 33, C.green);
      if (f.sufficiency) text(ctx, 'Unsupported', 1075, 564, 33, C.yellow);
    }
  });
  api.focus.target('fresh-text', () => {
    text(
      ctx,
      timeout ? 'Output review timed out' : 'Required output review',
      1780,
      430,
      29,
      timeout ? C.yellow : C.muted,
      'right',
    );
    if (f.draftHeld) text(ctx, 'Draft held', 1780, 528, 36, C.yellow, 'right');
  });

  line(ctx, 120, 620, 1790, 620, C.muted, 2);
  api.focus.target('fresh-effect', () => {
    text(ctx, 'Rollback proposal', 120, 695, 30, C.muted);
    if (call) {
      text(ctx, 'Proposed   ' + proposed + ' × 64', 120, 757, 39, C.ink);
      text(ctx, 'Action hash   ' + digest(proposed), 120, 816, 28, C.blue);
      text(ctx, 'Approved   ' + approved + ' × 64', 660, 757, 39, C.ink);
      text(ctx, 'Action hash   ' + digest(approved), 660, 816, 28, C.cyan);
    }
    text(
      ctx,
      f.effects === null ? 'Deployments   ?' : 'Deployments   ' + admission.count,
      1780,
      762,
      41,
      f.effects === null ? C.muted : C.yellow,
      'right',
    );
  });
  api.focus.target('fresh-fallback', () => {
    const send = f.fallback ? step('fresh-delivery', 2, 0.24, 0.37) : 0;
    text(ctx, 'Host fallback', 120, 873, 28, C.muted);
    text(ctx, 'Chat', 1130, 873, 28, C.muted);
    line(ctx, 960, 852, 960, 875, C.muted, 4);
    line(ctx, 960, 973, 960, 989, C.muted, 4);
    if (!f.fallback) line(ctx, 960, 875, 960, 973, C.muted, 4);
    const x = 120 + 1010 * send;
    rect(ctx, x, 888, 660, 75, C.panel, send === 1 ? C.green : C.muted, 8);
    text(
      ctx,
      '“Review unavailable. Try again.”',
      x + 330,
      938,
      35,
      send === 1 ? C.green : C.ink,
      'center',
    );
    if (beat < 2) text(ctx, '?', 1400, 938, 40, C.muted, 'center');
  });
  if (beat === 0)
    api.focus.target('fresh-question', () =>
      text(
        ctx,
        'Which message reaches chat? How many deployments run?',
        960,
        1020,
        36,
        C.ink,
        'center',
      ),
    );
  if (beat === 2)
    api.focus.target('fresh-record', () => {
      text(
        ctx,
        f.record
          ? 'Decision record    ·    policy-7    /    output timeout    /    approved action changed'
          : 'Decision record',
        122,
        1021,
        27,
        C.muted,
      );
    });
}
export { paintFreshBoundary as drawFreshBoundary };
export default {
  id: 'fresh-boundary',
  draw: paintFreshBoundary,
  cues: [
    'fresh-boundary-premises',
    'fresh-claims',
    'fresh-artifacts',
    'fresh-timeout',
    'fresh-boundary-predict',
    'fresh-boundary-support',
    'fresh-boundary-sufficiency',
    'fresh-boundary-effects',
    'fresh-boundary-draft',
    'fresh-boundary-fallback',
    'fresh-delivery',
    'fresh-boundary-record',
    'fresh-boundary-final',
  ],
};
