import { spokenScene } from '../pieces/scene.mjs';
import { chip } from '../defaults.mjs';
import { mix } from '../arithmetic.mjs';

export default spokenScene('alias', (ctx, scene, state, api, g) => {
  const { C } = api;
  const move = g(1, 0),
    reload = g(2, 1);
  const version = reload >= 1 ? 18 : 17;
  api.text(ctx, 'Prompt registry', 160, 290, 40, C.ink);
  api.text(ctx, 'Worker memory', 1170, 290, 40, C.ink);
  const left = 160,
    right = 570,
    width = 292;
  chip(ctx, api, 'v17', left, 507, width, C.blue, 96, 44);
  chip(ctx, api, 'v18', right, 507, width, C.cyan, 96, 44);
  const center = mix(left, right, move) + width / 2;
  api.text(ctx, 'production', center, 382, 36, C.yellow, 'center');
  api.arrow(ctx, center, 407, center, 484, C.yellow, 4);
  api.line(ctx, 986, 334, 986, 687, C.muted, 2);
  if (g(0, 1) > 0) {
    chip(
      ctx,
      api,
      reload > 0 && reload < 1 ? 'Loading…' : 'Held copy   v' + version,
      1170,
      507,
      512,
      C.blue,
      96,
      40,
    );
    if (reload > 0 && reload < 1) {
      const x = mix(right + width, 1170, reload);
      api.circle(ctx, x, 480 - 70 * Math.sin(Math.PI * reload), 11, C.cyan);
    }
  }
  api.text(ctx, 'Request receipts', 158, 741, 32, C.muted);
  if (g(0, 3) > 0) api.text(ctx, 'Initial load   ·   v17', 160, 816, 35, C.blue);
  if (g(2, 0) > 0) api.text(ctx, 'Before reload   ·   v17', 682, 816, 35, C.blue);
  if (g(2, 2) > 0) api.text(ctx, 'After reload   ·   v18', 1250, 816, 35, C.green);
  if (state.beat === 1 && g(1, 2) > 0)
    api.text(ctx, 'Halfway to refresh, which version serves this request?', 160, 953, 39, C.yellow);
});
