import { chapterCard, panel, text } from '../defaults.mjs';
import { eighteen, motion, passed, recorded } from '../ledger.mjs';
import { rayApplyBatch } from '../model.mjs';

const blind = eighteen.ledger.count + 2;
const safe = rayApplyBatch(eighteen.ledger, 'B18', 2);

export function drawRetry(ctx, scene, state, api) {
  const { C } = api;
  const first = passed(state, 'retry-first', 0);
  const lost = motion(state, 'retry-lost', 0);
  const second = motion(state, 'retry-again', 1);
  const doubled = passed(state, 'retry-blind', 1);
  const found = passed(state, 'retry-hit', 1);
  const reply = motion(state, 'retry-return', 1);
  text(ctx, api, 'Caller’s reply', 315, 260, 41, C.ink, 'center');
  text(ctx, api, 'B18   ·   2 documents', 885, 260, 37, C.cyan, 'center');
  text(ctx, api, 'Ledger count', 1280, 260, 41);
  for (const [i, durable] of [false, true].entries()) {
    const y = 418 + i * 329;
    const blindReply = !durable && doubled && second === 1;
    const hasReply = durable ? passed(state, 'retry-return', 1) : blindReply;
    const total = !first ? recorded.count : !durable && doubled ? blind : eighteen.ledger.count;
    const value = durable ? safe.result : blind;
    chapterCard(
      ctx,
      api,
      hasReply ? String(value) : '…',
      135,
      y - 58,
      360,
      hasReply ? C.green : C.muted,
      116,
      62,
    );
    text(
      ctx,
      api,
      durable ? 'With batch receipts' : 'Blind retry',
      315,
      y + 108,
      34,
      durable ? C.green : C.pink,
      'center',
    );
    api.focus.target('retry-wire', () => {
      const x1 = 528,
        x2 = 1218;
      if (second > 0 && second < 1) {
        const x = x1 + 72 + (x2 - x1 - 144) * second;
        api.line(ctx, x1, y, x2, y, C.muted, 2);
        chapterCard(ctx, api, 'B18', x - 70, y - 38, 140, C.cyan, 76, 33);
      } else if (durable && reply > 0 && reply < 1) {
        api.line(ctx, x1, y, x2, y, C.green, 3);
        const x = x2 - 75 - (x2 - x1 - 150) * reply;
        chapterCard(ctx, api, '5', x - 70, y - 38, 140, C.green, 76, 36);
      } else if (hasReply) {
        api.arrow(ctx, x2, y, x1, y, C.green, 3);
        text(ctx, api, 'Second reply', 865, y - 28, 31, C.green, 'center');
      } else if (lost > 0) {
        // The first reply travels left and stops short of the caller.
        const x = x2 - lost * 366;
        api.line(ctx, x, y, x2, y, C.pink, 3);
        if (lost < 1) api.circle(ctx, x, y, 10, C.pink);
        else {
          api.line(ctx, x - 12, y - 12, x + 12, y + 12, C.pink, 5);
          api.line(ctx, x - 12, y + 12, x + 12, y - 12, C.pink, 5);
          text(ctx, api, 'First reply lost', 865, y - 34, 32, C.pink, 'center');
        }
      } else api.arrow(ctx, x1, y, x2, y, C.cyan, 3);
    });
    api.focus.target('retry-ledger', () =>
      api.focus.target(durable ? 'retry-safe-ledger' : 'retry-blind-ledger', () => {
        panel(ctx, api, 1260, y - 95, 495, 226, durable ? C.green : C.pink);
        text(ctx, api, String(total), 1352, y + 16, 81, C.ink, 'center');
        const effectCount = Number(first) + Number(!durable && doubled);
        for (let mark = 0; mark < effectCount; mark++) {
          chapterCard(ctx, api, '+2', 1450 + 140 * mark, y - 61, 114, C.yellow, 77, 35);
        }
        const note =
          durable && first ? 'Receipt   B18 → ' + safe.result : 'B18 commits   ' + effectCount;
        text(ctx, api, note, 1505, y + 91, 34, durable && found ? C.yellow : C.muted, 'center');
      }),
    );
  }
  if (state.beat === 0 && lost === 1)
    text(ctx, api, 'Can the caller tell whether B18 committed?', 960, 975, 41, C.yellow, 'center');
  if (state.beat === 2)
    text(
      ctx,
      api,
      'Each run started at 3 and received two attempts for B18.',
      960,
      975,
      35,
      C.ink,
      'center',
    );
}
export default {
  id: 'retry',
  draw: drawRetry,
  cues: [
    'retry-first',
    'retry-lost',
    'retry-again',
    'retry-blind',
    'retry-hit',
    'retry-return',
    'retry-audit',
  ],
};
