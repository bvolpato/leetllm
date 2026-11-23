import { traceBudgetFixture } from '../model.mjs';
import {
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawTraceBudget(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  const complete = (id) => state.cues?.[id]?.phase === 'after';
  api.focus.target('trace-budget-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat < 2) {
        const f = traceBudgetFixture(currentBeat > 0),
          expanded = complete('budget-expanded-result'),
          verdict = currentBeat ? complete('budget-fail-result') : complete('budget-pass-result'),
          data = [
            ['Events', f.used.events, f.limits.events],
            ['Tokens', f.used.tokens, f.limits.tokens],
            ['Sequential ms', f.used.ms, f.limits.ms],
          ],
          width = 980;
        if (currentBeat)
          drawAgentUpgradeText(
            ctx,
            api,
            'Prior audit: 4 events /570 tokens /530 ms /PASS',
            960,
            295,
            27,
            themeColors.muted,
            'center',
          );
        data.forEach(([name, total, limit], i) => {
          const y = 400 + i * 190,
            known = currentBeat
              ? expanded
              : i === 0 || complete(i === 1 ? 'budget-token-result' : 'budget-ms-result');
          drawAgentUpgradeText(ctx, api, name, 200, y, 33, themeColors.blue);
          api.rect(ctx, 540, y - 42, 980 * 1.35, 80, themeColors.panel, themeColors.muted, 1, 4);
          let x = 540;
          const values = f.events.map((v) =>
            name === 'Events' ? 1 : name === 'Tokens' ? v.tokens : v.ms,
          );
          values.forEach((v, j) => {
            const w = (980 * v) / limit;
            api.rect(
              ctx,
              x,
              y - 42,
              w - 3,
              80,
              j === 4
                ? themeColors.pink
                : [themeColors.blue, themeColors.cyan, themeColors.green, themeColors.yellow][j],
              themeColors.bg,
              1,
              2,
            );
            x += w;
          });
          api.line(ctx, 540 + 980, y - 68, 540 + 980, y + 65, themeColors.ink, 3);
          drawAgentUpgradeText(
            ctx,
            api,
            (known ? total : 'pending') + ' /' + limit,
            1750,
            y + 112,
            31,
            verdict ? (total > limit ? themeColors.pink : themeColors.green) : themeColors.cyan,
            'right',
          );
        });
        drawAgentUpgradeText(
          ctx,
          api,
          verdict
            ? currentBeat
              ? '5events /1070tokens /1480ms →all three exceed'
              : '4events /570tokens /530ms →all pass'
            : 'Current totals and budget verdict pending',
          960,
          950,
          32,
          verdict ? (currentBeat ? themeColors.pink : themeColors.green) : themeColors.muted,
          'center',
        );
      } else {
        drawAgentUpgradePaper(
          ctx,
          api,
          200,
          340,
          1500,
          480,
          'Completed-call audit ≠runtime enforcement',
          themeColors.yellow,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'NaN /missing /negative /wrong type →invalid accounting',
            'Exact integer sums remain exact; unrepresentable float sums fail',
            'Admissions +deadlines +token caps +concurrency +cancellation',
            'Failed/retried calls and delayed usage still belong to the request',
          ],
          250,
          485,
          30,
          themeColors.ink,
          90,
        );
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Supplied sequential telemetry ·strictly greater fails; equality passes this local audit',
      );
    }
  });
}
export default {
  id: 'trace-budget',
  draw: drawTraceBudget,
  cues: [
    'trace-budget-b1',
    'budget-token-result',
    'budget-ms-result',
    'budget-pass-result',
    'trace-budget-b2',
    'budget-expanded-result',
    'budget-fail-result',
    'trace-budget-b3',
  ],
};
