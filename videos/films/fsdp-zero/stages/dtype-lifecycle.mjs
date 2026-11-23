import { onWords } from '../card-memory.mjs';

export function drawDtypeLifecycle(ctx, scene, state, api) {
  const { C } = api;
  const gather = onWords(state, api, 1, 'full-weights', 0.28, 0.47);
  const local = onWords(state, api, 1, 'full-gradient', 0.62, 0.82);
  const release = onWords(state, api, 2, 'free-weights', 0.03, 0.12);
  const reduced = onWords(state, api, 2, 'reduce-gradient', 0.15, 0.3);
  const updated = onWords(state, api, 2, 'update-shard', 0.35, 0.48);
  const cleared = onWords(state, api, 2, 'clear-gradient', 0.55, 0.7);
  const ranks = 4;
  const fullGradient = 4; // One billion FP32 values in decimal GB.
  const localGB = fullGradient / ranks;
  const segments = [
    ['owned-weight', 'FP32 weight shard', localGB, C.blue],
    ['moments', 'Two FP32 moment shards', 2 * localGB, C.yellow],
    ['compute-copy', 'BF16 compute copy', 2 * gather * (1 - release), C.cyan],
    ['local-gradient', reduced === 1 ? 'Reduced FP32 gradient' : 'Local FP32 gradient',
      (fullGradient - (fullGradient - localGB) * reduced) * local * (1 - cleared), C.pink],
  ];
  api.text(ctx, 'Rank 0   /   four ranks   /   one billion parameters in this unit', 120, 260, 37, C.ink);
  api.text(ctx, 'Buffers after Adam has initialized its moments', 120, 330, 30, C.muted);
  segments.forEach(([target, label, value, color], i) => {
    const y = 408 + i * 127;
    api.focus.target(target, () => {
      api.text(ctx, label, 565, y + 50, 32, C.ink, 'right');
      for (let j = 0; j < 4; j++) {
        const x = 615 + j * 243;
        api.rect(ctx, x, y, 235, 77, C.panel, C.muted, 2);
        const gb = api.clamp(value - j);
        if (gb > 0) api.rect(ctx, x, y + 7, gb * 235, 63, color, undefined, 0);
      }
      if (Number.isInteger(value)) api.text(ctx, value + ' GB', 1640, y + 52, 36, color);
      if (i === 0 && updated === 1) api.text(ctx, 'updated', 730, y + 49, 28, C.bg, 'center');
    });
  });
  const note = cleared === 1 ? 'Gradient cleared to None: the shard’s storage is released'
    : updated === 1 ? 'Update complete: the reduced gradient is still allocated'
    : reduced === 1 ? 'The reduced gradient belongs to the same shard as the weight'
    : local === 1 ? 'The full local gradient exists before reduce-scatter'
    : '4 bytes for the weight  +  4 for its gradient  +  8 for Adam moments';
  api.text(ctx, note, 960, 982, 35, C.ink, 'center');
}
export default {
  id: 'dtype-lifecycle', draw: drawDtypeLifecycle,
  cues: ['full-weights', 'full-gradient', 'free-weights', 'reduce-gradient', 'update-shard', 'clear-gradient'],
};
