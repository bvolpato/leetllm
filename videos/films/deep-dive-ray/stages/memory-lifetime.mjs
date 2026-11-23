import { rayMix } from '../arithmetic.mjs';
import { rayChapterState, rayProgress } from '../construction.mjs';
import {
  arrow,
  chapterCard,
  chapterGrid,
  chapterText,
  footer,
  heading,
  packet,
  panel,
} from '../defaults.mjs';
export function drawMemoryLifetime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('memory-lifetime', state),
    { b: currentBeat } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1,
    cueProgress = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat);
  api.focus.target('ray-memory-lifetime-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Local shared allocation and worker heap are separate'
        : currentBeat === 1
          ? 'Deleting one handle leaves a view pin alive'
          : 'Freed original array · separate eligible spill object',
    );
    const deleted = currentBeat > 1 || (currentBeat === 1 && cueProgress('delete-ref', 1) > 0),
      released = currentBeat > 1 || (currentBeat === 1 && done('release-view', 1));
    const blocks = 8,
      blockMiB = 4,
      privateMiB = 12;
    panel(ctx, api, 150, 400, 720, 365, themeColors.blue);
    chapterText(
      ctx,
      api,
      'Shared array   ·   4 MiB per block',
      510,
      460,
      31,
      themeColors.blue,
      'center',
    );
    chapterGrid(
      ctx,
      api,
      [
        Array.from(
          {
            length: blocks,
          },
          () => (released ? 'free' : String(blockMiB)),
        ),
      ],
      200,
      550,
      620,
      110,
      themeColors.blue,
      28,
    );
    chapterText(
      ctx,
      api,
      'Array payload   ' + (released ? 0 : blocks * blockMiB) + ' MiB',
      510,
      723,
      37,
      released ? themeColors.muted : themeColors.green,
      'center',
    );
    chapterCard(
      ctx,
      api,
      deleted ? 'ref variable deleted' : 'ObjectRef variable',
      1060,
      400,
      690,
      deleted ? themeColors.muted : themeColors.cyan,
    );
    chapterCard(
      ctx,
      api,
      released ? 'array view released' : 'NumPy view → same allocation',
      1060,
      625,
      690,
      released ? themeColors.muted : themeColors.green,
    );
    if (!released) arrow(ctx, api, 1040, 672, 890, 672, themeColors.green);
    if (!deleted) arrow(ctx, api, 1040, 448, 890, 448, themeColors.cyan);
    if (currentBeat === 2) {
      chapterCard(
        ctx,
        api,
        'Worker heap   ' + privateMiB + ' MiB',
        150,
        830,
        470,
        themeColors.yellow,
        80,
      );
      chapterCard(ctx, api, 'Control memory', 720, 830, 470, themeColors.yellow, 80);
      chapterCard(ctx, api, 'Eligible spill → disk', 1290, 830, 470, themeColors.cyan, 80);
      if (cueProgress('eligible-spill', 2) > 0)
        packet(
          ctx,
          api,
          'eligible bytes',
          rayMix(940, 1360, cueProgress('eligible-spill', 2)),
          730,
          themeColors.cyan,
          240,
        );
    } else {
      chapterText(
        ctx,
        api,
        'Unrelated worker heap   ' + privateMiB + ' MiB',
        1405,
        801,
        33,
        themeColors.yellow,
        'center',
      );
      chapterText(
        ctx,
        api,
        released
          ? 'No retainers remain in this illustrated allocation'
          : deleted
            ? 'View keeps the same allocation pinned'
            : 'Other handles, arguments and views can retain data',
        960,
        900,
        31,
        released ? themeColors.green : themeColors.yellow,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Illustrative payload sizes   ·   The local lab gives the object store 80 MiB',
    );
  });
}
export default {
  id: 'memory-lifetime',
  draw: drawMemoryLifetime,
  cues: [
    'ray-memory-lifetime-op-0',
    'ray-memory-lifetime-op-1',
    'ray-delete-ref',
    'ray-view-pins',
    'ray-release-view',
    'ray-memory-lifetime-op-2',
    'ray-eligible-spill',
  ],
};
