import { vvMix } from '../arithmetic.mjs';
import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, packet } from '../defaults.mjs';
export function drawProcessOwners(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('process-owners', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-process-owners-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-process-owners-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Retain R1 across API, core and GPU owners'
        : currentBeat === 1
          ? 'Count main processes from the selected topology'
          : 'Place the delay at its actual owner',
    );
    const A = modelState.A ?? 1,
      DP = modelState.D ?? 1,
      N = modelState.N ?? 4;
    for (let i = 0; i < A; i++)
      chapterCard(
        ctx,
        api,
        'API' + i,
        140 + i * 420,
        360,
        A === 1 ? 650 : 370,
        themeColors.blue,
        80,
        27,
      );
    for (let i = 0; i < DP; i++)
      chapterCard(
        ctx,
        api,
        'Core' + i + ' · KV / schedule',
        140 + i * 420,
        580,
        DP === 1 ? 650 : 370,
        themeColors.yellow,
        90,
        25,
      );
    for (let i = 0; i < N; i++) {
      const x = 140 + (i % 4) * 420,
        y = 770 + Math.floor(i / 4) * 85;
      chapterCard(ctx, api, 'GPU worker' + i, x, y, 370, themeColors.cyan, 65, 25);
    }
    if (DP > 1) chapterCard(ctx, api, 'Coordinator', 1120, 475, 620, themeColors.pink, 65, 27);
    if (currentBeat === 0) {
      packet(ctx, api, 'R1', vvMix(820, 1000, progress), 480, themeColors.pink);
      chapterText(
        ctx,
        api,
        'ZeroMQ · every API can reach every core',
        1380,
        640,
        26,
        themeColors.cyan,
        'center',
      );
    }
    if (currentBeat === 1 && resultComplete('single-six', 1))
      chapterText(ctx, api, 'TP4 / DP1: 1 +1 +4 =6', 510, 1010, 28, themeColors.green, 'center');
    if (currentBeat === 1 && resultComplete('parallel-seventeen', 1))
      chapterText(
        ctx,
        api,
        'TP2 / DP4: 4 +4 +8 +1 =17',
        1380,
        1010,
        28,
        themeColors.green,
        'center',
      );
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Input → API · queue/blocks → core · kernel/collective → workers',
        960,
        1010,
        28,
        themeColors.yellow,
        'center',
      );
    foot(
      'Documented online multiprocessing count · auxiliary OS and other deployment modes excluded',
    );
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'process-owners',
  draw: drawProcessOwners,
  cues: [
    'vv-process-owners-op-0',
    'vv-process-owners-op-1',
    'vv-process-owners-single-six',
    'vv-process-owners-parallel-seventeen',
    'vv-process-owners-op-2',
  ],
};
