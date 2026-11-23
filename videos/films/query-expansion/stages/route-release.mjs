import { RELEASE_ROUTES } from '../fixtures.mjs';
import { spoken } from '../construction.mjs';
import {
  drawAdvancedArrow,
  drawAdvancedFooter,
  drawAdvancedTarget,
  drawAdvancedText,
} from '../defaults.mjs';
export function drawRouteRelease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const repairs = [
        ['Missing history', 'Rewrite'],
        ['Noisy candidates', 'Rerank'],
        ['Document-style mismatch', 'HyDE'],
        ['Weak / dependent evidence', 'Correct / iterate'],
      ];
      repairs.forEach(([failure, repair], i) => {
        const y = 330 + i * 150;
        drawAdvancedText(ctx, api, failure, 200, y + 55, 35, themeColors.blue);
        drawAdvancedArrow(
          ctx,
          api,
          {
            x: 870,
            y: y + 40,
          },
          {
            x: 1060,
            y: y + 40,
          },
          themeColors.yellow,
        );
        drawAdvancedTarget(ctx, api, 'route-repair', () =>
          drawAdvancedText(ctx, api, repair, 1180, y + 55, 37, themeColors.green),
        );
      });
      drawAdvancedFooter(
        ctx,
        api,
        'Measure each control against the same labeled baseline · compositions need separate evidence',
      );
    } else {
      const tighten = spoken(state, 3, 'route-tighten'),
        tight = tighten === 1,
        moving = tighten > 0 && !tight,
        limit = 350 - 50 * tighten,
        reveal = moving
          ? false
          : tight
            ? spoken(state, 3, 'qx-tight-result') === 1
            : spoken(state, 2, 'route-gate') === 1;
      drawAdvancedText(
        ctx,
        api,
        moving
          ? 'Supported accuracy ≥ 0.93    ·    p95 ceiling 350 → 300 ms'
          : `Supported accuracy ≥ 0.93    ·    p95 ≤ ${limit} ms`,
        960,
        285,
        40,
        themeColors.yellow,
        'center',
      );
      RELEASE_ROUTES.forEach((v, i) => {
        const y = 420 + i * 175,
          okay = v.accuracy >= 0.93 && v.p95 <= limit;
        drawAdvancedText(
          ctx,
          api,
          { baseline: 'Raw hybrid', rewrite: 'Rewrite', expensive: 'Costly route' }[v.id],
          155,
          y + 48,
          35,
          themeColors.blue,
        );
        drawAdvancedTarget(ctx, api, 'route-counts', () => {
          for (let k = 0; k < 50; k++)
            api.rect(
              ctx,
              470 + (k % 25) * 22,
              y + Math.floor(k / 25) * 35,
              15,
              24,
              k < v.supported ? themeColors.green : themeColors.muted,
            );
          drawAdvancedText(
            ctx,
            api,
            `${v.supported}/50 = ${v.accuracy.toFixed(2)}`,
            1190,
            y + 53,
            32,
            themeColors.green,
            'center',
          );
        });
        drawAdvancedTarget(ctx, api, 'route-latency', () => {
          api.rect(ctx, 1380, y + 10, (400 * v.p95) / 500, 46, themeColors.blue);
          const x = 1380 + (400 * limit) / 500;
          api.line(ctx, x, y - 10, x, y + 80, themeColors.yellow, 4);
          drawAdvancedText(ctx, api, v.p95 + ' ms', 1580, y + 120, 30, themeColors.muted, 'center');
        });
        drawAdvancedTarget(ctx, api, 'route-verdict', () =>
          drawAdvancedText(
            ctx,
            api,
            reveal ? (okay ? 'PASS' : 'FAIL') : '?',
            1820,
            y + 60,
            33,
            reveal ? (okay ? themeColors.green : themeColors.pink) : themeColors.muted,
            'center',
          ),
        );
      });
      if (tight)
        drawAdvancedText(
          ctx,
          api,
          reveal ? 'No eligible route · keep release blocked' : 'Re-evaluate the same three routes',
          960,
          980,
          37,
          reveal ? themeColors.pink : themeColors.yellow,
          'center',
        );
    }
  }
}
export default {
  id: 'route-release',
  draw: drawRouteRelease,
  cues: ['route-repairs', 'route-gate', 'route-tighten', 'qx-tight-result', 'route-evidence'],
};
