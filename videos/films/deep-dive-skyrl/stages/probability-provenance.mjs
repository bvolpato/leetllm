import { labels, tokens, mask } from '../fixtures.mjs';
import { phraseEnded } from '../construction.mjs';

export function drawProbabilityProvenance(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const repaired = end('provenance-resumed', 0, 0.48);
  const recorded = 0.2,
    current = 0.4,
    replay = 0.25;
  api.text(ctx, 'query-42_0', 120, 280, 44, C.ink, 'left', 'mono');
  api.text(ctx, 'Group L     scheduled 1     consumed 4', 1790, 280, 34, C.cyan, 'right');

  api.focus.target('provenance-history', () => {
    tokens.forEach((id, i) => {
      const x = 130 + i * 336;
      const isFuture = i > 2 && !repaired;
      const color = isFuture ? C.muted : mask[i] ? C.blue : C.yellow;
      api.rect(ctx, x, 370, 300, 115, C.panel, color, 12);
      api.text(ctx, isFuture ? '…' : labels[i] + '   ' + id, x + 150, 445, 38, color, 'center');
    });
    for (const [x, width, name, color] of [
      [130, 636, 'sampled under v11', C.blue],
      [802, 300, 'database', C.yellow],
      [
        1138,
        636,
        repaired ? 'sampled under v12' : 'awaiting next turn',
        repaired ? C.blue : C.muted,
      ],
    ]) {
      api.line(ctx, x + 10, 526, x + width - 10, 526, color, 5);
      api.text(ctx, name, x + width / 2, 594, 32, color, 'center');
    }
  });

  api.focus.target('provenance-score', () => {
    if (state.beat === 0) {
      api.text(ctx, 'Weight sync between turns', 960, 780, 48, C.ink, 'center', 'serif');
      api.text(
        ctx,
        'Keep the sampling log probability with each action ID.',
        960,
        892,
        37,
        C.cyan,
        'center',
      );
      return;
    }
    const alternate = end('provenance-replay', 3, 0.32);
    const denominator = end('provenance-substitute', 2, 0.4);
    const solved = end('provenance-ratio', 2, 0.86);
    api.text(ctx, 'Token 21   /   probability example', 135, 707, 35, C.ink);
    const column = (x, name, value, color) => {
      api.text(ctx, name, x, 795, 30, color, 'center');
      api.text(ctx, value, x, 875, 57, color, 'center');
    };
    column(405, 'actual sampler', recorded.toFixed(2), C.blue);
    column(960, 'current trainer', current.toFixed(2), C.cyan);
    if (alternate) column(1490, 'replayed at sampler weights', replay.toFixed(2), C.yellow);
    const ratio = `${current.toFixed(2)} / ${denominator ? recorded.toFixed(2) : '?'} = ${solved ? current / recorded : '?'}`;
    const wrong = end('provenance-wrong', 3, 0.7);
    api.text(ctx, ratio, alternate ? 620 : 960, 1000, 42, solved ? C.green : C.ink, 'center');
    if (wrong)
      api.text(
        ctx,
        `Using replay gives ${(current / replay).toFixed(1)}`,
        1475,
        1000,
        35,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'probability-provenance',
  draw: drawProbabilityProvenance,
  cues: [
    'provenance-resumed',
    'provenance-denominator',
    'provenance-substitute',
    'provenance-ratio',
    'provenance-replay',
    'provenance-wrong',
  ],
};
