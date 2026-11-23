import { rlvrMixedProbability, vrBound } from '../arithmetic.mjs';
import {
  drawCell,
  drawEquation,
  drawFooter,
  drawHeading,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawSamplingBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue sampling-budget/' + id);
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
    cueProgress('vr-' + name + '-' + 'sampling-budget', beat);
  const paint = () => {
    drawHeading(ctx, api, 'Independent draws: informative groups require both outcomes');
    const size = 64,
      prob = 0.01,
      z = rlvrMixedProbability(prob, size);
    drawEquation(ctx, api, String.raw`P_{\rm mixed}=1-p^G-(1-p)^G`, 960, 350, 51, themeColors.blue);
    const admitted = operationProgress('result', 0) > 0;
    drawRectangle(ctx, api, 250, 470, 1420, 105, themeColors.muted);
    if (admitted) {
      api.rect(ctx, 250, 470, 1420 * z.mixed, 105, themeColors.cyan);
      api.rect(
        ctx,
        250 + 1420 * z.mixed,
        470,
        1420 * z.allFail,
        105,
        themeColors.panel,
        themeColors.yellow,
        2,
      );
      drawText(
        ctx,
        api,
        'mixed ' + (100 * z.mixed).toFixed(2) + '%',
        570,
        640,
        35,
        themeColors.cyan,
        'center',
      );
      drawText(
        ctx,
        api,
        'all fail ' + (100 * z.allFail).toFixed(2) + '%',
        1330,
        640,
        35,
        themeColors.yellow,
        'center',
      );
    }
    drawText(ctx, api, 'p = 0.01     G = 64', 960, 425, 34, themeColors.ink, 'center');
    if (currentBeat >= 1 && operationProgress('zero', 1) > 0) {
      drawText(
        ctx,
        api,
        'p = 0 → all fail for every finite G',
        960,
        755,
        35,
        themeColors.pink,
        'center',
      );
    }
    if (currentBeat === 2 && operationProgress('filter', 2) > 0) {
      const attempts = 8,
        pass = [0, 0, 1, 0, 1, 0, 0, 1];
      pass.forEach((v, i) =>
        drawCell(
          ctx,
          api,
          v ? 'mixed' : 'uniform',
          220 + i * 195,
          825,
          165,
          70,
          v ? themeColors.cyan : themeColors.muted,
          25,
        ),
      );
      drawText(
        ctx,
        api,
        'Charge every generated group, including discarded groups',
        960,
        960,
        28,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(ctx, api, 'Correlated responses change this calculation. Retries need a bound.');
  };
  api.focus.target('sampling-budget-mechanism', paint);
}
export default {
  id: 'sampling-budget',
  draw: drawSamplingBudget,
  cues: [
    'vr-sampling-budget-b0',
    'vr-mixed-sampling-budget',
    'vr-result-sampling-budget',
    'vr-sampling-budget-b1',
    'vr-zero-sampling-budget',
    'vr-sampling-budget-b2',
    'vr-filter-sampling-budget',
  ],
};
