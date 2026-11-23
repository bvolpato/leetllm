import { burst, outcomes } from '../arithmetic.mjs';
import { decision, requestStrip, startBoard } from '../admission-board.mjs';
import { afterClause } from '../timing.mjs';

const pools = Object.fromEntries([1, 3, 20].map((warm) => [warm, burst(warm)]));

export function drawBurst(ctx, scene, state, api) {
  const { C } = api;
  const three = afterClause(state, 'three-warm', 1, 0.29);
  const twenty = afterClause(state, 'twenty-ready', 3, 0.36);
  const warm = twenty ? 20 : three ? 3 : 1;
  const rows = pools[warm];
  const { start, worker } = rows[20];
  const result = outcomes(rows);
  let now = 40;
  if (three) now = afterClause(state, 'more-admitted', 2, 0.33) ? start : 0;
  if (three && afterClause(state, 'queue-expiry', 2, 0.84)) now = 40;
  if (twenty) now = afterClause(state, 'all-at-once', 3, 0.62) ? 0 : -1;
  requestStrip(ctx, api, {
    rows,
    now,
    deadline: 30,
    pin: 'R21',
    detail: warm + ' warm  ·  5 slots per replica',
  });
  if (twenty) {
    api.focus.target('start-grid', () => {
      api.text(ctx, 'At the instant the queue opens', 145, 460, 39, C.ink);
      for (let i = 0; i < warm; i++) {
        const x = 145 + (i % 10) * 164;
        const y = 527 + Math.floor(i / 10) * 132;
        api.text(ctx, 'GPU ' + (i + 1), x, y, 28, C.muted);
        for (let k = 0; k < 5; k++) {
          const r = rows[5 * i + k];
          const col = now >= r.start ? C.cyan : C.panel;
          api.rect(ctx, x + k * 28, y + 21, 23, 49, col, r.id === 'R21' ? C.yellow : C.muted, 2);
        }
      }
    });
  } else {
    startBoard(ctx, api, {
      trackedId: 'R21',
      rows,
      slots: 5,
      warm,
      service: 10,
      deadline: 30,
      now,
      slotDetail: !three,
    });
  }
  let message =
    '1 warm  ·  ' +
    result.admitted.length +
    ' start by 30 s  ·  ' +
    result.expired.length +
    ' expire';
  if (three) message = 'Which worker takes R21 when the slots reopen at 10 s?';
  if (three && now >= start) message = 'R21 starts on GPU ' + worker + ' at ' + start + ' s';
  if (three && now > 30)
    message =
      '3 warm  ·  ' +
      result.admitted.length +
      ' start by 30 s  ·  ' +
      result.expired.length +
      ' expire';
  if (twenty)
    message =
      now < 0 ? '20 workers already warm at 9 a.m.' : '20 warm  ·  all 100 start immediately';
  decision(ctx, api, message);
}
export default {
  id: 'burst',
  draw: drawBurst,
  cues: [
    'one-warm-outcome',
    'three-warm',
    'more-admitted',
    'queue-expiry',
    'twenty-ready',
    'all-at-once',
  ],
};
