import { progress } from '../phrase-clock.mjs';

const tasks = [
  { name: 'F', version: 11, fraction: 1 },
  { name: 'G', version: 11, fraction: 0.65 },
];
const required = [['F'], ['F', 'G']];

export function drawAsyncFuture(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  const running = p('overlap-future');
  const waited = p('future-returns');
  const completed = new Set(waited === 1 ? ['F'] : []);
  return api.focus.target('async-work', () => {
    api.text(ctx, 'Rollout GPUs', 126, 286, 35, C.blue);
    api.text(
      ctx,
      'Separate training GPUs   /   actor ' + (p('actor-advances') === 1 ? 'v12' : 'v11'),
      1760,
      286,
      35,
      C.ink,
      'right',
    );
    tasks.forEach((task, i) => {
      const y = 408 + 155 * i;
      const length = i === 0 ? 0.6 * running + 0.4 * waited : task.fraction * p('start-background');
      api.text(
        ctx,
        i ? 'G   custom worker' : 'F   next rollout',
        128,
        y + 14,
        38,
        i ? C.yellow : C.blue,
      );
      api.line(ctx, 605, y, 1422, y, C.muted, 3);
      if (length > 0) api.line(ctx, 605, y, 605 + 817 * length, y, i ? C.yellow : C.blue, 9);
      const status = completed.has(task.name) ? 'returned' : length > 0 ? 'in flight' : 'ready';
      api.text(ctx, status, 1748, y + 14, 38, completed.has(task.name) ? C.green : C.ink, 'right');
      if (length > 0) api.text(ctx, `sampled on v${task.version}`, 605, y + 66, 30, C.muted);
    });
    if (state.beat > 0) {
      required.forEach((set, i) => {
        const tx = i ? 1250 : 650;
        api.text(ctx, 'Required: ' + set.join(' and '), tx, 765, 39, C.ink, 'center');
        const ready = set.every((name) => completed.has(name));
        const reveal = p(i ? 'missing-g' : 'have-f') === 1;
        api.text(
          ctx,
          reveal ? (ready ? 'Check met' : 'Still waiting for G') : '?',
          tx,
          842,
          45,
          reveal ? (ready ? C.green : C.yellow) : C.muted,
          'center',
        );
      });
    }
    const footer =
      state.beat === 0
        ? 'The caller waits on the next-rollout future at its sync interval.'
        : state.beat === 1
          ? 'Which required set has finished?'
          : 'Coordinate G before a live weight change.';
    api.text(ctx, footer, 960, 975, 35, state.beat === 1 ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'async-future',
  draw: drawAsyncFuture,
  cues: [
    'overlap-future',
    'start-background',
    'actor-advances',
    'future-returns',
    'compare-waits',
    'have-f',
    'missing-g',
  ],
};
