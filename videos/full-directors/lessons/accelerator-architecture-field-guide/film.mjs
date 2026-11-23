import { roof, projectionScene, checkProjection } from './projection.mjs';
import { memory, spill, checkMemory } from './memory.mjs';
import { lanes, checkLanes } from './lanes.mjs';
import { drawTilePass, checkTilePass } from './tile-pass.mjs';
import { fabric, checkFabric } from './fabric.mjs';
import { requests, checkRequests } from './requests.mjs';

function tileChapter(ctx, clock) {
  if (clock.beat.beatIndex < 6) drawTilePass(ctx, { ...clock, index: clock.beat.beatIndex });
  else spill(ctx, clock);
}
const painters = [roof, projectionScene, memory, lanes, tileChapter, fabric, requests];

export default {
  title: 'Follow the Bytes Through an Accelerator',
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    checkProjection();
    checkMemory();
    checkLanes();
    checkTilePass();
    checkFabric();
    checkRequests();
  },
};
