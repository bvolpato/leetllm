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
export function drawEngineBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('engine-boundary', state),
    { b: currentBeat, p: progress } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1;
  api.focus.target('ray-engine-boundary-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'At arrival, before a slot opened'
        : currentBeat === 1
          ? 'Standard replica: CPU actor plus TP×PP GPU workers'
          : 'Cache events inform routing; the engine retains its own allocator',
    );
    if (currentBeat === 0 || currentBeat === 2) {
      chapterCard(ctx, api, 'Ingress · R7', 150, 360, 600, themeColors.blue);
      chapterCard(ctx, api, 'Selected replica1', 1120, 360, 630, themeColors.cyan);
      panel(ctx, api, 1020, 610, 730, 295, themeColors.cyan);
      chapterText(
        ctx,
        api,
        'Illustrative finite KV slots',
        1385,
        660,
        27,
        themeColors.cyan,
        'center',
      );
      chapterGrid(ctx, api, [['R4 live', 'R9 live']], 1090, 705, 590, 95, themeColors.green, 30);
      chapterCard(ctx, api, 'R7 · engine admission queue', 160, 730, 700, themeColors.yellow);
      const x = rayMix(790, 910, progress);
      if (progress < 0.95) packet(ctx, api, 'R7', x, 475, themeColors.yellow, 180);
      if (currentBeat === 2) {
        arrow(ctx, api, 1030, 560, 770, 560, themeColors.cyan);
        chapterText(
          ctx,
          api,
          'Cache / load event → routing',
          960,
          960,
          29,
          themeColors.cyan,
          'center',
        );
      } else if (done('engine-wait', 0))
        chapterText(
          ctx,
          api,
          'No free KV slot; route complete, token work waits',
          960,
          960,
          30,
          themeColors.yellow,
          'center',
        );
    } else {
      const ready = done('engine-eight', 1),
        doubled = done('engine-double', 1);
      for (let r = 0; r < (doubled ? 2 : 1); r++) {
        const x = 150 + r * 870;
        chapterText(
          ctx,
          api,
          'Replica' + r,
          x + 370,
          355,
          31,
          r ? themeColors.cyan : themeColors.blue,
          'center',
        );
        chapterCard(
          ctx,
          api,
          'LLMServer actor · CPU1',
          x,
          400,
          740,
          r ? themeColors.cyan : themeColors.blue,
          85,
        );
        chapterGrid(
          ctx,
          api,
          [
            Array.from(
              {
                length: 4,
              },
              (_, t) => 'P0 / T' + t,
            ),
            Array.from(
              {
                length: 4,
              },
              (_, t) => 'P1 / T' + t,
            ),
          ],
          x,
          565,
          740,
          185,
          r ? themeColors.cyan : themeColors.blue,
          27,
        );
        if (ready)
          chapterText(
            ctx,
            api,
            '8 GPU workers +1 CPU actor',
            x + 370,
            850,
            31,
            themeColors.green,
            'center',
          );
      }
      if (!doubled)
        chapterText(ctx, api, 'PP2 stages ×TP4 shards', 1400, 600, 34, themeColors.cyan, 'center');
      if (doubled)
        chapterText(
          ctx,
          api,
          '2 replicas:16 GPU workers +2 CPU actors',
          960,
          950,
          34,
          themeColors.green,
          'center',
        );
    }
    footer(ctx, api, 'Ray Serve 2.58 · standard vLLM layout');
  });
}
export default {
  id: 'engine-boundary',
  draw: drawEngineBoundary,
  cues: [
    'ray-engine-boundary-op-0',
    'ray-engine-wait',
    'ray-engine-boundary-op-1',
    'ray-engine-eight',
    'ray-engine-double',
    'ray-engine-boundary-op-2',
  ],
};
