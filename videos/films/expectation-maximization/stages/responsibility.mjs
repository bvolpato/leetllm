import { constructedFrame } from '../construction.mjs';
import { drawMembership } from '../membership.mjs';
import { membershipAt } from '../model.mjs';

const equal = membershipAt(50, [30, 90], 20, 0.5);
const rare = membershipAt(50, [30, 90], 20, 0.1);

export function drawResponsibility(ctx, scene, state, api) {
  const f = constructedFrame(state);
  const changed = f.progress('membership-prior', 2) > 0;
  const extra = f.progress('membership-copies', 3);
  const blue = f.progress('membership-fast-strip', 0);
  const firstPink = f.progress('membership-slow-strip', 0);
  drawMembership(ctx, api, {
    model: changed ? rare : equal,
    slice: f.progress('membership-slice', 0),
    blue,
    pinkCopies: changed ? 9 * extra : firstPink,
    answer: changed ? f.completed('membership-rare-result', 3) : f.completed('membership-equal-result', 1),
    prompt: changed ? 'Which component gets more?' : 'How much of one request is fast?',
    previous: changed ? equal : undefined,
  });
}
export default {
  id: 'responsibility',
  draw: drawResponsibility,
  cues: [
    'membership-slice', 'membership-fast-strip', 'membership-slow-strip',
    'membership-equal-result', 'membership-prior', 'membership-copies', 'membership-rare-result',
  ],
};
