import { desk } from './art.mjs';
import { check } from './evidence.mjs';
import {
  outbox,
  paths,
  provenance,
  validity,
  filter,
  scopedGraph,
  lexical,
  bundles,
} from './archive.mjs';
import {
  expansion,
  packing,
  decision,
  citation,
  recorded,
  margin,
  revoke,
  cache,
} from './reading-room.mjs';
import { diagnosis, recall, latency, replay, gates, finalPractice } from './control-room.mjs';

const scenes = [
  outbox,
  paths,
  provenance,
  validity,
  filter,
  scopedGraph,
  lexical,
  bundles,
  expansion,
  packing,
  decision,
  citation,
  recorded,
  margin,
  revoke,
  cache,
  diagnosis,
  recall,
  latency,
  replay,
  gates,
  finalPractice,
];

function draw(ctx, clock) {
  ctx.save();
  ctx.scale(1.6, 1.6);
  desk(ctx);
  scenes[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
export default { title: 'Build a Production Retrieval Path You Can Trust', draw, check };
