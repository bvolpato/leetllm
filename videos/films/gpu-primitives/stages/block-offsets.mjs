import { hierarchyCounts } from '../arithmetic.mjs';
import { ARTICLE_INPUT } from '../fixtures.mjs';
import { drawExtendedBox as box, text } from '../defaults.mjs';
import {
  after,
  axes,
  boundaries,
  boundaryX,
  cue,
  mark,
  plays,
  scoreY,
  trace,
} from '../score-trace.mjs';

const left = boundaries(ARTICLE_INPUT.slice(0, 4));
const right = boundaries(ARTICLE_INPUT.slice(4));
const offset = left.at(-1);

function hierarchy(ctx, state, api) {
  const { C } = api;
  const extra = cue(state, 'offset-extra', 2, 0.48, 0.55) > 0;
  const result = after(state, 'offset-boundary', 2, 0.82);
  api.focus.target('offset-recursion', () => {
    ['Inputs', 'Block totals', 'Next level', 'Root'].forEach((word, i) =>
      text(ctx, api, word, 380 + 388 * i, 348, 37, C.ink),
    );
    [512 ** 2, 512 ** 2 + 1].forEach((n, i) => {
      if (i && !extra) return;
      const counts = [n, ...hierarchyCounts(n)];
      counts.forEach((count, j) => {
        const x = 380 + 388 * j,
          y = 407 + 203 * i;
        box(
          ctx,
          api,
          i && j > 1 && !result ? '?' : count.toLocaleString('en-US'),
          x - 135,
          y,
          270,
          100,
          i ? C.yellow : C.cyan,
          43,
        );
        if (j) api.arrow(ctx, x - 224, y + 50, x - 153, y + 50, C.muted, 4);
      });
    });
    text(ctx, api, 'Each tile holds up to 512 items at every level.', 960, 922, 42, C.ink);
  });
}

export function drawBlockOffsets(ctx, scene, state, api) {
  if (state.beat === 2) return hierarchy(ctx, state, api);
  const { C } = api;
  const leftProgress = cue(state, 'offset-left', 0, 0.13, 0.34);
  const rightProgress = cue(state, 'offset-right', 0, 0.39, 0.63);
  const lift = cue(state, 'offset-shift', 1, 0.01, 0.24);
  const before = after(state, 'offset-result', 1, 0.46);
  const through = after(state, 'offset-after', 1, 0.58);
  api.focus.target('offset-traces', () => {
    plays(ctx, api, ARTICLE_INPUT, { marked: [5], split: true });
    axes(ctx, api);
    trace(ctx, api, left, { steps: 4 * leftProgress, color: C.blue });
    if (rightProgress > 0) {
      if (lift > 0) trace(ctx, api, right, { start: 4, color: '#58504b', dots: false });
      trace(ctx, api, right, {
        start: 4,
        steps: rightProgress * 4,
        offset: lift * offset,
        color: C.cyan,
      });
    }
    if (leftProgress >= 1) mark(ctx, api, 4, offset, String(offset), C.blue);
    if (rightProgress >= 1 && lift === 0) {
      mark(ctx, api, 5, right[1], String(right[1]), C.cyan);
      mark(ctx, api, 4, 0, '0', C.cyan, true);
      api.line(ctx, boundaryX(4), scoreY(offset) + 19, boundaryX(4), scoreY(0) - 18, C.yellow, 4);
    }
    if (before) mark(ctx, api, 5, right[1] + offset, String(right[1] + offset), C.yellow);
    if (through) mark(ctx, api, 6, right[2] + offset, String(right[2] + offset), C.cyan, true);
    const message = through
      ? 'Block B     0, 5, −4, −2     + 7 each     →     7, 12, 3, 5'
      : before
        ? 'Before −9     5 local + 7 carried = 12 points'
        : lift > 0
          ? 'Keep the plays fixed. Move their starting score.'
          : rightProgress >= 1
            ? 'Block B reports 5 before −9. What shift joins the traces?'
            : 'Each block starts its own score at zero.';
    text(ctx, api, message, 960, 970, 41, C.ink);
  });
}
export default {
  id: 'block-offsets',
  draw: drawBlockOffsets,
  cues: [
    'offset-left',
    'offset-right',
    'offset-gap',
    'offset-shift',
    'offset-result',
    'offset-after',
    'offset-ready',
    'offset-extra',
    'offset-boundary',
  ],
};
