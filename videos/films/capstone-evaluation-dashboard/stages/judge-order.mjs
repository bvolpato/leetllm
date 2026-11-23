import { dashboardClamp, dashboardCue, dashboardStarted } from '../arithmetic.mjs';
import { dashboardCell, dashboardLine, dashboardNote, dashboardText } from '../defaults.mjs';
export function drawJudgeOrder(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = dashboardClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  const { C: themeColors } = api;
  api.focus.target('judge-order-mechanism', () => {
    if (beat === 0) {
      const swap = dashboardCue(state, 'judge-swap', q),
        a = {
          x: 200 + 950 * swap,
          y: 470 - 150 * Math.sin(Math.PI * swap),
        },
        b = {
          x: 1150 - 950 * swap,
          y: 470 + 150 * Math.sin(Math.PI * swap),
        };
      dashboardText(
        ctx,
        api,
        'Follow answer identity when display order changes',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      dashboardCell(ctx, api, 'Answer A', a.x, a.y, 550, 130, themeColors.cyan, 39);
      dashboardCell(ctx, api, 'Answer B', b.x, b.y, 550, 130, themeColors.blue, 39);
      if (dashboardStarted(state, 'judge-first', progress > 0.25))
        dashboardText(
          ctx,
          api,
          'Order 1 [A, B] → first slot → A',
          960,
          830,
          34,
          themeColors.cyan,
          'center',
        );
      if (dashboardStarted(state, 'judge-second', progress > 0.45))
        dashboardText(
          ctx,
          api,
          'Order 2 [B, A] → first slot → B',
          960,
          900,
          34,
          themeColors.blue,
          'center',
        );
      if (dashboardStarted(state, 'judge-order-step-1', progress > 0.65))
        dashboardText(
          ctx,
          api,
          'Identity changed: preference unresolved',
          960,
          970,
          34,
          themeColors.yellow,
          'center',
        );
    } else if (beat === 1) {
      dashboardText(
        ctx,
        api,
        'Clarity preference and evidence validity are separate checks',
        960,
        285,
        35,
        themeColors.blue,
        'center',
      );
      dashboardCell(
        ctx,
        api,
        'Supplied judge preference',
        200,
        405,
        650,
        130,
        themeColors.cyan,
        33,
      );
      dashboardCell(
        ctx,
        api,
        'Cites workspace-note-48291',
        1050,
        405,
        650,
        130,
        themeColors.pink,
        32,
      );
      dashboardLine(ctx, api, 525, 555, 525, 740, themeColors.cyan, 4);
      dashboardLine(ctx, api, 1375, 555, 1375, 740, themeColors.pink, 4);
      dashboardCell(ctx, api, 'SOFT PREFERENCE', 200, 755, 650, 110, themeColors.cyan, 33);
      dashboardCell(ctx, api, 'HARD CITATION FAILURE', 1050, 755, 650, 110, themeColors.pink, 31);
      dashboardText(
        ctx,
        api,
        'The private citation holds this candidate.',
        960,
        950,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      dashboardText(
        ctx,
        api,
        'What to save with a preference',
        960,
        280,
        36,
        themeColors.blue,
        'center',
      );
      const fields = [
        ['Inputs', 'question + A/B answers'],
        ['Order', '[A, B] then [B, A]'],
        ['Evaluator', 'model + prompt + rubric versions'],
        ['Outputs', 'verdict + stated reason + cited spans'],
      ];
      fields.forEach(([name, value], i) => {
        const y = 370 + i * 140;
        dashboardText(ctx, api, name, 220, y + 55, 32, themeColors.muted);
        dashboardCell(ctx, api, value, 650, y, 1030, 100, themeColors.cyan, 29);
      });
      dashboardNote(
        ctx,
        api,
        'Retain source and label review too. A deterministic match can repeat an incorrect expected answer.',
      );
    }
  });
}
export default {
  id: 'judge-order',
  draw: drawJudgeOrder,
  cues: [
    'judge-order-step-1',
    'judge-swap',
    'judge-second',
    'judge-first',
    'judge-order-step-2',
    'judge-order-step-3',
  ],
};
