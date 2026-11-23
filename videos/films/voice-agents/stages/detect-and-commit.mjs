import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawDetectAndCommit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i, a = 0.07, z = 0.9) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(cueProgress, a, z);
  {
    const words = [
      ['incident', 235, themeColors.blue, 1],
      ['four', 565, themeColors.cyan, 1],
      ['pause', 895, themeColors.pink, phaseForBeat(0)],
      ['two one nine', 1225, themeColors.green, state.cues ? 1 : phaseForBeat(1)],
    ];
    words.forEach(([label, x, color, opacity], index) => {
      const drawWord = () =>
        api.focus.target('detect-word-' + index, () =>
          drawLegacyCard(ctx, api, label, x, 390, 270, color, opacity, 88),
        );
      if (index === 3) api.focus.reveal('detect-spoken-completion', drawWord);
      else drawWord();
    });
    const lineY = 610;
    api.line(ctx, 200, lineY, 1690, lineY, themeColors.muted, 3);
    const positions = [390, 720, 1050, 1380];
    positions.forEach((x, i) => {
      api.circle(ctx, x, lineY, i === 2 ? 13 : 9, i === 2 ? themeColors.pink : themeColors.cyan);
      drawLegacyText(
        ctx,
        api,
        i === 2 ? 'silence' : 'speech',
        x,
        675,
        27,
        i === 2 ? themeColors.pink : themeColors.cyan,
      );
    });
    api.focus.target('detect-and-commit-silence-only-commit-incident-four', () =>
      drawLegacyCard(
        ctx,
        api,
        'silence-only commit: “incident four”',
        200,
        755,
        700,
        themeColors.red,
        phaseForBeat(0),
        82,
      ),
    );
    api.focus.reveal('detect-commit-rule', () =>
      api.focus.target('detect-and-commit-stable-complete-turn-incident-4219', () =>
        drawLegacyCard(
          ctx,
          api,
          'stable complete turn: incident 4219',
          1020,
          755,
          700,
          themeColors.green,
          state.cues ? 1 : phaseForBeat(2),
          82,
        ),
      ),
    );
    drawLegacyText(
      ctx,
      api,
      'Commit requires silence + stable transcript + complete four-digit incident ID',
      960,
      890,
      27,
      themeColors.yellow,
    );
    drawLegacyText(
      ctx,
      api,
      'Voice activity finds speech frames; turn policy decides when meaning is complete.',
      960,
      950,
      30,
      themeColors.muted,
    );
  }
}
export default {
  id: 'detect-and-commit',
  draw: drawDetectAndCommit,
  cues: [
    'detect-activity-frames',
    'detect-turn-policy',
    'detect-partial-identifier',
    'detect-spoken-completion',
    'detect-commit-rule',
    'detect-complete-id',
  ],
};
