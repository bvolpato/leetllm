import { atelier } from './art.mjs';
import { checkExamples } from './examples.mjs';
import {
  opening,
  position,
  edits,
  storeNotes,
  scope,
  patchbay,
  prefixSplice,
  cacheMeter,
} from './recorder.mjs';
import {
  allocation,
  cutoff,
  summary,
  worker,
  envelope,
  pack,
  owner,
  thrashing,
  skills,
  skillRoute,
} from './workbench.mjs';
import {
  bytes,
  artifacts,
  graphContract,
  execution,
  protectedFact,
  release,
  lookup,
  finalShift,
} from './restart.mjs';

const painters = [
  opening,
  position,
  edits,
  storeNotes,
  scope,
  (a) => patchbay(a, false),
  (a) => patchbay(a, true),
  prefixSplice,
  cacheMeter,
  (a) => allocation(a, false),
  cutoff,
  summary,
  worker,
  envelope,
  (a) => allocation(a, true),
  pack,
  owner,
  thrashing,
  skills,
  skillRoute,
  bytes,
  artifacts,
  graphContract,
  execution,
  protectedFact,
  release,
  lookup,
  finalShift,
];

export default {
  title: 'Building the Context an Answer Needs',
  check: checkExamples,
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](atelier(ctx, clock));
  },
};
