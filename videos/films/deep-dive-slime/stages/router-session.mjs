import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeRow,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
  drawSlimeWire,
} from '../defaults.mjs';
export function drawRouterSession(ctx, scene, state, api) {
  return api.focus.target('sl-router-session-mechanism', () =>
    paintRouterSession(ctx, scene, state, api),
  );
}
function paintRouterSession(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('router-session', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Where does the second turn go?');
    drawSlimeTile(ctx, api, 'session = rollout 7', 160, 425, 480, themeColors.yellow, 95, 33);
    drawSlimeTile(ctx, api, 'consistent-hash router', 820, 425, 470, themeColors.cyan, 95, 31);
    [0, 1].forEach((i) =>
      drawSlimeTile(
        ctx,
        api,
        `worker ${i + 1} · policy ${i ? 12 : 11}`,
        1450,
        365 + i * 230,
        350,
        i ? themeColors.muted : themeColors.blue,
        100,
        28,
      ),
    );
    drawSlimeWire(ctx, api, 640, 472, 820, 472, modelState.route);
    drawSlimeWire(ctx, api, 1290, 472, 1450, 415, modelState.route, themeColors.blue);
    drawSlimeText(
      ctx,
      api,
      `Turn ${modelState.turn} · same key → same worker mapping`,
      900,
      690,
      33,
      themeColors.blue,
      'center',
    );
    if (currentBeat === 1)
      drawSlimeRow(
        ctx,
        api,
        [
          'token IDs',
          'log probabilities',
          'loss mask',
          modelState.attached ? 'policy v11' : 'policy version',
        ],
        790,
        {
          x: 310,
          width: 330,
          colors: [themeColors.blue, themeColors.blue, themeColors.cyan, themeColors.yellow],
        },
      );
    if (currentBeat === 2)
      ['completed', 'truncated', 'aborted', 'recoverable'].forEach((label, i) =>
        drawSlimeTile(
          ctx,
          api,
          label,
          150 + i * 440,
          790,
          400,
          i < modelState.accepted ? themeColors.yellow : themeColors.muted,
          90,
          29,
        ),
      );
    drawSlimeRule(
      ctx,
      api,
      currentBeat === 0
        ? 'The same worker can reuse the cached prefix.'
        : currentBeat === 1
          ? modelState.attached
            ? 'The Sample records which policy generated these tokens.'
            : 'Attach the generation record to the Sample.'
          : 'Workload acceptance policy decides which statuses may train',
      940,
      themeColors.cyan,
      31,
    );
    return;
  }
}
export default {
  id: 'router-session',
  draw: drawRouterSession,
  cues: [
    'sl-router-session-b0-operation',
    'sl-router-session-b0-s0',
    'sl-router-session-b0-s1',
    'sl-router-session-b0-s2',
    'sl-router-session-b1-operation',
    'sl-router-session-b1-s0',
    'sl-router-session-b1-s1',
    'sl-router-session-b1-s2',
    'sl-router-session-b2-operation',
    'sl-router-session-b2-s0',
    'sl-router-session-b2-s1',
    'sl-router-session-b2-s2',
  ],
};
