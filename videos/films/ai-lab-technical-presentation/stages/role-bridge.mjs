import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, panel, sheet } from '../defaults.mjs';
export function drawRoleBridge(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      const proposed = cueDone(state, 'role-proposal', 0, 0.25),
        checked = cueDone(state, 'role-authorization', 0, 0.5);
      chapterText(ctx, api, 'Principal: tenant A', 960, 295, 32, themeColors.blue, 'center');
      focusTargets(ctx, api, ['role-proposal'], () => {
        panel(ctx, api, 220, 425, 650, 175, themeColors.purple);
        chapterText(
          ctx,
          api,
          proposed ? 'Model proposes: read tenant B' : 'Proposed tool call',
          545,
          525,
          33,
          themeColors.purple,
          'center',
        );
      });
      focusTargets(ctx, api, ['role-authorization'], () => {
        panel(ctx, api, 1100, 425, 620, 175, checked ? themeColors.pink : themeColors.yellow);
        chapterText(
          ctx,
          api,
          checked ? 'DENY · tenant boundary' : 'Runtime authorization',
          1410,
          525,
          34,
          checked ? themeColors.pink : themeColors.yellow,
          'center',
        );
      });
      api.line(ctx, 900, 510, 1070, 510, themeColors.muted, 3);
      chapterText(
        ctx,
        api,
        'Passing selected evaluations does not grant data access',
        960,
        820,
        33,
        themeColors.yellow,
        'center',
      );
    } else {
      sheet(
        ctx,
        api,
        210,
        350,
        1500,
        535,
        currentBeat === 1
          ? 'Choose the role-relevant connection'
          : 'Use the actual format’s tool permission',
        themeColors.blue,
      );
      const rows =
        currentBeat === 1
          ? [
              ['agent platform', 'tenant-scoped tool boundary'],
              ['retrieval', 'labels + query regressions'],
              ['research', 'hypothesis + controlled test'],
            ]
          : [
              ['preparation', 'confirm permitted assistance'],
              ['private artifact', 'approved disclosure and upload'],
              ['delivery', 'actual assessment policy'],
            ];
      rows.forEach((r, i) => {
        chapterText(ctx, api, r[0], 270, 500 + i * 130, 30, themeColors.cyan);
        chapterText(ctx, api, r[1], 780, 500 + i * 130, 31);
      });
    }
    footer(ctx, api, 'Retain the original contribution and the limits of its evidence');
  }
}
export default {
  id: 'role-bridge',
  draw: drawRoleBridge,
  cues: ['role-proposal', 'role-authorization'],
};
