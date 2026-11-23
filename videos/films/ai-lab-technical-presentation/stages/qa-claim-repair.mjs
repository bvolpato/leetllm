import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, sheet } from '../defaults.mjs';
export function drawQaClaimRepair(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat < 2) {
      focusTargets(ctx, api, ['qa-measured'], () => {
        sheet(ctx, api, 180, 350, 710, 470, 'Observation · req-42', themeColors.blue);
        chapterText(ctx, api, 'Wait inside store call', 225, 520, 33, themeColors.blue);
        chapterText(ctx, api, 'Presenter owns adapter tests', 225, 650, 30, themeColors.cyan);
      });
      focusTargets(ctx, api, ['qa-hypothesis'], () => {
        sheet(ctx, api, 1020, 350, 710, 470, 'Unresolved explanations', themeColors.yellow);
        ['server work', 'network behavior', 'queue wait', 'missing index?'].forEach((v, i) =>
          chapterText(
            ctx,
            api,
            v,
            1070,
            475 + i * 78,
            31,
            i === 3 ? themeColors.yellow : themeColors.muted,
          ),
        );
      });
      chapterText(
        ctx,
        api,
        'Next discriminating evidence: query plan + matched request',
        960,
        920,
        31,
        themeColors.cyan,
        'center',
      );
    } else {
      sheet(
        ctx,
        api,
        220,
        370,
        1480,
        440,
        'Correct the claim, then reassess its consequence',
        themeColors.blue,
      );
      chapterText(ctx, api, 'Before: “+7%”', 290, 535, 40, themeColors.pink);
      focusTargets(ctx, api, ['qa-unit'], () =>
        chapterText(
          ctx,
          api,
          cueDone(state, 'qa-unit', 2, 0.3)
            ? 'After: “+7 percentage points”'
            : 'Unit repair pending',
          290,
          650,
          40,
          themeColors.green,
        ),
      );
      chapterText(
        ctx,
        api,
        'A required tenant regression can change the release decision',
        960,
        890,
        30,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'State observation, hypothesis and proposed test without inventing ownership');
  }
}
export default {
  id: 'qa-claim-repair',
  draw: drawQaClaimRepair,
  cues: ['qa-measured', 'qa-hypothesis', 'qa-unit'],
};
