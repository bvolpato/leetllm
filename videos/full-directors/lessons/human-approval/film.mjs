import { checkExamples } from './examples.mjs';
import { storefront, guarded, reconcile, exercise } from './storefront.mjs';
import { oversight, binding, outbox, alternatives } from './review.mjs';
import { durable, graphPause, temporal } from './waiting.mjs';
import { batch, queue, weekend } from './practice.mjs';

const chapters = {
  c01: storefront,
  c02: oversight,
  c03: durable,
  'c03-graph': graphPause,
  'c03-temporal': temporal,
  c04: binding,
  'c04-outbox': outbox,
  c05: guarded,
  c06: reconcile,
  c07: alternatives,
  'c07-batch': batch,
  c08: queue,
  'c08-window': weekend,
  'c08-practice': exercise,
};

export default {
  title: 'Human Approval: Exact Intent, Durable Decisions and Verified Effects',
  draw(c, clock) {
    chapters[clock.beat.chapterId](c, clock);
  },
  check: checkExamples,
};
