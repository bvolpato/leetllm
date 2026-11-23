import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, sheet } from '../defaults.mjs';
export function drawRehearsalDiagnosis(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const steps = [
      ['Package list', 'Missing: input, decision, failure'],
      ['Before / after', 'Missing: isolated comparison'],
      ['Confident claim', 'Missing: reversal condition'],
    ];
    const [claim, missing] = steps[currentBeat];
    sheet(ctx, api, 210, 350, 1500, 485, claim, themeColors.pink);
    chapterText(ctx, api, missing, 960, 520, 37, themeColors.yellow, 'center');
    focusTargets(ctx, api, ['diagnosis-request', 'diagnosis-scope', 'diagnosis-reversal'], () => {
      const ready = cueDone(
        state,
        ['diagnosis-request', 'diagnosis-scope', 'diagnosis-reversal'][currentBeat],
        currentBeat,
        0.4,
      );
      chapterText(
        ctx,
        api,
        ready
          ? [
              'Repair: trace req-42 → auth → cursor check',
              'Repair: label replay / shadow / served scope',
              'Repair: hold if required tenant regressions remain',
            ][currentBeat]
          : 'Supply the artifact that could resolve this gap',
        960,
        690,
        34,
        ready ? themeColors.green : themeColors.muted,
        'center',
      );
    });
    chapterText(
      ctx,
      api,
      'A listener should reconstruct the problem and credible alternative',
      960,
      920,
      29,
      themeColors.ink,
      'center',
    );
    footer(ctx, api, 'Rehearsal rubric for an explanation · no private employer score inferred');
  }
}
export default {
  id: 'rehearsal-diagnosis',
  draw: drawRehearsalDiagnosis,
  cues: ['diagnosis-request', 'diagnosis-scope', 'diagnosis-reversal'],
};
