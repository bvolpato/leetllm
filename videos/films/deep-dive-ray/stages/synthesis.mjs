import { chapterCard, text } from '../defaults.mjs';
import { motion, passed } from '../ledger.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const routed = motion(state, 'serve-route', 0);
  const released = passed(state, 'serve-release', 2);
  const admitted = released ? motion(state, 'serve-admit', 2) : 0;
  // Leave the route into the engine open for the incoming request.
  api.path(
    ctx,
    [
      { x: 790, y: 485 },
      { x: 790, y: 255 },
      { x: 1785, y: 255 },
      { x: 1785, y: 875 },
      { x: 790, y: 875 },
      { x: 790, y: 626 },
    ],
    { color: C.cyan, width: 2 },
  );
  text(ctx, api, 'Engine replica 1', 855, 331, 46);
  text(ctx, api, 'Ingress', 255, 374, 41, C.ink, 'center');
  text(ctx, api, 'Engine queue', 1050, 453, 37, C.muted, 'center');
  text(ctx, api, 'Active cache slots', 1535, 453, 37, C.muted, 'center');
  const waitingX = 1050,
    activeX = 1535;
  api.focus.target('serve-track', () => {
    api.arrow(ctx, 390, 554, 902, 554, C.cyan, 4);
    text(ctx, api, 'Serve route', 570, 510, 33, C.cyan, 'center');
    if (routed < 1)
      chapterCard(ctx, api, 'R7', 155 + (waitingX - 255) * routed, 511, 200, C.yellow, 86, 39);
  });
  api.focus.target('serve-cache', () => {
    for (const [i, id] of ['R4', released ? '' : 'R9'].entries()) {
      const y = 510 + i * 150;
      api.rect(ctx, activeX - 154, y - 14, 308, 113, C.panel, C.muted, 11);
      if (id) chapterCard(ctx, api, id, activeX - 119, y, 238, C.green, 86, 39);
      else if (admitted === 0) text(ctx, api, 'open', activeX, y + 55, 37, C.muted, 'center');
    }
  });
  api.focus.target('serve-queue-slot', () => {
    api.line(ctx, waitingX - 130, 627, waitingX + 130, 627, C.muted, 2);
    if (routed === 1) {
      const x = waitingX + (activeX - waitingX) * Math.max(0, (admitted - 0.35) / 0.65);
      const y = 511 + 149 * Math.min(1, admitted / 0.35);
      chapterCard(ctx, api, 'R7', x - 100, y, 200, admitted === 1 ? C.green : C.yellow, 86, 39);
    }
  });
  if (state.beat === 0 && routed === 1)
    text(ctx, api, 'Has R7 started its first token?', 960, 974, 41, C.yellow, 'center');
  if (state.beat === 1)
    text(
      ctx,
      api,
      'R7 has reached the engine. Both slots are occupied.',
      960,
      974,
      37,
      C.ink,
      'center',
    );
  if (state.beat === 2 && admitted === 1)
    text(ctx, api, 'Next engine step    R4  +  R7', 960, 974, 44, C.green, 'center');
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['serve-route', 'serve-queue', 'serve-release', 'serve-admit'],
};
