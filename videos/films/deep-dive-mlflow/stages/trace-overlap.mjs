import { spokenScene } from '../pieces/scene.mjs';
import { traceRuler, span } from '../pieces/trace-ruler.mjs';
import { mergeIntervals, mix } from '../arithmetic.mjs';

export default spokenScene('trace-overlap', (ctx, scene, state, api, g) => {
  const { C } = api;
  const root = 800,
    a = [0, 300],
    b = [200, 650],
    model = [250, 550];
  const covered = mergeIntervals([a, b]).duration;
  const overlap = a[1] - b[0];
  const x = traceRuler(ctx, api, root, [0, 200, 300, 650, 800]);
  const row = (name, interval, y, color, cue, nested = false) =>
    span(ctx, api, x, name, ...interval, y, color, g(0, cue), nested, 'below-name');
  row('Request', [0, root], 362, C.yellow, 0);
  row('Child A', a, 466, C.blue, 1);
  row('Child B', b, 561, C.cyan, 2);
  row('Model inside B', model, 656, C.green, 3, true);
  const p = g(1, 0);
  if (p > 0) {
    api.rect(ctx, x(a[0]), mix(508, 782, p), x(a[1]) - x(a[0]), 13, C.blue, undefined, 0);
    api.rect(ctx, x(b[0]), mix(603, 798, p), x(b[1]) - x(b[0]), 13, C.cyan, undefined, 0);
  }
  if (g(1, 1) > 0) {
    api.line(ctx, x(b[0]), 772, x(b[0]), 823, C.yellow, 3);
    api.line(ctx, x(a[1]), 772, x(a[1]), 823, C.yellow, 3);
    api.text(ctx, overlap + ' ms shared', x((a[1] + b[0]) / 2), 863, 29, C.yellow, 'center');
  }
  const outsideReady = g(1, 2) >= 1;
  if (outsideReady) {
    api.line(ctx, x(covered), 789, x(root), 789, C.ink, 10);
    api.text(
      ctx,
      root - covered + ' ms outside',
      x((covered + root) / 2),
      862,
      29,
      C.ink,
      'center',
    );
  }
  const label =
    state.beat === 0
      ? g(0, 4) > 0
        ? 'How much of these 800 ms lies outside A and B?'
        : ''
      : state.beat === 1 && g(1, 3) > 0
        ? 'Adding durations counts the 100 ms overlap twice.'
        : outsideReady
          ? `800 − ${covered} = ${root - covered} ms outside the direct children`
          : 'Count each covered instant once.';
  if (label) api.text(ctx, label, 960, 965, 39, C.yellow, 'center');
});
