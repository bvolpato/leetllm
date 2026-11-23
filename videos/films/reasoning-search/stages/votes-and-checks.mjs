import { voteFixture } from '../arithmetic.mjs';
import { drawLegacyCard, drawLegacyFooter, drawLegacyText, withLegacyFocus } from '../defaults.mjs';
export function drawVotesAndChecks(ctx, scene, state, api) {
  api.focus.target('votes-and-checks-mechanism', () => {
    const finished = (key) => api.focus.progress('reason-result-' + key, 0) === 1;
    const { C: themeColors, phase, teaching: teaching } = api;
    const beat = state.beat ?? 0,
      progress2 = state.beatP ?? 0,
      q = phase(progress2, 0.05, 0.9);
    const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1, radius = 6) =>
      teaching.transfer({
        source: {
          shape: from,
          opacity,
        },
        target: {
          shape: to,
          opacity,
        },
        color,
        progress,
        width: 3,
        gap: 12,
        margin: 2,
        particle: {
          radius,
          fill: color,
        },
      });
    {
      const vote = voteFixture();
      const samples = vote.samples.map((sample, index) =>
        withLegacyFocus(ctx, api, 'votes-and-checks-object-sample-answer-42', () =>
          drawLegacyCard(
            ctx,
            api,
            `Sample ${index + 1}\nanswer ${sample.answer}`,
            120 + index * 580,
            350,
            500,
            themeColors.blue,
            150,
            29,
          ),
        ),
      );
      const voteCard = withLegacyFocus(ctx, api, 'votes-and-checks-object-vote-24-43', () =>
        drawLegacyCard(ctx, api, 'Vote: 24', 710, 595, 520, themeColors.yellow, 110, 34),
      );
      samples.forEach((shape) => route(shape, voteCard, themeColors.yellow, q));
      const rejected = drawLegacyCard(
        ctx,
        api,
        'Repeated path\n6 × 4 only',
        130,
        760,
        500,
        themeColors.pink,
        140,
        27,
      );
      const verified = finished('checked-votes');
      const accepted = drawLegacyCard(
        ctx,
        api,
        'Full expression\n(6 − 4) × (5 + 7)',
        1280,
        760,
        500,
        verified ? themeColors.green : themeColors.muted,
        140,
        25,
      );
      const checker = drawLegacyCard(
        ctx,
        api,
        verified ? 'Each input used once' : 'Check inputs + operations',
        740,
        760,
        430,
        verified ? themeColors.yellow : themeColors.cyan,
        140,
        25,
      );
      route(rejected, checker, themeColors.pink, q);
      route(accepted, checker, themeColors.green, q);
      drawLegacyText(
        ctx,
        api,
        `Agreement ${vote.votes}/${vote.samples.length} · complete expressions passing ${verified ? vote.checked.filter((item) => item.valid).length + '/' + vote.checked.length : 'pending'}`,
        960,
        285,
        31,
        themeColors.ink,
        'center',
      );
      drawLegacyFooter(
        ctx,
        api,
        'A vote summarizes answers; a verifier checks the task constraints',
      );
    }
  });
}
export default {
  id: 'votes-and-checks',
  draw: drawVotesAndChecks,
  cues: [
    'votes-and-checks-beat-1-focus-1',
    'votes-and-checks-beat-2-focus-1',
    'votes-and-checks-beat-3-focus-1',
    'votes-and-checks-beat-3-focus-2',
    'reason-result-checked-votes',
  ],
};
