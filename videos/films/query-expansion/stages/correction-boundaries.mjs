import { spoken } from '../construction.mjs';
import {
  drawAdvancedCard,
  drawAdvancedFooter,
  drawAdvancedTarget,
  drawAdvancedText,
} from '../defaults.mjs';
export function drawCorrectionBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      const allowed = spoken(state, 0, 'egress-gate');
      drawAdvancedCard(
        ctx,
        api,
        'Private policy question',
        160,
        330,
        650,
        themeColors.pink,
        110,
        37,
      );
      api.line(ctx, 960, 285, 960, 850, themeColors.pink, 10);
      drawAdvancedText(ctx, api, 'EXPORT DENIED', 960, 930, 45, themeColors.pink, 'center');
      drawAdvancedTarget(ctx, api, 'private-egress', () => {
        const x = 300 + 470 * Math.min(1, allowed * 2);
        api.rect(ctx, x, 560, 120, 95, themeColors.pink);
        drawAdvancedText(ctx, api, 'private', x + 60, 620, 28, themeColors.bg, 'center');
      });
      drawAdvancedCard(
        ctx,
        api,
        'Approved public query',
        1150,
        330,
        610,
        themeColors.green,
        110,
        33,
      );
      ['Source policy', 'Redirect / address checks', 'Untrusted content'].forEach((v, i) =>
        drawAdvancedCard(ctx, api, v, 1150, 520 + i * 120, 610, themeColors.green, 85, 30),
      );
    } else {
      const progress = spoken(state, 1, 'cache-separate');
      drawAdvancedCard(ctx, api, '“How can I retry it?”', 560, 275, 800, themeColors.blue, 100, 38);
      const keys = [
        [
          'Tenant A · batch.read',
          '“My batch job failed.”',
          'Retry a failed batch job',
          themeColors.cyan,
        ],
        [
          'Tenant B · billing.read',
          '“My invoice export failed.”',
          'Retry a failed invoice export',
          themeColors.yellow,
        ],
      ];
      keys.forEach(([tenant, key, rewrite, color], i) => {
        const x = 160 + i * 900;
        drawAdvancedCard(ctx, api, tenant, x, 465, 700, color, 90, 38);
        drawAdvancedTarget(ctx, api, 'scoped-cache', () =>
          drawAdvancedCard(ctx, api, key, x, 620, 700, color, 110, 33),
        );
        if (progress > 0.5) drawAdvancedCard(ctx, api, rewrite, x, 815, 700, color, 90, 31);
      });
      drawAdvancedFooter(
        ctx,
        api,
        'Scope + policy + history + query + technique + generator/prompt · encoder version for vectors',
      );
    }
  }
}
export default {
  id: 'correction-boundaries',
  draw: drawCorrectionBoundaries,
  cues: ['egress-gate', 'cache-separate'],
};
