import { highestPassingLoad } from '../model.mjs';
import {
  cueProgress,
  drawBatchingUpgradeFoot,
  drawBatchingUpgradeTable,
  drawBatchingUpgradeText,
} from '../defaults.mjs';
export function drawLoadOperatingPoint(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const currentBeat = state.beat ?? 0,
      progress2 = state.beatP ?? 0;
    const { C: themeColors } = api;
    {
      if (currentBeat === 0) {
        drawBatchingUpgradeTable(
          ctx,
          api,
          [
            ['Comparison', 'Replay rule'],
            ['Both runs', 'Prompts, arrivals, system and decoding settings'],
            ['Fixed-length replay', 'Fix each request’s output length across runs'],
            ...(cueProgress(state, 'load-natural', 0.71, 0.74) > 0
              ? [['Natural stopping', 'Same stop rules. Measure actual lengths.']]
              : []),
          ],
          150,
          345,
          1620,
          125,
        );
        if (cueProgress(state, 'load-work', 0.56, 0.67) > 0)
          api.text(ctx, 'Measure cache hits, replayed positions and verification positions separately',
            960, 932, 35, themeColors.yellow, 'center');
      } else if (currentBeat === 1) {
        drawBatchingUpgradeText(
          ctx,
          api,
          'When a reply takes 400 ms, what happens to the next arrival?',
          960,
          285,
          31,
          themeColors.muted,
          'center',
        );
        [0, 1].forEach((row) => {
          const y = 450 + row * 280,
            times = row ? [0, 400, 800] : [0, 100, 200, 300, 400, 500, 600, 700, 800];
          drawBatchingUpgradeText(
            ctx,
            api,
            row ? 'Closed-loop' : 'Open-loop',
            160,
            y,
            29,
            row ? themeColors.yellow : themeColors.cyan,
          );
          api.line(ctx, 420, y, 1700, y, themeColors.muted, 2);
          const progress = row ? cueProgress(state, 'load-closed', 0.45, 0.59)
            : cueProgress(state, 'load-operating-point-b2', 0.12, 0.30);
          times.slice(0, 1 + Math.floor((times.length - 1) * progress)).forEach((t) => {
            const x = 420 + t * 1.5;
            api.circle(ctx, x, y, 9, row ? themeColors.yellow : themeColors.cyan);
            drawBatchingUpgradeText(ctx, api, t + ' ms', x, y + 65, 24, themeColors.ink, 'center');
          });
        });
      } else {
        const rows = [
            {
              rate: 2,
              attainment: 0.95,
            },
            {
              rate: 3,
              attainment: 0.92,
            },
            {
              rate: 4,
              attainment: 0.84,
            },
          ],
          r = highestPassingLoad(rows, 0.9, 2);
        const x = attainment => 505 + 1110 * attainment;
        api.text(ctx, 'Illustrative two-GPU sweep', 210, 289, 37, themeColors.ink);
        api.text(ctx, 'Required: 90% of arrivals', x(0.9), 289, 33, themeColors.yellow, 'center');
        rows.forEach(({ rate, attainment }, i) => {
          const y = 405 + i * 156;
          api.text(ctx, rate + ' req/s', 265, y + 14, 44, themeColors.ink, 'center');
          api.rect(ctx, x(0), y - 27, x(1) - x(0), 53, themeColors.panel, themeColors.muted, 4);
          api.rect(ctx, x(0), y - 27, x(attainment) - x(0), 53, themeColors.cyan, undefined, 4);
          api.text(ctx, Math.round(attainment * 100) + '%', 1710, y + 14, 40, themeColors.ink, 'center');
        });
        api.line(ctx, x(0.9), 317, x(0.9), 780, themeColors.yellow, 4);
        if (cueProgress(state, 'load-choice', 0.40, 0.49) > 0) drawBatchingUpgradeText(
          ctx,
          api,
          `${r.rate} requests/s ÷ 2 GPUs = ${r.perGpu} requests/s per GPU`,
          960,
          940,
          37,
          themeColors.green,
          'center',
        );
      }
      drawBatchingUpgradeFoot(
        ctx,
        api,
        currentBeat === 0 ? 'Use the same warmup, measurement window and drain policy'
          : currentBeat === 1 ? 'Record the scheduled send time and the actual send time'
          : 'Each bar shows the share of offered requests that meet both latency limits',
      );
    }
    return;
  });
}
export default {
  id: 'load-operating-point',
  draw: drawLoadOperatingPoint,
  cues: ['load-operating-point-b1', 'load-work', 'load-natural', 'load-operating-point-b2', 'load-closed', 'load-operating-point-b3', 'load-choice'],
};
