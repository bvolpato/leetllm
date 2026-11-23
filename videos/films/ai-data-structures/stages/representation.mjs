import {
  drawChapterCard,
  drawChapterPath,
  drawChapterRectangle,
  drawChapterReference,
  drawChapterText,
  pointOnPath,
} from '../defaults.mjs';
export function drawRepresentation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['ds-representation-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(progress / 0.82);
  api.focus.target('ds-representation-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'List slots hold references; M2 remains one object',
        960,
        325,
        36,
        themeColors.ink,
      );
      const shifted = [4, 0, 1, 2, 3];
      for (const [i, id] of shifted.entries()) {
        drawChapterRectangle(ctx, api, 200 + i * 310, 440, 250, 100, themeColors.muted);
        drawChapterText(ctx, api, 'slot ' + i, 325 + i * 310, 405, 27, themeColors.muted);
        drawChapterReference(
          ctx,
          api,
          id,
          220 + i * 310,
          454,
          id === 2 ? themeColors.yellow : themeColors.cyan,
          210,
        );
      }
      const origin = {
        x: 1255,
        y: 552,
      };
      drawChapterPath(
        ctx,
        api,
        [
          origin,
          {
            x: 1255,
            y: 650,
          },
          {
            x: 1190,
            y: 650,
          },
          {
            x: 1190,
            y: 710,
          },
        ],
        themeColors.yellow,
      );
      drawChapterRectangle(ctx, api, 900, 710, 700, 150, themeColors.yellow);
      drawChapterText(ctx, api, 'M2 · one support-note object', 1250, 760, 31, themeColors.yellow);
      drawChapterText(
        ctx,
        api,
        'Its identity survives reference movement',
        1250,
        825,
        27,
        themeColors.ink,
      );
      const token = pointOnPath(
        ctx,
        api,
        [
          origin,
          {
            x: 1255,
            y: 650,
          },
          {
            x: 1190,
            y: 650,
          },
          {
            x: 1190,
            y: 695,
          },
        ],
        u,
      );
      api.circle(ctx, token.x, token.y, 8, themeColors.yellow);
    } else {
      drawChapterText(
        ctx,
        api,
        'Known numeric position ≠ unknown message identity',
        960,
        325,
        36,
        themeColors.yellow,
      );
      for (let i = 0; i < 5; i++) {
        drawChapterRectangle(ctx, api, 260 + i * 260, 450, 215, 100, themeColors.cyan);
        drawChapterText(ctx, api, i + 0.25, 367 + i * 260, 515, 33, themeColors.cyan);
        drawChapterText(ctx, api, 'position ' + i, 367 + i * 260, 410, 25, themeColors.muted);
      }
      drawChapterCard(
        ctx,
        api,
        'Packed numeric values · declared dtype',
        960 - 450,
        650,
        themeColors.cyan,
        900,
      );
      drawChapterCard(
        ctx,
        api,
        u < 0.5 ? 'Dictionary key [0,2]' : 'Dictionary key (0,2)',
        960 - 450,
        820,
        u < 0.5 ? themeColors.pink : themeColors.green,
        900,
      );
      drawChapterText(
        ctx,
        api,
        u < 0.5 ? 'Mutable list: unhashable' : 'Tuple of immutable IDs: hashable',
        960,
        950,
        29,
        u < 0.5 ? themeColors.pink : themeColors.green,
      );
    }
    return;
  });
}
export default {
  id: 'representation',
  draw: drawRepresentation,
  cues: ['ds-representation-0', 'ds-representation-1'],
};
