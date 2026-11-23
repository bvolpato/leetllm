import { complete, paddedWorkingSet, sentence } from '../construction.mjs';
import {
  drawChapterFooter,
  drawChapterGrid,
  drawChapterSend,
  drawChapterText,
  drawChapterValues,
} from '../defaults.mjs';
export function drawPaddedGather(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'padded-gather', beat, index),
    resultComplete = (beat, index) => complete(state, 'padded-gather', beat, index);
  api.focus.target('padded-gather-construction', () => {
    const lengths = currentBeat ? [5, 7] : [5],
      ws = paddedWorkingSet(lengths, 4, currentBeat > 1 ? [0, 1] : [0]);
    drawChapterText(
      ctx,
      api,
      'Supplied 4-rank allocation worksheet',
      960,
      285,
      34,
      themeColors.yellow,
      'center',
    );
    drawChapterText(ctx, api, 'Logical L0 · 5 values', 150, 380, 30, themeColors.blue);
    drawChapterGrid(
      ctx,
      api,
      [['p0', 'p1', 'p2', 'p3', 'p4']],
      620,
      325,
      1100,
      90,
      themeColors.blue,
      34,
    );
    const localDone = currentBeat > 0 || resultComplete(0, 1),
      gatherP = currentBeat > 0 ? 1 : sentenceProgress(0, 2),
      copied = Math.floor(gatherP * 8);
    if (localDone) {
      drawChapterValues(
        ctx,
        api,
        currentBeat ? 'R0 retained L0 + L1 shards' : 'R0 retained L0 shard',
        currentBeat ? ['L0p0', 'L0p1', 'L1p0', 'L1p1'] : ['p0', 'p1'],
        475,
        themeColors.blue,
      );
    }
    drawChapterText(ctx, api, 'Separate full L0 allocation', 150, 700, 29, themeColors.cyan);
    drawChapterGrid(
      ctx,
      api,
      [
        Array.from(
          {
            length: 8,
          },
          (_, i) => (i < copied ? (i < 5 ? 'p' + i : 'pad') : ''),
        ),
      ],
      620,
      645,
      1100,
      90,
      themeColors.cyan,
      30,
    );
    if (gatherP > 0 && gatherP < 1) {
      const active = Math.min(7, copied),
        x = 620 + ((active + 0.5) * 1100) / 8;
      drawChapterSend(
        ctx,
        api,
        x,
        600,
        x,
        640,
        (gatherP * 8) % 1,
        [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][
          Math.floor(active / 2)
        ],
      );
    }
    if (currentBeat === 0 && resultComplete(0, 2))
      drawChapterText(
        ctx,
        api,
        'Local 2 + separate full 8 = 10 allocated elements',
        960,
        875,
        38,
        themeColors.green,
        'center',
      );
    if (currentBeat === 1) {
      drawChapterText(
        ctx,
        api,
        'Add supplied L1 length 7: ceil(7/4) = 2 more resident',
        960,
        820,
        32,
        themeColors.blue,
        'center',
      );
      if (resultComplete(1, 0))
        drawChapterText(
          ctx,
          api,
          'Resident 4 + full L0 8 = ' + ws.total + ' elements',
          960,
          905,
          40,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 2) {
      const pref = sentenceProgress(2, 0);
      drawChapterText(
        ctx,
        api,
        'Retained L0 full view + prefetched L1 full view',
        960,
        815,
        31,
        themeColors.cyan,
        'center',
      );
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 8,
            },
            (_, i) => (i < Math.floor(pref * 8) ? (i < 7 ? 'L1p' + i : 'pad') : ''),
          ),
        ],
        620,
        850,
        1100,
        80,
        themeColors.pink,
        28,
      );
      if (resultComplete(2, 0))
        drawChapterText(
          ctx,
          api,
          '4 resident + 8 + 8 gathered = ' + ws.total + ' elements',
          960,
          965,
          36,
          themeColors.green,
          'center',
        );
    }
    drawChapterFooter(
      ctx,
      api,
      'Allocated full view includes local values · received network values are a different count',
      1040,
    );
  });
}
export default {
  id: 'padded-gather',
  draw: drawPaddedGather,
  cues: [
    'ds-padded-gather-b0-s0',
    'ds-padded-gather-b0-s1',
    'ds-padded-gather-b0-s2',
    'ds-padded-gather-b1-s0',
    'ds-padded-gather-b1-s1',
    'ds-padded-gather-b1-s2',
    'ds-padded-gather-b1-s3',
    'ds-padded-gather-b2-s0',
    'ds-padded-gather-b2-s1',
    'ds-padded-gather-b2-s2',
    'ds-padded-gather-b2-s3',
  ],
};
