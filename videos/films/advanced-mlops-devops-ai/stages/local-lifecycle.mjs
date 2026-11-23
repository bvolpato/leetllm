import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawLocalLifecycle(ctx, scene, state, api) {
  if (paintLocalLifecycle(ctx, scene, state, api)) return;
}
function paintLocalLifecycle(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'local-lifecycle', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('local-lifecycle-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(ctx, api, 'Production pointer and audit table in SQLite');
    if (currentBeat === 0) {
      drawReleaseBox(
        ctx,
        api,
        'Computed parity: L2 vs none',
        310,
        350,
        1300,
        100,
        themeColors.pink,
        35,
      );
      if (resultComplete(0, 1))
        drawReleaseBox(
          ctx,
          api,
          'Bad candidate rejected · baseline pointer unchanged',
          310,
          560,
          1300,
          100,
          themeColors.pink,
          33,
        );
      if (resultComplete(0, 2))
        drawReleaseBox(
          ctx,
          api,
          'Corrected L2 fixtures → registered full manifest digest',
          310,
          770,
          1300,
          100,
          themeColors.green,
          31,
        );
    } else if (currentBeat === 2) {
      const audits = [
        ['baseline', 'candidate', 1],
        ['candidate', 'baseline', 2],
        ['baseline', 'candidate', 3],
        ['candidate', 'baseline', 4],
      ];
      audits.forEach(([from, to, g], i) => {
        drawReleaseBox(
          ctx,
          api,
          'generation ' + g + ' · ' + from + ' → ' + to,
          340,
          340 + i * 130,
          1240,
          90,
          themeColors.yellow,
          32,
        );
      });
      if (resultComplete(2, 1))
        drawReleaseBox(
          ctx,
          api,
          'Delayed token rejected · 0 extra audit rows',
          320,
          900,
          1280,
          90,
          themeColors.green,
          33,
        );
      drawReleaseFooter(ctx, api, 'One audit row per committed change');
    } else {
      const rowsData = [
          ['baseline', 0],
          ['candidate', 1],
          ['baseline', 2],
          ['candidate', 3],
          ['baseline', 4],
        ],
        u = cueProgress(1, 4),
        through = resultComplete(1, 3) ? 2 : resultComplete(1, 1) ? 1 : 0,
        last = through === 2 ? 2 + Math.floor(u * 2) : through;
      rowsData.forEach(([name, g], i) => {
        const x = 130 + i * 350;
        drawReleaseBox(
          ctx,
          api,
          name,
          x,
          390,
          290,
          90,
          i <= last ? (i % 2 ? themeColors.cyan : themeColors.green) : themeColors.muted,
          28,
        );
        drawReleaseText(
          ctx,
          api,
          'generation ' + g,
          x + 145,
          580,
          29,
          i <= last ? themeColors.ink : themeColors.muted,
          'center',
        );
        if (i > 0 && i <= last) {
          drawReleaseArrow(ctx, api, x - 55, 435, x - 15, 435, themeColors.cyan);
          drawReleaseBox(ctx, api, 'audit ' + g, x, 700, 290, 90, themeColors.yellow, 29);
        }
      });
      if (currentBeat === 2) {
        drawReleaseText(
          ctx,
          api,
          'Four committed transitions · generations 1, 2, 3, 4',
          960,
          915,
          36,
          themeColors.green,
          'center',
        );
        drawReleaseFooter(ctx, api, 'Stale attempts changed neither pointer nor audit');
      }
    }
  }
}
export default {
  id: 'local-lifecycle',
  draw: drawLocalLifecycle,
  cues: [
    'local-lifecycle-b1',
    'local-lifecycle-s0-0',
    'local-lifecycle-s0-1',
    'local-lifecycle-s0-2',
    'local-lifecycle-s0-3',
    'local-lifecycle-b2',
    'local-lifecycle-s1-0',
    'local-lifecycle-s1-1',
    'local-lifecycle-s1-2',
    'local-lifecycle-s1-3',
    'local-lifecycle-s1-4',
    'local-lifecycle-b3',
    'local-lifecycle-s2-0',
    'local-lifecycle-s2-1',
    'local-lifecycle-s2-2',
    'local-lifecycle-s2-3',
  ],
};
