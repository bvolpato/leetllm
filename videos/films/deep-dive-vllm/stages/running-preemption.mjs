import { vvMix } from '../arithmetic.mjs';
import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid, packet, rect } from '../defaults.mjs';
export function drawRunningPreemption(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('running-preemption', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-running-preemption-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-running-preemption-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Token, execution and running-set limits are independent'
        : currentBeat === 1
          ? 'Free physical blocks; preserve the request for recomputation'
          : 'Keep the cost of repeated work in the latency trace',
    );
    if (currentBeat === 0) {
      grid(
        ctx,
        api,
        [
          ['Execution capacity', 'RUNNING cap', 'Current RUNNING'],
          ['256', '64', '64'],
        ],
        150,
        380,
        1600,
        220,
        themeColors.blue,
        32,
      );
      chapterCard(ctx, api, 'New request65', 150, 720, 650, themeColors.pink);
      chapterCard(
        ctx,
        api,
        resultComplete('running-cap', 0)
          ? 'Wait · running cap reached'
          : 'Apply running-set admission',
        1060,
        720,
        700,
        resultComplete('running-cap', 0) ? themeColors.pink : themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const reset = resultComplete('preempt-reset', 1);
      chapterCard(ctx, api, 'Request R3 · tokens retained', 150, 360, 700, themeColors.pink);
      chapterCard(
        ctx,
        api,
        reset ? 'Waiting · computed0' : 'RUNNING · computed8',
        1060,
        360,
        700,
        reset ? themeColors.yellow : themeColors.green,
      );
      grid(
        ctx,
        api,
        [[reset ? 'free' : 'R3t0–3', reset ? 'free' : 'R3t4–7']],
        150,
        650,
        1600,
        130,
        themeColors.cyan,
        30,
      );
      packet(ctx, api, 'R3 record', vvMix(760, 870, progress), 520, themeColors.pink, 230);
      chapterText(
        ctx,
        api,
        reset ? 'R3 keeps its tokens and releases its blocks' : 'KV pressure prevents more live work',
        960,
        930,
        33,
        themeColors.yellow,
        'center',
      );
    } else {
      for (let i = 0; i < 3; i++) {
        chapterText(ctx, api, 'Attempt ' + (i + 1), 140, 430 + i * 145, 30, themeColors.blue);
        rect(
          ctx,
          api,
          410,
          380 + i * 145,
          (4 + Math.floor(progress * 4)) * 120,
          75,
          i === 2 ? themeColors.green : themeColors.pink,
        );
        chapterText(
          ctx,
          api,
          i < 2 ? 'recompute' : 'useful continuation',
          1550,
          430 + i * 145,
          26,
          i === 2 ? themeColors.green : themeColors.pink,
          'center',
        );
      }
      chapterText(
        ctx,
        api,
        'Default V1 recompute · CPU swap / offload are different paths',
        960,
        960,
        30,
        themeColors.yellow,
        'center',
      );
    }
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'running-preemption',
  draw: drawRunningPreemption,
  cues: [
    'vv-running-preemption-op-0',
    'vv-running-preemption-running-cap',
    'vv-running-preemption-op-1',
    'vv-running-preemption-preempt-reset',
    'vv-running-preemption-op-2',
  ],
};
