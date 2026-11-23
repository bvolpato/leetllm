import {
  card,
  foot,
  math,
  target,
  text,
  withMpsAdvancedFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintCrossover(ctx, scene, state, api, C, c, t, s) {
  target(ctx, api, 'matrix-size', () =>
    math(
      ctx,
      api,
      C,
      'N=' + s.width + '\\qquad\\text{arithmetic work}\\times' + s.work.toFixed(1),
      960,
      285,
      48,
      C.yellow,
    ),
  );
  const x = 410,
    scale = 120;
  text(ctx, api, C, 'CPU', 185, 460, 43, C.blue);
  text(ctx, api, C, 'MPS', 185, 680, 43, C.cyan);
  target(ctx, api, 'crossover-bars', () => {
    api.rect(ctx, x, 385, s.host * scale, 120, C.blue, C.blue, 0, 10);
    api.rect(ctx, x, 605, s.dispatch * scale, 120, C.yellow, C.yellow, 0, 10);
    api.rect(ctx, x + s.dispatch * scale, 605, s.device * scale, 120, C.cyan, C.cyan, 0, 0);
    text(ctx, api, C, s.host.toFixed(2) + ' ms', x + s.host * scale + 35, 460, 43, C.blue);
    text(ctx, api, C, s.mps.toFixed(2) + ' ms', x + s.mps * scale + 35, 680, 43, C.cyan);
  });
  text(ctx, api, C, 'MPS = launch overhead + device compute', 960, 805, 34, C.muted, 'center');
  target(ctx, api, 'crossover-result', () =>
    card(
      ctx,
      api,
      C,
      c,
      s.winner === 'cpu'
        ? 'Small work · CPU finishes first'
        : 'More arithmetic · MPS finishes first',
      310,
      870,
      1300,
      95,
      s.winner === 'cpu' ? C.blue : C.green,
      39,
    ),
  );
  foot(
    ctx,
    api,
    C,
    'Illustrative cost model: CPU work 1 ms × (N/256)³; MPS 3 ms + 0.25 ms × (N/256)³',
  );
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsAdvancedFrame(ctx, scene, state, api, C, c, s, paintCrossover);
}
export function drawCrossoverStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'crossover',
  draw: drawCrossoverStage,
  cues: ['small-work-cost', 'grow-workload', 'workload-crossover'],
};
