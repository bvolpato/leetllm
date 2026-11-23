import assert from 'node:assert/strict';
import { C, ground } from './press.mjs';
import { checkLedger } from './ledger.mjs';
import {
  overnightBills,
  anatomy,
  oneCall,
  prefix,
  reuse,
  physics,
  normalize,
  reasoning,
  tier,
  tierState,
} from './receipts.mjs';
import {
  writeRead,
  compatibility,
  cohorts,
  fiveTurns,
  answer,
  postage,
  schedule,
  nightly,
} from './workload.mjs';
import {
  archive,
  forecast,
  quality,
  reservation,
  atomic,
  fresh,
  calendar,
  accountState,
} from './decisions.mjs';

const chapters = [
  overnightBills,
  anatomy,
  oneCall,
  prefix,
  reuse,
  physics,
  normalize,
  reasoning,
  tier,
  writeRead,
  compatibility,
  cohorts,
  fiveTurns,
  answer,
  postage,
  schedule,
  nightly,
  (c, k) => schedule(c, k, true),
  archive,
  forecast,
  quality,
  reservation,
  atomic,
  fresh,
  calendar,
];
const rooms = [
  C.cloth,
  C.cloth,
  C.cloth,
  C.cloth,
  C.wine,
  C.night,
  C.night,
  C.night,
  C.dark,
  C.cloth,
  C.cloth,
  C.cloth,
  C.night,
  C.wine,
  C.night,
  C.night,
  C.cloth,
  C.night,
  C.wine,
  C.cloth,
  C.night,
  C.cloth,
  C.dark,
  C.dark,
  C.cloth,
];
function draw(c, k) {
  const i = k.beat.chapterIndex;
  ground(c, rooms[i]);
  chapters[i](c, k);
}
function check() {
  checkLedger();
  const clock = (beat, said = []) => ({
    beat: { beatIndex: beat - 1 },
    reveal: (phrase) => Number(said.includes(phrase)),
  });
  const initial = tierState(clock(2, ['One more token']));
  const landed = tierState(clock(3, ['The entire prompt']));
  assert.deepEqual(
    [initial.input, initial.inputRate, initial.cost, initial.result],
    [272000, 2.5, 0.68, 1],
  );
  assert.deepEqual(
    [landed.input, landed.inputRate, landed.cost, landed.result],
    [272001, 5, 1.360005, 0],
  );
  assert.equal(tierState(clock(3, ['The entire prompt', 'Compare it'])).result, 1);
  const full = tierState(clock(4, ['The long row still applies']));
  assert.deepEqual(
    [full.input, full.output, full.cost, full.title, full.result],
    [300000, 1000, 1.5225, 'Price a full call on the long row', 0],
  );
  assert.equal(tierState(clock(4, ['The long row still applies', 'Check the provider'])).result, 1);
  const held = accountState(clock(2, ['B sees six tenths']));
  const settled = accountState(clock(2, ['The rest of the held cent']));
  const timed = accountState(clock(3, ['Replay the same admission', 'The provider may still']));
  assert.deepEqual([held.free, settled.free, timed.free], [6000, 11430, 6000]);
  assert.deepEqual([held.held, settled.spent, timed.held], [10000, 4570, 10000]);
  assert.equal(accountState(clock(5, ['The provider may still']), true).free, 7000);
}
export default { title: 'Where a Language Model Spends Its Budget', draw, check };
