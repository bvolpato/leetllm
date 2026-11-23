import { spoken } from '../arithmetic.mjs';
import { rotationPool } from '../model.mjs';

const pool = rotationPool(1_000_003, 50_331_648, 14_884_405_248);
const num = (n) => n.toLocaleString('en-US');

export function drawCacheAllocation(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  api.focus.target('cache-allocation-mechanism', () => {
    const left = 175, width = 1570;
    text(ctx, 'One slot   =   X + Z + Y   =   ' + num(pool.slot) + ' bytes', left, 255, 37, C.ink);
    text(ctx, '8 slots', left, 405, 33, C.blue);
    text(ctx, num(8 * pool.slot) + ' B', left, 466, 36, C.blue);
    text(ctx, '2 × L2 + 1 slot', 960, 405, 33, C.yellow, 'center');
    text(ctx, num(2 * pool.l2 + pool.slot) + ' B', 960, 466, 36, C.yellow, 'center');
    text(ctx, 'Recorded L2', left + width, 405, 33, C.muted, 'right');
    text(ctx, num(pool.l2) + ' B', left + width, 466, 36, C.muted, 'right');
    const grown = spoken(state, 'ten-slot-pool', 1);
    const allocated = Math.min(pool.slots, 9 + Math.floor(grown));
    const visits = Math.floor(pool.warmup * spoken(state, 'slot-warmup', 2));
    const cell = width / pool.slots;
    const targetX = left + pool.target / pool.slot * cell;
    const target = spoken(state, 'rotation-target', 0) > 0;
    for (let i = 0; i < pool.slots; i++) {
      const active = visits > 0 && (visits - 1) % pool.slots === i;
      rect(ctx, left + i * cell, 613, cell - 4, 119, active ? C.yellow : i < allocated ? C.blue : C.panel, C.muted, 1);
      text(ctx, String(i), left + (i + 0.5) * cell, 687, 37, i < allocated ? C.bg : C.muted, 'center');
    }
    if (target) {
      line(ctx, targetX, 559, targetX, 752, C.yellow, 4);
      text(ctx, 'target', targetX, 540, 31, C.yellow, 'center');
    }
    text(ctx, 'Slot IDs', left, 797, 30, C.muted);
    text(ctx, allocated + ' slots   ·   ' + num(allocated * pool.slot) + ' bytes', left + width, 797, 37, C.ink, 'right');
    const caption = state.beat === 2 ? 'Warmup launches   ' + visits + ' / ' + pool.warmup :
      allocated < pool.slots ? 'Will nine whole slots reach the target?' : 'Round up to ten whole slots.';
    text(ctx, caption, 960, 945, 45, C.ink, 'center');
  });
}
export default { id: 'cache-allocation', draw: drawCacheAllocation, cues: ['rotation-target', 'ten-slot-pool', 'slot-warmup'] };
