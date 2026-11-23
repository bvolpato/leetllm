import { burst } from '../arithmetic.mjs';
import { requestStrip, startBoard, decision } from '../admission-board.mjs';
import { cueProgress, afterClause } from '../timing.mjs';

const rows = burst(1);
const request = rows[20];
const firstPossible = burst(1, 40)[20].start;
const firstGroup = rows.filter((row) => row.start === 0);

function drawQueueTicket(ctx, state, api) {
  const { C } = api;
  ctx.save();
  // The ticket is already in the caller's hand on the first frame.
  ctx.globalAlpha = 1;
  api.focus.target('arrival-order', () => {
    const x = 140;
    const y = 265;
    const width = 610;
    api.rect(ctx, x, y, width, 555, C.yellow, undefined, 18);
    api.text(ctx, 'Incident summary', x + 52, y + 88, 50, C.bg);
    api.text(ctx, '#' + request.id.slice(1), x + width / 2, y + 328, 192, C.bg, 'center');
    for (let i = 0; i < 18; i++) {
      const tick = x + 22 + i * 32;
      api.line(ctx, tick, y + 395, tick + 13, y + 395, C.bg, 3);
    }
    for (const edge of [x, x + width]) api.circle(ctx, edge, y + 395, 16, C.bg);
    api.text(
      ctx,
      'Start within ' + request.deadline + ' s',
      x + width / 2,
      y + 493,
      50,
      C.bg,
      'center',
    );
  });
  api.focus.target('start-grid', () => {
    api.text(ctx, 'One warm GPU', 910, 365, 54, C.ink);
    api.rect(ctx, 910, 423, 820, 273, C.panel, C.cyan, 12);
    const insertion = Math.min(1, Math.max(0, state.t / 0.65));
    for (const [i, row] of firstGroup.entries()) {
      const x = 946 + i * 151;
      api.rect(ctx, x, 477, 137, 145, C.bg, C.muted, 5);
      const y = 443 + 37 * insertion;
      api.rect(ctx, x + 4, y, 129, 137, C.cyan, undefined, 5);
      api.text(ctx, row.id, x + 69, y + 86, 49, C.bg, 'center');
    }
    for (let x = 1040; x < 1600; x += 36) api.rect(ctx, x, 698, 20, 22, C.muted, undefined, 1);
    api.text(ctx, '10 s per request', 1318, 807, 43, C.ink, 'center');
  });
  api.focus.target('cold-worker', () => {
    const cold = cueProgress(state, 'cold-clock', 0, 0.72, 0.98) > 0;
    api.text(
      ctx,
      cold ? 'Next GPU ready at 207 s' : '9:00 a.m.  ·  100 requests arrive together',
      960,
      975,
      40,
      cold ? C.blue : C.muted,
      'center',
    );
  });
  ctx.restore();
}

export function drawIntro(ctx, scene, state, api) {
  if (state.beat === 0) return drawQueueTicket(ctx, state, api);
  const { C } = api;
  const last = afterClause(state, 'last-five', 2, 0.37);
  const expired = afterClause(state, 'turn-too-late', 2, 0.8);
  let now = 20 * cueProgress(state, 'two-refills', 1, 0.12, 0.58);
  if (last) now = 30;
  if (expired) now = 40;
  requestStrip(ctx, api, {
    rows,
    deadline: 30,
    now,
    pin: request.id,
    detail: 'Next GPU ready at 207 s',
  });
  startBoard(ctx, api, {
    rows,
    slots: 5,
    warm: 1,
    service: 10,
    deadline: 30,
    now,
    slotDetail: true,
  });
  let message = 'Does R21 start by 30 s?';
  if (last) message = '30 s  ·  R16–R20 take the last five starts';
  if (expired)
    message = request.id + ' expires  ·  earliest possible turn at ' + firstPossible + ' s';
  decision(ctx, api, message, expired ? C.pink : C.ink);
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'find-request',
    'first-five',
    'cold-clock',
    'two-refills',
    'last-tick-question',
    'last-five',
    'turn-too-late',
  ],
};
