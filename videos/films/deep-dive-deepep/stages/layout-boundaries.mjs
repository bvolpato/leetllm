import { chapterModel, completed } from '../construction.mjs';
import {
  drawChapterArrow,
  drawChapterEquation,
  drawChapterGrid,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawLayoutBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('layout-boundaries', state),
    currentBeat = m.b,
    progress2 = m.p;
  const done = (cue, fallback = false) => completed(state, cue, fallback);
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65)),
    step = (n) => Math.min(n, Math.floor(progress * (n + 1)));
  drawChapterTarget(ctx, api, 'de-layout-boundaries-mechanism', () => {
    if (!currentBeat) {
      const L = m.layout,
        n = step(8);
      drawChapterText(
        ctx,
        api,
        'Counts [3, 1] · alignment 4 · fixed source identities',
        960,
        280,
        34,
        themeColors.yellow,
        'center',
      );
      Array.from(
        {
          length: 8,
        },
        (_, i) => {
          const x = 200 + i * 190,
            valid = L.valid[i];
          if (i < n) {
            api.rect(
              ctx,
              x,
              460,
              170,
              115,
              themeColors.panel,
              valid ? themeColors.cyan : themeColors.muted,
              3,
            );
            drawChapterText(
              ctx,
              api,
              valid ? L.inverse.get(i) : 'gap',
              x + 85,
              530,
              31,
              valid ? themeColors.cyan : themeColors.muted,
              'center',
            );
          }
          drawChapterText(ctx, api, 'slot ' + i, x + 85, 410, 24, themeColors.muted, 'center');
        },
      );
      drawChapterEquation(ctx, api, String.raw`a_e=A\left\lceil n_e/A\right\rceil`, 960, 700, 44);
      drawChapterText(
        ctx,
        api,
        'Allocated lengths [4, 4] · starts [0, 4]',
        960,
        800,
        34,
        themeColors.blue,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'Valid endpoints [3, 5] · ' +
          (done('de-layout-four')
            ? '4 real identities / 8 allocated slots'
            : 'valid identities stay separate from gaps'),
        960,
        915,
        33,
        themeColors.cyan,
        'center',
      );
    } else {
      drawChapterText(
        ctx,
        api,
        'One token-destination row → two valid expert assignments',
        960,
        285,
        34,
        themeColors.yellow,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [['a', 'rank 1', 'E2 / E3', 'gates .7 / .3']],
        180,
        370,
        1540,
        100,
        themeColors.blue,
        29,
      );
      drawChapterArrow(ctx, api, 960, 500, 960, 625);
      drawChapterGrid(
        ctx,
        api,
        [
          ['a → E2', 'a → E3'],
          ['valid slot', 'valid slot'],
        ],
        430,
        680,
        1060,
        190,
        themeColors.cyan,
        32,
      );
      drawChapterText(
        ctx,
        api,
        'Unused selection: no contribution · alignment gap: no source ID',
        960,
        1000,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'layout-boundaries',
  draw: drawLayoutBoundaries,
  cues: ['de-layout-boundaries-b0', 'de-layout-four', 'de-layout-boundaries-b1'],
};
