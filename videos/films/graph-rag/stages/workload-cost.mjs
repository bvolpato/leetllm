import { workloadCost } from '../model.mjs';
import { connector, dot, footer, line, text } from '../defaults.mjs';
export function drawWorkloadCost(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => state.cues?.['workload-cost-' + id]?.phase === 'after';
  api.focus.target('workload-cost-mechanism', () => {
    const id = scene.id,
      C = api.C;
    const write = (s, x, y, z, col, align = 'left') => text(ctx, api, id, s, x, y, z, col, align);
    if (currentBeat <= 2) {
      const x = 200,
        y = 825,
        width = 940,
        height = 470;
      const X = (q) => x + (q / 500) * width,
        Y = (cost) => y - (cost / 900) * height;
      const marker = state.cues?.[id + '-move']?.progress ?? 0;
      const q = Math.round(10 + 490 * marker);
      const cost = workloadCost(q);
      const settled = marker === 0 ? done('volume-ten') : done('volume-many');
      write('Total cost units', x, 280, 35, C.ink);
      line(ctx, api, x, y, x + width, y, C.muted);
      line(ctx, api, x, y, x, Y(900), C.muted);
      for (const tick of [0, 100, 200, 300, 400, 500])
        write(tick, X(tick), y + 46, 28, C.muted, 'center');
      for (const tick of [0, 200, 400, 600, 800])
        write(tick, x - 20, Y(tick) + 9, 28, C.muted, 'right');
      write('Queries per refresh', x + width / 2, 957, 34, C.ink, 'center');
      for (const [key, color] of [
        ['deferred', C.yellow],
        ['precomputed', C.blue],
      ])
        line(ctx, api, X(0), Y(workloadCost(0)[key]), X(500), Y(workloadCost(500)[key]), color, 5);
      line(ctx, api, X(q), Y(900), X(q), y, C.muted, 2);
      for (const [key, color] of [
        ['deferred', C.yellow],
        ['precomputed', C.blue],
      ])
        api.circle(ctx, X(q), Y(cost[key]), 10, color);
      write(q + ' queries', 1280, 285, 46, C.ink);
      write('Deferred', 1280, 405, 39, C.yellow);
      write('1 + 1.7 × Q', 1280, 477, 37, C.ink);
      write('Precomputed', 1280, 614, 39, C.blue);
      write('200 + 0.8 × Q', 1280, 686, 37, C.ink);
      if (settled) {
        write('Total cost · deferred / precomputed', 1280, 780, 29, C.muted);
        write('Q=' + q + ' : ' + cost.deferred + ' / ' + cost.precomputed, 1280, 844, 40, C.ink);
      }
      if (done('cost-crossing')) {
        api.circle(ctx, X(cost.crossover), Y(workloadCost(cost.crossover).deferred), 13, C.green);
        write('Crossover: 199 / .9 ≈ ' + cost.crossover.toFixed(1), 1280, 954, 33, C.green);
      }
    } else if (currentBeat <= 4) {
      const cases = [
        ['Fact', 'Basic', 0.96, 95, 200],
        ['Fact', 'Local', 0.96, 240, 200],
        ['Trend', 'Basic', 0.61, 92, 700],
        ['Trend', 'Global', 0.91, 580, 700],
      ];
      const headers = [
        ['Question', 130],
        ['Route', 413],
        ['Accuracy ≥ 0.90', 696],
        ['p95 / limit', 1110],
        ['Release?', 1570],
      ];
      headers.forEach(([v, x]) => write(v, x, 318, 33, C.muted));
      cases.forEach(([group, route, accuracy, ms, limit], i) => {
        const row = 437 + i * 120;
        const reveal = i < 2 ? done('fact-route') : done('trend-route');
        const pass = accuracy >= 0.9 && ms <= limit;
        write(group, 130, row, 39, C.ink);
        write(route, 413, row, 39, C.ink);
        write(accuracy.toFixed(2), 696, row, 39, reveal && accuracy < 0.9 ? C.pink : C.ink);
        write(ms + ' / ' + limit + ' ms', 1110, row, 37, reveal && ms > limit ? C.pink : C.ink);
        write(
          reveal ? (pass ? 'Pass' : 'Fail') : '?',
          1570,
          row,
          39,
          reveal ? (pass ? C.green : C.pink) : C.muted,
        );
      });
      write('A route must meet both limits for its question class.', 960, 959, 38, C.ink, 'center');
    } else {
      text(
        ctx,
        api,
        'workload-cost',
        'The refresh changes more than one text vector',
        960,
        270,
        39,
        themeColors.ink,
        'center',
      );
      const names = ['Identity', 'Edges', 'Communities', 'Reports', 'Embeddings'];
      names.forEach((v, i) => {
        const x = 210 + i * 350;
        dot(
          ctx,
          api,
          'workload-cost',
          v,
          x,
          520,
          i === 3 ? themeColors.pink : themeColors.blue,
          95,
        );
        if (i < 4) connector(ctx, api, x + 105, 520, x + 245, 520, Math.min(1, progress * 4));
      });
      text(
        ctx,
        api,
        'workload-cost',
        'Delete sole supporting source → withdraw its fact',
        960,
        780,
        35,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        'workload-cost',
        'Block stale descendants; rebuild; then compare quality / access / p95 / total spend',
        960,
        890,
        30,
        themeColors.ink,
        'center',
      );
      footer(
        ctx,
        api,
        'workload-cost',
        'Incremental merging is work with semantic and access consequences',
      );
    }
  });
}
export default {
  id: 'workload-cost',
  draw: drawWorkloadCost,
  cues: [
    'volume',
    'volume-ten',
    'move',
    'volume-many',
    'cost-crossing',
    'rules',
    'fact-route',
    'trend-route',
    'refresh',
  ].map((name) => 'workload-cost-' + name),
};
