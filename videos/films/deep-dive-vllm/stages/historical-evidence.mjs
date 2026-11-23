import { vvState } from '../construction.mjs';
import { chapterText, grid } from '../defaults.mjs';
export function drawHistoricalEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('historical-evidence', state),
    { b: currentBeat, p: progress } = modelState;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-historical-evidence-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Which workload produced the throughput gain?'
        : currentBeat === 1
          ? 'Retain the actual latency and baseline definitions'
          : 'A new benchmark needs a matched trace',
    );
    const rows =
      currentBeat === 0
        ? [
            ['2023 paper', '2–4× reported throughput', 'comparable measured latency'],
            ['Sampling models', 'OPT 13B / 66B / 175B', 'ShareGPT / Alpaca'],
            ['Shared prefixes', 'LLaMA 13B', 'WMT16 translation'],
          ]
        : currentBeat === 1
          ? [
              ['Hardware', 'GCP A2 / A100', 'historical setup'],
              ['FasterTransformer', 'custom dynamic batcher', 'authors’ comparison'],
              ['Orca', 'reimplemented by authors', 'three reservation policies'],
              ['Latency', 'mean E2E / output length', 'averaged across requests'],
            ]
          : [
              ['Hardware/topology', 'Model/dtype/sampling', 'Arrivals/lengths'],
              ['Versions/config', 'Warmup/window', 'Reference outputs'],
              ['Useful completions', 'TTFT distribution', 'Per-request ITL rule'],
            ];
    const n = 1 + Math.min(rows.length - 1, Math.floor(progress * rows.length));
    grid(ctx, api, rows.slice(0, n), 140, 380, 1640, Math.min(520, n * 125), themeColors.blue, 27);
    if (currentBeat === 1)
      chapterText(
        ctx,
        api,
        'One hour per trace  ·  15 minutes for OPT-175B',
        960,
        950,
        30,
        themeColors.yellow,
        'center',
      );
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'historical-evidence',
  draw: drawHistoricalEvidence,
  cues: [
    'vv-historical-evidence-op-0',
    'vv-historical-evidence-op-1',
    'vv-historical-evidence-op-2',
  ],
};
