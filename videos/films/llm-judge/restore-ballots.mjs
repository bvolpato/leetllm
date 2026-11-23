import { aggregateSwaps } from './arithmetic.mjs';
import { restoreReplies, restoreTie, restoreVotes } from './fixtures.mjs';

export function drawRestoreBallots(
  ctx,
  api,
  { showVotes, tie = false, showIdentity = false, showOutcome = false, handoff = false },
) {
  const { C, focus } = api;
  const votes = [restoreVotes[0], tie ? restoreTie : restoreVotes[1]];
  const targets = handoff
    ? { slots: 'restore-slots', votes: 'restore-votes', question: 'restore-question' }
    : { slots: 'fresh-slots', votes: 'fresh-slots', question: 'fresh-predict' };
  focus.target(targets.slots, () => {
    api.text(ctx, 'Restore 41    /    Which reply is clearer?', 150, 246, 35, C.muted);
    ['Slot A', 'Slot B'].forEach((label, i) => api.text(ctx, label, 150, 476 + i * 152, 42, C.ink));
    votes.forEach((v, col) => {
      const x = 415 + col * 730;
      api.text(ctx, col === 0 ? 'First call' : 'Reversed call', x, 345, 37, C.ink);
      api.line(ctx, x, 375, x + 640, 375, C.muted, 2);
      v.order.forEach((id, i) => {
        const y = 453 + 152 * i;
        api.text(ctx, id, x, y, 40, id === 'alpha' ? C.green : C.cyan);
        api.text(ctx, restoreReplies[id], x, y + 56, 37, C.ink);
      });
    });
  });
  focus.target(targets.votes, () => {
    votes.forEach((v, i) => {
      const x = 415 + i * 730;
      api.line(ctx, x, 718, x + 640, 718, C.muted, 2);
      api.text(ctx, 'Receipt', x, 792, 32, C.muted);
      api.text(ctx, showVotes ? v.verdict : '?', x + 214, 804, 61, C.yellow);
    });
  });
  const outcome = aggregateSwaps(...votes);
  const result = showOutcome
    ? 'Change reversed verdict only to tie → ' + outcome
    : showIdentity && !tie
      ? 'A(first) = ' + outcome + ' = B(reversed)'
      : tie
        ? 'One pick and one tie. What do we record?'
        : 'Which reply did the judge choose twice?';
  // During the alternate take, the original receipt remains on the left.
  focus.target(targets.question, () =>
    focus.target('fresh-identity', () =>
      focus.target('fresh-tie', () => {
        api.text(ctx, result, 960, 948, 47, showOutcome ? C.pink : C.ink, 'center', 'serif');
      }),
    ),
  );
}
