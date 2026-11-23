import { rayMix } from '../arithmetic.mjs';
import { rayChapterState } from '../construction.mjs';
import {
  arrow,
  chapterCard,
  chapterGrid,
  chapterText,
  footer,
  heading,
  packet,
} from '../defaults.mjs';
export function drawSourceHistory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('source-history', state),
    { b: currentBeat, p: progress } = modelState;
  api.focus.target('ray-source-history-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Follow execution and ownership as separate source questions'
        : currentBeat === 1
          ? 'From remote tasks to distributed futures'
          : 'Who maintains Ray, and what does a reference own?',
    );
    if (currentBeat === 0) {
      const names = ['Remote function / actor', 'CoreWorker', 'raylet / GCS'];
      names.forEach((name, i) =>
        chapterCard(
          ctx,
          api,
          name,
          140 + i * 570,
          410,
          500,
          i === Math.min(2, Math.floor(progress * 3)) ? themeColors.yellow : themeColors.blue,
        ),
      );
      for (let i = 0; i < 2; i++)
        arrow(ctx, api, 660 + i * 570, 460, 690 + i * 570, 460, themeColors.cyan);
      chapterCard(ctx, api, 'Where does execution run?', 160, 720, 740, themeColors.blue);
      chapterCard(ctx, api, 'Who owns result metadata?', 1020, 720, 740, themeColors.yellow);
    } else if (currentBeat === 1) {
      const milestones = [
        ['2016–17', 'Ray development at Berkeley'],
        ['2018 Ray paper', 'One execution engine for tasks and actors'],
        ['2019', 'Anyscale founded'],
        ['2021 Ownership paper', 'Object metadata lives with the owner'],
      ];
      milestones.forEach(([date, event], i) => {
        const y = 370 + i * 140;
        chapterCard(ctx, api, date, 200, y, 700, themeColors.blue);
        if (progress > (i + 0.2) / 4)
          chapterCard(ctx, api, event, 1050, y, 680, themeColors.cyan, 95, 27);
      });
    } else {
      chapterGrid(
        ctx,
        api,
        [
          ['Source governance', 'Artifact rights', 'Object fault tolerance'],
          ['Contributors / TSC', 'model / dataset licenses', 'ObjectRef owner'],
          ['Apache2 source', 'separate loaded artifacts', 'metadata lifetime'],
        ],
        140,
        400,
        1640,
        330,
        themeColors.blue,
        28,
      );
      chapterCard(
        ctx,
        api,
        'Artifact W · its own license',
        170,
        810,
        630,
        themeColors.blue,
        80,
        27,
      );
      chapterCard(
        ctx,
        api,
        'Same W · same artifact license',
        1120,
        810,
        630,
        themeColors.blue,
        80,
        27,
      );
      const x = rayMix(850, 900, progress);
      packet(ctx, api, 'handle X', x, 815, themeColors.cyan, 170);
      chapterText(
        ctx,
        api,
        'Handle passed to C; metadata owner D and artifact rights stay distinct',
        960,
        955,
        27,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'Ray source tag  ·  ray-2.58.0');
  });
}
export default {
  id: 'source-history',
  draw: drawSourceHistory,
  cues: ['ray-source-history-op-0', 'ray-source-history-op-1', 'ray-source-history-op-2'],
};
