import { vrBound } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawTrustedExecution(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue trusted-execution/' + id);
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
      cueProgress('vr-' + name + '-' + 'trusted-execution', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'The grader owns the cases and observes the candidate’s behavior');
    drawRectangle(ctx, api, 180, 375, 520, 420, themeColors.blue);
    drawText(ctx, api, 'Trusted host', 440, 425, 33, themeColors.blue, 'center');
    drawText(ctx, api, 'expected integer 1', 440, 515, 32, themeColors.ink, 'center');
    drawText(ctx, api, 'exact type is int', 440, 585, 30, themeColors.ink, 'center');
    drawRectangle(ctx, api, 1020, 375, 710, 420, themeColors.yellow);
    drawText(
      ctx,
      api,
      'Child process · fixed trusted code',
      1375,
      425,
      31,
      themeColors.yellow,
      'center',
    );
    const observed = resultComplete('type', 0)
      ? 'true is Boolean → reject'
      : 'candidate output: true';
    drawText(
      ctx,
      api,
      observed,
      1375,
      540,
      30,
      resultComplete('type', 0) ? themeColors.pink : themeColors.ink,
      'center',
    );
    if (operationProgress('claim', 0) > 0)
      drawText(
        ctx,
        api,
        'claimed {score: 1} ≠ host observation',
        1375,
        650,
        27,
        themeColors.pink,
        'center',
      );
    api.arrow(ctx, 1010, 520, 720, 520, themeColors.cyan, 4);
    if (currentBeat >= 1 && operationProgress('boundary', 1) > 0) {
      drawLine(ctx, api, 895, 335, 895, 900, themeColors.yellow, 4);
      drawText(ctx, api, 'Production boundary', 900, 925, 28, themeColors.yellow, 'center');
      drawText(
        ctx,
        api,
        'CPU / wall / memory / files / network / output',
        960,
        975,
        26,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      const sleep = operationProgress('sleep', 2),
        desc = operationProgress('descendant', 2);
      drawText(ctx, api, 'Sleeping child', 1140, 730, 28, themeColors.yellow);
      drawLine(ctx, api, 1140, 765, 1640, 765);
      drawRectangle(ctx, api, 1140, 750, 500 * sleep, 30, themeColors.yellow);
      if (desc > 0) {
        api.arrow(ctx, 1540, 795, 1700, 865, themeColors.pink, 4);
        drawText(ctx, api, 'descendant', 1510, 895, 27, themeColors.pink);
        drawText(ctx, api, 'cancel + clean whole boundary', 230, 735, 27, themeColors.pink);
      }
    }
    drawFooter(
      ctx,
      api,
      'Fixed programs in the exercise. Untrusted submissions require a restricted sandbox.',
    );
  };
  api.focus.target('trusted-execution-mechanism', paint);
}
export default {
  id: 'trusted-execution',
  draw: drawTrustedExecution,
  cues: [
    'vr-trusted-execution-b0',
    'vr-type-trusted-execution',
    'vr-claim-trusted-execution',
    'vr-trusted-execution-b1',
    'vr-boundary-trusted-execution',
    'vr-trusted-execution-b2',
    'vr-sleep-trusted-execution',
    'vr-descendant-trusted-execution',
  ],
};
