import { check } from './evidence.mjs';
import { baseplate } from './art.mjs';
import { opening, record, grade, inventory, provenance, repairScene } from './answers.mjs';
import { bootstrap, pairing, selector, judge } from './sampling.mjs';
import {
  filterScene,
  emptyView,
  regression,
  collection,
  ownership,
  routingScene,
  fifth,
} from './decisions.mjs';

const painters = [
  opening,
  record,
  grade,
  inventory,
  provenance,
  repairScene,
  bootstrap,
  pairing,
  selector,
  judge,
  filterScene,
  emptyView,
  regression,
  collection,
  ownership,
  routingScene,
  fifth,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(clock.width / 1600, clock.height / 900);
  baseplate(ctx);
  painters[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
export default { title: 'A Dashboard That Explains the Decision', draw, check };
