import { cueMotion } from '../construction.mjs';
import { visionCandidateRanking } from '../arithmetic.mjs';
import { incidentScreen } from '../incident.mjs';

export function drawCandidateRanking(ctx, scene, state, api) {
  const { C } = api;
  const copied = cueMotion(state, 1, 'candidate-copy', 0.4, 0.7) > 0;
  const view = visionCandidateRanking(copied);
  const showCopyResult = state.beat >= 2;
  const rows = copied ? [0, 2, 1] : [0, 1];
  const maxScore = Math.max(...view.scores);
  const masses = view.scores.map((s) => Math.exp(s - maxScore));
  const denominator = masses.reduce((a, b) => a + b, 0);
  api.focus.target('ranked-image', () => {
    api.text(ctx, 'Same image vector', 100, 314, 41, C.ink);
    incidentScreen(ctx, api, 100, 374, 0.9);
    api.text(ctx, 'Supplied vectors for this example', 100, 806, 30, C.muted);
  });
  api.focus.target('candidate-set', () => {
    ['Candidate', 'Relative weight', 'Share'].forEach((name, i) =>
      api.text(ctx, name, [805, 1400, 1710][i], 318, 34, C.muted, i ? 'center' : 'left'),
    );
    rows.forEach((idx, row) => {
      const y = 438 + row * 114;
      const color = row === 1 ? C.cyan : C.pink;
      api.text(
        ctx,
        ['Deploy failed', 'Deploy succeeded', 'Deploy failed (copy)'][row],
        805,
        y,
        38,
        color,
      );
      api.text(ctx, masses[idx].toFixed(3), 1400, y, 42, color, 'center', 'mono');
      api.text(
        ctx,
        !copied || showCopyResult ? view.probabilities[idx].toFixed(3) : '?',
        1710,
        y,
        42,
        color,
        'center',
        'mono',
      );
    });
    api.line(ctx, 800, 728, 1805, 728, C.muted, 2);
    api.text(ctx, 'Sum of weights', 805, 811, 36, C.ink);
    api.text(ctx, denominator.toFixed(3), 1400, 811, 44, C.ink, 'center', 'mono');
  });
  if (state.beat === 1 && copied)
    api.text(
      ctx,
      'What share goes to the original failure description?',
      960,
      960,
      40,
      C.ink,
      'center',
    );
  if (state.beat === 2)
    api.text(
      ctx,
      'Each share uses the candidates in this comparison.',
      960,
      960,
      40,
      C.ink,
      'center',
    );
}
export default {
  id: 'candidate-ranking',
  draw: drawCandidateRanking,
  cues: ['candidate-towers', 'candidate-weights', 'candidate-copy', 'candidate-share'],
};
