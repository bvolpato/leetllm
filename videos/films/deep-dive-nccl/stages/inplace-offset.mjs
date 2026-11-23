import { done } from '../construction.mjs';
import {
  chapterCard,
  chapterEquation,
  chapterGrid,
  chapterHeading,
  chapterLine,
  chapterNote,
  chapterText,
} from '../defaults.mjs';
export function drawInplaceOffset(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      resultComplete = (bi, si) => done(state, 'inplace-offset', bi, si);
    const rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      chapterHeading(ctx, api, 'The view aliases a rank-index slot in the original allocation');
      const written = currentBeat > 0 && resultComplete(1, 2),
        offset = currentBeat > 0 && resultComplete(1, 1);
      chapterGrid(
        ctx,
        api,
        [[100, 200, written ? 3333 : 300, 400].map(String)],
        300,
        430,
        1320,
        125,
        rankColors,
      );
      [0, 4, 8, 12].forEach((v, j) =>
        chapterText(
          ctx,
          api,
          'byte ' + v,
          465 + j * 330,
          640,
          29,
          j === 2 && offset ? themeColors.green : themeColors.muted,
          'center',
        ),
      );
      if (offset) chapterLine(ctx, api, 1125, 660, 1125, 780, themeColors.green, 4);
      chapterCard(
        ctx,
        api,
        offset ? 'Rank 2 view · byte 8' : 'Rank 2 view · offset pending',
        775,
        810,
        700,
        100,
        offset ? themeColors.green : themeColors.yellow,
      );
      if (currentBeat === 0) {
        chapterEquation(ctx, api, 'offset = rank × count × bytes/element', 960, 980, 37);
      } else if (resultComplete(1, 3)) {
        chapterCard(ctx, api, 'Wrong base pointer reads 100', 200, 940, 700, 70, themeColors.pink);
        chapterCard(
          ctx,
          api,
          'View write changes original slot 2',
          1020,
          940,
          700,
          70,
          themeColors.green,
        );
      }
      chapterNote(ctx, api, 'One shared float32 array on the CPU');
    }
  });
}
export default {
  id: 'inplace-offset',
  draw: drawInplaceOffset,
  cues: [
    'nc-inplace-offset-b0-s0',
    'nc-inplace-offset-b0-s1',
    'nc-inplace-offset-b0-s2',
    'nc-inplace-offset-b0-s3',
    'nc-inplace-offset-b1-s0',
    'nc-inplace-offset-b1-s1',
    'nc-inplace-offset-b1-s2',
    'nc-inplace-offset-b1-s3',
    'nc-inplace-offset-b1-s4',
  ],
};
