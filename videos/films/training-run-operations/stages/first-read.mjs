import { boundary, trainingRun } from '../boundaries.mjs';
import { trainingCompleted, trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawLine, drawText } from '../defaults.mjs';

export function drawFirstRead(ctx, scene, state, api) {
  const { C } = api;
  const { saved, perRound } = boundary(trainingRun);
  const { rounds, finished, step } = trainingRun;
  const { beat, beatP, t = 0 } = state;
  if (t < 0.35) ctx.globalAlpha = 1;

  const lost = beat > 0 || trainingCompleted(state, 'first-power-loss', beatP > 0.5);
  const choosing = beat > 0 || trainingStarted(state, 'intro-choice', beatP > 0.72);
  const answered = beat > 0 && trainingCompleted(state, 'intro-replay', beatP > 0.07);
  const rebuild = beat > 0 ? trainingCue(state, 'first-rebuild', beatP > 0.8 ? 1 : 0) : 0;
  const rebuilt = Math.floor(rebuild * finished);
  const landing = Math.min(1, 0.16 + t / 1.05);
  const count = lost ? rebuilt : finished - Number(landing < 1);
  const color = lost && !answered ? C.pink : answered ? C.cyan : C.yellow;
  const x = 160,
    pitch = 201,
    width = 180,
    y = 493,
    height = 139;
  const letters = 'ABCDEFGH';

  api.focus.target('worker-status', () => {
    api.circle(ctx, x + 16, 257, 13, color);
    drawText(
      ctx,
      api,
      lost && !answered ? 'Power lost' : answered ? 'Replacement workers' : 'Live workers',
      x + 52,
      274,
      49,
      color,
    );
  });

  api.focus.target('live-window', () => {
    drawText(ctx, api, 'Gradients in memory', x, 388, 44, C.ink);
    drawText(
      ctx,
      api,
      count + ' / ' + rounds + ' batches',
      x + 7 * pitch + width,
      388,
      44,
      C.ink,
      'right',
    );
    for (let i = 0; i < rounds; i++) {
      const left = x + i * pitch;
      const falling = !lost && i === finished - 1 && landing < 1;
      const filled = i < count || falling;
      const tileY = falling ? y - 116 * (1 - landing * landing) : y;
      drawLine(ctx, api, left + 3, y + height + 12, left + width - 3, y + height + 12, C.muted, 4);
      drawBox(
        ctx,
        api,
        left,
        tileY,
        width,
        height,
        filled ? color : C.muted,
        filled ? color : C.panel,
      );
      drawText(
        ctx,
        api,
        letters[i],
        left + width / 2,
        tileY + 98,
        80,
        filled ? C.bg : C.muted,
        'center',
        'mono',
      );
    }
    if (lost && !rebuilt) drawText(ctx, api, 'A–E were read before the crash', x, 773, 34, C.muted);
    if (rebuilt > 0)
      drawText(ctx, api, rebuilt * perRound + ' examples replayed', x, 773, 34, C.cyan);
  });

  if (!answered)
    drawText(ctx, api, 'After a crash, read A or F?', 1745, 274, 55, C.ink, 'right', 'serif');
  api.focus.target('restart-choice', () => {
    if (!choosing) return;
    for (const i of answered ? [0] : [0, finished]) {
      const middle = x + pitch * i + width / 2;
      const ink = answered ? C.cyan : C.blue;
      drawLine(ctx, api, middle, 653, middle, 678, ink, 4);
      drawText(
        ctx,
        api,
        answered ? 'Replay starts here' : letters[i] + '?',
        middle,
        718,
        answered ? 32 : 41,
        ink,
        'center',
      );
    }
  });

  const driveX = x,
    driveY = 839;
  drawBox(ctx, api, driveX, driveY, 215, 100, C.cyan);
  drawLine(ctx, api, driveX + 22, driveY + 32, driveX + 193, driveY + 32, C.cyan, 5);
  api.circle(ctx, driveX + 32, driveY + 70, 7, C.cyan);
  api.circle(ctx, driveX + 58, driveY + 70, 7, C.muted);
  drawText(ctx, api, 'Checkpoint on disk', driveX + 253, 864, 33, C.cyan);
  drawText(ctx, api, 'Update ' + step.toLocaleString('en-US'), driveX + 253, 941, 65, C.ink);
  drawText(
    ctx,
    api,
    saved.toLocaleString('en-US') + ' examples consumed',
    1745,
    918,
    36,
    C.cyan,
    'right',
  );
}

export default {
  id: 'first-read',
  draw: drawFirstRead,
  cues: ['intro-five', 'first-power-loss', 'intro-choice', 'intro-replay', 'first-rebuild'],
};
