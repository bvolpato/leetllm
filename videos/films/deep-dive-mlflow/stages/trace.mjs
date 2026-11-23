import { spokenScene } from '../pieces/scene.mjs';
import { span, traceRuler } from '../pieces/trace-ruler.mjs';
import { bound } from '../arithmetic.mjs';

export default spokenScene('trace', (ctx, scene, state, api, g) => {
  const { C } = api;
  const root = 1420;
  const children = [145, 110, 1130];
  const [retrieve, rerank, generate] = children;
  const start = retrieve + rerank;
  const covered = start + generate;
  const x = traceRuler(ctx, api, root, [0, 500, 1000, root]);
  span(ctx, api, x, 'T104', 0, root, 368, C.yellow, g(0, 0));
  span(ctx, api, x, 'Retrieve', 0, retrieve, 463, C.blue, bound(g(0, 1) * 2));
  span(ctx, api, x, 'Rerank', retrieve, start, 551, C.pink, bound(g(0, 1) * 2 - 1));
  span(ctx, api, x, 'Generate', start, covered, 638, C.cyan, bound(g(0, 2) * 2));
  span(ctx, api, x, 'Model call', start, start + 980, 730, C.green, bound(g(0, 2) * 2 - 1), true);
  span(
    ctx,
    api,
    x,
    'Citation check',
    start + 980,
    start + 1085,
    789,
    C.green,
    bound(g(0, 2) * 2 - 1),
    true,
  );
  if (g(1, 0) > 0) {
    let left = 0;
    for (const [i, duration] of children.entries()) {
      api.rect(
        ctx,
        x(left),
        411,
        (x(left + duration) - x(left)) * g(1, 0),
        14,
        [C.blue, C.pink, C.cyan][i],
        undefined,
        0,
      );
      left += duration;
    }
    api.line(ctx, x(covered), 402, x(covered), 440, C.ink, 3);
  }
  const intro = state.beat === 0;
  const solved = g(2, 0) > 0;
  if (solved) api.rect(ctx, x(covered), 368, x(root) - x(covered), 44, C.ink, undefined, 0);
  if (!intro) {
    const equation = solved
      ? `${root} − ${covered} = ${root - covered} ms outside the children`
      : g(1, 3) > 0
        ? `${root} − ${covered} = ? ms outside the children`
        : '145 + 110 + 1,130 = 1,385 ms covered';
    api.text(ctx, equation, 960, 963, 44, solved ? C.green : C.yellow, 'center');
  }
});
