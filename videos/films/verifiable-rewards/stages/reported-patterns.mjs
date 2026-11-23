import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawHeading, drawLine, drawText } from '../defaults.mjs';
export function drawReportedPatterns(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue reported-patterns/' + id);
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
      cueProgress('vr-' + name + '-' + 'reported-patterns', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Each correction appends new tokens to the response');
    const texts = ['14 × 12 = 148', 'wait…', '10 × 12 + 4 × 12', '120 + 48 = 168'];
    const counts =
      operationProgress('backtrack', 0) > 0
        ? Math.min(4, 1 + Math.floor(operationProgress('backtrack', 0) * 3.99))
        : 1;
    texts.slice(0, counts).forEach((v, i) => {
      const x = 220 + (i % 2) * 800,
        y = 420 + Math.floor(i / 2) * 230;
      drawCell(
        ctx,
        api,
        v,
        x,
        y,
        700,
        100,
        i === 0 ? themeColors.pink : i === 3 ? themeColors.green : themeColors.blue,
        35,
      );
      if (i === 1 || i === 3) api.arrow(ctx, x - 90, y + 50, x - 10, y + 50, themeColors.muted, 3);
      if (i === 2) {
        drawLine(ctx, api, 1370, 530, 1370, 580, themeColors.muted, 3);
        drawLine(ctx, api, 1370, 580, 570, 580, themeColors.muted, 3);
        api.arrow(ctx, 570, 580, 570, 640, themeColors.muted, 3);
      }
    });
    if (resultComplete('retained', 0))
      drawText(
        ctx,
        api,
        'Earlier wrong tokens remain in the autoregressive context',
        960,
        925,
        30,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 1 && operationProgress('authored', 1) > 0)
      drawText(
        ctx,
        api,
        'Split 14 into 10 + 4',
        960,
        345,
        30,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2 && operationProgress('budget', 2) > 0) {
      drawText(
        ctx,
        api,
        'Measure accuracy with token and end-to-end time budgets',
        960,
        345,
        31,
        themeColors.cyan,
        'center',
      );
    }
  };
  api.focus.target('reported-patterns-mechanism', paint);
}
export default {
  id: 'reported-patterns',
  draw: drawReportedPatterns,
  cues: [
    'vr-reported-patterns-b0',
    'vr-backtrack-reported-patterns',
    'vr-retained-reported-patterns',
    'vr-reported-patterns-b1',
    'vr-authored-reported-patterns',
    'vr-reported-patterns-b2',
    'vr-budget-reported-patterns',
  ],
};
