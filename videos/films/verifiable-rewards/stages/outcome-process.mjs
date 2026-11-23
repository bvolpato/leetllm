import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawHeading, drawLine, drawText } from '../defaults.mjs';
export function drawOutcomeProcess(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue outcome-process/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
      cueProgress('vr-' + name + '-' + 'outcome-process', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Is 97 prime?');
    drawCell(ctx, api, 'Yes: ends in 7', 200, 395, 590, 85, themeColors.yellow);
    drawCell(ctx, api, 'Yes: test divisors ≤ √97', 1000, 395, 710, 85, themeColors.blue);
    if (operationProgress('prime-check', 0) > 0) {
      [2, 3, 5, 7].forEach((d, i) => {
        const z = vrBound(operationProgress('prime-check', 0) * 4 - i),
          x = 1030 + i * 170;
        if (z > 0) {
          drawCell(ctx, api, d, x, 550, 135, 70, themeColors.blue);
          drawText(ctx, api, 'r = ' + (97 % d), x + 67, 680, 28, themeColors.green, 'center');
        }
      });
    }
    if (resultComplete('equal-final', 0)) {
      drawText(ctx, api, 'outcome reward 1', 495, 800, 34, themeColors.green, 'center');
      drawText(ctx, api, 'outcome reward 1', 1355, 800, 34, themeColors.green, 'center');
    }
    if (operationProgress('steps', 1) > 0) {
      api.arrow(ctx, 790, 438, 930, 620, themeColors.pink, 4);
      drawText(ctx, api, 'Step rubric: unsupported rule', 200, 610, 29, themeColors.pink);
      drawText(ctx, api, 'Step rubric: sufficient divisor checks', 1000, 740, 29, themeColors.blue);
    }
    if (currentBeat === 2) {
      drawLine(ctx, api, 180, 869, 1740, 869);
      drawText(ctx, api, 'Try the rule on 77', 220, 946, 39, themeColors.ink);
      if (resultComplete('coverage', 2))
        drawText(ctx, api, '7 × 11 = 77', 1070, 946, 48, themeColors.pink);
    }
  };
  api.focus.target('outcome-process-mechanism', paint);
}
export default {
  id: 'outcome-process',
  draw: drawOutcomeProcess,
  cues: [
    'vr-outcome-process-b0',
    'vr-bad-proof-outcome-process',
    'vr-prime-check-outcome-process',
    'vr-equal-final-outcome-process',
    'vr-outcome-process-b1',
    'vr-steps-outcome-process',
    'vr-outcome-process-b2',
    'vr-coverage-outcome-process',
  ],
};
