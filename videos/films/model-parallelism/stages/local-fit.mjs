import { localPlacement } from '../arithmetic.mjs';
import {
  atGB,
  gpuRows,
  halfGB,
  limitLabel,
  memoryBlock,
  memoryRail,
  poolGB,
  reserveGB,
} from '../memory-rails.mjs';
import { sceneClock } from '../scene-clock.mjs';

const plan = localPlacement([35, 15], poolGB);
const perRequest = 0.75;
export function drawLocalFit(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  api.focus.target('request-pools', () => {
    limitLabel(ctx, api);
    gpuRows.forEach((y, rank) => {
      memoryRail(ctx, api, rank, y);
      memoryBlock(ctx, api, reserveGB, y, halfGB, rank ? api.C.cyan : api.C.blue, '35 weights');
      const start = reserveGB + halfGB;
      if (state.beat === 0) {
        api.text(
          ctx,
          `${poolGB} GB free`,
          atGB(start + poolGB / 2),
          y + 64,
          37,
          api.C.green,
          'center',
        );
      } else {
        const p = clock.progress(rank ? 'right-placement' : 'left-placement');
        const gb = plan.values[rank];
        memoryBlock(ctx, api, start, y, gb * p, api.C.yellow, p === 1 ? `${gb} GB KV` : '');
        if (clock.done('local-verdict')) {
          const free = plan.free[rank];
          api.text(
            ctx,
            free < 0 ? `${-free} GB over` : `${free} GB spare`,
            atGB(start),
            y + 165,
            42,
            free < 0 ? api.C.pink : api.C.green,
          );
        }
      }
    });
    let footer = `${plan.groupCapacity} GB across the pair   ÷   ${perRequest} GB per request`;
    if (clock.done('request-ceiling'))
      footer += `   →   ${Math.floor(plan.groupCapacity / perRequest)} whole requests`;
    if (state.beat > 0)
      footer = clock.done('local-verdict')
        ? 'Placement must fit on each GPU before admission'
        : `${plan.groupTotal} GB requested   ·   Which GPU runs out first?`;
    api.text(ctx, footer, 960, 938, 45, api.C.ink, 'center');
  });
}
export default {
  id: 'local-fit',
  draw: drawLocalFit,
  cues: ['request-pool', 'request-ceiling', 'left-placement', 'right-placement', 'local-verdict'],
};
