import { MESSAGES } from '../fixtures.mjs';
import { clamp, mix } from '../arithmetic.mjs';
import { indexBuildState, q } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawMessage,
  drawPosting,
  drawReference,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawScanIndex(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const model = indexBuildState(state),
      p = model.progress,
      sourceId =
        currentBeat === 0
          ? 0
          : currentBeat === 1
            ? progress('index-second-source', 1, 0.3, 0.4) > 0
              ? 2
              : 1
            : 3;
    withFocus(ctx, api, 'index-source', () =>
      drawMessage(ctx, api, MESSAGES[sourceId], 150, 250, 1590),
    );
    drawText(
      ctx,
      api,
      'Showing two entries of the complete word dictionary',
      180,
      900,
      29,
      themeColors.muted,
    );
    withFocus(ctx, api, 'index-charged', () =>
      drawPosting(ctx, api, 'charged', model.charged, 850, 500, 900),
    );
    withFocus(ctx, api, 'index-twice', () =>
      drawPosting(ctx, api, 'twice', model.twice, 850, 690, 900),
    );
    const moves =
      currentBeat === 0
        ? [
            [0, p[0], 500],
            [0, p[1], 690],
          ]
        : currentBeat === 1
          ? [
              [2, clamp(p[2] * 2), 500],
              [2, clamp((p[2] - 0.5) * 2), 690],
            ]
          : [[3, p[3], 500]];
    for (const [id, part, y] of moves)
      if (part > 0 && part < 0.98) {
        const slot = id === 0 ? 0 : id === 2 ? 1 : 2,
          targetX = 1090 + slot * 190,
          corridor = y === 500 ? 390 : 590,
          travel = clamp(part / 0.88),
          landing = clamp((part - 0.88) / 0.1);
        drawReference(
          ctx,
          api,
          id,
          mix(250, targetX, travel),
          landing ? mix(corridor, y + 24, landing) : mix(430, corridor, clamp(part / 0.2)),
          themeColors.yellow,
          1,
          170,
        );
      }
    if (currentBeat === 1 && sourceId === 1)
      drawCard(
        ctx,
        api,
        'sign → other vocabulary entry',
        180,
        580,
        580,
        85,
        themeColors.blue,
        1,
        28,
      );
    drawCaption(ctx, api, 'Word key → a set of stable message IDs', themeColors.cyan);
  }
}
export default {
  id: 'scan-index',
  draw: drawScanIndex,
  cues: [
    'index-first-charged',
    'index-first-twice',
    'index-other',
    'index-second-source',
    'index-second',
    'index-third',
  ],
};
