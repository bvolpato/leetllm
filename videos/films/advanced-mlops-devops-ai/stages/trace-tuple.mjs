import { mix } from '../arithmetic.mjs';
import { featureImpact } from '../features.mjs';
import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawTraceTuple(ctx, scene, state, api) {
  if (paintTraceTuple(ctx, scene, state, api)) return;
}
function paintTraceTuple(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'trace-tuple', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('trace-tuple-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Resolve the immutable release recorded on request 8a2'
        : currentBeat === 1
          ? 'Recorded identity → retained manifest → timestamped feature evidence'
          : 'Replay one changed input before restoring the compatible whole',
    );
    if (currentBeat === 0) {
      const keys = ['prompt', 'base', 'adapter', 'feature view', 'normalize', 'Git commit'],
        served = ['support@2.8', 'base@42', 'lora@1.9', 'releases@5', 'none', '9f3c2a1'],
        known = ['support@2.8', 'base@42', 'lora@1.9', 'releases@4', 'l2', 'a7d812b'];
      drawReleaseBox(
        ctx,
        api,
        'request 8a2 · us-west → release-a91',
        460,
        320,
        1000,
        75,
        themeColors.yellow,
        31,
      );
      drawReleaseText(ctx, api, 'Served', 970, 450, 29, themeColors.pink, 'center');
      drawReleaseText(ctx, api, 'Known good', 1540, 450, 29, themeColors.green, 'center');
      keys.forEach((key, i) => {
        const y = 500 + i * 71;
        if (cueProgress(0, Math.min(3, i > 2 ? 3 : 1)) > 0) {
          drawReleaseText(ctx, api, key, 240, y + 34, 27, themeColors.muted);
          drawReleaseBox(
            ctx,
            api,
            served[i],
            700,
            y,
            540,
            64,
            i > 2 ? themeColors.pink : themeColors.blue,
            27,
          );
          drawReleaseBox(
            ctx,
            api,
            known[i],
            1290,
            y,
            500,
            64,
            i > 2 ? themeColors.green : themeColors.blue,
            27,
          );
        }
      });
    } else if (currentBeat === 1) {
      drawReleaseBox(
        ctx,
        api,
        'Recorded request 8a2 → immutable release-a91',
        300,
        330,
        1320,
        95,
        themeColors.yellow,
        35,
      );
      const groups = [
        'prompt · base · adapter · image',
        'guardrail · retrieval · feature computation',
        'golden set · judge · promoting commit',
      ];
      groups.forEach((v, i) => {
        if (cueProgress(1, 1) > i / 3) {
          drawReleaseBox(ctx, api, v, 210, 510 + i * 130, 1500, 90, themeColors.blue, 31);
          if (i === 0) drawReleaseArrow(ctx, api, 960, 450, 960, 485, themeColors.cyan);
        }
      });
      if (resultComplete(1, 2))
        drawReleaseBox(
          ctx,
          api,
          'Timestamped feature values · controlled access + retention',
          310,
          925,
          1300,
          90,
          themeColors.cyan,
          32,
        );
    } else {
      const u = cueProgress(2, 2),
        v = featureImpact(1),
        changed = v.raw.map((n, i) => mix(n, v.normalized[i], u)),
        changedScore = changed.reduce((sum, n) => sum + 0.5 * n, 0),
        restored = resultComplete(2, 2);
      [
        ['known-good path', v.normalized, 0.7, themeColors.green],
        ['changed path', changed, changedScore, themeColors.pink],
      ].forEach(([name, values, score, col], i) => {
        const x = 160 + i * 900;
        drawReleaseBox(ctx, api, name, x, 365, 700, 100, col, 34);
        drawReleaseText(
          ctx,
          api,
          '[' + values.map((v) => v.toFixed(2)).join(', ') + ']',
          x + 350,
          610,
          45,
          col,
          'center',
        );
        drawReleaseText(
          ctx,
          api,
          'fixed dot score ' + score.toFixed(2),
          x + 350,
          740,
          38,
          col,
          'center',
        );
      });
      if (restored)
        drawReleaseBox(
          ctx,
          api,
          'Restore full compatible known-good manifest',
          310,
          865,
          1300,
          90,
          themeColors.green,
          34,
        );
      if (resultComplete(2, 3))
        drawReleaseFooter(
          ctx,
          api,
          'New served trace, feature values, health and task outcome remain required',
        );
    }
  }
}
export default {
  id: 'trace-tuple',
  draw: drawTraceTuple,
  cues: [
    'trace-tuple-b1',
    'trace-tuple-s0-0',
    'trace-tuple-s0-1',
    'trace-tuple-s0-2',
    'trace-tuple-s0-3',
    'trace-tuple-b2',
    'trace-tuple-s1-0',
    'trace-tuple-s1-1',
    'trace-tuple-s1-2',
    'trace-tuple-b3',
    'trace-tuple-s2-0',
    'trace-tuple-s2-1',
    'trace-tuple-s2-2',
    'trace-tuple-s2-3',
  ],
};
