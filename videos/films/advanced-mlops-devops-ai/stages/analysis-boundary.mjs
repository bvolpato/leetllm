import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
} from '../defaults.mjs';
export function drawAnalysisBoundary(ctx, scene, state, api) {
  if (paintAnalysisBoundary(ctx, scene, state, api)) return;
}
function paintAnalysisBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'analysis-boundary', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('analysis-boundary-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(ctx, api, 'The expressions own the unavailable-data behavior');
    const labels =
      currentBeat === 0
        ? ['measure', 'evaluate conditions', 'progress / pause / abort']
        : currentBeat === 1
          ? ['NaN → success', 'NaN → inconclusive', 'NaN → failure']
          : ['predeclared windows', 'count + stopping rule', 'authorized action'];
    if (currentBeat < 2)
      labels.forEach((v, i) => {
        const x = 170 + i * 600;
        if (cueProgress(currentBeat, Math.min(i, 2)) > 0 || currentBeat === 1) {
          drawReleaseBox(
            ctx,
            api,
            v,
            x,
            430,
            500,
            130,
            i === 2 ? themeColors.pink : i === 1 ? themeColors.yellow : themeColors.cyan,
            31,
          );
          if (i > 0 && currentBeat !== 1)
            drawReleaseArrow(ctx, api, x - 75, 495, x - 25, 495, themeColors.muted);
        }
      });
    if (currentBeat === 1) {
      drawReleaseBox(
        ctx,
        api,
        'Same NaN input · three different configured conditions',
        300,
        275,
        1320,
        90,
        themeColors.blue,
        31,
      );
      if (resultComplete(1, 2))
        drawReleaseBox(
          ctx,
          api,
          'Empty [] also needs an explicit branch',
          420,
          760,
          1080,
          100,
          themeColors.yellow,
          34,
        );
    }
    if (currentBeat === 2) {
      drawReleaseBox(
        ctx,
        api,
        'Declare windows, sample counts and stopping rule',
        280,
        340,
        1360,
        100,
        themeColors.blue,
        33,
      );
      ['R1', 'R2', 'R3'].forEach((v, i) =>
        drawReleaseBox(ctx, api, v, 240 + i * 230, 580, 180, 100, themeColors.cyan, 34),
      );
      drawReleaseBox(ctx, api, 'same saved outputs', 1070, 580, 650, 100, themeColors.yellow, 32);
      drawReleaseArrow(ctx, api, 945, 630, 1030, 630, themeColors.muted);
      if (cueProgress(2, 2) > 0) {
        drawReleaseArrow(ctx, api, 1380, 720, 1380, 825, themeColors.pink);
        drawReleaseBox(
          ctx,
          api,
          'Distinct saved request identities: 3',
          340,
          840,
          1240,
          100,
          themeColors.pink,
          34,
        );
      }
    }
    drawReleaseFooter(
      ctx,
      api,
      'Argo Rollouts analysis, Argo CD reconciliation and local scoring are distinct',
    );
  }
}
export default {
  id: 'analysis-boundary',
  draw: drawAnalysisBoundary,
  cues: [
    'analysis-boundary-b1',
    'analysis-boundary-s0-0',
    'analysis-boundary-s0-1',
    'analysis-boundary-s0-2',
    'analysis-boundary-s0-3',
    'analysis-boundary-b2',
    'analysis-boundary-s1-0',
    'analysis-boundary-s1-1',
    'analysis-boundary-s1-2',
    'analysis-boundary-s1-3',
    'analysis-boundary-b3',
    'analysis-boundary-s2-0',
    'analysis-boundary-s2-1',
    'analysis-boundary-s2-2',
  ],
};
