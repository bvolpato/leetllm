import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, panel, sheet } from '../defaults.mjs';
export function drawEvidenceInventory(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Which artifact supports this exact claim?',
        960,
        285,
        33,
        themeColors.yellow,
        'center',
      );
      focusTargets(ctx, api, ['inventory-evidence'], () => {
        const rows = [
          ['Repeated integrations', 'onboarding records'],
          ['Tenant-safe lookup', 'scoped request + failure response'],
          ['Pagination correctness', 'contract test + trace'],
        ];
        rows.forEach((r, i) => {
          const y = 405 + i * 175;
          panel(ctx, api, 180, y, 660, 115, themeColors.blue);
          chapterText(ctx, api, r[0], 510, y + 68, 32, themeColors.blue, 'center');
          panel(ctx, api, 1030, y, 710, 115, themeColors.cyan);
          chapterText(ctx, api, r[1], 1385, y + 68, 29, themeColors.cyan, 'center');
          api.line(ctx, 865, y + 58, 1005, y + 58, themeColors.yellow, 3);
        });
      });
    } else if (currentBeat === 1) {
      focusTargets(ctx, api, ['inventory-owners'], () => {
        sheet(ctx, api, 170, 355, 1040, 530, 'Presenter owns', themeColors.cyan);
        ['connector contract', 'adapter + gateway changes', 'tests + instrumentation'].forEach(
          (v, i) => chapterText(ctx, api, v, 225, 510 + i * 120, 37),
        );
        sheet(ctx, api, 1330, 355, 420, 530, 'Other team', themeColors.purple);
        chapterText(ctx, api, 'tenant store', 1540, 600, 35, themeColors.purple, 'center');
        api.line(ctx, 1265, 320, 1265, 925, themeColors.yellow, 3);
      });
    } else {
      sheet(ctx, api, 185, 345, 1550, 570, 'Onboarding comparison receipt', themeColors.blue);
      const cols = [
        ['unit', 'days'],
        ['population', '8 source integrations'],
        ['window', 'compared before / after groups'],
        ['source', 'onboarding start → finish records'],
      ];
      cols.forEach((r, i) => {
        chapterText(ctx, api, r[0], 235, 465 + i * 70, 27, themeColors.muted);
        chapterText(ctx, api, r[1], 560, 465 + i * 70, 30);
      });
      focusTargets(ctx, api, ['inventory-difference'], () =>
        chapterText(
          ctx,
          api,
          cueDone(state, 'inventory-difference', 2, 0.58)
            ? '20 − 6 = 14 fewer days'
            : '20 days → 6 days',
          960,
          835,
          38,
          themeColors.yellow,
          'center',
        ),
      );
    }
    footer(
      ctx,
      api,
      'Observed group difference · staffing and source complexity still need comparison',
    );
  }
}
export default {
  id: 'evidence-inventory',
  draw: drawEvidenceInventory,
  cues: ['inventory-evidence', 'inventory-owners', 'inventory-difference'],
};
