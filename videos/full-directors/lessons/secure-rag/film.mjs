import { background } from './atelier.mjs';
import { opening, loom, buffered, closing, checkCopies } from './copies.mjs';
import {
  models,
  identity,
  join,
  filter,
  receipts,
  predicate,
  revoke,
  metadata,
  rls,
  scan,
  expected,
  checkRetrieval,
} from './retrieval.mjs';
import {
  lag,
  sync,
  freshness,
  children,
  layouts,
  rewrite,
  external,
  credential,
  directory,
  capability,
  temporary,
  checkPolicy,
} from './policy.mjs';
import {
  output,
  destinationsScene,
  action,
  audit,
  guide,
  vectors,
  matrix,
  transfer,
  checkRelease,
} from './release.mjs';

const painters = [
  opening,
  models,
  identity,
  join,
  filter,
  receipts,
  predicate,
  revoke,
  metadata,
  rls,
  scan,
  expected,
  lag,
  sync,
  freshness,
  children,
  layouts,
  loom,
  rewrite,
  external,
  credential,
  directory,
  capability,
  temporary,
  buffered,
  output,
  destinationsScene,
  action,
  audit,
  guide,
  vectors,
  matrix,
  transfer,
  closing,
];
export default {
  title: 'Retrieving Only the Evidence a User May See',
  draw(ctx, clock) {
    background(ctx);
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    checkCopies();
    checkRetrieval();
    checkPolicy();
    checkRelease();
  },
};
