import { checkExamples } from './examples.mjs';
import { access, lookup, observed, retry, shape } from './library.mjs';
import {
  choice,
  deferred,
  duplicates,
  envelope,
  exposure,
  linkage,
  ownership,
  parameters,
  recovery,
  strict,
  trajectory,
  wholeBatch,
} from './dispatch.mjs';
import {
  auditRuns,
  budget,
  comparison,
  errorRate,
  fanIn,
  gate,
  intent,
  mcp,
  routing,
  sameSuite,
} from './bench.mjs';

const painters = [
  lookup,
  errorRate,
  envelope,
  linkage,
  wholeBatch,
  shape,
  strict,
  choice,
  access,
  ownership,
  observed,
  sameSuite,
  access,
  gate,
  retry,
  intent,
  parameters,
  recovery,
  duplicates,
  fanIn,
  routing,
  deferred,
  trajectory,
  auditRuns,
  mcp,
  exposure,
  budget,
  comparison,
];
export default {
  title: 'From a Model Request to a Tool Action',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.6, 1.6);
    painters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check: checkExamples,
};
