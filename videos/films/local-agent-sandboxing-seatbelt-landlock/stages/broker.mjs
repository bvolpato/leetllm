import { cueProgress } from '../construction.mjs';

export default {
  id: 'broker',
  cues: ['broker-socket', 'broker-check', 'broker-dispatch', 'broker-return'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
    const socket = cueProgress(state, 'broker-socket', 0, 0.28, 0.52);
    const check = cueProgress(state, 'broker-check', 0, 0.6, 0.9);
    const dispatch = cueProgress(state, 'broker-dispatch', 1, 0.1, 0.45);
    const reply = cueProgress(state, 'broker-return', 1, 0.48, 0.72);
    const route = (a, b, y, progress, color) => {
      api.line(ctx, a, y, b, y, C.muted, 3);
      if (progress > 0) api.circle(ctx, a + (b - a) * progress, y, 13, color, C.bg, 2);
    };
    label('GET /repos/owner/repo/pulls/42', 145, 280, 51);
    api.line(ctx, 673, 336, 673, 780, C.muted, 2);
    api.focus.target('broker-socket', () => {
      label('Worker', 150, 443, 47, C.blue);
      label('Local socket', 420, 553, 32, C.muted);
      route(180, 879, 599, socket, C.blue);
    });
    api.focus.target('broker-check', () => {
      label('Host broker', 767, 443, 47, C.yellow);
      label(check > 0 ? 'Check caller + request' : 'Receive request', 765, 553, 33, C.yellow);
      api.rect(ctx, 764, 686, 362, 81, C.panel, C.yellow, 7);
      label('Host credential', 799, 738, 34, C.yellow);
    });
    api.focus.target('broker-upstream', () => {
      label('Fixed upstream', 1382, 443, 44, C.cyan);
      route(1060, 1622, 599, dispatch, C.yellow);
    });
    api.focus.target('broker-reply', () => {
      label(
        reply > 0 ? 'Selected reply: number and state' : 'Reply to worker',
        148,
        860,
        35,
        reply > 0 ? C.cyan : C.muted,
      );
      route(903, 178, 902, reply, C.cyan);
    });
  },
};
