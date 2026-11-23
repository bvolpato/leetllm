import { weightLedger } from '../arithmetic.mjs';
import { sceneClock } from '../scene-clock.mjs';
import {
  atGB,
  checkpointGB,
  deviceGB,
  gpuRows,
  limitLabel,
  memoryBlock,
  memoryRail,
  reserveGB,
} from '../memory-rails.mjs';

export function drawWeightBudget(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const four = clock.done('four-devices');
  const ranks = four ? 4 : 2;
  const ledger = weightLedger(35e9, 2, deviceGB * 1e9, reserveGB * 1e9, ranks);
  const shard = ledger.weight / 1e9;
  api.focus.target('weight-ledger', () => {
    if (state.beat < 2) {
      limitLabel(ctx, api);
      const rows = four ? [gpuRows[0]] : gpuRows;
      rows.forEach((y, rank) => {
        memoryRail(ctx, api, rank, y, four ? 'Each GPU' : undefined);
        memoryBlock(ctx, api, reserveGB, y, shard, rank ? api.C.cyan : api.C.blue, `${shard} GB`);
        if (clock.done(four ? 'four-room' : 'two-room')) {
          api.text(
            ctx,
            `${ledger.free / 1e9} GB free`,
            atGB((reserveGB + shard + deviceGB) / 2),
            y + 64,
            36,
            api.C.green,
            'center',
          );
        }
      });
      if (four)
        api.text(
          ctx,
          '4 equal shares of the same checkpoint',
          960,
          gpuRows[1] + 65,
          46,
          api.C.ink,
          'center',
        );
      const formula = four
        ? `${checkpointGB} GB ÷ 4 GPUs = ${shard} GB of weights per GPU`
        : clock.done('lower-bound')
          ? 'Minimum for weights = ceil(70 / 64) = 2 GPUs'
          : 'Available for weights and requests = 80 − 16 = 64 GB per GPU';
      api.text(ctx, formula, 960, 922, 43, api.C.ink, 'center');
      return;
    }
    const total = 35,
      active = 3,
      rawBytes = clock.done('raw-codes') ? 0.5 : 2;
    api.text(ctx, 'Parameters in GPU memory', 240, 310, 40, api.C.ink);
    api.text(ctx, 'Active for one token', 240, 580, 40, api.C.ink);
    for (let i = 0; i < total; i++) {
      const x = 240 + i * 40;
      api.rect(ctx, x, 350, 34, 96, api.C.blue, undefined, 0);
      api.rect(ctx, x, 620, 34, 96, i < active ? api.C.cyan : api.C.panel, undefined, 0);
    }
    api.text(ctx, '≈ 35 billion', 240, 500, 37, api.C.blue);
    api.text(ctx, '≈ 3 billion', 240, 770, 37, api.C.cyan);
    api.text(
      ctx,
      `35 billion × ${rawBytes} bytes = ${total * rawBytes} GB of raw weights`,
      960,
      942,
      48,
      api.C.ink,
      'center',
    );
  });
}
export default {
  id: 'weight-budget',
  draw: drawWeightBudget,
  cues: ['lower-bound', 'two-room', 'four-devices', 'four-room', 'resident-count', 'raw-codes'],
};
