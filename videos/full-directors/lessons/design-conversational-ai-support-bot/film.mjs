import assert from 'node:assert/strict';
import { opening, channels, state, contract, evidence, consent } from './casework.mjs';
import { reads, ledger, replies, handoff } from './dispatch.mjs';
import { costs, evaluation, practice, labeledCases } from './settlement.mjs';
import { check as checkRecords } from './records.mjs';

const chapters = [
  opening,
  channels,
  state,
  contract,
  evidence,
  consent,
  reads,
  ledger,
  replies,
  handoff,
  costs,
  evaluation,
  practice,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(1.6, 1.6);
  chapters[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
function check() {
  checkRecords();
  assert.deepEqual(
    [
      labeledCases.filter((c) => c.sent).length,
      labeledCases.filter((c) => c.needed).length,
      labeledCases.filter((c) => c.needed && c.sent).length,
    ],
    [3, 4, 2],
  );
  return true;
}
export default { title: 'A Support Assistant That Can Explain Every Action', draw, check };
