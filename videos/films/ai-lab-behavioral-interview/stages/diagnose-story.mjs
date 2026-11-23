import { cueProgress, drawEvidenceBox, drawLine, drawText, withFocus } from '../defaults.mjs';
export function drawDiagnoseStory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const examples = [
      ['Mission slogan', 'Mechanism + consequence', 'diagnose-mission-build'],
      ['“I led the research”', 'Exact ownership boundary', 'diagnose-story-repair'],
      ['Incident heroics', 'Impact + hypothesis + follow-up', 'diagnose-incident-build'],
      ['“We should be safer”', 'A bounded evaluable control', 'diagnose-control-build'],
      ['Unsupported outcome', 'Observation or marked unknown', 'diagnose-outcome-build'],
    ];
    withFocus(ctx, api, 'diagnose-missing', () =>
      examples.forEach(([s], i) =>
        drawEvidenceBox(
          ctx,
          api,
          'diagnose-before-' + i,
          s,
          140,
          285 + i * 125,
          640,
          90,
          themeColors.pink,
          27,
        ),
      ),
    );
    withFocus(ctx, api, 'diagnose-repair', () =>
      examples.forEach(([, s, cue], i) => {
        const y = 285 + i * 125,
          p = currentBeat > 0 ? 1 : cueProgress(ctx, api, cue);
        drawLine(ctx, api, 800, y + 45, 800 + 170 * p, y + 45, themeColors.yellow);
        drawEvidenceBox(
          ctx,
          api,
          'diagnose-after-' + i,
          p >= 1 ? s : 'Identify the missing evidence',
          1000,
          y,
          780,
          90,
          p >= 1 ? (i === 1 ? themeColors.blue : themeColors.yellow) : themeColors.muted,
          27,
        );
      }),
    );
    withFocus(ctx, api, 'diagnose-gates', () => {
      if (currentBeat === 1)
        drawEvidenceBox(
          ctx,
          api,
          'diagnose-signal',
          'Release / rollback criterion: result that changes the decision',
          250,
          935,
          1420,
          80,
          themeColors.green,
          27,
        );
    });
    withFocus(ctx, api, 'diagnose-unknown', () => {
      drawText(
        ctx,
        api,
        currentBeat === 0
          ? 'Repair the missing field before polishing its wording'
          : 'A result never observed remains unknown',
        960,
        currentBeat === 0 ? 1010 : 1050,
        27,
        themeColors.muted,
      );
    });
  }
}
export default {
  id: 'diagnose-story',
  draw: drawDiagnoseStory,
  cues: [
    'diagnose-story-missing',
    'diagnose-story-repair',
    'diagnose-mission-build',
    'diagnose-incident-build',
    'diagnose-control-build',
    'diagnose-outcome-build',
    'diagnose-story-gates',
    'diagnose-story-limits',
  ],
};
