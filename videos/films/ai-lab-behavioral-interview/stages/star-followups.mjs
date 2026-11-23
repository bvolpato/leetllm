import {
  cueProgress,
  drawCaption,
  drawEvidenceBox,
  drawLine,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawStarFollowups(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) >= 1;
  {
    if (currentBeat === 0) {
      withFocus(ctx, api, 'star-fields', () => {
        const fields = [
          ['Situation', 'Reranker before returns peak', 'star-context-build'],
          ['Task', 'Your release-check responsibility', 'star-task-build'],
          ['Action', 'Reproduce + write check', 'star-action-build'],
          ['Result', 'Both cases pass; 420 ms window', 'star-result-build'],
        ];
        fields.forEach(([k, v, cue], i) => {
          const ready = resultComplete(cue);
          drawEvidenceBox(
            ctx,
            api,
            'star-' + i,
            k,
            170,
            300 + i * 145,
            300,
            100,
            themeColors.yellow,
          );
          drawEvidenceBox(
            ctx,
            api,
            'star-fact-' + i,
            ready ? v : 'Evidence pending',
            610,
            300 + i * 145,
            1100,
            100,
            ready ? (i === 2 ? themeColors.blue : themeColors.ink) : themeColors.muted,
            30,
          );
          drawLine(ctx, api, 490, 350 + i * 145, 580, 350 + i * 145, themeColors.muted);
        });
      });
      withFocus(ctx, api, 'star-owner', () =>
        drawText(
          ctx,
          api,
          'Authorization repair belongs to the service owner',
          960,
          1005,
          28,
          themeColors.cyan,
        ),
      );
    } else {
      const options = [
        ['Too cautious?', 'Both cases pass + complete gates'],
        ['Their view?', 'Learn before the returns deadline'],
        ['Cost?', 'Waiting / scope / team effort'],
        ['Might be wrong?', 'Uncertainty + verification plan'],
        ['Afterward?', 'Shared decision record'],
      ];
      withFocus(ctx, api, 'star-followup', () => {
        options.forEach(([question, evidence], i) => {
          const y = 280 + i * 125;
          drawEvidenceBox(
            ctx,
            api,
            'star-question-' + i,
            question,
            140,
            y,
            470,
            90,
            themeColors.yellow,
            27,
          );
          drawEvidenceBox(
            ctx,
            api,
            'star-answer-' + i,
            evidence,
            810,
            y,
            950,
            90,
            i === 2 ? themeColors.muted : themeColors.blue,
            27,
          );
          drawLine(ctx, api, 630, y + 45, 780, y + 45, themeColors.muted);
        });
      });
      drawCaption(
        ctx,
        api,
        'star-missing',
        'Missing observation → keep the answer unknown',
        1005,
        themeColors.yellow,
      );
    }
  }
}
export default {
  id: 'star-followups',
  draw: drawStarFollowups,
  cues: [
    'star-followups-star',
    'star-followups-ownership',
    'star-context-build',
    'star-task-build',
    'star-action-build',
    'star-result-build',
    'star-followups-followup',
    'star-followups-unknown',
  ],
};
