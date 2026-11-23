import { ARTICLE_INPUT } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { after, axes, boundaries, cue, mark, plays, signed, trace } from '../score-trace.mjs';

const scores = boundaries(ARTICLE_INPUT);
const gain = 4;
const penalty = gain + 1;

function drawPenalty(ctx, state, api) {
  const { C } = api;
  const before = after(state, 'intro-before', 1, 0.06);
  const through = after(state, 'intro-through', 1, 0.34);
  const add = cue(state, 'intro-add-five', 0, 0, 0.4);
  const subtract = cue(state, 'intro-penalty', 1, 0.06, 0.2);
  const frozen = cue(state, 'intro-freeze', 0, 0.5, 0.78) > 0;
  const exclusive = after(state, 'intro-exclusive', 1, 0.62);
  const inclusive = after(state, 'intro-inclusive', 1, 0.86);
  const left = 330,
    middle = 960,
    right = 1590,
    track = 730;

  text(ctx, api, 'Score after four plays', left, 379, 38, C.ink);
  text(ctx, api, 'Before the penalty', middle, 379, 38, C.ink);
  text(ctx, api, 'After the penalty', right, 379, 38, through ? C.ink : C.muted);
  text(ctx, api, String(scores[gain]), left, 636, 204, C.blue);
  text(ctx, api, before ? String(scores[penalty]) : '?', middle, 636, 204, C.yellow);
  text(
    ctx,
    api,
    through ? String(scores[penalty + 1]) : '·',
    right,
    636,
    204,
    through ? C.cyan : C.muted,
  );

  for (const [x, value, color] of [
    [(left + middle) / 2, ARTICLE_INPUT[gain], C.blue],
    [(middle + right) / 2, ARTICLE_INPUT[penalty], C.yellow],
  ]) {
    text(ctx, api, signed(value), x, 502, 76, color);
    api.arrow(ctx, x - 130, 559, x + 130, 559, color, 8);
  }

  api.line(ctx, left, track, right, track, C.muted, 3);
  for (const x of [left, middle, right]) api.line(ctx, x, track - 17, x, track + 17, C.muted, 4);
  const cursor = left + (middle - left) * add + (right - middle) * subtract;
  api.line(ctx, left, track, cursor, track, C.blue, 7);
  api.circle(ctx, cursor, track, 16, frozen && !subtract ? C.yellow : C.ink);
  if (exclusive) text(ctx, api, 'Exclusive scan', middle, 845, 43, C.yellow);
  if (inclusive) text(ctx, api, 'Inclusive scan', right, 845, 43, C.cyan);
}

export function drawSubjectIntro(ctx, scene, state, api) {
  api.focus.target('replay-board', () => {
    if (state.beat < 2) return drawPenalty(ctx, state, api);

    const { C } = api;
    const finish = cue(state, 'intro-finish', 2, 0.09, 0.33);
    const total = after(state, 'intro-total', 2, 0.46);
    plays(ctx, api, ARTICLE_INPUT, { marked: [penalty] });
    axes(ctx, api);
    trace(ctx, api, scores.slice(0, penalty + 1), { color: C.blue });
    trace(ctx, api, scores.slice(penalty, penalty + 2), { start: penalty, color: C.yellow });
    trace(ctx, api, scores.slice(penalty + 1), {
      start: penalty + 1,
      steps: total ? 2 : finish,
      color: C.blue,
    });
    mark(ctx, api, penalty, scores[penalty], String(scores[penalty]), C.yellow);
    mark(ctx, api, penalty + 1, scores[penalty + 1], String(scores[penalty + 1]), C.cyan, true);
    if (total) {
      mark(ctx, api, 8, scores[8], String(scores[8]), C.green);
      text(ctx, api, 'Final score   ' + scores[8], 960, 987, 47, C.ink);
    }
  });
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'intro-add-five',
    'intro-freeze',
    'intro-before',
    'intro-penalty',
    'intro-through',
    'intro-exclusive',
    'intro-inclusive',
    'intro-finish',
    'intro-total',
  ],
};
