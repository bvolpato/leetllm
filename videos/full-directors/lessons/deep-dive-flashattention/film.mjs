import assert from 'node:assert/strict';
import { workspace, slots, rescale } from './forward.mjs';
import { corner, bits, packed, pages } from './boundaries.mjs';
import { backward, gradient } from './training.mjs';
import { integration, headGroups, cache } from './integration.mjs';
import { compare, timing, decision } from './practice.mjs';
import { checkOperator } from './operator.mjs';

const painters = {c01:workspace,c02:slots,c03:rescale,c04:corner,polarity:bits,c05:packed,pages,c06:backward,gradient,c07:integration,heads:headGroups,cache,c08:compare,trace:timing,dispatch:decision};

function draw(ctx, clock) {
  const painter = painters[clock.beat.chapterId];
  assert.ok(painter, 'Unknown teaching chapter: ' + clock.beat.chapterId);
  painter(ctx, clock);
}

export default { title:'FlashAttention Through the Memory Window', draw, check:checkOperator };
