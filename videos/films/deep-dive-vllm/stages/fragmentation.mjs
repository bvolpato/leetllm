import { vvProgress, vvState } from '../construction.mjs';
import { arrow, chapterCard, chapterText, grid } from '../defaults.mjs';
export function drawFragmentation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('fragmentation', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) => vvProgress(state, 'vv-fragmentation-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-fragmentation-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Five unused cells do not all mean the same kind of waste'
        : currentBeat === 1
          ? 'Grow the same logical history without adjacent storage'
          : 'Resolve position through division, remainder and table',
    );
    if (currentBeat === 0) {
      chapterText(ctx, api, 'Reserved12 · actual history7', 150, 350, 32, themeColors.blue);
      grid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 12,
            },
            (_, i) => (i < 7 ? 't' + i : 'unused'),
          ),
        ],
        150,
        400,
        1600,
        100,
        themeColors.blue,
        25,
      );
      if (resultComplete('internal', 0))
        chapterText(
          ctx,
          api,
          'Internal unused:12 −7 =5',
          960,
          560,
          34,
          themeColors.yellow,
          'center',
        );
      grid(ctx, api, [['free', 'free']], 150, 690, 340, 95, themeColors.green);
      grid(ctx, api, [['free', 'free', 'free']], 650, 690, 510, 95, themeColors.green);
      grid(ctx, api, [['new', 'new', 'new', 'new']], 1270, 690, 510, 95, themeColors.pink);
      if (resultComplete('external', 0))
        chapterText(
          ctx,
          api,
          'Free runs2 /3 · no contiguous4-slot fit',
          960,
          900,
          34,
          themeColors.pink,
          'center',
        );
    } else if (currentBeat === 1) {
      const words = Array.from(
        {
          length: 7,
        },
        (_, i) => 't' + i,
      );
      grid(ctx, api, [words], 150, 360, 1600, 95, themeColors.blue);
      grid(ctx, api, [['t0', 't1', 't2', 't3']], 150, 680, 650, 100, themeColors.cyan);
      grid(ctx, api, [['t4', 't5', 't6', 'unused']], 1090, 680, 650, 100, themeColors.pink);
      chapterText(ctx, api, 'Logical0 → physical12', 690, 570, 29, themeColors.cyan, 'center');
      chapterText(ctx, api, 'Logical1 → physical41', 1210, 570, 29, themeColors.pink, 'center');
      arrow(ctx, api, 480, 475, 480, 655);
      arrow(ctx, api, 1420, 475, 1420, 655);
      chapterText(
        ctx,
        api,
        'Same seven values; separate four-position blocks',
        960,
        920,
        33,
        themeColors.green,
        'center',
      );
    } else {
      const pos = Math.min(7, Math.floor(progress * 8)),
        logical = Math.floor(pos / 4),
        offset = pos % 4;
      grid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 8,
            },
            (_, i) => 't' + i,
          ),
        ],
        150,
        375,
        1600,
        110,
        themeColors.blue,
      );
      chapterCard(ctx, api, 'Position ' + pos, 150, 640, 430, themeColors.yellow);
      chapterCard(
        ctx,
        api,
        'logical ' + logical + ' / offset ' + offset,
        650,
        640,
        600,
        themeColors.cyan,
      );
      chapterCard(ctx, api, 'physical ' + [12, 41][logical], 1320, 640, 430, themeColors.green);
      chapterText(
        ctx,
        api,
        pos + ' =4×' + logical + ' +' + offset,
        960,
        900,
        46,
        themeColors.yellow,
        'center',
      );
    }
    foot('Constructed fragmentation trace · physical block IDs preserve logical token order');
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'fragmentation',
  draw: drawFragmentation,
  cues: [
    'vv-fragmentation-op-0',
    'vv-fragmentation-internal',
    'vv-fragmentation-external',
    'vv-fragmentation-op-1',
    'vv-fragmentation-op-2',
  ],
};
