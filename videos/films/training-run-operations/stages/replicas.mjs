import { boundary, trainingRun } from '../boundaries.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawLine, drawText } from '../defaults.mjs';

export function drawReplicas(ctx, scene, state, api) {
  const { C } = api;
  const { beat, beatP } = state;
  const changed =
    beat >= 3 || (beat === 2 && trainingStarted(state, 'replicas-new-plan', beatP > 0.08));
  const run = changed ? { ...trainingRun, replicas: 8, rounds: 4 } : trainingRun;
  const { perUpdate, perRound } = boundary(run);
  let rounds = Math.floor(trainingCue(state, 'replicas-one-round', beatP));
  if (beat === 1) {
    rounds = 1 + Math.floor(4 * trainingCue(state, 'replicas-five', Math.min(1, beatP * 2)));
    rounds += Math.floor(3 * trainingCue(state, 'replicas-eight', Math.max(0, beatP * 2 - 1)));
  }
  if (beat >= 2)
    rounds = changed
      ? Math.floor(4 * trainingCue(state, 'replicas-refill', 0))
      : trainingRun.rounds;
  if (beat >= 3) rounds = Math.floor(run.rounds * trainingCue(state, 'replicas-refill', beatP));

  const x = 430,
    top = 342,
    w = 1312 / run.rounds,
    h = 456 / run.replicas;
  drawText(ctx, api, 'GPU pair', 160, 300, 33, C.blue);
  drawText(ctx, api, 'Accumulation rounds', x, 230, 34, C.muted);
  api.focus.target('mesh', () => {
    for (let k = 0; k < run.rounds; k++)
      drawText(ctx, api, String.fromCharCode(65 + k), x + (k + 0.5) * w, 302, 38, C.ink, 'center');
    for (let r = 0; r < run.replicas; r++) {
      const y = top + r * h;
      drawText(
        ctx,
        api,
        2 * r + ' + ' + (2 * r + 1),
        263,
        y + 0.5 * h + 12,
        33,
        C.blue,
        'center',
        'mono',
      );
      for (let k = 0; k < run.rounds; k++) {
        const cx = x + (k + 0.5) * w,
          cy = y + 0.5 * h;
        const used = k < rounds;
        drawBox(ctx, api, x + k * w + 6, y + 4, w - 12, h - 8, used ? C.cyan : C.muted);
        for (const sign of [-1, 1])
          api.circle(
            ctx,
            cx + 22 * sign,
            cy,
            changed ? 11 : 15,
            used ? C.cyan : C.panel,
            used ? C.cyan : C.muted,
            2,
          );
      }
    }
  });
  api.focus.target('sequence-count', () => {
    drawText(
      ctx,
      api,
      rounds + ' rounds × ' + run.replicas + ' pairs × 2 sequences',
      170,
      894,
      39,
      C.ink,
    );
    drawText(ctx, api, String(rounds * perRound), 1590, 904, 78, C.cyan, 'right', 'mono');
    drawText(ctx, api, 'read so far', 1610, 895, 31, C.cyan);
    drawLine(ctx, api, 170, 943, 1750, 943, C.muted, 2);
    drawText(
      ctx,
      api,
      changed && beat === 2
        ? 'How many sequences will the complete four-round update use?'
        : rounds === run.rounds
          ? perUpdate + ' sequences in the complete update'
          : 'Each dot is one sequence shared by both GPUs in its pair.',
      960,
      1003,
      32,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'replicas',
  draw: drawReplicas,
  cues: [
    'replicas-one-round',
    'replicas-five',
    'replicas-eight',
    'replicas-new-plan',
    'replicas-refill',
  ],
};
