import { sampleModel } from '../model.mjs';
import {
  drawAgentUpgradeBox,
  drawAgentUpgradeFooter,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
  text,
} from '../defaults.mjs';
export function drawEvaluation(ctx, scene, state, api) {
  if (drawAgentUpgrade(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('evaluation', state);
  {
    const rows = [
      ['Urgent intake', '0 planner steps', '0'],
      ['Stale bundle', '0 planner steps', '0'],
      ['Grounded draft', 'Review stop', '0'],
      ['Unsupported evidence', 'Abstain + handoff', '0'],
      ['Forbidden restore', 'Dispatch blocked', '0'],
      ['Approval replay', 'One local effect', '1'],
    ];
    api.focus.target('evaluation-field-grid', () =>
      teaching.grid({
        x: 200,
        y: 335,
        width: 1520,
        height: 535,
        rows: 7,
        columns: 3,
        cellFocusTarget: (row, column) =>
          row > 0
            ? [
                row >= 5 ? 'episode-final-cases' : null,
                ['episode-names', 'episode-outcomes', 'episode-effects'][column],
              ].filter(Boolean)
            : undefined,
        labels: [['Episode', 'Required outcome', 'Effects'], ...rows],
        fontSize: 28,
        padding: 12,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
      }),
    );
    api.focus.target('evaluation-exact-six-episode-fixture-inventory-inspect-actual-ef', () =>
      text(
        ctx,
        api,
        'Exact six-episode fixture inventory · inspect actual effect-store observations',
        960,
        985,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
function drawAgentUpgrade(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (!(currentBeat >= 2)) return false;
  const { C: themeColors } = api;
  return api.focus.target('evaluation-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      const rows = [
        ['Urgent /stale', [], 0],
        ['Grounded draft', ['P', 'A', 'D', 'H'], 0],
        ['Injection', ['P', 'H'], 0],
        ['Forbidden', ['R ×'], 0],
        ['Separate replay', [], 1],
      ];
      rows.forEach(([name, acts, effects], i) => {
        const y = 330 + i * 125;
        drawAgentUpgradeText(ctx, api, name, 180, y + 20, 30, themeColors.blue);
        acts.forEach((v, j) =>
          drawAgentUpgradeBox(
            ctx,
            api,
            v,
            650 + j * 180,
            y - 20,
            140,
            70,
            v.includes('✕') ? themeColors.pink : themeColors.cyan,
          ),
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Effects:' + effects,
          1710,
          y + 25,
          30,
          effects ? themeColors.green : themeColors.muted,
          'right',
        );
      });
      drawAgentUpgradeFooter(
        ctx,
        api,
        'P/A/D/H are permitted dispatches; exported summaries omit full arguments/results; inspect original trace',
      );
    }
    return true;
  });
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'episode-boundaries',
    'effect-store',
    'complete-inventory',
    'runtime-limits',
    'evaluation-core-3',
  ],
};
