import { edgeOwnership } from '../arithmetic.mjs';
import { chapterText } from '../defaults.mjs';

const pair = edgeOwnership(33, 1, 0).pairs.find(({ producer }) => producer.value === 65);
export function drawBarrier(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (key) => focus.cue(key)?.phase === 'after';
  const repaired = done('restart-slot');
  const steps = repaired
    ? [
        ['ordered-write', 'Warp 1 writes', 'write'],
        ['all-arrive', 'Barrier releases', 'barrier'],
        ['ordered-read', 'Warp 0 reads', 'read'],
        ['ordered-store', 'Warp 0 stores', 'store'],
      ]
    : [
        ['early-read', 'Warp 0 reads', 'read'],
        ['late-write', 'Warp 1 writes', 'write'],
        ['early-store', 'Warp 0 stores', 'store'],
      ];
  const events = steps.filter(([key]) => done(key));
  let shared = 'unwritten',
    register = 'empty',
    output = 'pending';
  for (const [, , action] of events) {
    if (action === 'write') shared = pair.producer.value;
    if (action === 'read') register = shared === 'unwritten' ? '?' : shared;
    if (action === 'store') output = register;
  }
  chapterText(
    ctx,
    api,
    repaired ? 'Replay with a block barrier' : 'One possible schedule without the barrier',
    960,
    272,
    40,
  );
  focus.target('barrier-events', () => {
    api.line(ctx, 260, 409, 1660, 409, '#424955', 5);
    steps.forEach(([key, label, action], i) => {
      const x = 280 + i * (1360 / (steps.length - 1));
      api.circle(
        ctx,
        x,
        409,
        done(key) ? 15 : 9,
        done(key) ? (action === 'barrier' ? C.green : C.cyan) : '#59616e',
      );
      if (done(key)) chapterText(ctx, api, label, x, 478, 34, C.ink);
    });
  });
  const fields = [
    ['Shared tile[1, 0]', shared, C.blue],
    ['Warp 0 register', register, C.yellow],
    ['Output B[32, 1]', output, C.cyan],
  ];
  fields.forEach(([label, value, color], i) => {
    const x = 385 + 575 * i;
    focus.target(['barrier-shared', 'barrier-register', 'barrier-output'][i], () => {
      chapterText(ctx, api, label, x, 614, 34, color);
      api.rect(ctx, x - 220, 655, 440, 154, C.panel, color, 6);
      chapterText(
        ctx,
        api,
        value,
        x,
        755,
        typeof value === 'number' || value === '?' ? 82 : 42,
        value === '?' ? C.pink : C.ink,
      );
    });
  });
  const prompt = repaired
    ? done('ordered-store')
      ? 'B[32, 1] receives 65 from A[1, 32]'
      : done('all-arrive')
        ? '256 threads have arrived. Warp 0 can read.'
        : 'Every thread reaches the barrier after its guarded writes.'
    : done('early-store')
      ? 'The store copies the earlier read. Its value is unknown.'
      : done('late-write')
        ? 'Which value will warp 0 store from its register?'
        : done('early-read')
          ? '? means the read has no defined value'
          : 'At entry the shared slot has no producer value.';
  chapterText(ctx, api, prompt, 960, 936, 36, C.ink);
}
export default {
  id: 'barrier',
  draw: drawBarrier,
  cues: [
    'early-read',
    'late-write',
    'early-store',
    'restart-slot',
    'ordered-write',
    'all-arrive',
    'ordered-read',
    'ordered-store',
  ],
};
