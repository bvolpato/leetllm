import { windows, words } from '../fixtures.mjs';
import { box, drawText, focus, sub } from '../defaults.mjs';
export function drawWindows(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const finalCue = state.cues?.['windows-final-targets'],
      finalVisible =
        currentBeat > 1 ||
        (currentBeat === 1 && (finalCue ? finalCue.phase !== 'before' : progress >= 0.6)),
      shown = currentBeat === 0 ? 1 : finalVisible ? 3 : 2,
      row = shown - 1,
      [begin, end, scoreBegin, scoreEnd] = windows[row];
    sub(ctx, api, 'One document ruler · context windows move; target ownership stays unique');
    focus(ctx, api, 'windows-simulation-35', () => {
      focus(ctx, api, 'windows-object-words-i-37', () =>
        words.forEach((w, i) => {
          const x = 150 + i * 165;
          box(
            ctx,
            api,
            i >= end ? '?' : w,
            x,
            370,
            151,
            90,
            i >= begin && i < end ? themeColors.blue : themeColors.muted,
            28,
          );
          drawText(ctx, api, i, x + 75, 525, 26, themeColors.muted, 'center');
        }),
      );
      api.rect(
        ctx,
        145 + begin * 165,
        350,
        (end - begin) * 165 + 10,
        150,
        'transparent',
        themeColors.cyan,
        3,
      );
      drawText(
        ctx,
        api,
        'Window ' + shown + ' · read positions ' + begin + '–' + (end - 1),
        960,
        640,
        34,
        themeColors.cyan,
        'center',
      );
      for (let r = 0; r < shown; r++) {
        const [, , first, last] = windows[r];
        focus(ctx, api, r === 2 ? 'windows-final-row' : 'windows-owners', () => {
          for (let i = first; i < last; i++)
            box(
              ctx,
              api,
              'W' + (r + 1),
              150 + i * 165,
              730,
              151,
              80,
              [themeColors.green, themeColors.pink, themeColors.yellow][r],
              29,
            );
        });
      }
    });
    focus(ctx, api, 'windows-scored-count', () =>
      drawText(
        ctx,
        api,
        'distinct scored targets: ' + windows.slice(0, shown).reduce((n, w) => n + w[3] - w[2], 0),
        960,
        980,
        41,
        themeColors.yellow,
        'center',
      ),
    );
    focus(ctx, api, 'windows-object-context-mask-reads-target-mask-scores-41', () =>
      drawText(
        ctx,
        api,
        currentBeat === 2
          ? 'Read “all” at position 8 → logits 8 score label “evening” at 9'
          : 'Only fresh target positions acquire an owner stamp',
        960,
        880,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'windows',
  draw: drawWindows,
  cues: [
    'windows-beat-1-focus-1',
    'windows-beat-1-focus-2',
    'windows-beat-2-focus-1',
    'windows-beat-2-focus-2',
    'windows-final-targets',
    'windows-beat-3-focus-1',
    'windows-beat-3-focus-2',
  ],
};
