import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawFeatureInterface(ctx, scene, state, api) {
  if (paintFeatureInterface(ctx, scene, state, api)) return;
}
function paintFeatureInterface(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'feature-interface', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('feature-interface-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Feast object sketch · no Parquet or online materialization executed'
        : currentBeat === 1
          ? 'Historical examples and latest online values use separate interfaces'
          : 'Documentation capabilities checked for this film · November 2026',
    );
    if (currentBeat === 0) {
      const fields = [
        'region identity',
        'event timestamp',
        'available at',
        'recent failure count',
        'average queue minutes · 30 days',
        'release pattern embedding · float array',
      ];
      fields.forEach((v, i) => {
        if (cueProgress(0, 0) > i / fields.length || currentBeat > 0)
          drawReleaseBox(
            ctx,
            api,
            v,
            420,
            345 + i * 89,
            1080,
            68,
            i < 3 ? themeColors.blue : themeColors.cyan,
            28,
          );
      });
      if (resultComplete(0, 1))
        drawReleaseFooter(
          ctx,
          api,
          'Object declarations → source records → materialization → actual serving',
        );
    } else if (currentBeat === 1) {
      drawReleaseBox(
        ctx,
        api,
        'Historical request: entity + example time',
        150,
        370,
        750,
        110,
        themeColors.blue,
        29,
      );
      drawReleaseBox(
        ctx,
        api,
        'Online request: entity rows',
        1040,
        370,
        720,
        110,
        themeColors.cyan,
        29,
      );
      drawReleaseBox(
        ctx,
        api,
        'event / availability / allowed age',
        150,
        635,
        750,
        120,
        themeColors.green,
        31,
      );
      drawReleaseBox(
        ctx,
        api,
        'current stored feature values',
        1040,
        635,
        720,
        120,
        themeColors.yellow,
        31,
      );
      drawReleaseArrow(ctx, api, 525, 500, 525, 610, themeColors.blue);
      drawReleaseArrow(ctx, api, 1400, 500, 1400, 610, themeColors.cyan);
      if (resultComplete(1, 2))
        drawReleaseText(
          ctx,
          api,
          'releases@4 / @5 here are application labels',
          960,
          900,
          35,
          themeColors.pink,
          'center',
        );
    } else {
      drawReleaseBox(
        ctx,
        api,
        'Version-qualified online read',
        130,
        340,
        770,
        105,
        themeColors.blue,
      );
      drawReleaseBox(
        ctx,
        api,
        'configured option + SQLite backend',
        1020,
        340,
        770,
        105,
        themeColors.green,
        28,
      );
      drawReleaseArrow(ctx, api, 925, 392, 995, 392, themeColors.cyan);
      if (cueProgress(2, 1) > 0) {
        drawReleaseBox(
          ctx,
          api,
          'Historical created-time filter',
          130,
          600,
          770,
          105,
          themeColors.blue,
        );
        drawReleaseBox(
          ctx,
          api,
          'opt-in + non-null time + supported store',
          1020,
          600,
          770,
          105,
          themeColors.green,
          28,
        );
        drawReleaseArrow(ctx, api, 925, 652, 995, 652, themeColors.cyan);
      }
      if (resultComplete(2, 2))
        drawReleaseBox(
          ctx,
          api,
          'Without filter: latest correction may be future-created',
          250,
          840,
          1420,
          100,
          themeColors.pink,
          31,
        );
      drawReleaseFooter(
        ctx,
        api,
        'Verify the deployed backend and version; a label does not retain a snapshot',
      );
    }
  }
}
export default {
  id: 'feature-interface',
  draw: drawFeatureInterface,
  cues: [
    'feature-interface-b1',
    'feature-interface-s0-0',
    'feature-interface-s0-1',
    'feature-interface-s0-2',
    'feature-interface-b2',
    'feature-interface-s1-0',
    'feature-interface-s1-1',
    'feature-interface-s1-2',
    'feature-interface-s1-3',
    'feature-interface-b3',
    'feature-interface-s2-0',
    'feature-interface-s2-1',
    'feature-interface-s2-2',
    'feature-interface-s2-3',
  ],
};
