import { cueProgress, drawRequest, number } from '../latency-ruler.mjs';

export function drawWhyTrain(ctx, scene, state, api) {
  const { C, text, line, rect, focus } = api;
  const reset = cueProgress(state, api, 'rollback-small-nudge', 0, 0.02, 0.17);
  const larger = cueProgress(state, api, 'double-miss', 1, 0.45, 0.65);
  const trial = cueProgress(state, api, 'trial-weight', 2, 0.12, 0.5);
  const movingWeight = state.beat === 0 ? 2.99 + 0.01 * reset
    : state.beat === 1 ? 3 + 0.5 * larger : 3 - 0.1 * trial;
  const weight = Number(movingWeight.toFixed(state.beat === 0 ? 3 : 2));
  const elapsed = state.beat === 0
    ? cueProgress(state, api, 'request-input-b1-1', 0, 0.28, 0.52) : 0;
  const { gap } = drawRequest(ctx, api, weight, { elapsed });
  const square = cueProgress(state, api, 'squared-loss-b2-2', 1, 0.05, 0.25);
  if (!square) {
    text(ctx, 'How much should a miss cost?', 960, 854, 47, C.ink, 'center');
    return;
  }
  focus.target('squared-loss', () => {
    const unit = 106, side = unit * gap, left = 1160, bottom = 986;
    const height = side * square;
    rect(ctx, left, bottom - height, side, height, C.panel, C.pink, 0);
    if (state.beat === 1 && larger === 1) {
      line(ctx, left + unit, bottom - side, left + unit, bottom, C.pink, 3);
      line(ctx, left, bottom - unit, left + side, bottom - unit, C.pink, 3);
    }
    text(ctx, 'Prediction error', 340, 805, 30, C.muted);
    text(ctx, number(gap) + ' seconds', 340, 863, 47, C.cyan);
    if (square === 1) {
      text(ctx, number(gap) + ' × ' + number(gap) + ' = ' + number(gap * gap, 4) + ' s²',
        340, 951, 41, C.pink);
    }
  });
}

export default {
  id: 'why-train',
  draw: drawWhyTrain,
  cues: ['rollback-small-nudge', 'request-input-b1-1', 'target-fixed', 'squared-loss-b2-2', 'double-miss', 'trial-weight', 'trial-gap'],
};
