import { smoothstep } from 'vizmatic';
import { sceneClock } from '../scene-clock.mjs';
import {
  atGB,
  checkpointGB,
  deviceGB,
  gpuRows,
  halfGB,
  memoryBlock,
  memoryRail,
  reserveGB,
} from '../memory-rails.mjs';

export function drawIntro(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const loaded = smoothstep(clock.progress('load-weights'));
  const split = clock.progress('split-weights') > 0;
  const move = smoothstep(clock.progress('place-half'));
  const [upper, lower] = gpuRows;
  const deficit = reserveGB + checkpointGB - deviceGB;
  // Cut straight to the weight block while the scene title comes in.
  if (state.beat === 0) ctx.globalAlpha = 1;
  api.focus.target('device-memory', () => {
    gpuRows.forEach((y, rank) => memoryRail(ctx, api, rank, y));
    const limitX = atGB(deviceGB);
    api.text(ctx, `${deviceGB} GB limit`, limitX, upper - 168, 37, api.C.yellow, 'center');
    api.line(ctx, limitX, upper - 152, limitX, upper - 24, api.C.yellow, 3);
    if (split) {
      memoryBlock(ctx, api, reserveGB, upper, halfGB, api.C.blue, `${halfGB} GB`);
      const descent = Math.min(1, move * 2);
      const slide = Math.max(0, move * 2 - 1);
      const y = upper + (lower - upper) * descent;
      memoryBlock(
        ctx,
        api,
        reserveGB + halfGB * (1 - slide),
        y,
        halfGB,
        api.C.cyan,
        `${halfGB} GB`,
      );
    } else {
      const y = upper - 140 * (1 - loaded);
      memoryBlock(
        ctx,
        api,
        reserveGB,
        y,
        checkpointGB,
        api.C.blue,
        `${checkpointGB} GB of weights`,
      );
    }
    if (clock.done('spill') && move === 0) {
      const start = atGB(deviceGB),
        end = atGB(reserveGB + checkpointGB);
      api.line(ctx, start, upper + 137, end, upper + 137, api.C.pink, 5);
      api.text(ctx, `${deficit} GB over`, end + 15, upper + 150, 35, api.C.pink);
    }
  });
  const label =
    move === 1
      ? 'One checkpoint across two GPUs'
      : split
        ? 'Two equal shares of one checkpoint'
        : clock.done('spill')
          ? 'A full copy overflows either GPU'
          : clock.done('load-weights')
            ? 'How far past the limit?'
            : '';
  if (label) api.text(ctx, label, 960, 920, 51, api.C.ink, 'center');
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['reserved-space', 'load-weights', 'spill', 'split-weights', 'place-half', 'same-model'],
};
