import assert from 'node:assert/strict';
import { checkModel } from './model.mjs';
import { intro, geometry, partition, reserve, blockTails, sharing } from './memory.mjs';
import { membership, bandwidth, phaseCost, decision, finalTrial } from './service.mjs';
import { verify, yieldCost, compression } from './alternatives.mjs';
const painters = {
  c01: intro,
  c02: geometry,
  c03: partition,
  c04: reserve,
  c05: blockTails,
  prefix: sharing,
  schedule: membership,
  c06: bandwidth,
  phases: phaseCost,
  c07: decision,
  verify,
  yield: yieldCost,
  precision: compression,
  c08: finalTrial,
};
function draw(ctx, clock) {
  const painter = painters[clock.beat.chapterId];
  assert(painter, 'Unknown teaching chapter ' + clock.beat.chapterId);
  painter(ctx, clock);
}
export default { title: 'Fitting More Conversations into GPU Memory', draw, check: checkModel };
