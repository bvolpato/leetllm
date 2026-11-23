import { ASSISTANT_TARGETS, TOKEN_IDS } from '../fixtures.mjs';
import { clamp, cueProgress, done } from '../construction.mjs';
import { inputPass, inputStrip, pieces, prefixBracket } from '../conversation.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

function drawTracks(ctx, state, api) {
  const { C } = api;
  const throughModel = cueProgress(state, 'mask-read', 0);
  const questions = cueProgress(state, 'mask-questions', 1);
  const headers = cueProgress(state, 'mask-headers', 1);
  const retain = cueProgress(state, 'mask-replies', 1);
  const trace = cueProgress(state, 'mask-trace', 3);
  const compare = cueProgress(state, 'mask-compare-is', 3);
  const selected = ASSISTANT_TARGETS.filter(Boolean).length;

  inputStrip(ctx, api);
  inputPass(ctx, api, throughModel);
  text(
    ctx,
    api,
    retain > 0 ? 'Loss labels at token positions' : 'Copy of token IDs to mask',
    pieces[0].left,
    637,
    37,
  );
  if (throughModel < 1) return;
  for (const [i, { x, left, right }] of pieces.entries()) {
    const inQuestion = (i >= 1 && i <= 4) || i === 11;
    const active = ASSISTANT_TARGETS[i];
    const order = inQuestion ? [1, 2, 3, 4, 11] : [0, 5, 10, 12];
    const ignored = !active && (inQuestion ? questions : headers) * order.length > order.indexOf(i);
    const kept = active && retain > 0;
    const color = ignored ? C.muted : kept ? C.green : C.ink;
    text(ctx, api, ignored ? '−100' : TOKEN_IDS[i], x, 737, ignored ? 28 : 33, color, 'center');
    if (kept) api.line(ctx, left + 4, 767, right - 4, 767, C.green, 5);
    if (compare > 0 && pieces[i].token === 'is') {
      api.line(ctx, x, 784, x, 812, C.yellow, 3);
      text(ctx, api, 'is', x, 856, 34, C.yellow, 'center');
    }
  }
  if (done(state, 'mask-count', 1)) {
    text(ctx, api, selected + ' scored targets', pieces.at(-1).right, 637, 37, C.green, 'right');
  }

  if (state.beat >= 2) {
    const x = pieces[13].x;
    api.line(ctx, pieces[13].left + 8, 353, pieces[13].right - 8, 353, C.yellow, 4);
    if (trace > 0) {
      const headerX = pieces[12].x;
      const route = [
        [x, 682],
        [x, 578],
        [headerX, 548],
        [headerX, 469],
      ];
      for (let i = 0; i < 3; i++) {
        const p = clamp(trace * 6 - i);
        if (p <= 0) break;
        const [ax, ay] = route[i];
        const [bx, by] = route[i + 1];
        api.line(ctx, ax, ay, ax + p * (bx - ax), ay + p * (by - ay), C.yellow, 5);
      }
      prefixBracket(ctx, api, 12, clamp(trace * 2 - 1), 467);
    }
    const explanation =
      compare > 0
        ? '“is” in the question  →  −100       “is” in either reply  →  ' + TOKEN_IDS[7]
        : trace > 0
          ? 'The prefix for “She” includes “Why?” and the entire first exchange.'
          : 'Can the model use “Why?” to predict the second “She”?';
    text(ctx, api, explanation, 960, 946, 42, C.yellow, 'center');
  } else if (headers > 0) {
    text(ctx, api, '−100 means skip this target', 960, 907, 35, C.muted, 'center');
  }
}
export function drawRoleMask(ctx, scene, state, api) {
  return focus(ctx, api, 'conversation-and-labels', () => drawTracks(ctx, state, api));
}

export default {
  id: 'role-mask',
  draw: drawRoleMask,
  cues: [
    'mask-read',
    'mask-questions',
    'mask-headers',
    'mask-replies',
    'mask-count',
    'mask-predict',
    'mask-trace',
    'mask-compare-is',
  ],
};
