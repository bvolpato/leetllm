import { mix } from '../arithmetic.mjs';
import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseHeading,
  drawReleaseLine,
  drawReleaseText,
} from '../defaults.mjs';
export function drawRegistryCache(ctx, scene, state, api) {
  if (paintRegistryCache(ctx, scene, state, api)) return;
}
function paintRegistryCache(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'registry-cache', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('registry-cache-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Supplied registry-state illustration'
        : currentBeat === 1
          ? 'Registry alias and already-loaded worker are separate owners'
          : 'Use the deployed cache refresh contract',
    );
    if (currentBeat === 0) {
      drawReleaseBox(ctx, api, 'Prompt template version 6', 600, 330, 720, 95, themeColors.blue);
      const u = cueProgress(0, 1),
        temp = 0.2 + 0.5 * u;
      drawReleaseText(
        ctx,
        api,
        'Template bytes stay fixed',
        960,
        510,
        34,
        themeColors.blue,
        'center',
      );
      drawReleaseLine(ctx, api, 430, 700, 1490, 700, themeColors.muted, 5);
      const x = 430 + 1060 * temp;
      api.circle(ctx, x, 700, 18, themeColors.yellow);
      drawReleaseText(
        ctx,
        api,
        'mutable temperature ' + temp.toFixed(2),
        960,
        620,
        40,
        themeColors.yellow,
        'center',
      );
      drawReleaseText(ctx, api, '0', 420, 760, 28, themeColors.muted);
      drawReleaseText(ctx, api, '1', 1490, 760, 28, themeColors.muted);
      if (resultComplete(0, 3))
        drawReleaseBox(
          ctx,
          api,
          'Snapshot settings in the evaluated manifest',
          410,
          865,
          1100,
          100,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const changed = resultComplete(1, 1);
      drawReleaseBox(
        ctx,
        api,
        'Alias production → ' + (changed ? 'version 13' : 'version 12'),
        180,
        380,
        680,
        110,
        themeColors.yellow,
      );
      drawReleaseBox(ctx, api, 'Worker W loaded version 12', 1050, 380, 700, 110, themeColors.blue);
      drawReleaseArrow(ctx, api, 880, 435, 1020, 435, themeColors.muted);
      drawReleaseText(
        ctx,
        api,
        'A pointer update does not rewrite W',
        960,
        630,
        38,
        themeColors.pink,
        'center',
      );
      if (resultComplete(1, 2)) {
        drawReleaseBox(
          ctx,
          api,
          'prepare 13 → health → route → new served trace',
          240,
          790,
          1440,
          110,
          themeColors.green,
          33,
        );
      }
    } else {
      const u = cueProgress(2, 1),
        refreshed = u >= 1;
      drawReleaseBox(
        ctx,
        api,
        'Illustrative registry target: version 13',
        150,
        355,
        750,
        110,
        themeColors.yellow,
        30,
      );
      drawReleaseBox(
        ctx,
        api,
        refreshed ? 'Fresh resolution: version 13' : 'Cached resolution: version 12',
        1020,
        355,
        750,
        110,
        refreshed ? themeColors.cyan : themeColors.blue,
        31,
      );
      drawReleaseArrow(ctx, api, 925, 410, 995, 410, themeColors.muted);
      if (u > 0 && u < 1)
        drawReleaseBox(
          ctx,
          api,
          'resolve 13',
          mix(230, 1130, u),
          540,
          360,
          85,
          themeColors.cyan,
          30,
        );
      ['configured TTL', 'invalidation', 'explicit bypass'].forEach((v, i) =>
        drawReleaseBox(ctx, api, v, 160 + i * 590, 720, 520, 90, themeColors.yellow, 30),
      );
      if (resultComplete(2, 2))
        drawReleaseBox(
          ctx,
          api,
          'New response → inspect actual resolved version',
          310,
          900,
          1300,
          90,
          themeColors.green,
          32,
        );
    }
  }
}
export default {
  id: 'registry-cache',
  draw: drawRegistryCache,
  cues: [
    'registry-cache-b1',
    'registry-cache-s0-0',
    'registry-cache-s0-1',
    'registry-cache-s0-2',
    'registry-cache-s0-3',
    'registry-cache-b2',
    'registry-cache-s1-0',
    'registry-cache-s1-1',
    'registry-cache-s1-2',
    'registry-cache-s1-3',
    'registry-cache-b3',
    'registry-cache-s2-0',
    'registry-cache-s2-1',
    'registry-cache-s2-2',
    'registry-cache-s2-3',
  ],
};
