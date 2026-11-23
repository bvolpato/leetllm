import { vvMix } from '../arithmetic.mjs';
import { vvState } from '../construction.mjs';
import { arrow, chapterCard, chapterText, grid, packet } from '../defaults.mjs';
export function drawEntryContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('entry-contract', state),
    { b: currentBeat, p: progress } = modelState;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-entry-contract-mechanism', () => {
    head(
      currentBeat === 0
        ? 'One request · two entry contracts'
        : currentBeat === 1
          ? 'Keep the source tag with the observed capability'
          : 'Resolve the actual online route',
    );
    if (currentBeat === 0) {
      chapterCard(ctx, api, 'R1 · 9 prompt tokens', 140, 360, 600, themeColors.pink);
      chapterCard(ctx, api, 'LLM.generate · Python caller', 140, 610, 660, themeColors.blue);
      chapterCard(ctx, api, 'vllm serve · HTTP caller', 1080, 610, 660, themeColors.cyan);
      packet(ctx, api, 'R1', vvMix(800, 880, progress), 450, themeColors.pink);
      chapterText(
        ctx,
        api,
        progress < 0.5
          ? 'Caller waits for synchronous result'
          : 'Worker processes remain independent',
        960,
        870,
        34,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      grid(
        ctx,
        api,
        [
          ['Example', 'Version or model', 'What to follow'],
          ['Request trace', '0.28.0 · Aug 26, 2026', 'CPU block calculations'],
          ['Adapter comparison', '0.31.0 · Oct 5, 2026', 'Cache key fields'],
          ['Decoder', 'Full attention', 'GPU-resident KV blocks'],
        ],
        140,
        365,
        1640,
        420,
        themeColors.blue,
        27,
      );
    } else {
      chapterCard(ctx, api, 'vllm serve', 150, 390, 650, themeColors.blue);
      chapterCard(ctx, api, 'Registered routes', 1110, 390, 650, themeColors.cyan);
      arrow(ctx, api, 820, 435, 1090, 435);
      const choices = ['Generation', 'Pooling', 'Reranking'];
      choices.forEach((v, i) =>
        chapterCard(
          ctx,
          api,
          v + ' · selected model support',
          150 + i * 550,
          690,
          500,
          i / 3 < progress ? themeColors.green : themeColors.muted,
          110,
          26,
        ),
      );
      chapterText(
        ctx,
        api,
        'In v0.30, inspect the routes registered by vllm serve.',
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
  id: 'entry-contract',
  draw: drawEntryContract,
  cues: ['vv-entry-contract-op-0', 'vv-entry-contract-op-1', 'vv-entry-contract-op-2'],
};
