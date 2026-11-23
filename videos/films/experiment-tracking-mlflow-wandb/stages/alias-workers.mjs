import { cueClock } from '../report-picture.mjs';

export function drawAliasWorkers(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const moved = at('move-alias') === 1;
  const joined = at('new-worker') === 1;
  const backed = at('move-back') === 1;
  const refreshed = at('refresh-worker') === 1;
  const pointer = moved && !backed ? 'v3' : 'v2';
  const workers = [
    ['Worker A', 'Loaded before the move', 'v2'],
    [
      'Worker B',
      joined ? 'Loaded after the move' : 'Waiting to start',
      joined ? (refreshed ? 'v2' : 'v3') : '·',
    ],
  ];
  api.focus.target('pointer', () => {
    api.text(ctx, 'Registry', 125, 306, 38, C.muted);
    api.text(ctx, '@champion', 620, 317, 55, C.yellow, 'left', 'mono');
    api.arrow(ctx, 1020, 295, 1390, 295, C.yellow, 5);
    api.text(ctx, pointer, 1500, 320, 62, C.ink);
  });
  api.line(ctx, 125, 389, 1790, 389, C.muted, 2);
  api.text(ctx, 'Serving process', 125, 470, 32, C.muted);
  api.text(ctx, 'Alias resolution', 620, 470, 32, C.muted);
  api.text(ctx, 'Loaded version', 1430, 470, 32, C.muted);
  workers.forEach(([name, history, version], i) => {
    const y = 595 + 153 * i;
    api.focus.target(i ? 'worker-b' : 'worker-a', () => {
      api.text(ctx, name, 125, y, 47, C.ink);
      api.text(ctx, i && refreshed ? 'Reloaded after rollback' : history, 620, y, 39, C.ink);
      api.text(ctx, version, 1515, y, 55, C.cyan);
    });
  });
  api.focus.target('cache', () =>
    api.text(
      ctx,
      'MLflow 3.16.1 defaults   /   alias: 60 s    ·    explicit version: no expiry',
      125,
      956,
      37,
      C.muted,
    ),
  );
}
export default {
  id: 'alias-workers',
  draw: drawAliasWorkers,
  cues: ['worker-start', 'move-alias', 'new-worker', 'cache-policy', 'move-back', 'refresh-worker'],
};
