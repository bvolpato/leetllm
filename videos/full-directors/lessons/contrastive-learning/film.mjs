import { bg } from './studio.mjs';
import { checks } from './examples.mjs';
import { opening, compass, spread, auditClips, transfer } from './archive.mjs';
import { order, pooling, pool, numerics, margin, temperature } from './comparison.mjs';
import {
  relation,
  dropout,
  batches,
  duplicates,
  objectives,
  mine,
  teacher,
} from './supervision.mjs';
import {
  architectures,
  maxsim,
  formatting,
  projection,
  nested,
  lookup,
  shortlist,
  evaluation,
  metrics,
  lift,
} from './retrieval.mjs';

const scenes = [
  opening,
  order,
  compass,
  pooling,
  (g, k) => pool(g, k, false),
  (g, k) => pool(g, k, true),
  numerics,
  margin,
  temperature,
  (g, k) => compass(g, k, true),
  spread,
  relation,
  dropout,
  auditClips,
  batches,
  duplicates,
  objectives,
  mine,
  teacher,
  architectures,
  maxsim,
  formatting,
  projection,
  nested,
  lookup,
  shortlist,
  evaluation,
  metrics,
  transfer,
  (g, k) => (k.beat.beatIndex < 4 ? duplicates(g, k, true) : lift(g, k)),
];
export default {
  title: 'Contrastive Comparisons That Survive Retrieval',
  draw(g, k) {
    bg(g);
    scenes[k.beat.chapterIndex](g, k);
  },
  check: checks,
};
