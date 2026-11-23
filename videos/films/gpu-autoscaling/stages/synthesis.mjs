import { burst, outcomes } from '../arithmetic.mjs';
import { decision, requestStrip, startBoard } from '../admission-board.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const four = burst(4);
const five = burst(5);
const short = outcomes(four);
const full = outcomes(five);

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const change = afterClause(state, 'fifth-ready', 2, 0.35);
  const fail = afterClause(state, 'four-short', 1, 0.29);
  const last = afterClause(state, 'hundred-starts', 3, 0.31);
  const rows = change ? five : four;
  let now = 20 * cueProgress(state, 'three-starts', 0, 0.39, 0.78);
  if (fail) now = 40;
  if (change) now = 20 * cueProgress(state, 'fill-again', 2, 0.4, 0.8);
  if (last) now = rows.at(-1).start;
  requestStrip(ctx, api, {
    rows,
    now,
    deadline: 30,
    pin: 'R100',
    detail: '5 slots per replica  ·  10 s per request',
  });
  startBoard(ctx, api, {
    trackedId: 'R100',
    rows,
    slots: 5,
    warm: change ? 5 : 4,
    service: 10,
    deadline: 30,
    now,
  });
  let message = 'Can four warm workers start all 100 by 30 s?';
  if (fail) message = short.admitted.length + ' start  ·  R81–R100 miss the gate';
  if (change) message = 'Where and when does R100 start?';
  if (last)
    message =
      full.admitted.length +
      ' start  ·  R100 gets GPU ' +
      five.at(-1).worker +
      ' at ' +
      five.at(-1).start +
      ' s';
  decision(ctx, api, message, last ? C.cyan : fail && !change ? C.pink : C.ink);
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['three-starts', 'four-short', 'fifth-ready', 'fill-again', 'hundred-starts'],
};
