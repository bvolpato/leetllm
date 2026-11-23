import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawEvaluationRelease(ctx, scene, state, api) {
  api.focus.target('cc-evaluation-release-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0));
    {
      completionHeading(
        ctx,
        api,
        currentBeat === 0
          ? 'Freeze the repository and edit time before retrieval'
          : 'Keep the complete eligible request population',
      );
      if (currentBeat === 0) {
        completionBox(ctx, api, 'Snapshot at edit t0', 180, 380, 600, 100, themeColors.blue);
        completionBox(ctx, api, 'Hidden target insertion', 1110, 380, 620, 100, themeColors.muted);
        api.line(ctx, 200, 650, 1720, 650, themeColors.muted, 3);
        [
          ['file available t−1', 400, themeColors.green],
          ['qualifying edit t0', 960, themeColors.yellow],
          ['future file t+1', 1520, themeColors.pink],
        ].forEach(([v, x, col]) => {
          api.circle(ctx, x, 650, 12, col);
          completionText(ctx, api, v, x, 760, 29, col, 'center');
        });
        completionText(
          ctx,
          api,
          'Retrieve only evidence available at the frozen edit point',
          960,
          900,
          35,
          themeColors.cyan,
          'center',
        );
      } else {
        const stages = ['eligible', 'requested', 'shown', 'accepted', 'retained'];
        stages.forEach((s, i) => {
          const w = 270 - i * 25;
          completionBox(
            ctx,
            api,
            s,
            190 + i * 335,
            400,
            w,
            100,
            i < 3 ? themeColors.blue : themeColors.green,
          );
          if (i < 4)
            api.arrow(
              ctx,
              190 + i * 335 + w + 15,
              450,
              190 + (i + 1) * 335 - 15,
              450,
              themeColors.muted,
              3,
            );
        });
        completionText(
          ctx,
          api,
          'Stable user/workspace assignment · fixed trigger and display policy',
          960,
          680,
          35,
          themeColors.yellow,
          'center',
        );
        completionText(
          ctx,
          api,
          currentBeat === 1
            ? 'Retain cancellations, timeouts, stale drops and supported slices'
            : 'High shown-only acceptance can hide low coverage or tiny low-value suggestions',
          960,
          860,
          32,
          themeColors.ink,
          'center',
        );
        completionFooter(
          ctx,
          api,
          'Compare correctness, useful retained work, complete latency and declared cost together',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'evaluation-release',
  draw: drawEvaluationRelease,
  cues: ['cc-evaluation-release-0', 'cc-evaluation-release-1', 'cc-evaluation-release-2'],
};
