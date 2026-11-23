import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRow,
  drawSlimeTile,
  drawSlimeTitle,
  drawSlimeWire,
} from '../defaults.mjs';
export function drawDebugReplay(ctx, scene, state, api) {
  return api.focus.target('sl-debug-replay-mechanism', () =>
    paintDebugReplay(ctx, scene, state, api),
  );
}
function paintDebugReplay(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('debug-replay', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Use one trusted dump to isolate the failing boundary');
    drawSlimeTile(ctx, api, 'generation-only', 160, 390, 480, themeColors.blue, 100, 31);
    drawSlimeTile(ctx, api, 'exact rollout dump', 790, 390, 500, themeColors.cyan, 100, 31);
    drawSlimeTile(ctx, api, 'train-only replay', 1440, 390, 360, themeColors.green, 100, 29);
    drawSlimeWire(ctx, api, 640, 440, 790, 440, modelState.dump);
    drawSlimeWire(
      ctx,
      api,
      1290,
      440,
      1440,
      440,
      modelState.trusted ? modelState.compare : 0,
      themeColors.green,
    );
    drawSlimeRow(ctx, api, ['IDs', 'masks', 'versions', 'launch config'], 650, {
      x: 220,
      width: 420,
      color: themeColors.cyan,
      size: 28,
    });
    drawSlimeTile(
      ctx,
      api,
      modelState.trusted
        ? 'trusted source and compatible revision checked'
        : 'Check the dump’s source and revision before loading.',
      350,
      810,
      1280,
      modelState.trusted ? themeColors.green : themeColors.yellow,
      85,
      31,
    );
    drawSlimeNote(
      ctx,
      api,
      currentBeat === 1
        ? 'PyTorch loader  /  weights-only mode off'
        : 'Replay the saved batch from its matching checkpoint.',
    );
    return;
  }
}
export default {
  id: 'debug-replay',
  draw: drawDebugReplay,
  cues: [
    'sl-debug-replay-b0-operation',
    'sl-debug-replay-b0-s0',
    'sl-debug-replay-b0-s1',
    'sl-debug-replay-b0-s2',
    'sl-debug-replay-b0-s3',
    'sl-debug-replay-b1-operation',
    'sl-debug-replay-b1-s0',
    'sl-debug-replay-b1-s1',
    'sl-debug-replay-b1-s2',
    'sl-debug-replay-b2-operation',
    'sl-debug-replay-b2-s0',
    'sl-debug-replay-b2-s1',
    'sl-debug-replay-b2-s2',
  ],
};
