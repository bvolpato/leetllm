import { surface } from './studio.mjs';
import { checkExamples } from './examples.mjs';
import { opening, eventContract, joined, asof, denominators, bounds } from './delivery.mjs';
import {
  longClock,
  streamContract,
  percentile,
  runtime,
  trace,
  wire,
  attributes,
} from './clocks.mjs';
import {
  costing,
  usage,
  privacy,
  metadata,
  alertWindow,
  sampling,
  tail,
  weights,
} from './collection.mjs';
import { poller, growth, tool, practice, incident, candidate } from './replay.mjs';

const scenes = [
  opening,
  eventContract,
  joined,
  asof,
  denominators,
  bounds,
  longClock,
  streamContract,
  percentile,
  runtime,
  trace,
  wire,
  attributes,
  costing,
  usage,
  privacy,
  metadata,
  alertWindow,
  sampling,
  tail,
  weights,
  poller,
  growth,
  tool,
  practice,
  incident,
  candidate,
];
const nightScenes = new Set([7, 8, 10, 11, 19, 20, 24, 26]);
function draw(ctx, clock) {
  const index = clock.beat.chapterIndex;
  ctx.save();
  surface(ctx, nightScenes.has(index + 1));
  scenes[index](ctx, clock);
  ctx.restore();
}
export default { title: 'Find the Failure Behind a Healthy Dashboard', draw, check: checkExamples };
