import { formatValue } from '../arithmetic.mjs';
import { drawCells, drawNote, drawRectangle, drawText } from '../defaults.mjs';
import { dotProduct } from 'vizmatic';
export function drawPrefixFailure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-prefix-failure-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('prefix-failure-mechanism', () => {
    const full = [
        [0.6, 0.8],
        [0.6, 0.8],
        [0.6, -0.8],
      ],
      cut = currentBeat === 0 ? cueProgress('cut') : 1;
    drawText(
      ctx,
      api,
      'Same coordinate strips · remove the distinguishing coordinate',
      960,
      285,
      34,
      themeColors.yellow,
    );
    full.forEach((v, i) => {
      const y = 425 + i * 165;
      drawText(
        ctx,
        api,
        ['query', 'match', 'distractor'][i],
        340,
        y + 45,
        31,
        i === 2 ? themeColors.pink : themeColors.blue,
      );
      drawCells(ctx, api, [0.6], 620, y, 340, 85, i === 2 ? themeColors.pink : themeColors.cyan);
      drawRectangle(
        ctx,
        api,
        960,
        y + cut * 70,
        328,
        85,
        themeColors.panel,
        cut ? themeColors.muted : i === 2 ? themeColors.pink : themeColors.cyan,
      );
      drawText(
        ctx,
        api,
        cut === 1 ? 'discarded' : v[1],
        1124,
        y + cut * 70 + 55,
        28,
        cut ? themeColors.muted : i === 2 ? themeColors.pink : themeColors.cyan,
      );
      if ((resultComplete('full') && !cut) || (currentBeat === 0 && resultComplete('tie')))
        drawText(
          ctx,
          api,
          cut ? 'cos = 1' : i ? formatValue(dotProduct(full[0], v), 2) : 'unit query',
          1540,
          y + 50,
          34,
          i === 2 ? themeColors.pink : themeColors.green,
        );
    });
    if (currentBeat === 1 && resultComplete('zero'))
      drawText(
        ctx,
        api,
        'Prefix [0,0] → reject before normalization',
        960,
        945,
        35,
        themeColors.pink,
      );
    drawNote(
      ctx,
      api,
      cut
        ? 'All retained .6 values normalize to +1 · length repair cannot restore lost information'
        : 'The second coordinate carries the distinguishing direction',
    );
  });
}
export default {
  id: 'prefix-failure',
  draw: drawPrefixFailure,
  cues: [
    'cl-prefix-failure-full',
    'cl-prefix-failure-cut',
    'cl-prefix-failure-tie',
    'cl-prefix-failure-zero',
  ],
};
