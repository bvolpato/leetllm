import { cueProgress, motion } from '../construction.mjs';
import { badge, line, panel } from '../defaults.mjs';

export function drawHumanComparisons(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const seen = (id, from, to) => cueProgress(state, id, motion(state, from, to)) > 0;
  const votes = ['A', 'B'];
  const first = beat > 0 || seen('first-vote', 0.11, 0.19);
  const second = beat > 0 || seen('collect-votes', 0.36, 0.48);
  const compared = beat > 0 || seen('compare-votes', 0.67, 0.77);
  const adjudicated = beat > 0 && seen('resolve-rubric', 0.12, 0.35);
  badge(api, ctx, 'Same request and same two replies for both reviewers', 960, 284, C.ink, 37);
  ['A   Request a ticket and wait', 'B   Grant access now'].forEach((answer, i) => {
    badge(api, ctx, answer, 590 + i * 760, 371, C.blue, 34);
  });
  [first, second].forEach((opened, i) => {
    const x = 270 + i * 790;
    api.focus.target(i ? 'second-ballot' : 'first-ballot', () => {
      panel(api, ctx, x, 436, 590, 246, C.muted);
      badge(api, ctx, 'Reviewer ' + (i + 1), x + 295, 492, C.muted, 32);
      badge(
        api,
        ctx,
        opened ? votes[i] : 'Sealed vote',
        x + 295,
        583,
        opened ? C.ink : C.muted,
        opened ? 78 : 38,
      );
      if (opened)
        badge(
          api,
          ctx,
          i ? '“The migration is urgent.”' : '“Approval comes first.”',
          x + 295,
          646,
          C.ink,
          30,
        );
    });
  });
  api.focus.target('labeler-votes', () => {
    line(api, ctx, 565, 709, 1355, 709, C.muted);
    if (compared)
      badge(
        api,
        ctx,
        votes[0] === votes[1] ? 'Same choice' : 'Different choices • 1 vote for A, 1 for B',
        960,
        794,
        C.yellow,
        40,
      );
  });
  api.focus.target('policy-rule', () =>
    badge(
      api,
      ctx,
      adjudicated
        ? 'Approval-first rubric   →   strict training label A over B'
        : 'P-7 requires approval before access.',
      960,
      928,
      adjudicated ? C.green : C.muted,
      36,
    ),
  );
}
export default {
  id: 'human-comparisons',
  draw: drawHumanComparisons,
  cues: ['first-vote', 'collect-votes', 'compare-votes', 'resolve-rubric', 'retain-votes'],
};
