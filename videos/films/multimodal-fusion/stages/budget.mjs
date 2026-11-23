import { budgetSnapshot } from '../construction.mjs';
import {
  CONTEXT_LIMIT,
  OUTPUT_RESERVE,
  TEXT_TOKENS,
  VIEWS,
  VISUAL_TOKENS_336,
} from '../fixtures.mjs';
import { prefixPlan } from '../model.mjs';

const direct = prefixPlan(VISUAL_TOKENS_336);
const reduced = prefixPlan(32);
const fixed = TEXT_TOKENS + OUTPUT_RESERVE;
const available = CONTEXT_LIMIT - fixed;
const fmt = (n) => n.toLocaleString('en-US');

export function drawBudget(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const alloc = budgetSnapshot(beat, state.beatP, state.cues);
  const { text, reserve } = alloc;
  const views = alloc.views.length;
  const complete = alloc.reduced === VIEWS;
  const x0 = 180;
  const scale = 1530 / 5500;
  const x = (n) => x0 + n * scale;
  const limitX = x(CONTEXT_LIMIT);
  const segment = (start, count, y, color) => {
    if (count > 0) api.rect(ctx, x(start), y, count * scale, 66, color, C.panel, 0);
  };
  function row(y, counts, title, tint) {
    api.text(ctx, title, x0, y - 34, 38, tint);
    api.line(ctx, x0, y + 70, x(5500), y + 70, C.muted, 2);
    segment(0, text, y, C.green);
    segment(text, reserve, y, C.yellow);
    let cursor = text + reserve;
    for (const count of counts) {
      segment(cursor, count, y, count === 32 ? C.cyan : C.blue);
      cursor += count;
    }
    // Keep the window edge visible even when an allocation extends past it.
    api.line(ctx, limitX, y - 22, limitX, y + 84, C.ink, 4);
    api.text(
      ctx,
      `${fmt(cursor)} tokens`,
      Math.max(x0 + 90, x(cursor)),
      y + 128,
      36,
      tint,
      'right',
    );
  }
  api.focus.target('budget-ledger', () => {
    api.text(ctx, '2,000 transcript  +  100 system  +  100 question', 180, 262, 34, C.green);
    api.text(ctx, `${OUTPUT_RESERVE} reserved for the answer`, 1120, 262, 34, C.yellow);
    api.text(ctx, `${fmt(CONTEXT_LIMIT)} limit`, limitX, 356, 31, C.ink, 'center');
    row(443, Array(views).fill(VISUAL_TOKENS_336), 'Direct projection', C.blue);
    if (beat === 3) {
      row(
        699,
        alloc.views,
        `Query reducer   ·   ${alloc.reduced} of ${VIEWS} views at 32 states`,
        C.cyan,
      );
    } else {
      api.text(
        ctx,
        `${VIEWS} views   ×   ${VISUAL_TOKENS_336} patch states per view`,
        180,
        692,
        41,
        C.blue,
      );
      if (beat >= 1) {
        api.text(
          ctx,
          `${fmt(CONTEXT_LIMIT)} − ${fmt(fixed)} = ${fmt(available)} tokens for vision`,
          180,
          783,
          39,
          C.ink,
        );
      }
    }
    let message;
    if (beat === 0) message = 'How many tokens are left for the image?';
    else if (beat === 1)
      message =
        views === 2
          ? `${fmt(available - views * VISUAL_TOKENS_336)} left. Will a third ${VISUAL_TOKENS_336}-state view fit?`
          : 'Place two views against the limit.';
    else if (beat === 2)
      message =
        views === VIEWS
          ? `${fmt(direct.prefix)} prefix + ${OUTPUT_RESERVE} reserve   ·   ${fmt(direct.total - CONTEXT_LIMIT)} over the limit`
          : `${fmt(views * VISUAL_TOKENS_336)} visual tokens against ${fmt(available)} available`;
    else
      message = complete
        ? `${fmt(reduced.prefix)} prefix + ${OUTPUT_RESERVE} reserve   ·   ${fmt(CONTEXT_LIMIT - reduced.total)} free`
        : 'Keep the transcript, question and answer reserve in place.';
    api.text(
      ctx,
      message,
      960,
      946,
      43,
      beat === 2 && views >= 3 ? C.pink : beat === 3 && complete ? C.green : C.yellow,
      'center',
    );
  });
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'budget-text',
    'budget-reserve',
    'budget-two-views',
    'budget-third-view',
    'budget-five-views',
    'budget-reduce',
  ],
};
