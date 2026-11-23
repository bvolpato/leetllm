import { customerSums } from '../customer-sums.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { focus } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const arrival = api.ease(Math.min(1, state.t / 1.25));
  const removal = focus.progress('remove-alice', 0);
  const measured = focus.progress('measure-change', 0) === 1;
  customerSums(ctx, api, {
    arrival, copy: focus.progress('compare-copy', 0), removal, joined: false, clip: 0,
    measure: measured, normalize: false, proposedLimit: 1,
  });
}
export default { id: 'intro', draw: drawIntro, cues: ['first-ticket', 'ticket-limit', 'compare-copy', 'remove-alice', 'measure-change'] };
