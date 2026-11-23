import { samplerWindow } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import { drawChapterCard, drawChapterEquation, drawChapterText, drawFooter } from '../defaults.mjs';
export function drawStreamBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('stream-boundaries-mechanism', () => {
    if (currentBeat === 0) {
      const split = cueProgress('contiguous-split', 0) > 0;
      drawChapterText(
        ctx,
        api,
        'Same source ruler · token identities 0 through 19',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 20; i++) {
        const x = 170 + i * 79;
        drawChapterCard(
          ctx,
          api,
          i,
          x,
          400,
          72,
          split
            ? i < 16
              ? themeColors.blue
              : themeColors.yellow
            : i < 4 || (i >= 8 && i < 12)
              ? themeColors.cyan
              : themeColors.muted,
          85,
          27,
        );
      }
      if (split) {
        api.line(ctx, 1430, 365, 1430, 570, themeColors.yellow, 5);
        drawChapterText(ctx, api, 'training 0…15', 750, 655, 38, themeColors.blue, 'center');
        drawChapterText(ctx, api, 'validation 16…19', 1530, 655, 29, themeColors.yellow, 'center');
        drawChapterText(
          ctx,
          api,
          'No target crosses the split',
          960,
          840,
          37,
          themeColors.green,
          'center',
        );
      } else {
        [0, 1, 2, 3, 8, 9, 10, 11].forEach((v, i) =>
          drawChapterCard(
            ctx,
            api,
            v,
            310 + i * 160,
            655,
            125,
            v === 3 || v === 8 ? themeColors.pink : themeColors.cyan,
            90,
            33,
          ),
        );
        if (cueProgress('false-join', 0) > 0) {
          api.arrow(ctx, 895, 795, 1060, 795, themeColors.pink, 5);
          drawChapterText(
            ctx,
            api,
            '3 → 8 was never adjacent in the source',
            960,
            900,
            36,
            themeColors.pink,
            'center',
          );
        }
      }
    } else if (currentBeat === 1) {
      const start = Math.floor(15 * cueProgress('sampler-window', 1)),
        w = samplerWindow(20, 4, start);
      drawChapterText(
        ctx,
        api,
        'Source length 20 · context T = 4 · starts 0…15',
        960,
        290,
        35,
        themeColors.ink,
        'center',
      );
      drawChapterText(ctx, api, 'INPUT', 220, 450, 31, themeColors.blue);
      drawChapterText(ctx, api, 'TARGET', 220, 685, 31, themeColors.yellow);
      w.input.forEach((v, i) => {
        drawChapterCard(ctx, api, v, 450 + i * 300, 385, 230, themeColors.blue, 115, 45);
        drawChapterCard(
          ctx,
          api,
          w.target[i],
          450 + i * 300,
          625,
          230,
          themeColors.yellow,
          115,
          45,
        );
        api.arrow(ctx, 565 + i * 300, 520, 565 + i * 300, 600, themeColors.cyan, 4);
      });
      drawChapterEquation(ctx, api, String.raw`\text{start}<N-T=16`, 960, 860, 47);
      drawChapterText(
        ctx,
        api,
        'One shared five-token source span supplies four successor pairs',
        960,
        945,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      const short = cueProgress('short-stream', 2) > 0;
      drawChapterText(
        ctx,
        api,
        short
          ? 'Source shortened to 48 IDs · no legal window'
          : 'Exact edge: 49 source IDs · context 48',
        960,
        285,
        36,
        themeColors.ink,
        'center',
      );
      drawChapterCard(ctx, api, 'Input: source 0 … 47', 230, 395, 1440, themeColors.blue, 110, 39);
      if (E('last-successor', 2) && !short) {
        drawChapterCard(
          ctx,
          api,
          'Target: source 1 … 48',
          230,
          650,
          1440,
          themeColors.yellow,
          110,
          39,
        );
        api.arrow(ctx, 1460, 535, 1460, 610, themeColors.yellow, 5);
        drawChapterText(
          ctx,
          api,
          'Input 47 predicts source ID 48',
          960,
          880,
          38,
          themeColors.green,
          'center',
        );
      }
      if (short) {
        drawChapterCard(
          ctx,
          api,
          'Last required successor 48 is missing',
          230,
          650,
          1440,
          themeColors.pink,
          110,
          38,
        );
        drawChapterText(
          ctx,
          api,
          'FAIL length check · N must exceed T',
          960,
          885,
          40,
          themeColors.pink,
          'center',
        );
      }
    }
    drawFooter(
      ctx,
      api,
      'Independent documents additionally need attention isolation and boundary-target handling',
    );
  });
}
export default {
  id: 'stream-boundaries',
  draw: drawStreamBoundaries,
  cues: [
    'stream-boundaries-1',
    'false-join',
    'contiguous-split',
    'stream-boundaries-2',
    'sampler-window',
    'stream-boundaries-3',
    'last-successor',
    'short-stream',
  ],
};
