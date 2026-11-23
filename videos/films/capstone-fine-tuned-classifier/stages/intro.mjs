import { drawTicket, sceneClock } from '../desk.mjs';

export function drawIntro(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  const t = state.t ?? 0;
  if (t < 0.35) ctx.globalAlpha = 1;
  const arrival = Math.max(0, 1 - t / 1.1) ** 2;
  for (const index of [0, 1]) {
    const route = index ? 'intro-human' : 'intro-guard';
    const center = index ? 1390 : 528;
    const color = index ? C.cyan : C.blue;
    api.focus.target(index ? 'ticket-b' : 'ticket-a', () => {
      const y = 365 - 68 * arrival + 126 * api.ease(clock.travelAfter(route));
      drawTicket(ctx, api, index, y, (index ? 94 : -94) * arrival);
      if (clock.after(route)) {
        api.path(
          ctx,
          [
            { x: center - 399, y: 700 },
            { x: center - 384, y: 749 },
            { x: center + 384, y: 749 },
            { x: center + 399, y: 700 },
          ],
          { color, width: 6 },
        );
        api.text(
          ctx,
          index ? 'Immediate human review' : 'Guarded agent',
          center,
          817,
          44,
          color,
          'center',
        );
      }
    });
  }
  if ((state.beat ?? 0) === 0) {
    api.text(ctx, 'Which request needs a person?', 960, 785, 62, C.ink, 'center');
  }
  if ((state.beat ?? 0) >= 2) {
    api.focus.target('approval-record', () => {
      api.line(ctx, 135, 891, 1782, 891, C.muted, 2);
      api.text(ctx, 'Approved access changes', 135, 964, 37, C.muted);
      api.text(ctx, clock.after('intro-approval') ? '0' : '…', 1782, 965, 56, C.ink, 'right');
    });
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-a', 'intro-b', 'intro-human', 'intro-guard', 'intro-approval'],
};
