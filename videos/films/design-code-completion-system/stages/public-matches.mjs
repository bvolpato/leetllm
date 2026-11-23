import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawPublicMatches(ctx, scene, state, api) {
  api.focus.target('cc-public-matches-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0));
    {
      completionHeading(
        ctx,
        api,
        'Where did this call come from, and what does it do?',
      );
      completionBox(
        ctx,
        api,
        'Proposed graph.allows(request)',
        230,
        385,
        1460,
        100,
        themeColors.cyan,
      );
      if (currentBeat === 0) {
        completionBox(ctx, api, 'Public-index match policy', 250, 650, 650, 100, themeColors.blue);
        completionBox(ctx, api, 'Show reference or block', 1050, 650, 650, 100, themeColors.yellow);
        completionFooter(
          ctx,
          api,
          'Index coverage: public GitHub repositories at the last refresh',
        );
      } else {
        [
          ['Library version', 'Check the method signature', themeColors.blue],
          ['Request within scope', 'Expect an allow decision', themeColors.cyan],
          ['Request outside scope', 'Expect a denial', themeColors.yellow],
        ].forEach(([a, v, col], i) => {
          completionText(ctx, api, a, 300, 660 + i * 110, 31, col);
          completionText(ctx, api, v, 1300, 660 + i * 110, 31, col, 'center');
        });
      }
    }
    return true;
  });
}
export default {
  id: 'public-matches',
  draw: drawPublicMatches,
  cues: ['cc-public-matches-0', 'cc-public-index', 'cc-public-matches-1'],
};
