import { customerSums } from '../customer-sums.mjs';

export function drawUserAggregate(ctx, scene, state, api) {
  const { C, focus } = api;
  const joined = (state.beat ?? 0) > 0 || focus.progress('group-tickets', 0) > 0;
  const clip = focus.progress('clip-customer', 0);
  const divide = focus.progress('divide-both', 0) > 0;
  customerSums(ctx, api, {
    copy: 1, removal: 1, joined, clip, measure: true, normalize: divide,
  });
  if (!divide) {
    const label = clip === 1 ? 'One bounded contribution enters the sum for each customer.'
      : 'If we cap Alice’s whole piece at 1, how far apart will the sums be?';
    focus.target('customer-sums', () => api.text(ctx, label, 960, 960, 36, C.ink, 'center'));
  }
}
export default { id: 'user-aggregate', draw: drawUserAggregate, cues: ['group-tickets', 'clip-customer', 'divide-both'] };
