import { spokenScene } from '../pieces/scene.mjs';
import { mix } from '../arithmetic.mjs';

export default spokenScene('store-route', (ctx, scene, state, api, g) => {
  const { C } = api;
  const labels = ['Worker', 'Tracking server', 'Object storage'];
  const xs = [200, 810, 1420];
  labels.forEach((s, i) => api.text(ctx, s, xs[i], 320, 37, C.ink));
  function route(y, label, direct, p, color) {
    api.text(ctx, label, 145, y - 53, 32, color);
    api.line(ctx, 250, y, 1520, y, color, 4);
    api.circle(ctx, 250, y, 11, color);
    api.circle(ctx, 1520, y, 11, color);
    if (!direct) api.circle(ctx, 906, y, 16, C.panel, color, 4);
    if (p > 0) {
      const at = mix(1520, 250, p);
      api.rect(ctx, at - 35, y - 16, 70, 32, color, undefined, 3);
    }
  }
  if (g(0, 1) > 0)
    route(
      515,
      'R8   /   recorded direct location U1',
      true,
      state.beat === 0 ? g(0, 2) : 0,
      C.blue,
    );
  if (g(1, 1) > 0) route(739, 'New run   /   recorded proxy location U2', false, g(2, 1), C.cyan);
  if (g(1, 2) > 0) {
    api.text(ctx, 'Worker lacks access to U1', 180, 602, 30, C.pink);
    if (g(2, 0) > 0) api.text(ctx, 'Read denied at U1', 1290, 602, 31, C.pink);
  }
  const note =
    state.beat === 0
      ? 'U1 requires the worker’s storage credentials.'
      : state.beat === 1
        ? g(1, 2) > 0
          ? 'Can the server’s role authorize the old direct download?'
          : 'The old recorded location stays U1.'
        : g(2, 1) > 0
          ? 'U2 requires server-side authorization and scoped storage access.'
          : 'U1: authorize the worker or migrate the old artifact explicitly.';
  api.text(ctx, note, 145, 943, 37, C.yellow);
});
