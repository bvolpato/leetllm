import {
  FRESH_QUERY,
  NEXT_CALLER_IDS,
  PERMITTED_NOTE_IDS,
  UPDATED_MESSAGES,
} from '../fixtures.mjs';
import { clamp, mix, permittedFreshRanking, terms } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawChapterReference, drawText, withFocus } from '../defaults.mjs';
import { drawLock } from '../reader-desk.mjs';

const query = terms(FRESH_QUERY);
const ranking = permittedFreshRanking();
const next = permittedFreshRanking(NEXT_CALLER_IDS);
const initialAccess = new Set(PERMITTED_NOTE_IDS);
const nextAccess = new Set(NEXT_CALLER_IDS);
const selectedNames = ranking.early.map((row) => 'M' + row.id).join(', ');
const scopedX = (slot) => 1170 + slot * 270;
const outputY = 850;

function paintNote(ctx, api, row, y, showMatch, allowed, selected) {
  const { C } = api;
  drawText(ctx, api, 'M' + row.id, 145, y, 38, C.ink, 'left', 'mono');
  let x = 317;
  ctx.save();
  ctx.font = '500 32px "Lesson Sans"';
  for (const piece of row.text.split(/(\bcharged\b|\bsign\b)/gi).filter(Boolean)) {
    const match = showMatch && query.includes(piece.toLowerCase());
    drawText(ctx, api, piece, x, y, 32, match ? C.yellow : C.ink);
    x += ctx.measureText(piece).width;
  }
  ctx.restore();
  drawLock(ctx, api, 1310, y - 15, allowed);
  drawText(ctx, api, allowed ? 'open' : 'locked', 1370, y, 30, allowed ? C.green : C.pink);
  if (selected && !allowed) api.line(ctx, 1250, y - 34, 1250, y + 2, C.pink, 5);
}

function output(ctx, api, id, x, color, opacity = 1) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  drawChapterReference(ctx, api, id, x, outputY, color, 180);
  ctx.restore();
}

export function drawFreshPermission(ctx, scene, state, api) {
  const { C } = api;
  const scores = q(state, 'ds-fresh-scores', 1, 0.02, 0.15);
  const global = q(state, 'ds-fresh-global-result', 1, 0.18, 0.28);
  const check = q(state, 'ds-fresh-permission-1', 1, 0.32, 0.46);
  const select = q(state, 'ds-fresh-scoped-selection', 1, 0.54, 0.65);
  const order = q(state, 'ds-fresh-scoped-order', 1, 0.68, 0.78);
  const fill = q(state, 'ds-fresh-scoped-fill', 1, 0.83, 0.95);
  const store = q(state, 'ds-fresh-permission-2', 2);
  const unlock = q(state, 'fresh-caller-unlock', 3, 0.25, 0.55);
  const move = q(state, 'fresh-caller-rerank', 4, 0.04, 0.43);
  const refill = q(state, 'fresh-caller-send', 4, 0.53, 0.76);
  const access = unlock === 1 ? nextAccess : initialAccess;
  const admitted = scores === 1 && global === 1 && select === 1;
  const complete = admitted && order === 1 && fill === 1;

  drawText(ctx, api, 'v8    /    sign  +  charged    /    two places', 144, 233, 39, C.ink);
  drawText(ctx, api, 'Lower ID wins a tie', 1745, 233, 31, C.muted, 'right');
  withFocus(ctx, api, 'fresh-candidates', () => {
    drawText(ctx, api, 'Support note', 144, 314, 28, C.muted);
    drawText(ctx, api, unlock === 1 ? 'Second caller' : 'First caller', 1295, 314, 28, C.muted);
    UPDATED_MESSAGES.forEach((row, i) => {
      const y = 398 + i * 94;
      paintNote(
        ctx,
        api,
        row,
        y,
        scores * UPDATED_MESSAGES.length >= i + 1,
        access.has(row.id),
        admitted,
      );
      const scored = ranking.all.find((item) => item.id === row.id);
      drawText(
        ctx,
        api,
        scores === 1 ? 'score ' + scored.score : 'score ?',
        1753,
        y,
        32,
        scores === 1 ? C.cyan : C.muted,
        'right',
      );
    });
  });

  withFocus(ctx, api, 'fresh-slots', () => {
    const saved = store === 1;
    const switched = move > 0;
    drawText(
      ctx,
      api,
      saved ? 'Saved for the first caller' : 'Take two, then check access',
      168,
      794,
      32,
      C.ink,
    );
    let replyTitle = admitted ? 'Check access, then take two' : 'Caller’s reply';
    if (unlock === 1) replyTitle = switched ? 'Second caller’s reply' : 'Reuse the saved pair?';
    drawText(ctx, api, replyTitle, 1100, 794, 32, C.ink);
    for (const x of [300, 570, scopedX(0), scopedX(1)]) {
      api.line(ctx, x - 6, outputY + 82, x + 186, outputY + 82, C.muted, 3);
    }
    if (saved) {
      ranking.early.forEach(({ id }, slot) => output(ctx, api, id, 300 + 270 * slot, C.cyan));
    } else if (global === 1 && scores === 1) {
      ranking.all.slice(0, 2).forEach(({ id }, slot) => {
        const reject = clamp((check - 0.55 - 0.13 * slot) / 0.3);
        output(
          ctx,
          api,
          id,
          300 + slot * 270 - 80 * reject,
          reject > 0 ? C.pink : C.yellow,
          1 - reject,
        );
      });
    }
    if (admitted && move === 0) {
      ranking.early.forEach(({ id }, slot) => {
        const p = slot ? (order === 1 ? fill : 0) : order;
        if (p > 0)
          output(
            ctx,
            api,
            id,
            scopedX(slot) + 120 * (1 - p),
            p === 1 && unlock < 1 ? C.green : C.yellow,
          );
      });
    }
    if (move > 0) {
      const displaced = clamp(move / 0.46);
      const carry = clamp((move - 0.46) / 0.54);
      output(ctx, api, ranking.early[1].id, scopedX(1) + 110 * displaced, C.pink, 1 - displaced);
      output(
        ctx,
        api,
        ranking.early[0].id,
        mix(scopedX(0), scopedX(1), carry),
        carry === 1 ? C.green : C.yellow,
      );
      if (refill > 0)
        output(
          ctx,
          api,
          next.early[0].id,
          scopedX(0) - 200 * (1 - refill),
          refill === 1 ? C.green : C.yellow,
        );
    }
    if (check === 1 && !saved)
      drawText(ctx, api, ranking.late.length + ' / 2 slots filled', 530, 982, 30, C.pink, 'center');
    if (complete && move === 0)
      drawText(
        ctx,
        api,
        unlock === 1 ? 'Both IDs still allowed' : '2 / 2: ' + selectedNames,
        1400,
        982,
        30,
        unlock === 1 ? C.yellow : C.green,
        'center',
      );
    if (refill === 1)
      drawText(
        ctx,
        api,
        '2 / 2: ' + next.early.map((row) => 'M' + row.id).join(', '),
        1400,
        982,
        30,
        C.green,
        'center',
      );
    if (saved)
      drawText(
        ctx,
        api,
        'v8  /  same query and ranking rule  /  scope {M2, M3}',
        530,
        982,
        26,
        C.cyan,
        'center',
      );
  });
}

export default {
  id: 'fresh-permission',
  draw: drawFreshPermission,
  cues: [
    'ds-fresh-permission-0',
    'ds-fresh-scores',
    'ds-fresh-global-result',
    'ds-fresh-permission-1',
    'ds-fresh-scoped-selection',
    'ds-fresh-scoped-order',
    'ds-fresh-scoped-fill',
    'ds-fresh-permission-2',
    'fresh-caller-unlock',
    'fresh-caller-rerank',
    'fresh-caller-send',
  ],
};
