import {
  approvalProgress,
  contractArrow,
  contractLine,
  contractNote,
  contractRectangle,
  contractTag,
  contractText,
} from '../defaults.mjs';
export function drawOversightModes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    resultComplete = (id) => approvalProgress(ctx, api, id) === 1;
  api.focus.target('oversight-modes-mechanism', () => {
    if (currentBeat === 0) {
      const rows = [
        ['HITL', 'hitl-before', 650],
        ['HOTL', 'hotl-monitor', 1260],
        ['HOOTL', 'hootl-none', null],
      ];
      rows.forEach(([name, cue, review], i) => {
        const y = 390 + i * 185;
        contractText(
          ctx,
          api,
          name,
          200,
          y + 12,
          34,
          [themeColors.green, themeColors.yellow, themeColors.muted][i],
        );
        contractLine(ctx, api, 410, y, 1740, y, themeColors.muted, 4);
        contractLine(ctx, api, 1080, y - 42, 1080, y + 42, themeColors.pink, 5);
        contractText(ctx, api, 'effect', 1080, y + 85, 27, themeColors.pink);
        if (review && approvalProgress(ctx, api, cue)) {
          api.circle(ctx, review, y, 23, i ? themeColors.yellow : themeColors.green);
          contractText(
            ctx,
            api,
            i ? 'intervention' : 'decision',
            review,
            y - 65,
            28,
            i ? themeColors.yellow : themeColors.green,
          );
          contractArrow(
            ctx,
            api,
            420,
            y,
            420 + 1300 * approvalProgress(ctx, api, cue),
            y,
            i ? themeColors.yellow : themeColors.green,
          );
        }
        if (!review && resultComplete(cue))
          contractText(ctx, api, 'no real-time reviewer', 670, y - 55, 29, themeColors.muted);
      });
    }
    if (currentBeat === 1) {
      contractTag(ctx, api, 'Host policy floor', 600, 390, themeColors.blue, 800);
      contractTag(ctx, api, 'Model suggests lower review', 600, 600, themeColors.yellow, 800);
      contractArrow(ctx, api, 600, 440, 600, 540, themeColors.yellow);
      if (resultComplete('policy-block')) {
        contractRectangle(ctx, api, 1250, 280, 470, 620, themeColors.panel);
        contractText(ctx, api, 'Prohibited effect', 1485, 430, 35, themeColors.pink);
        contractText(ctx, api, 'still blocked', 1485, 560, 42, themeColors.pink);
        contractText(ctx, api, 'after a click', 1485, 690, 31, themeColors.muted);
      }
    }
    contractNote(ctx, api, 'Timing of intervention and authority are separate decisions');
  });
  return;
}
export default {
  id: 'oversight-modes',
  draw: drawOversightModes,
  cues: ['hitl-before', 'hotl-monitor', 'hootl-none', 'policy-block'],
};
