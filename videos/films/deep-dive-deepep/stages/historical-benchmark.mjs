import { drawChapterGrid, text } from '../defaults.mjs';

export function drawHistoricalBenchmark(ctx, scene, state, api) {
  const { C } = api;
  const second = state.beat > 0;
  api.focus.target('de-historical-benchmark-mechanism', () => {
    text(
      ctx,
      api,
      'Historical V2   ·   SM100   ·   8 GPUs on NVLink',
      960,
      290,
      46,
      C.ink,
      'center',
    );
    text(
      ctx,
      api,
      '8,000 tokens   ·   7,168 values per row   ·   top 8',
      960,
      375,
      38,
      C.muted,
      'center',
    );
    const rows = [
      ['Communication SMs', 'FP8 dispatch', 'BF16 combine'],
      ['24', '643 GB/s', '675 GB/s'],
    ];
    if (second) rows.push(['64', '726 GB/s', '740 GB/s']);
    drawChapterGrid(ctx, api, rows, 220, 465, 1480, rows.length * 108, C.blue, 40);
    text(ctx, api, 'Reported logical bandwidth', 960, 876, 38, C.cyan, 'center');
    if (second)
      text(
        ctx,
        api,
        'Compare time from dispatch through combine on your workload',
        960,
        988,
        35,
        C.ink,
        'center',
      );
  });
}
export default {
  id: 'historical-benchmark',
  draw: drawHistoricalBenchmark,
  cues: ['de-historical-benchmark-b0', 'de-historical-benchmark-b1'],
};
