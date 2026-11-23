import { vvMix } from '../arithmetic.mjs';
import { vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid, packet } from '../defaults.mjs';
export function drawProjectIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('project-identity', state),
    { b: currentBeat, p: progress } = modelState;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-project-identity-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Attach the paper and contributors to their actual scope'
        : currentBeat === 1
          ? 'Repository license and loaded artifacts keep distinct identities'
          : 'Carry the tradeoff into correct useful completions',
    );
    if (currentBeat === 0) {
      grid(
        ctx,
        api,
        [
          ['Research origin', 'UC Berkeley Sky Computing Lab'],
          ['PagedAttention authors', 'Kwon /Li /Zhuang /Sheng /collaborators'],
          ['Committer authority', 'individual sustained contributions /review'],
        ],
        150,
        400,
        1600,
        350,
        themeColors.blue,
        28,
      );
      const x = vvMix(240, 1380, progress);
      packet(ctx, api, 'reviewed contribution', x, 870, themeColors.yellow, 380);
    } else if (currentBeat === 1) {
      chapterCard(
        ctx,
        api,
        'Pinned repository · Apache2.0',
        150,
        420,
        730,
        themeColors.blue,
        120,
        33,
      );
      chapterCard(
        ctx,
        api,
        'Loaded weights /tokenizer /data',
        1040,
        420,
        730,
        themeColors.yellow,
        120,
        30,
      );
      chapterText(ctx, api, 'Source terms', 510, 760, 31, themeColors.blue, 'center');
      chapterText(
        ctx,
        api,
        'Separate artifact rights and trust',
        1405,
        760,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      grid(
        ctx,
        api,
        [
          ['Blocks', 'less waste', 'metadata work'],
          ['Scheduling', 'mixed useful work', 'latency pressure'],
          ['Backends', 'more combinations', 'compatibility matrix'],
          ['Parallelism', 'more fit', 'communication'],
        ],
        150,
        360,
        1600,
        500,
        themeColors.blue,
        28,
      );
      chapterText(
        ctx,
        api,
        'Correct useful completions under the actual workload',
        960,
        990,
        34,
        themeColors.green,
        'center',
      );
    }
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'project-identity',
  draw: drawProjectIdentity,
  cues: ['vv-project-identity-op-0', 'vv-project-identity-op-1', 'vv-project-identity-op-2'],
};
