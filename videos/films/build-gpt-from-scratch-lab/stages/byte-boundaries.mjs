import { bytePieceFixture } from '../arithmetic.mjs';
import { prompt } from '../prompt.mjs';
import { ended, spoken } from '../construction.mjs';
import { drawChapterCard, drawChapterText, drawFooter } from '../defaults.mjs';
export function drawByteBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('byte-boundaries-mechanism', () => {
    if (currentBeat === 0) {
      const piecesVisible = cueProgress('six-byte-pieces', 0) > 0;
      drawChapterText(
        ctx,
        api,
        'Actual GPT-2 encoding · Good sir,↵Speak',
        960,
        290,
        35,
        themeColors.ink,
        'center',
      );
      prompt.forEach(({ original, piece }, i) => {
        const x = 155 + i * 270;
        drawChapterCard(ctx, api, original, x, 395, 250, themeColors.blue, 92, 36);
        if (piecesVisible)
          drawChapterCard(
            ctx,
            api,
            piece,
            x,
            560,
            250,
            i === 3 ? themeColors.yellow : themeColors.cyan,
            110,
            42,
          );
        drawChapterText(ctx, api, 'position ' + i, x + 125, 745, 25, themeColors.muted, 'center');
      });
      if (E('newline-target', 0)) {
        api.arrow(ctx, 820, 795, 1090, 795, themeColors.yellow, 5);
        drawChapterText(
          ctx,
          api,
          'comma at position 2 → newline ID 198',
          960,
          900,
          37,
          themeColors.yellow,
          'center',
        );
      }
      drawFooter(ctx, api, 'The dot marks a leading space. The bent arrow marks a line break.');
    } else {
      const bytes = bytePieceFixture(),
        join = cueProgress('joined-bytes', 1),
        split = cueProgress('separate-bytes', 1) > 0;
      drawChapterText(
        ctx,
        api,
        'Actual byte pieces for ' + bytes.unicode,
        960,
        290,
        36,
        themeColors.ink,
        'center',
      );
      const left = 340 + 280 * join,
        right = 1210 - 250 * join;
      drawChapterCard(ctx, api, 'F0 9F', left, 405, 300, themeColors.blue, 115, 42);
      drawChapterCard(ctx, api, '99 82', right, 405, 300, themeColors.cyan, 115, 42);
      if (split && join === 0) {
        drawChapterCard(ctx, api, 'decode → U+FFFD', 245, 625, 470, themeColors.pink, 110, 30);
        drawChapterCard(ctx, api, 'decode → U+FFFD × 2', 1095, 625, 580, themeColors.pink, 110, 30);
        drawChapterText(
          ctx,
          api,
          '3 replacement characters · original bytes are lost',
          960,
          850,
          35,
          themeColors.pink,
          'center',
        );
      }
      if (join > 0) {
        drawChapterCard(
          ctx,
          api,
          E('joined-bytes', 1) ? 'F0 9F 99 82 → U+1F642' : 'F0 9F 99 82 · decode pending',
          410,
          675,
          1100,
          E('joined-bytes', 1) ? themeColors.green : themeColors.cyan,
          125,
          39,
        );
        drawChapterText(
          ctx,
          api,
          E('joined-bytes', 1) ? 'Decoded together   ' + bytes.whole : 'Buffer the original bytes',
          960,
          900,
          31,
          themeColors.cyan,
          'center',
        );
      }
      drawFooter(
        ctx,
        api,
        'Replacement decoding and strict rejection are different policies · this fixture uses the full tokenizer',
      );
    }
  });
}
export default {
  id: 'byte-boundaries',
  draw: drawByteBoundaries,
  cues: [
    'byte-boundaries-1',
    'six-byte-pieces',
    'newline-target',
    'byte-boundaries-2',
    'separate-bytes',
    'joined-bytes',
  ],
};
