import { cueClock } from '../cue-clock.mjs';

export function drawWorkerRecovery(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const { C, focus } = api;
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const ready = p('ready-worker') === 1;
  const switched = p('switch-worker') === 1;
  const loaded = p('load-worker') === 1;
  focus.target('registry-alias', () => {
    text('Registry alias', 150, 285, 36, C.muted);
    text(
      'production   →   ' + (p('restore-alias') > 0 ? 'baseline B' : 'candidate C'),
      150,
      368,
      50,
      C.yellow,
    );
  });
  focus.target('workers', () => {
    text('Loaded workers', 900, 285, 36, C.muted);
    text('Worker 1   /   candidate C', 900, 478, 43, C.pink);
    text(
      loaded ? 'Worker 2   /   baseline B' : 'Worker 2   /   empty',
      900,
      715,
      43,
      loaded ? C.blue : C.muted,
    );
    if (loaded)
      text(
        ready ? 'Health and capacity acknowledged' : 'Warming up',
        900,
        773,
        30,
        ready ? C.green : C.yellow,
      );
  });
  focus.target('worker-traffic', () => {
    text('Live gateway', 150, 566, 40);
    const start = { x: 410, y: 550 };
    const route = (endY) => [start, { x: 550, y: 550 }, { x: 745, y: endY }, { x: 845, y: endY }];
    const oldRoute = route(465),
      newRoute = route(700);
    api.path(ctx, oldRoute, { color: switched ? C.muted : C.cyan, width: switched ? 2 : 5 });
    if (ready)
      api.path(ctx, newRoute, { color: switched ? C.cyan : C.muted, width: switched ? 5 : 2 });
    const packet = switched ? p('new-route') : p('old-route');
    if (packet > 0) {
      const end = api.trace(ctx, switched ? newRoute : oldRoute, packet, C.cyan, 7);
      if (end) api.circle(ctx, end.x, end.y, 12, C.yellow);
    }
  });
  focus.target('worker-trace', () => {
    text('Request trace', 1510, 285, 32, C.muted);
    if (p('old-receipt') > 0) {
      text('served C', 1510, 478, 47, C.pink);
      text('raw features', 1510, 534, 28, C.muted);
    }
    if (p('new-receipt') > 0) {
      text('served B', 1510, 715, 47, C.green);
      text('L2 features', 1510, 771, 28, C.muted);
    }
  });
  focus.target('recovery-limit', () => {
    api.line(ctx, 150, 866, 1770, 866, C.muted, 2);
    const label =
      p('external-effects') > 0
        ? 'Check shared index integrity and any actions already taken'
        : p('new-receipt') > 0
          ? 'A new us-west request has reached the restored worker'
          : 'The gateway routes to a loaded worker';
    text(label, 960, 970, 40, C.ink, 'center');
  });
}
export default {
  id: 'worker-recovery',
  draw: drawWorkerRecovery,
  cues: [
    'restore-alias',
    'old-route',
    'old-receipt',
    'load-worker',
    'ready-worker',
    'switch-worker',
    'new-route',
    'new-receipt',
    'external-effects',
  ],
};
