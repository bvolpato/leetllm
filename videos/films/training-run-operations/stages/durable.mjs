import { boundary, trainingRun } from '../boundaries.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawLine, drawText } from '../defaults.mjs';

export function drawDurable(ctx, scene, state, api) {
  const { C } = api;
  const { beat, beatP } = state;
  const { saved, perUpdate } = boundary(trainingRun);
  const newStep = trainingRun.step + 1;
  const staged = beat > 0 || trainingStarted(state, 'durable-stage', beatP > 0.3);
  const liveMoved = beat > 0 || trainingStarted(state, 'durable-live', beatP > 0.6);
  const writes =
    beat > 1 ? 3 : beat === 1 ? Math.floor(3 * trainingCue(state, 'durable-three', beatP)) : 0;
  const fork = beat >= 2;
  const lastValid = fork && trainingStarted(state, 'durable-fourth', beatP > 0.38);
  const published = lastValid && trainingStarted(state, 'durable-publish', beatP > 0.78);
  const n = (v) => v.toLocaleString('en-US');
  api.focus.target('snapshot', () => {
    drawText(ctx, api, 'Live weights', 160, 268, 34, C.blue);
    drawText(ctx, api, 'Update ' + (newStep + Number(liveMoved)), 160, 354, 56, C.ink);
    drawText(
      ctx,
      api,
      n(saved + perUpdate * (liveMoved ? 2 : 1)) + ' consumed',
      160,
      417,
      32,
      C.blue,
    );
    drawText(ctx, api, 'Frozen host copy', 890, 268, 34, C.cyan);
    drawText(ctx, api, staged ? 'Update ' + newStep : 'Copy pending', 890, 354, 56, C.ink);
    drawText(
      ctx,
      api,
      staged ? n(saved + perUpdate) + ' consumed' : 'Hold the live state here',
      890,
      417,
      32,
      C.cyan,
    );
  });
  const lane = (y, count, next, interrupted) => {
    const color = interrupted ? C.pink : next ? C.green : C.yellow;
    drawText(
      ctx,
      api,
      interrupted
        ? 'Write interrupted'
        : fork
          ? lastValid
            ? 'Write completes'
            : 'Fourth write pending'
          : 'Storage for 1841',
      160,
      y + 44,
      34,
      color,
    );
    for (let i = 0; i < 4; i++) {
      const left = 595 + i * 128;
      drawBox(ctx, api, left, y - 13, 102, 82, i < count ? C.cyan : C.muted);
      drawText(
        ctx,
        api,
        i < count ? String(i + 1) : '·',
        left + 51,
        y + 43,
        39,
        i < count ? C.cyan : C.muted,
        'center',
      );
    }
    drawText(ctx, api, count + ' / 4', 1220, y + 43, 41, color, 'center');
    drawText(
      ctx,
      api,
      beat === 1 ? '?' : String(next ? newStep : trainingRun.step),
      1580,
      y + 48,
      56,
      next ? C.green : C.ink,
      'center',
      'mono',
    );
  };
  api.focus.target('manifest', () => {
    drawLine(ctx, api, 160, 481, 1760, 481, C.muted, 2);
    drawText(ctx, api, 'Prior save  ·  1840', 160, 570, 32, C.muted);
    drawText(ctx, api, 'Expected shards', 595, 570, 32, C.muted);
    drawText(ctx, api, 'Validated', 1220, 570, 32, C.muted, 'center');
    drawText(
      ctx,
      api,
      beat === 1 ? 'Load after failure' : 'Latest published',
      1580,
      570,
      32,
      C.muted,
      'center',
    );
    lane(635, writes, false, fork);
    if (fork) lane(785, lastValid ? 4 : writes, published, false);
  });
  drawText(
    ctx,
    api,
    published
      ? 'A reader can now load the manifest and its matching cursor.'
      : fork
        ? 'Each row starts from the same three validated shards.'
        : beat === 1
          ? 'If the last write fails, which update can a new worker load?'
          : 'The upload reads the frozen copy while training continues.',
    960,
    982,
    33,
    C.ink,
    'center',
  );
}
export default {
  id: 'durable',
  draw: drawDurable,
  cues: [
    'durable-stage',
    'durable-live',
    'durable-three',
    'durable-fork',
    'durable-fourth',
    'durable-publish',
  ],
};
