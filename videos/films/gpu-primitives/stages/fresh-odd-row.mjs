import { ODD_ROW, SWAPPED_ROW } from '../fixtures.mjs';
import { freshPrefixSnapshot } from '../model.mjs';
import { text } from '../defaults.mjs';
import {
  after,
  axes,
  boundaries,
  boundaryX,
  cue,
  mark,
  number,
  plays,
  trace,
} from '../score-trace.mjs';

const oldScores = boundaries(ODD_ROW);
const newScores = boundaries(SWAPPED_ROW);

export function drawFreshOddRow(ctx, scene, state, api) {
  const { C } = api;
  const snap = freshPrefixSnapshot(state.beat, state.beatP, state.cues);
  const swapped = after(state, 'fresh-swap', 2, 0.44);
  const frozen = cue(state, 'fresh-again', 2, 0.64, 0.8) > 0;
  const answer = after(state, 'fresh-eight', 3, 0.12);
  const penalty = cue(state, 'fresh-penalty', 3, 0.25, 0.32);
  const rejoin = cue(state, 'fresh-rejoin', 3, 0.46, 0.54);
  const last = cue(state, 'fresh-last', 3, 0.56, 0.68);
  api.focus.target('fresh-board', () => {
    plays(ctx, api, swapped ? SWAPPED_ROW : ODD_ROW, {
      pad: true,
      split: true,
      marked: state.beat === 2 && !frozen ? [3, 5] : [4],
    });
    axes(ctx, api);
    if (frozen) {
      api.line(ctx, boundaryX(4), 312, boundaryX(4), 345, C.yellow, 3);
      text(ctx, api, 'Before −2', boundaryX(4), 383, 31, C.yellow);
    }
    if (state.beat < 2) {
      // A local prefix contains the score before a real play. Omit the padded output.
      const a = oldScores.slice(0, 5),
        b = boundaries(ODD_ROW.slice(4));
      const localSteps = state.beat === 0 ? 2 * cue(state, 'fresh-ask', 0, 0.56, 0.78) : 2;
      trace(ctx, api, a, { steps: snap.offsetShown ? 4 : 3, color: C.blue });
      trace(ctx, api, b, { start: 4, steps: localSteps, color: '#797c84' });
      mark(ctx, api, 4, 0, 'B local 0', C.muted, true);
      if (snap.offsetShown) mark(ctx, api, 4, snap.offset, String(snap.offset), C.yellow);
      if (snap.revealed) {
        trace(ctx, api, b, {
          start: 4,
          offset: snap.offset,
          steps: snap.reductionShown ? 3 : 2,
          color: C.cyan,
        });
        for (const i of [5, 6])
          mark(ctx, api, i, oldScores[i], number(oldScores[i]), C.cyan, i === 5);
      }
      if (snap.reductionShown) mark(ctx, api, 7, snap.total, String(snap.total), C.green);
      const question = 'Score before the two-point penalty   ?';
      text(
        ctx,
        api,
        snap.revealed
          ? 'Exclusive scores     ' + snap.output.map(number).join('     ')
          : snap.offsetShown
            ? 'Block B starts at ' + snap.offset + ' points'
            : question,
        960,
        964,
        42,
        C.ink,
      );
      return;
    }
    if (!swapped) {
      trace(ctx, api, oldScores, { color: C.blue });
      mark(ctx, api, 4, oldScores[4], String(oldScores[4]), C.blue);
      mark(ctx, api, 7, oldScores[7], String(oldScores[7]), C.green);
      text(ctx, api, 'Exchange the highlighted plays.', 960, 964, 43, C.ink);
      return;
    }
    trace(ctx, api, oldScores, { color: '#727987' });
    const oldBoundary = oldScores[4];
    mark(ctx, api, 4, oldBoundary, 'Was ' + oldBoundary, C.muted, true);
    mark(ctx, api, 7, oldScores[7], String(oldScores[7]), C.green);
    const steps = answer ? 4 + penalty + rejoin + last : 3;
    trace(ctx, api, newScores, { steps, color: C.yellow });
    if (answer) mark(ctx, api, 4, newScores[4], 'Now ' + newScores[4], C.yellow);
    if (rejoin >= 1) mark(ctx, api, 6, newScores[6], 'Both ' + newScores[6], C.cyan);
    text(
      ctx,
      api,
      answer
        ? 'Before −2     ' +
            oldBoundary +
            ' → ' +
            newScores[4] +
            ' points        Final score     ' +
            newScores[7] +
            ' in both replays'
        : 'Same penalty, same final score.   Score before −2 now   ?',
      960,
      971,
      43,
      C.ink,
    );
  });
}
export default {
  id: 'fresh-odd-row',
  draw: drawFreshOddRow,
  cues: [
    'fresh-ask',
    'fresh-offset-five',
    'fresh-odd-row-step-2',
    'fresh-reduction',
    'fresh-swap',
    'fresh-again',
    'fresh-eight',
    'fresh-penalty',
    'fresh-rejoin',
    'fresh-last',
    'fresh-choose',
  ],
};
