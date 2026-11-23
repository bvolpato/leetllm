import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawExactCandidate(ctx, scene, state, api) {
  if (paintExactCandidate(ctx, scene, state, api)) return;
}
function paintExactCandidate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'exact-candidate', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('exact-candidate-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      'Registration retains candidate bytes · approval changes the deployment reference',
    );
    const fast = [
      'template + schema',
      'artifact digests',
      'computed parity',
      'input-size estimate',
    ];
    if (currentBeat === 0) {
      drawReleaseBox(ctx, api, 'Immutable candidate C', 640, 330, 640, 90, themeColors.blue);
      fast.forEach((v, i) => {
        const x = 150 + i * 430;
        if (cueProgress(0, 0) > i / fast.length || resultComplete(0, 0)) {
          drawReleaseBox(ctx, api, v, x, 540, 330, 100, themeColors.cyan, 27);
          drawReleaseArrow(ctx, api, 960, 445, x + 165, 520, themeColors.muted, 2);
        }
      });
      if (resultComplete(0, 1)) {
        drawReleaseBox(
          ctx,
          api,
          'Cached output → parser check',
          230,
          790,
          650,
          100,
          themeColors.yellow,
          29,
        );
        drawReleaseBox(
          ctx,
          api,
          'New prompt → fresh generated eval',
          1040,
          790,
          650,
          100,
          themeColors.green,
          29,
        );
      }
    } else if (currentBeat === 1) {
      const cats = ['helpfulness', 'grounding', 'safety', 'task result'];
      cats.forEach((v, i) => {
        drawReleaseBox(ctx, api, v, 200 + i * 420, 370, 320, 85, themeColors.blue, 29);
        if (cueProgress(1, 0) > i / 4)
          drawReleaseBox(
            ctx,
            api,
            'reviewed cases',
            200 + i * 420,
            535,
            320,
            90,
            themeColors.cyan,
            27,
          );
      });
      if (resultComplete(1, 1))
        drawReleaseBox(
          ctx,
          api,
          'tool schema + policy versions stay pinned',
          450,
          730,
          1020,
          95,
          themeColors.yellow,
        );
      if (resultComplete(1, 2))
        drawReleaseText(
          ctx,
          api,
          'Judge / uncertainty / critical slices',
          960,
          925,
          36,
          themeColors.ink,
          'center',
        );
    } else {
      drawReleaseBox(ctx, api, 'Controlled release C', 160, 375, 670, 100, themeColors.blue);
      drawReleaseBox(ctx, api, 'Hosted service', 1110, 375, 650, 100, themeColors.yellow);
      drawReleaseArrow(ctx, api, 855, 425, 1080, 425, themeColors.cyan);
      if (cueProgress(2, 0) > 0) {
        drawReleaseBox(
          ctx,
          api,
          'version + request ID + observed metadata',
          940,
          610,
          820,
          100,
          themeColors.cyan,
          28,
        );
        drawReleaseArrow(ctx, api, 1435, 500, 1350, 590, themeColors.cyan);
      }
      if (resultComplete(2, 1))
        drawReleaseBox(
          ctx,
          api,
          'Retain evaluated responses + regression checks',
          200,
          800,
          1520,
          100,
          themeColors.green,
          31,
        );
      drawReleaseFooter(
        ctx,
        api,
        'Record the provider version and request ID for each evaluated response',
      );
    }
  }
}
export default {
  id: 'exact-candidate',
  draw: drawExactCandidate,
  cues: [
    'exact-candidate-b1',
    'exact-candidate-s0-0',
    'exact-candidate-s0-1',
    'exact-candidate-s0-2',
    'exact-candidate-b2',
    'exact-candidate-s1-0',
    'exact-candidate-s1-1',
    'exact-candidate-s1-2',
    'exact-candidate-s1-3',
    'exact-candidate-s1-4',
    'exact-candidate-b3',
    'exact-candidate-s2-0',
    'exact-candidate-s2-1',
    'exact-candidate-s2-2',
    'exact-candidate-s2-3',
  ],
};
