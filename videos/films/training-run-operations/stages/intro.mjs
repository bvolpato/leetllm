import { boundary, trainingRun } from '../boundaries.mjs';
import { checkpointRestore, trainingStarted } from '../construction.mjs';
import { drawBox, drawLine, drawText } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const { full, actor, fields } = checkpointRestore(state);
  const step = trainingRun.step.toLocaleString('en-US');
  const saved = boundary(trainingRun).saved.toLocaleString('en-US');
  const color = full ? C.green : C.pink;
  const details = {
    Weights: ['weights', `Parameters from update ${step}`],
    'Adam moments': ['moments', full ? 'Use both saved moments' : 'Start both moments at zero'],
    'Scheduler phase': ['schedule', full ? 'Continue at the saved phase' : 'Start warmup again'],
    'Consumed cursor': [
      'cursor',
      full ? 'Pick up at the saved boundary' : 'Read the first examples again',
    ],
  };

  api.focus.target('checkpoint-boundary', () =>
    drawText(ctx, api, `Checkpoint at update ${step}`, 180, 251, 38, C.ink),
  );
  if (full && trainingStarted(state, 'intro-random', state.beatP >= 0.66)) {
    const scaler = trainingStarted(state, 'intro-scaler', state.beatP >= 0.71);
    api.focus.target('extra-state', () =>
      drawText(
        ctx,
        api,
        scaler ? 'Random state restored  ·  Scaler restored if used' : 'Random state restored',
        1750,
        251,
        32,
        C.green,
        'right',
      ),
    );
  }
  api.focus.target('packet-name', () =>
    drawText(ctx, api, actor, 960, 340, 54, color, 'center'),
  );
  api.focus.target('packet-fields', () => {
    fields.forEach(({ name, restored }, i) => {
      const x = 180 + (i % 2) * 850;
      const y = 395 + Math.floor(i / 2) * 230;
      const [target, detail] = details[name];
      api.focus.target(target, () => {
        const fieldColor = restored ? C.cyan : C.pink;
        drawBox(ctx, api, x, y, 720, 185, fieldColor);
        drawText(ctx, api, name, x + 30, y + 56, 42, C.ink);
        drawText(ctx, api, detail, x + 30, y + 111, 33, C.ink);
        drawText(
          ctx,
          api,
          restored ? 'RESTORED' : 'RESET / MISSING',
          x + 30,
          y + 163,
          30,
          fieldColor,
          'left',
          'mono',
        );
      });
    });
  });

  const left = 360;
  const right = 1560;
  const y = 920;
  api.focus.target('read-position', () => {
    drawText(ctx, api, 'Examples consumed in this sample order', 960, 875, 34, C.ink, 'center');
    drawLine(ctx, api, left, y, right, y, C.muted, 4);
    for (const x of [left, right]) drawLine(ctx, api, x, y - 12, x, y + 12, C.muted, 4);
    drawText(ctx, api, '0 · stream start', left, 987, 34, C.ink, 'center');
    drawText(ctx, api, `${saved} · saved boundary`, right, 987, 34, C.ink, 'center');
    if (state.beat > 0 || trainingStarted(state, 'intro-repeat', state.beatP >= 0.15)) {
      const x = full ? right : left;
      api.circle(ctx, x, y, 12, color, color, 2);
      drawText(ctx, api, 'Restart here', x, 882, 30, color, 'center');
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-repeat',
    'intro-warmup',
    'intro-weights',
    'intro-boundary',
    'intro-full-continuation',
    'intro-weights-only',
    'intro-full-packet',
    'intro-moments',
    'intro-saved-schedule',
    'intro-saved-cursor',
    'intro-random',
    'intro-scaler',
  ],
};
