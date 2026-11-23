import { checkExpression } from '../arithmetic.mjs';
import { cueAt } from '../cue-clock.mjs';
import { COMPLETE_B_TREE, DEAD_END_TRACE, PRUNING_BRANCHES } from '../fixtures.mjs';
import { drawCard } from '../defaults.mjs';

const a = PRUNING_BRANCHES.branchA,
  b = PRUNING_BRANCHES.branchB;
const verified = checkExpression(COMPLETE_B_TREE);
const progressBetween = (from, to, t) => from + (to - from) * t;

export function drawHeuristicPruning(ctx, scene, state, api) {
  api.focus.target('heuristic-pruning-mechanism', () => {
    const { C, text, line } = api,
      beat = state.beat ?? 0;
    const xStart = 150,
      xKept = 942;
    const yA = 370,
      yB = 545,
      yOut = 790;
    const takeOne = cueAt(state, 'prune-one', 1, 0, 0.18);
    const previous = cueAt(state, 'prune-previous', 2, 0.15, 0.37);
    const rewind = cueAt(state, 'prune-reset', 2, 0.47, 0.53);
    const widen = cueAt(state, 'prune-wide', 2, 0.54, 0.67);
    const replay = beat >= 2 && cueAt(state, 'prune-replay', 2, 0, 0.12).started;
    const outside = replay ? previous.progress * (1 - rewind.progress) : takeOne.progress;
    const retainedB = replay ? widen.progress : 0;
    const advanced = replay ? outside + retainedB : takeOne.progress;
    const score = cueAt(state, 'prune-rank', 0, 0.31, 0.75);
    const branchCard = (branch, x, y, color) => {
      const scoreText = score.done ? 'Score ' + branch.heuristic.toFixed(2) : 'Score pending';
      drawCard(
        ctx,
        api,
        branch.label + '\n' + branch.remaining.join('   ') + '\n' + scoreText,
        x,
        y,
        428,
        148,
        color,
        31,
      );
    };
    text(ctx, 'At the fork', xStart, 275, 40, C.ink);
    text(ctx, 'Beam width ' + (widen.done ? '2' : '1'), xKept, 275, 40, C.cyan);
    line(ctx, 902, 317, 1403, 317, C.cyan, 3);
    line(ctx, 902, 317, 902, widen.done ? 696 : 520, C.cyan, 3);
    line(ctx, 902, widen.done ? 696 : 520, 1403, widen.done ? 696 : 520, C.cyan, 3);
    if (takeOne.started && !widen.done) {
      text(ctx, 'Discarded at width 1', 1390, 980, 32, C.muted, 'right');
      line(ctx, 902, 774, 1403, 774, C.muted, 2);
    }
    if (advanced === 1) {
      drawCard(ctx, api, 'Starting tray\n6   4   5   7', xStart, 482, 428, 128, C.blue, 36);
      line(ctx, 590, 541, xKept - 19, yA + 74, C.blue, 3);
      line(ctx, 590, 551, xKept - 19, progressBetween(yB, yOut, outside) + 74, C.cyan, 3);
    }
    branchCard(a, progressBetween(xStart, xKept, advanced), yA, C.blue);
    branchCard(
      b,
      progressBetween(xStart, xKept, outside + retainedB),
      progressBetween(yB, yOut, outside),
      C.cyan,
    );
    if (beat === 0) {
      text(ctx, 'Which tray gets the slot?', 960, 902, 43, C.yellow, 'center');
      return;
    }
    if (beat === 1) {
      const drain = cueAt(state, 'prune-drain', 1, 0.36, 0.73);
      const exhausted = cueAt(state, 'prune-empty', 1, 0.74, 0.84).done;
      if (drain.started) {
        const index = Math.floor(drain.progress * (DEAD_END_TRACE.length - 2));
        const point = exhausted
          ? DEAD_END_TRACE.at(-1)
          : drain.progress > 0
            ? DEAD_END_TRACE[index]
            : { checked: 0, queued: 1 };
        text(ctx, 'Below A', 1470, 360, 32, C.muted);
        text(ctx, point.checked + ' examined', 1470, 443, 34, C.ink);
        text(ctx, point.queued + ' waiting', 1470, 510, 34, C.ink);
        if (exhausted) text(ctx, 'No solution', 1470, 591, 37, C.pink);
      }
    } else {
      const sub = cueAt(state, 'prune-subtract', 2, 0.72, 0.81).done;
      const product = cueAt(state, 'prune-product', 2, 0.84, 0.94).done;
      if (retainedB === 1) {
        text(ctx, 'Below B', 1470, 539, 32, C.muted);
        if (sub) text(ctx, '6 − 4 = 2', 1470, 607, 40, C.ink);
        if (product && verified.valid) {
          text(ctx, '2 × 12 = ' + verified.result, 1470, 677, 40, C.green);
          text(ctx, '4 inputs used', 1470, 742, 29, C.green);
        }
      }
    }
  });
}
export default {
  id: 'heuristic-pruning',
  draw: drawHeuristicPruning,
  cues: [
    'prune-rank',
    'prune-one',
    'prune-drain',
    'prune-empty',
    'prune-replay',
    'prune-previous',
    'prune-reset',
    'prune-wide',
    'prune-retain',
    'prune-subtract',
    'prune-product',
  ],
};
