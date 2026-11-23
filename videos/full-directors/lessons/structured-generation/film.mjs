import { painter } from './press.mjs';
import { check } from './examples.mjs';
import * as decoder from './decoder.mjs';
import * as host from './host.mjs';
import { cost, deadline, finalCase } from './practice.mjs';

const scenes = [
  decoder.replies,
  decoder.interfaces,
  decoder.prefix,
  decoder.logits,
  decoder.weights,
  decoder.branch,
  decoder.shop,
  decoder.budgetEnd,
  decoder.stack,
  decoder.trie,
  decoder.cache,
  decoder.schedule,
  host.backend,
  host.bytes,
  host.job,
  host.wire,
  host.citations,
  host.scope,
  host.quote,
  host.tree,
  host.protocol,
  host.envelope,
  host.version,
  host.recovery,
  host.grants,
  host.digest,
  cost,
  deadline,
  (g) => decoder.stack(g, true),
  finalCase,
];

function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  const g = painter(ctx, clock);
  g.head(clock.beat.chapterTitle);
  scenes[clock.beat.chapterIndex](g);
  ctx.restore();
}

export default {
  title: 'Structured generation: which status can the dashboard show?',
  draw,
  check,
};
