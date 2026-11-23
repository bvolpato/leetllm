import { vvMix } from '../arithmetic.mjs';
import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid, packet } from '../defaults.mjs';
export function drawParallelCosts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('parallel-costs', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-parallel-costs-' + name, beat);
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-parallel-costs-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Split matrix dimensions or layer depth'
        : currentBeat === 1
          ? 'Separate request replication from expert ownership'
          : 'Carry compatibility and communication into the same request',
    );
    if (currentBeat === 0) {
      const pp = cueProgress('pipeline', 0) > 0;
      grid(
        ctx,
        api,
        Array.from(
          {
            length: 4,
          },
          (_, r) =>
            Array.from(
              {
                length: 4,
              },
              (_, col) => 'W' + r + col,
            ),
        ),
        150,
        390,
        650,
        420,
        themeColors.blue,
        28,
      );
      for (let i = 0; i < 4; i++) {
        const x = 1040 + (i % 2) * 380,
          y = 390 + Math.floor(i / 2) * 235;
        grid(
          ctx,
          api,
          pp
            ? [[`Layer ${i * 2}`], [`Layer ${i * 2 + 1}`]]
            : Array.from(
                {
                  length: 4,
                },
                (_, r) => ['W' + r + i],
              ),
          x,
          y,
          340,
          155,
          pp ? themeColors.pink : themeColors.cyan,
          27,
        );
      }
      chapterText(
        ctx,
        api,
        pp
          ? 'Pipeline stages retain depth ownership'
          : 'Tensor shards need within-layer collectives',
        960,
        950,
        32,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const expert = cueProgress('expert', 1) > 0;
      for (let i = 0; i < 2; i++) {
        chapterCard(
          ctx,
          api,
          expert ? 'EP owner' + i : 'Dense replica' + i,
          150 + i * 880,
          390,
          730,
          i ? themeColors.cyan : themeColors.blue,
        );
        grid(
          ctx,
          api,
          expert
            ? [[`Expert${i * 2}`, `Expert${i * 2 + 1}`]]
            : [['All layers', 'All dense weights']],
          150 + i * 880,
          600,
          730,
          130,
          i ? themeColors.cyan : themeColors.blue,
          28,
        );
      }
      packet(
        ctx,
        api,
        expert ? 'tokenT7' : 'requestR1',
        vvMix(800, 900, progress),
        790,
        themeColors.yellow,
        230,
      );
      chapterText(
        ctx,
        api,
        expert
          ? 'Token activations route to expert weights'
          : 'Request groups route to independent dense replicas',
        960,
        965,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      grid(
        ctx,
        api,
        [
          ['Model', 'dtype /quantization', 'attention/cache'],
          ['Scheduler', 'token and sequence caps', 'parallel groups'],
          ['Workers', 'actual topology', 'reference outputs'],
        ],
        150,
        400,
        1600,
        360,
        themeColors.blue,
        28,
      );
      chapterText(
        ctx,
        api,
        'Larger groups free memory and add communication.',
        960,
        930,
        31,
        themeColors.yellow,
        'center',
      );
    }
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'parallel-costs',
  draw: drawParallelCosts,
  cues: [
    'vv-parallel-costs-op-0',
    'vv-parallel-costs-tensor',
    'vv-parallel-costs-pipeline',
    'vv-parallel-costs-op-1',
    'vv-parallel-costs-data',
    'vv-parallel-costs-expert',
    'vv-parallel-costs-op-2',
  ],
};
